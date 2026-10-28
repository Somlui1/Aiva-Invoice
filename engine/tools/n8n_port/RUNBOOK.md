# Runbook — v5.8 draft → production (child workflow `034iqKMRjqKt9LlB`)

Nothing here has been executed against production: as of this writing the **draft** carries v5.8 and the
**published/active version is still `4de2ad29`** (`active=true`, parent `soWzNNLrZ1c4Absf` unchanged).
The draft on the canvas is now **v5.9** (`06b` per-page loop + adjudicate chain + R6-13 tax-id re-read);
push it with `python harness/push_v59.py` (same dry-run/`--check`/backup/byte-equal rules as `push_v58.py`) and
export with `python harness/export_workflow.py` (writes `workflow/..._v5.9_draft.json`, refuses to write a
leaked secret).
Publishing is the owner's decision (SRS §17: the AI matcher was never meant to go live before approval).

## 0. Read the real state (never trust a remembered version id)

```bash
cd engine/tools/n8n_port
python harness/verify_published.py            # compares the PUBLISHED version, read back by version id
python harness/verify_published.py --draft    # compares the draft (= repo)
```

`verify_published.py` fetches the running version through `get_workflow_version(activeVersionId)`.
`get_workflow_details` returns the **draft graph** — comparing that and calling it "production" produces a
false PASS (it happened while writing this tool; the script now refuses to guess).

## 1. Rebuild and check offline (no credentials, no network to Oracle/VLM)

```bash
node build.mjs && node build_n8n_inline.mjs
node harness/test_inline.mjs          # pinned hashes vs the engine's own reference payloads
python harness/test_answer_decode.py  # VLM answer decode: JS == Python (212 answers)
python harness/test_row_bbox_parity.py
python harness/test_empty_read.py     # no-invoice-page payload == engine, schema 3.1 valid
node harness/test_classify_select.mjs # page selection == Python (14 cases)
python harness/parity_rec.py          # 12 recorded documents, full decision layer
```

## 2. Push to the DRAFT only, then read it back

```bash
python harness/push_v58.py --check      # what would change
python harness/push_v58.py              # backup + write draft + byte-verify read-back; never publishes
```

The script writes node 21 / 03 / 05 / 10 code, node 02 params (JPEG q70) and the `05b` branch, saves a
timestamped backup under `live/`, and prints `draft=<id> active=<id> (NOT published by this script)`.

## 3. Test on the draft with real traffic

```bash
python harness/live_v58_test.py                 # doc 89 (normal path)
python harness/live_v58_test.py --set-doc 34    # document with no invoice page -> empty-read branch
python harness/live_v58_test.py --revert-doc    # put node 00 back to the $json.doc_id expression
```

Each run saves `live/ab_exec_<n>.json`; `python harness/test_live_exec.py` then replays those saved
extractions through the engine and compares payload hashes (8/8 OK: execs 451-457, 459, 460; 458 skipped —
that doc id does not exist in paperless). Manual runs on the draft do not touch the published version.
**Revert `doc_id` afterwards** — node 00 is shared with production.

## 4. Publish (owner's call)

1. Confirm the open items in `STATUS.md` §13.4 are accepted or closed (multi-page loop, adjudicate,
   tax-id 300 DPI re-read, extract JPEG q90).
2. Publish the draft version; confirm `activeVersionId` moved and re-run
   `python harness/verify_published.py` → must print `RUNNING VERSION == REPO`.
3. Watch the first real webhook documents: node 21's `metrics.elapsed_ms`, `recommendation`, and
   `payload_sha256` should agree with the engine for the same `doc_id`.

## 5. Rollback

n8n keeps every published version: **Workflow → Versions → select `4de2ad29…` → Restore version**, or the
local copy of that version as JSON: `workflow/workflow_034iqKMRjqKt9LlB_v5.8_published.json`
(secrets redacted — re-enter `paperless_token`, `llm_key`, Oracle token/URL after importing).
`python harness/export_workflow.py [--published]` regenerates either snapshot. Rollback needs no engine
change: the payload contract (`aiva.system_a.result/3.0`) did not change, only which rules produced it.

## 6. Import from file (another instance)

`workflow/workflow_034iqKMRjqKt9LlB_v5.8_draft.json` — import, then set the four placeholders
(`ENVIRONMENT.md`) and re-point the paperless credential id. Node 21's Oracle token lives inside its
`jsCode` SECTION A, not in a credential, so regenerate node 21 with `node build_n8n_inline.mjs` against
that instance's `port_config.json` rather than pasting a token by hand.
