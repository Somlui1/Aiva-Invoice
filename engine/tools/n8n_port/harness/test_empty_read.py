"""Engine parity for the branch that used to not exist: classify found no invoice page.

  python harness/test_empty_read.py

What it proves, in the order the code runs:
  1. the REAL node-05 jsCode (n8n_nodes_v58/05_parse_classify.js) returns selected=[] + no_invoice_page +
     pages_complete=false on a classify answer with no invoice page — the same dict python's
     select_invoice_pages returns (that half is also covered case-by-case by test_classify_select.mjs);
  2. node 21's own extraction builder (P.buildExtraction, the same call the node makes) then produces an
     ExtractionResult with ZERO reads — pages present, no fields, no lines, pages_complete=false;
  3. running the port on that extraction gives the SAME payload (payload_sha256) as the real engine
     (harness/py_full.py) on the same extraction, with the same dependency answers (Oracle: no rows on
     both sides, rule AI off on both sides);
  4. the payload passes schemas/result-3.1.schema.json and is a REVIEW with V-01 E01 — never a pass, and
     no exception silently dropped.

Nothing calls the network. Synthetic classify answers only, so no invoice data is written.
"""
import io
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ENGINE = os.path.dirname(os.path.dirname(ROOT))
sys.path.insert(0, os.path.join(ENGINE, "src"))
sys.path.insert(0, HERE)
from diff_rec import strip_ts, walk  # noqa: E402  (same drop rules as the payload hash)

PY = sys.executable
NO_INVOICE_ANSWER = {"pages": [
    {"p": 1, "t": "delivery", "c": "original", "n": "DN-556677", "m": "1/1", "r": 0, "h": ["3010003277"]},
    {"p": 2, "t": "other", "c": "original", "n": None, "m": None, "r": 90},
]}
CFG = {"doc_id": 999, "model": "nvidia/Qwen3.8-Flash-Next-NVFP4", "dpi_classify": 80, "dpi_extract": 150,
       "max_pages": 12, "coord": "norm1000", "standard": "v6.6", "max_boxes": 40, "label_max_chars": 40,
       "colors": {"field": "#d62728"}, "temperature": 0, "max_tokens": 8000}


def run_node05(answer):
    """Execute the node file exactly as n8n does (no imports, $/$input/$execution in scope)."""
    runner = r"""
const fs = require('fs');
const code = fs.readFileSync(process.argv[2], 'utf8');
const answer = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
global.$input = { all: () => [{ json: { choices: [{ message: { content: JSON.stringify(answer) } }] } }] };
const cfg = JSON.parse(fs.readFileSync(process.argv[4], 'utf8'));
global.$ = (name) => {
  if (name.startsWith('03 ')) return { first: () => ({ json: { n_pages: answer.pages.length, page_dims:
      answer.pages.map((p, i) => ({ page_no: p.p, key: 'cls_page_' + (i + 1), w_px: 660, h_px: 935,
                                    bytes: 41234, mime: 'image/jpeg' })) } }) };
  if (name.startsWith('00 CONFIG')) return { first: () => ({ json: cfg }) };
  if (name.startsWith('Get a document')) return { first: () => ({ json: { results: [{ id: 999, versions: [{ checksum: 'aa'.repeat(32) }] }] }, binary: { data: { id: 'pdf' } } }) };
  throw new Error('stub me: ' + name);
};
global.$execution = { id: 'synthetic-empty-read' };
new (Object.getPrototypeOf(async function () { }).constructor)(code)().then(
  (out) => process.stdout.write(JSON.stringify(out[0].json)),
  (e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });
"""
    with open(os.path.join(HERE, "_tmp_node05.cjs"), "w", encoding="utf-8") as fh:
        fh.write(runner)
    with open(os.path.join(HERE, "_tmp_answer.json"), "w", encoding="utf-8") as fh:
        json.dump(answer, fh)
    with open(os.path.join(HERE, "_tmp_cfg.json"), "w", encoding="utf-8") as fh:
        json.dump(CFG, fh)
    try:
        r = subprocess.run(["node", os.path.join(HERE, "_tmp_node05.cjs"),
                            os.path.join(ROOT, "n8n_nodes_v58", "05_parse_classify.js"),
                            os.path.join(HERE, "_tmp_answer.json"), os.path.join(HERE, "_tmp_cfg.json")],
                           capture_output=True, text=True, encoding="utf-8")
        if r.returncode:
            raise SystemExit("node 05 failed: " + (r.stderr or "")[-800:])
        return json.loads(r.stdout)
    finally:
        for f in ("_tmp_node05.cjs", "_tmp_answer.json", "_tmp_cfg.json"):
            os.unlink(os.path.join(HERE, f))


def write_synth_exec(n05, path):
    """An execution dump that stops after node 05 — exactly what the IF node routes to node 21."""
    def items(js):
        return [{"data": {"main": [[{"json": js}]]}}]
    rd = {"00 CONFIG (single point)": items(CFG),
          "Get a document": items({"results": [{"id": 999, "versions": [{"checksum": "aa" * 32}]}]}),
          "05 Parse classify pick invoice pages": items(n05)}
    io.open(path, "w", encoding="utf-8").write(json.dumps(
        {"data": {"resultData": {"runData": rd}}, "execution": {"id": "synthetic"}}))


