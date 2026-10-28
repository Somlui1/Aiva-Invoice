"""Write the production-rollback artifact that can actually be verified.

Fetches the version the server says is active (get_workflow_version by activeVersionId), redacts it through
harness/secret_guard.py — the one scrubber that knows a credential can hide under a key called "value" or
inside a jsCode string — then writes the graph plus a manifest whose sha256 describes EXACTLY the bytes on
disk, and refuses to finish if its own scan still sees a credential.

This is the artifact a rollback should be restored from. The file that used to carry that job
(workflow/…_v5.8_published.json) is behaviour-equivalent (harness/make_rollback_artifact.py: BEHAVIOUR 0) but
was written by a weaker redactor, so treat it as history and this one as the verified artifact.

Run:  python harness/finalize_rollback_artifact.py
"""
import hashlib
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from mcp_client import Mcp                          # noqa: E402
from secret_guard import scrub, scan                # noqa: E402

WF = os.environ.get('ROLLBACK_WF', '034iqKMRjqKt9LlB')


def main():
    m = Mcp()
    wf = m.call('get_workflow_details', {'workflowId': WF})['workflow']
    active_id, active_flag = wf['activeVersionId'], wf.get('active')
    ver = m.call('get_workflow_version', {'workflowId': WF, 'versionId': active_id})
    v = ver.get('version') or ver
    clean = scrub({'nodes': v.get('nodes'), 'connections': v.get('connections')})
    text = json.dumps({'_rollback_manifest': {
        'workflowId': WF, 'versionId': active_id, 'activeFlagAtCapture': active_flag,
        'nodes': len(clean['nodes']), 'connections': len(clean['connections'] or {}),
        'redaction': 'harness/secret_guard.py (assignment name + value shape + known config values)',
        'writtenBy': 'harness/finalize_rollback_artifact.py',
        'verifyWith': 'python harness/verify_rollback_artifacts.py',
        'note': 'import this graph, then re-enter the target instance credentials; the sha256 sidecar describes '
                'these exact bytes'}, 'nodes': clean['nodes'], 'connections': clean['connections']},
        indent=1, sort_keys=True)
    hits = scan(text)
    if hits:
        print('REFUSING TO WRITE, still carrying:', hits[:5])
        return 1
    out = os.path.join(ROOT, 'workflow', 'workflow_%s_ACTIVE_%s.json' % (WF, str(active_id)[:8]))
    io.open(out, 'w', encoding='utf-8', newline='\n').write(text)
    sha = hashlib.sha256(io.open(out, 'rb').read()).hexdigest()       # hash of the BYTES, not of another dump
    io.open(out + '.sha256', 'w', encoding='utf-8').write(sha + '\n')
    again = hashlib.sha256(io.open(out, 'rb').read()).hexdigest()
    print('WROTE %s (%d bytes)\n  versionId=%s active=%s nodes=%d connections=%d\n  sha256(bytes on disk)=%s\n'
          '  self-check: sidecar == sha256(file) -> %s | scan -> %s'
          % (os.path.basename(out), len(text), str(active_id)[:8], active_flag, len(clean['nodes']),
             len(clean['connections'] or {}), sha[:32], again == sha, scan(text) or 'CLEAN'))
    return 0 if again == sha else 1


if __name__ == '__main__':
    sys.exit(main())
