"""One-shot re-sync of the n8n blackbox workflow from this repo (no clipboard, no manual paste).

  export N8N_API_KEY=...              # n8n: Settings -> API -> Create API key  (or put it in engine/.env)
  python harness/n8n_sync.py --check  # drift report only: what live n8n holds vs what the repo says
  python harness/n8n_sync.py          # backup, PUT, then READ BACK every changed field and compare
  python harness/n8n_sync.py --publish | --unpublish

What it updates, all read out of the repo at run time (nothing is typed or pasted):
  00 CONFIG (single point)     assignment prompt_extract = config/prompts/single_pass_extract.md
  12 Build final JSON + images jsCode label single-pass-extract@<version>
  21 Validate (port)           jsCode = dist/node21_inline.js        (built by build_n8n_inline.mjs)
  22 Verification report       jsCode = n8n_nodes/22_v57.js           (v5.7 review rows)

House rules this script enforces, learned the hard way in this project:
  * "n8n said applied" is not evidence — after the PUT it GETs again and compares byte-for-byte
    (CR-normalised; n8n trims a trailing newline on Set values, which is reported, not hidden);
  * the live workflow is copied to live/backup_*.json before anything is written;
  * an unexpected node on the canvas aborts the run instead of overwriting it.
"""
import argparse
import io
import json
import os
import re
import sys
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ENGINE = os.path.dirname(os.path.dirname(ROOT))
LIVE = os.path.join(ROOT, "live")
CONFIG_NODE = "00 CONFIG (single point)"
NODE12 = "12 Build final JSON + images"
NODE21 = "21 Validate (port)"
NODE22 = "22 Verification report (9 rules)"
NODE03 = "03 Build classify request"
NODE05 = "05 Parse classify pick invoice pages"
NODE08 = "08 Build extract request"
EXPECTED_NODES = {
    "BB TRIGGER (doc_id from parent)", CONFIG_NODE, "Get a document", "02 PDF to JPEG 80 DPI (classify)",
    "03 Build classify request", "04 VLM step 1 classify pages", "05 Parse classify pick invoice pages",
    "06 PDF to JPEG 150 DPI", "07 Rotate invoice page upright", "08 Build extract request",
    "09 VLM step 2 extract bbox", "10 Bbox math pixels + sanitize", NODE12, NODE21, NODE22,
    "00 MANUAL TEST (doc_id=89)",
}


# ---------------------------------------------------------------- repo side (source of truth)
def prompt_text(name):
    path = os.path.join(ENGINE, "config", "prompts", name)
    text = io.open(path, encoding="utf-8").read()
    ver = re.search(r"version:\s*([0-9.]+)", text)
    return text.rstrip("\n"), (ver.group(1) if ver else "?")


def repo_updates():
    """node name -> list of (kind, key, value, where it came from)"""
    extract, extract_ver = prompt_text("single_pass_extract.md")
    classify, classify_ver = prompt_text("single_pass_classify.md")
    node21 = io.open(os.path.join(ROOT, "dist", "node21_inline.js"), encoding="utf-8").read()
    node22 = io.open(os.path.join(ROOT, "n8n_nodes", "22_v57.js"), encoding="utf-8").read()
    return {
        CONFIG_NODE: [("assignment", "prompt_extract", extract, "config/prompts/single_pass_extract.md@" + extract_ver),
                      ("assignment", "prompt_classify", classify, "config/prompts/single_pass_classify.md@" + classify_ver)],
        NODE12: [("label", None, extract_ver, "bumps only the single-pass-extract@ label in live n8n")],
        NODE21: [("jsCode", None, node21, "dist/node21_inline.js")],
        NODE03: [("jsCode", None, io.open(os.path.join(ROOT, "n8n_nodes_v58", "03_classify_multimage.js"), encoding="utf-8").read(),
                  "n8n_nodes_v58/03_classify_multimage.js (A2: one classify request, all pages)")],
        NODE05: [("jsCode", None, io.open(os.path.join(ROOT, "n8n_nodes_v58", "05_parse_classify.js"), encoding="utf-8").read(),
                  "n8n_nodes_v58/05_parse_classify.js (A2: one answer for all pages, python 'or' semantics, Thai-safe normKey)")],
        NODE08: [("jsCode", None, io.open(os.path.join(ROOT, "n8n_nodes_v58", "08_extract_request.js"), encoding="utf-8").read(),
                  "n8n_nodes_v58/08_extract_request.js (A2: keep the prompt file's trailing newline)")],
        NODE22: [("jsCode", None, node22, "n8n_nodes/22_v57.js")],
    }, {"extract": extract_ver, "classify": classify_ver}