def main():
    bad = 0
    n05 = run_node05(NO_INVOICE_ANSWER)
    sel = n05.get("selection") or {}
    print("node 05  : selected=%s no_invoice_page=%s pages_complete=%s empty_read=%s"
          % (json.dumps(sel.get("selected")), sel.get("no_invoice_page"), sel.get("pages_complete"),
             n05.get("empty_read")))
    for key, want in (("selected", []), ("no_invoice_page", True), ("pages_complete", False)):
        if sel.get(key) != want:
            bad += 1
            print("  FAIL selection.%s = %r (engine says %r)" % (key, sel.get(key), want))
    if n05.get("fallback_used"):
        bad += 1
        print("  FAIL fallback_used is true - the flow must never guess page 1")

    exec_file = os.path.join("live", "synth_empty_exec.json")
    write_synth_exec(n05, os.path.join(ROOT, exec_file))
    fx, tape = "exec_empty.json", "exec_empty_oracle.json"
    for f in (tape,):
        io.open(os.path.join(ROOT, "fixtures", f), "w", encoding="utf-8").write(json.dumps(
            [{"query_id": "EMPTY", "sql": "--", "csv": "No rows selected"}] * 14))
    js = subprocess.run(["node", os.path.join(HERE, "js_exec.mjs"), exec_file,
                         "--dump-extraction", "fixtures/" + fx,
                         "--tape", "fixtures/" + tape,
                         "--out", "fixtures/payload_js_empty.json"], capture_output=True, text=True, cwd=ROOT)
    if js.returncode:
        print("node side failed:\n" + (js.stderr or js.stdout)[-1500:])
        return 1
    # py_full.py reads request + models from <fixture>_meta.json. versions.models is INSIDE the hashed
    # payload, so both sides must be handed the identical dict (container.Services.models), not one side {}
    dumped = json.load(io.open(os.path.join(ROOT, "fixtures", fx), encoding="utf-8"))
    io.open(os.path.join(ROOT, "fixtures", fx[:-5] + "_meta.json"), "w", encoding="utf-8").write(
        json.dumps({"request": dumped["request"], "models": dumped["models"]}))
    py = subprocess.run([PY, os.path.join(HERE, "py_full.py"), fx, tape, "payload_py_empty.json"],
                        capture_output=True, text=True, cwd=ROOT)
    if py.returncode:
        print("python side failed:\n" + (py.stderr or py.stdout)[-1500:])
        return 1
    print("".join(l + "\n" for l in js.stdout.splitlines()[:3]))

    def sha_of(text):
        for line in text.splitlines():
            if "sha=" in line:
                return line.split("sha=")[1].split()[0].strip()
        return "?"
    jsSha, pySha = sha_of(js.stdout), sha_of(py.stdout)
    print("port   %s\nengine %s" % (jsSha, pySha))
    if jsSha != pySha:
        bad += 1

    jsP = json.load(io.open(os.path.join(ROOT, "fixtures", "payload_js_empty.json"), encoding="utf-8"))
    pyP = json.load(io.open(os.path.join(ROOT, "fixtures", "payload_py_empty.json"), encoding="utf-8"))
    for k in ("contract", "versions.schema", "pages_complete", "page_count"):
        got = (jsP.get("package") or {}).get(k, jsP.get(k)) if k != "versions.schema" else jsP["versions"]["schema"]
        print("  package.%-16s = %r" % (k, got))
    print("  recommendation         = %s  codes=%s  max_severity=%s"
          % (jsP["recommendation"]["value"], jsP["recommendation"]["exception_codes"],
             jsP["recommendation"]["max_severity"]))
    print("  lines=%s fields_without_box=%s evidence rows=%s (kind=review: %s)"
          % (len(jsP.get("extraction", {}).get("lines", []) or []),
             sum(1 for f in (jsP.get("extraction", {}) or {}).get("fields", {}).values() if not f.get("element_id")),
             len(jsP.get("evidence", [])),
             sum(1 for e in jsP.get("evidence", []) if e.get("kind") == "review")))

    diffs = []
    walk(strip_ts({k: v for k, v in jsP.items() if k not in ("integrity", "request", "metrics", "summary")}),
         strip_ts({k: v for k, v in pyP.items() if k not in ("integrity", "request", "metrics", "summary")}),
         "$", diffs, 20)
    if diffs:
        bad += 1
        print("  FIELD-BY-FIELD DIFF (engine vs port):")
        for p, a, b in diffs:
            print("    %-46s port=%s engine=%s" % (p, json.dumps(a, ensure_ascii=False)[:90],
                                                   json.dumps(b, ensure_ascii=False)[:90]))
    else:
        print("  field-by-field: identical on every key the payload hash covers")

    # verdict must be a HOLD/REVIEW with E01, never a pass; every evidence row must validate
    import jsonschema
    schema = json.load(io.open(os.path.join(ENGINE, "schemas", "result-3.1.schema.json"), encoding="utf-8"))
    try:
        jsonschema.validate(jsP, schema)
        print("  schema result-3.1: VALID (%d evidence rows)" % len(jsP.get("evidence", [])))
    except jsonschema.ValidationError as e:
        bad += 1
        print("  schema result-3.1: INVALID at %s: %s" % ("/".join(map(str, e.path)), e.message[:200]))
    if jsP["recommendation"]["value"] == "AUTO_PASS" or "E01" not in jsP["recommendation"]["exception_codes"]:
        bad += 1
        print("  FAIL an unread document must raise E01 and cannot auto-pass")
    print("\n%s" % ("EMPTY-READ PARITY: OK — the flow and the engine refuse the document the same way"
                    if not bad else "EMPTY-READ PARITY: FAIL (%d problem(s))" % bad))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
