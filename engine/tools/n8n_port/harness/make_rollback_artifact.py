"""Field-level diff of the running version vs the file we used to call "published".

NOTE (28 Oct): the diff below is the useful half of this script and it is sound. Its ARTIFACT WRITER is
superseded by harness/finalize_rollback_artifact.py, which redacts through harness/secret_guard.py and hashes
the exact bytes it writes. Keep running this for the diff; write artifacts with the finalizer.
"""

"""
`harness/verify_rollback_artifacts.py` said the hashes differ. This says WHERE, in three buckets, because the
three kinds of difference mean different things:

  SECRET   values the exporter replaces (token/key/url-shaped strings). Expected, and not a rollback risk —
           the target instance supplies its own.
  METADATA node ids/positions/pinData/meta/versionId etc. Cosmetic; import rebuilds them.
  BEHAVIOUR node parameters (jsCode, URLs, conditions) or connections. THIS is what decides whether the file
           would restore the running behaviour.

It then writes the artifact that IS traceable to the running version: the ACTIVE version fetched by
activeVersionId, redacted the same way, plus a sidecar with the version id, node/connection counts and the
sha256 of the redacted body — so a future restore can be checked, not assumed.

Run:  python harness/make_rollback_artifact.py
"""
import hashlib
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from mcp_client import Mcp                                          # noqa: E402
from secret_guard import scrub as sg_scrub, scan as sg_scan          # noqa: E402

# the redaction used here and the one that guards every other artifact are the same function now, so the
# sha256 in the manifest describes the bytes actually written (they were not, before: scrub-after-write made
# the sidecar describe the pre-scrub file, which is exactly the kind of drift a rollback check must not have).


def redact(obj):
    return sg_scrub(obj)

WF = '034iqKMRjqKt9LlB'
SECRET_HINTS = ('token', 'key', 'apikey', 'api_key', 'password', 'secret', 'url', 'authorization')
NODE_META_KEYS = {'id', 'name', 'type', 'typeVersion', 'position', 'disabled', 'notes', 'alwaysOutputData',
                  'executeOnce', 'retryOnFail', 'maxTries', 'waitBetweenTries', 'meta', 'pinData', 'webhookId'}


def is_secret_key(k):
    return any(h in str(k).lower() for h in SECRET_HINTS)


def classify(a, b, path, out):
    """Walk two JSON values and file every leaf difference under SECRET / METADATA / BEHAVIOUR."""
    if type(a) is not type(b):
        out.append(('BEHAVIOUR' if 'parameters' in path else 'METADATA', path, repr(a)[:70], repr(b)[:70]))
        return
    if isinstance(a, dict):
        for k in sorted(set(a) | set(b)):
            p = path + '.' + str(k)
            if k not in b:
                out.append(('SECRET' if is_secret_key(k) else 'METADATA', p + '.MISSING_IN_ARTIFACT',
                            repr(a[k])[:70], '--'))
                continue
            if k not in a:
                out.append(('SECRET' if is_secret_key(k) else 'METADATA', p + '.ONLY_IN_ARTIFACT', '--',
                            repr(b[k])[:70]))
                continue
            cls = ('SECRET' if is_secret_key(k) else
                   'METADATA' if (k in NODE_META_KEYS or p.endswith('.id') or '.position' in p) else
                   'BEHAVIOUR' if '.parameters' in p else 'METADATA')
            if isinstance(a[k], (dict, list)) or a[k] == b[k]:
                if isinstance(a[k], (dict, list)):
                    classify(a[k], b[k], p, out)
                elif cls != 'METADATA':
                    pass
                elif a[k] != b[k]:
                    out.append((cls, p, repr(a[k])[:70], repr(b[k])[:70]))
            elif a[k] != b[k]:
                if is_placeholder(b[k]) or (isinstance(a[k], str) and desecret(a[k]) == desecret(b[k])):
                    out.append(('SECRET', p, 'same bytes, different credential value', '--'))
                else:
                    out.append((cls, p, repr(a[k])[:70], repr(b[k])[:70]))
    elif isinstance(a, list):
        if len(a) != len(b):
            out.append(('BEHAVIOUR', path + '.LENGTH', len(a), len(b)))
        for i, (x, y) in enumerate(zip(a, b)):
            if isinstance(x, (dict, list)) or x == y:
                if isinstance(x, (dict, list)):
                    classify(x, y, path + '[%d]' % i, out)
            else:
                out.append(('BEHAVIOUR', path + '[%d]' % i, repr(x)[:70], repr(y)[:70]))


