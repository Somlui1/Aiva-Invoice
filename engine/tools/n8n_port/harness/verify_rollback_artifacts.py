"""Prove what each rollback artifact actually restores — by version id and content, never by filename.

Three different things get called "the backup" in a conversation, and mixing them up is how a draft
rollback ends up overwriting production:

  A. the DRAFT backup taken before the v5.9 push (live/backup_*_before_v59_*.json) — restores the draft
     canvas at version 128fb6f2-… . It is NOT a production artifact: it never was the active version.
  B. the PRODUCTION artifact: the bytes of the version that is actually running
     (activeVersionId = 4de2ad29-…) — fetched here by id from the server and hashed.
  C. the importable export (workflow/…_v5.8_published.json) — must equal B node-for-node after the
     exporter's redaction, otherwise "import this to roll back" is a claim nobody checked.

Run:  python harness/verify_rollback_artifacts.py
"""
import glob
import hashlib
import io
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mcp_client import Mcp                                    # noqa: E402

WF = '034iqKMRjqKt9LlB'
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SECRET_KEYS = ('token', 'key', 'apikey', 'api_key', 'password', 'secret', 'url')


def body(wf):
    return json.dumps({'nodes': wf.get('nodes'), 'connections': wf.get('connections')},
                      sort_keys=True).encode()


def sha(b):
    return hashlib.sha256(b).hexdigest()[:16]


def redact_lenient(obj):
    """Canonicalise secret-looking string values the SAME way on both sides.

    The first version of this function left already-redacted values (`<<ORACLE_MCP_URL>>`) alone while
    blanking the live server's real values, so it reported a mismatch that was an artifact of the comparison,
    not of the artifact. Under content-addressing that false alarm is as dangerous as a missed one, so the
    rule is now: any string under a secret-looking key collapses to one sentinel, whatever it holds.
    """
    if isinstance(obj, dict):
        return {k: ('<<REDACTED>>' if isinstance(v, str) and any(t in k.lower() for t in SECRET_KEYS)
                    and len(v) > 6 else redact_lenient(v)) for k, v in obj.items()}
    if isinstance(obj, list):
        return [redact_lenient(v) for v in obj]
    return obj


def main():
    m = Mcp()
    wf = m.call('get_workflow_details', {'workflowId': WF})['workflow']
    active_id = wf.get('activeVersionId')
    print('child %s  draft=%s  activeVersionId=%s  active=%s'
          % (WF, str(wf.get('versionId'))[:8], str(active_id)[:8], wf.get('active')))

    # ---- B: the bytes the server says are running -----------------------------------------------------
    ver = m.call('get_workflow_version', {'workflowId': WF, 'versionId': active_id})
    v = ver.get('version') or ver
    active = {'nodes': v.get('nodes'), 'connections': v.get('connections')}
    print('B  ACTIVE version fetched by id  versionId=%s  nodes=%d  sha(nodes+connections)=%s'
          % (str(v.get('versionId') or active_id)[:8], len(active['nodes'] or []), sha(body(active))))

    # ---- C: the importable "published" export must be those same bytes -------------------------------
    pub = os.path.join(ROOT, 'workflow', 'workflow_%s_v5.8_published.json' % WF)
    if os.path.exists(pub):
        exp = json.load(io.open(pub, encoding='utf-8'))
        same = sha(body(redact_lenient(active))) == sha(body(redact_lenient(exp)))
        print('C  %s\n   nodes=%d  sha(redacted)=%s   == ACTIVE(redacted): %s   -> PRODUCTION ROLLBACK ARTIFACT %s'
              % (os.path.basename(pub), len(exp.get('nodes') or []), sha(body(redact_lenient(exp))),
                 same, 'VERIFIED' if same else 'DOES NOT MATCH ACTIVE — do not trust this filename'))
    else:
        print('C  missing: %s' % pub)

    # ---- A: the draft backup, and what it is NOT -----------------------------------------------------
    cands = sorted(glob.glob(os.path.join(ROOT, 'live', 'backup_*before_v59*.json')))
    for c in cands:
        d = json.load(io.open(c, encoding='utf-8'))
        vid = str(d.get('versionId') or (d.get('workflow') or {}).get('versionId') or '?')
        inner = d.get('workflow', d)
        print('A  %s\n   versionId=%s  nodes=%d  sha(nodes+connections)=%s  == ACTIVE: %s  -> %s'
              % (os.path.basename(c), vid[:8], len(inner.get('nodes') or []), sha(body(inner)),
                 sha(body(inner)) == sha(body(active)),
                 'this is the DRAFT pre-v5.9 state (restoring it replaces the canvas draft only)'
                 if sha(body(inner)) != sha(body(active)) else 'this is the ACTIVE state'))
    if not cands:
        print('A  no live/backup_*before_v59*.json found')

    print('\nRULE: production rollback = import C (verified against activeVersionId), or restore the version\n'
          '     id above from the server. A is a draft-only undo and must never be used as production restore.')


if __name__ == '__main__':
    main()
