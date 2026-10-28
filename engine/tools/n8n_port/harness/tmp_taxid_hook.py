"""TEMPORARY live test hook for the R6-13 branch — not part of the repo's node code, and reversible.

Why a hook is needed at all: nothing in the recorded corpus ever fired the tax-id re-read (every engine
extraction has extra.taxid_retry = []), and whether a live document fires depends on what the model mis-reads
today, which a test cannot schedule. To prove the branch really runs on the canvas — 300 DPI render, rotate,
second VLM call, accept/reject, join, bbox maths on the hi-res frame — this pushes a config-gated hook into
node 09t plus a `taxid_force` assignment into node 00, and `--restore` puts the repo bytes back.

The hook fires only while node 00 carries taxid_force=true, and only on the DRAFT: production executes the
published version (4de2ad29), which never contains either edit.
"""
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from mcp_client import Mcp                                                # noqa: E402
import push_v59 as P                                                     # noqa: E402

WF = P.WF
CFG = "00 CONFIG (single point)"
HOOK_LINE = ("  let problem = (retryDpi > 0 && !spent) ? taxIdProblem(ans) : null;\n"
             "  if (cfg.taxid_force === true && problem === null)\n"
             "    problem = 'TAX_ID_MISSING (forced by cfg.taxid_force)';   // TEST HOOK: see harness/tmp_taxid_hook.py")
ASSIGN = {"id": "taxid_force", "name": "taxid_force", "type": "boolean", "value": True}


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'push'
    s = Mcp()
    wf = s.call('get_workflow_details', {'workflowId': WF})['workflow']
    nodes = {n['name']: n for n in wf['nodes']}
    repo09t = io.open(os.path.join(P.V58, '09t_taxid_triage.js'), encoding='utf-8').read()
    live09t = nodes[P.N09T]['parameters']['jsCode']
    assignments = [a for a in nodes[CFG]['parameters']['assignments']['assignments'] if a['name'] != 'taxid_force']

    if mode == 'push':
        assert "  const problem = (retryDpi > 0 && !spent) ? taxIdProblem(ans) : null;" in live09t, \
            'node 09t on canvas no longer matches the hook target line — refusing to guess'
        ops = [{'type': 'setNodeParameter', 'nodeName': P.N09T, 'path': '/jsCode',
                'value': live09t.replace(
                    "  const problem = (retryDpi > 0 && !spent) ? taxIdProblem(ans) : null;", HOOK_LINE)},
               {'type': 'setNodeParameter', 'nodeName': CFG, 'path': '/assignments/assignments',
                'value': assignments + [ASSIGN]}]
    elif mode == 'restore':
        ops = [{'type': 'setNodeParameter', 'nodeName': P.N09T, 'path': '/jsCode', 'value': repo09t},
               {'type': 'setNodeParameter', 'nodeName': CFG, 'path': '/assignments/assignments',
                'value': assignments}]
    else:
        raise SystemExit('usage: tmp_taxid_hook.py [push|restore]')

    r = s.call('update_workflow', {'workflowId': WF, 'operations': ops})
    print('%s ->' % mode, json.dumps({k: str(r.get(k)) for k in ('saved', 'draft_versionId') if k in r})[:160])

    back = {n['name']: n for n in s.call('get_workflow_details', {'workflowId': WF})['workflow']['nodes']}
    code = back[P.N09T]['parameters']['jsCode']
    names = [a['name'] for a in back[CFG]['parameters']['assignments']['assignments']]
    if mode == 'push':
        ok = 'taxid_force' in code and 'taxid_force' in names
    else:
        ok = code == repo09t and 'taxid_force' not in names
        print('  node 09t == repo bytes:', code == repo09t)
    print('  taxid_force assignment present:', 'taxid_force' in names)
    print('HOOK', mode.upper(), 'OK' if ok else 'FAILED')
    return 0 if ok else 1


sys.exit(main())