# ---------------------------------------------------------------- n8n side
def api(base, key, method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(base.rstrip("/") + path, data=data, method=method,
                                 headers={"X-N8N-API-KEY": key, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            raw = r.read().decode("utf-8")
            return r.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")


def norm(v):
    return str(v).replace("\r\n", "\n").rstrip("\n")


def node_by_name(wf):
    return {n["name"]: n for n in wf["nodes"]}


def current_value(node, kind, key):
    if kind == "jsCode":
        return node.get("parameters", {}).get("jsCode")
    for a in node.get("parameters", {}).get("assignments", {}).get("assignments", []):
        if a.get("name") == key:
            return a.get("value")
    return "<assignment %s not present>" % key


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workflow", default="034iqKMRjqKt9LlB")
    ap.add_argument("--base", default=os.environ.get("N8N_BASE_URL", "http://10.10.3.112:5678"))
    ap.add_argument("--check", action="store_true", help="read-only drift report")
    ap.add_argument("--publish", action="store_true")
    ap.add_argument("--from-file", help="read-only: use a saved workflow dump instead of the API")
    ap.add_argument("--unpublish", action="store_true")
    args = ap.parse_args()

    key = os.environ.get("N8N_API_KEY", "")
    if args.from_file:
        wf = json.load(open(args.from_file, encoding="utf-8"))
        wf = wf.get("workflow", wf)
        upd, vers = repo_updates()
        nodes = node_by_name(wf)
        print("OFFLINE drift check against %s  (versionId=%s)" % (os.path.basename(args.from_file), wf.get("versionId")))
        print("repo says: extract@%s classify@%s" % (vers["extract"], vers["classify"]))
        print()
        n = 0
        for name, changes in upd.items():
            for kind, k, val, src in changes:
                cur = current_value(nodes[name], "jsCode" if kind != "assignment" else kind, k)
                if kind == "label":
                    val = re.sub(r"single-pass-extract@[0-9.]+", "single-pass-extract@" + val, cur or "")
                    kind, k = "jsCode", None
                same = cur is not None and norm(cur) == norm(val)
                n += 0 if same else 1
                print("  %-14s %-30s %s  live=%s repo=%d chars   (%s)" %
                      (name, k or kind, "in sync" if same else "WOULD UPDATE",
                       "-" if cur is None else len(norm(cur)), len(norm(val)), src))
        print()
        print("%d field(s) would be updated. (--from-file is read-only)" % n)
        return 1 if n else 0

    if not key:
        envp = os.path.join(ENGINE, ".env")
        if os.path.exists(envp):
            for line in io.open(envp, encoding="utf-8"):
                if line.strip().startswith("N8N_API_KEY="):
                    key = line.split("=", 1)[1].strip().strip('"')
    if not key:
        print("N8N_API_KEY is not set (n8n: Settings -> API -> Create API key), and it is not in engine/.env")
        return 2

    upd, vers = repo_updates()
    st, got = api(args.base, key, "GET", "/api/v1/workflows/" + args.workflow)
    if st != 200:
        print("GET workflow failed HTTP %s: %s" % (st, str(got)[:400]))
        return 1
    wf = got.get("data", got) if isinstance(got, dict) else got
    nodes = node_by_name(wf)
    extra = sorted(set(nodes) - EXPECTED_NODES)
    gone = sorted(EXPECTED_NODES - set(nodes))
    if extra or gone:
        print("canvas is not the expected topology - refusing to write.\n  unexpected: %s\n  missing   : %s"
              % (extra or "-", gone or "-"))
        return 1

    print("workflow %s  versionId=%s  active=%s  nodes=%d" % (wf["id"], wf.get("versionId"), wf.get("active"), len(nodes)))
    print("repo says: extract@%s classify@%s\n" % (vers["extract"], vers["classify"]))

    diffs = []
    for name, changes in upd.items():
        for kind, k, val, src in changes:
            cur = current_value(nodes[name], "jsCode", k)
            if kind == "label":          # value is derived from live, so a local stale copy can never win
                cur_code = cur or ""
                if "single-pass-extract@" not in cur_code:
                    print("  %-14s label not found in live jsCode - refusing to guess" % name)
                    return 1
                val = re.sub(r"single-pass-extract@[0-9.]+", "single-pass-extract@" + val, cur_code)
                kind = "jsCode"
            if cur is None or norm(cur) != norm(val):
                how = "DIFFERS" if cur is not None else "ABSENT"
                diffs.append((name, kind, k, val, src))
                print("  %-14s %-30s %s  repo %d chars vs live %s" %
                      (name, k or kind, how, len(val), "-" if cur is None else str(len(norm(cur)))))
            else:
                print("  %-14s %-30s in sync (%d chars, %s)" % (name, k or kind, len(norm(val)), src))
    if not diffs:
        print("\nnothing to do - live n8n already matches the repo.")
        return 0
    if args.check:
        print("\n%d field(s) to update (--check wrote nothing)." % len(diffs))
        return 1

    os.makedirs(LIVE, exist_ok=True)
    bak = os.path.join(LIVE, "backup_%s_version-%s.json" % (wf["id"], wf.get("versionId")))
    with open(bak, "w", encoding="utf-8") as fh:
        json.dump(wf, fh, ensure_ascii=False, indent=1)
    print("\nbackup: %s (%d bytes)" % (bak, os.path.getsize(bak)))

    for name, kind, k, val, _src in diffs:
        node = nodes[name]
        if kind == "jsCode":
            node["parameters"]["jsCode"] = val
        else:
            entry = [a for a in node["parameters"]["assignments"]["assignments"] if a.get("name") == k][0]
            entry["value"] = val
            entry["type"] = "string"
    body = {k: wf[k] for k in ("name", "nodes", "connections", "settings") if k in wf}
    st, res = api(args.base, key, "PUT", "/api/v1/workflows/" + args.workflow, body)
    if st not in (200, 201):
        print("PUT failed HTTP %s: %s" % (st, str(res)[:600]))
        return 1
    new_wf = (res.get("data", res) if isinstance(res, dict) else res) or {}
    print("PUT ok, new versionId=%s" % new_wf.get("versionId"))

    if args.publish or args.unpublish:
        st, res = api(args.base, key, "POST", "/api/v1/workflows/%s/%s"
                      % (args.workflow, "activate" if args.publish else "deactivate"))
        print("%s -> HTTP %s" % ("publish" if args.publish else "unpublish", st))

    # ---- read back: the only proof that counts ---------------------------------------------------
    st, got2 = api(args.base, key, "GET", "/api/v1/workflows/" + args.workflow)
    after = node_by_name((got2.get("data", got2)))
    bad = 0
    for name, kind, k, val, src in diffs:
        now = current_value(after[name], kind, k)
        ok = norm(now) == norm(val)
        exact = str(now) == val
        if not ok:
            bad += 1
        print("  READ-BACK %-14s %-30s %s%s" % (name, k or kind, "EQUAL" if ok else "MISMATCH",
              "" if exact or not ok else "  (equal after CR/trailing-newline normalisation, source %s)" % src))
        if not ok and now is not None:
            i = 0
            a, b2 = norm(now), norm(val)
            while i < min(len(a), len(b2)) and a[i] == b2[i]:
                i += 1
            print("      first diff at %d: live=%r repo=%r" % (i, a[i:i + 60], b2[i:i + 60]))
    print("\n%s  (%d field(s) written)" % ("SYNC VERIFIED" if not bad else "SYNC NOT VERIFIED", len(diffs)))
    print("next: run the workflow once and compare it with the engine — see STATUS.md 'after a sync'.")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