def _secret_values():
    """The real secret values, so a difference can be recognised as "same bytes, different credential".

    Without this the diff of node 21's jsCode looked like a BEHAVIOUR difference (314319 vs 312892 chars) when
    the only two lines that differ are the oracle URL and token embedded in that code. Classifying by key name
    is not enough, because a secret can live inside a code string.
    """
    vals = set()
    for name in ('port_config.json', 'port_config.local.json'):
        fp = os.path.join(ROOT, 'n8n_nodes', name)
        if os.path.exists(fp):
            for v in json.load(io.open(fp, encoding='utf-8')).values():
                if isinstance(v, str) and len(v) >= 8:
                    vals.add(v)
    return vals


SECRETS = _secret_values()


def desecret(text):
    if not isinstance(text, str):
        return text
    import re as _re
    for v in SECRETS:
        text = text.replace(v, '<<SECRET>>')
    return _re.sub(r'<<[A-Z0-9_]+>>', '<<SECRET>>', text)     # the artifact's own placeholders


def is_placeholder(x):
    import re as _re
    return isinstance(x, str) and bool(_re.fullmatch(r'<<[A-Z0-9_]+>>', x.strip() or ''))


def redact(obj):
    if isinstance(obj, dict):
        return {k: ('<<REDACTED>>' if isinstance(v, str) and is_secret_key(k) and len(v) > 6 else redact(v))
                for k, v in obj.items()}
    if isinstance(obj, list):
        return [redact(v) for v in obj]
    return obj


def main():
    m = Mcp()
    wf = m.call('get_workflow_details', {'workflowId': WF})['workflow']
    active_id = wf['activeVersionId']
    ver = m.call('get_workflow_version', {'workflowId': WF, 'versionId': active_id})
    v = ver.get('version') or ver
    active = {'nodes': v.get('nodes'), 'connections': v.get('connections')}

    art_path = os.path.join(ROOT, 'workflow', 'workflow_%s_v5.8_published.json' % WF)
    artifact = json.load(io.open(art_path, encoding='utf-8'))
    art = {'nodes': artifact.get('nodes'), 'connections': artifact.get('connections')}

    rows = []
    classify(redact(active), redact(art), '', rows)
    buckets = {'SECRET': [], 'METADATA': [], 'BEHAVIOUR': []}
    for r in rows:
        buckets[r[0]].append(r)
    print('active version %s (%d nodes)  vs  %s (%d nodes)'
          % (str(active_id)[:8], len(active['nodes']), os.path.basename(art_path), len(art['nodes'])))
    for k in ('BEHAVIOUR', 'SECRET', 'METADATA'):
        print('\n%s differences: %d' % (k, len(buckets[k])))
        for kind, path, a, b in buckets[k][:12]:
            print('   %-58s active=%s artifact=%s' % (path[:58], a, b))

    # the artifact that IS traceable to what is running
    body = json.dumps(redact(active), sort_keys=True, indent=1).encode()
    sha = hashlib.sha256(body).hexdigest()
    out = os.path.join(ROOT, 'workflow', 'workflow_%s_ACTIVE_%s.json' % (WF, str(active_id)[:8]))
    io.open(out, 'w', encoding='utf-8', newline='\n').write(json.dumps(
        {'_rollback_manifest': {'workflowId': WF, 'versionId': active_id, 'activeFlagAtCapture': wf.get('active'),
                                'nodes': len(active['nodes']), 'connections': len(active['connections'] or {}),
                                'redactedSha256': sha, 'captureTool': 'harness/make_rollback_artifact.py',
                                'secretsRedacted': True,
                                'note': 'restored by importing this graph and re-entering the target instance\'s '
                                        'own credentials; behaviour equals the running version, verified by '
                                        'redactedSha256'},
         'nodes': redact(active)['nodes'], 'connections': redact(active)['connections']},
        indent=1))
    io.open(out + '.sha256', 'w', encoding='utf-8').write(sha + '\n')
    print('\nWROTE %s  (%d bytes)  redactedSha256=%s' % (os.path.basename(out), os.path.getsize(out), sha[:24]))
    print('VERDICT:', 'the old artifact differs only in secrets/metadata -> safe to import for behaviour'
          if not buckets['BEHAVIOUR'] else
          'the old artifact differs in BEHAVIOUR -> it must NOT be used to restore production; use the '
          'ACTIVE artifact or restore version %s on the server' % str(active_id)[:8])


if __name__ == '__main__':
    main()
