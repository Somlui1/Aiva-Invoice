"""THE parity gate: engine (Python, current tree) vs the n8n port, for every pinned document.

  python harness/parity.py            # full gate; exit 0 only when every case is byte-identical

Per case it runs:
  harness/py_full.py   fixture + Oracle replay tape  -> engine payload  (no network: tape replay)
  harness/js_full.mjs  same fixture + same tape       -> port payload    (dist/bundle.cjs)
  harness/diff_payload.py                            -> SHA EQUAL + deep diff of payload and summary
and finally validates the PORT payload against schemas/result-3.1.schema.json (the contract the Portal
consumes), because a hash match against a self-consistent but wrong shape is still a broken flow.

Add a case whenever a rule branch ships that none of the pinned docs reach - the engine's own lesson:
"a rule is not validated unless the evidence covers the place where the rule acts".
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ENGINE = os.path.dirname(os.path.dirname(ROOT))
FIX = os.path.join(ROOT, "fixtures")
SCHEMA = os.path.join(ENGINE, "schemas", "result-3.1.schema.json")

CASES = [
    # name,                       fixture,                    tape,                what it pins
    ("exec357 / DMS-23", "extraction.json", "oracle_rows.json", "receipt not found -> MANUAL_REVIEW, V-04 review row"),
    ("DMS-15", "extraction2.json", "oracle_rows2.json", "AUTO_PASS, po_number NOT_PRESENT reason"),
    ("V-06 empty", "extraction_v06_empty.json", "oracle_rows2.json", "E08 High + Medium, signature_boxes, missing_slots"),
    ("V-06 nosig", "extraction_v06_nosig.json", "oracle_rows2.json", "synthetic slot elements + NOT_PRESENT, actual='no box'"),
    ("V-06 stamp", "extraction_v06_stamp.json", "oracle_rows2.json", "stamp clears deliverer -> E08 High only"),
]


def run(cmd, env=None):
    p = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, encoding="utf-8",
                       errors="replace", env=env)
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def main():
    env = dict(os.environ, PYTHONPATH=os.path.join(ENGINE, "src"),
               AIVA_EVIDENCE_STRICT="1")               # the engine must also pass its own evidence contract
    bad, passed = 0, 0
    schema_errors = "skipped"
    for name, fixture, tape, note in CASES:
        slug = (fixture[len("extraction_"):-5] if fixture.startswith("extraction_")
                else (fixture[len("extraction"):-5] or "exec357"))
        py_out, js_out = "payload_py_%s.json" % slug, "payload_js_%s.json" % slug
        rc, py = run([sys.executable, os.path.join("harness", "py_full.py"), fixture, tape, py_out], env)
        if rc:
            print("FAIL %-18s engine side crashed:\n%s" % (name, py[-1500:]))
            bad += 1
            continue
        rc, js = run(["node", os.path.join("harness", "js_full.mjs"), fixture, tape, js_out], env)
        if rc:
            print("FAIL %-18s port side crashed:\n%s" % (name, js[-1500:]))
            bad += 1
            continue
        rc, diff = run([sys.executable, os.path.join("harness", "diff_payload.py"),
                        os.path.join(FIX, py_out), os.path.join(FIX, js_out)], env)
        facts = {}
        for line in diff.splitlines():
            for key in ("SHA EQUAL", "TOTAL DIFFS", "SUMMARY DIFFS"):
                if line.startswith(key):
                    facts[key] = line.split(":", 1)[1].strip()
        rec = ""
        for line in py.splitlines():
            if "rec=" in line:
                rec = line.split("rec=")[1].split()[0]
        ok = facts.get("SHA EQUAL") == "True" and facts.get("TOTAL DIFFS") == "0" and facts.get("SUMMARY DIFFS") == "0"
        if not ok:
            bad += 1
        else:
            passed += 1
        print("%-4s %-18s %-14s sha=%s diffs=%s summary=%s   %s"
              % ("PASS" if ok else "FAIL", name, rec, facts.get("SHA EQUAL", "?"),
                 facts.get("TOTAL DIFFS", "?"), facts.get("SUMMARY DIFFS", "?"), note))
        if not ok:
            print(diff[-2500:])
        if schema_errors != "error":
            try:
                import jsonschema
                payload = json.load(open(os.path.join(FIX, js_out), encoding="utf-8"))
                v = jsonschema.Draft7Validator(json.load(open(SCHEMA, encoding="utf-8")))
                errs = sorted(v.iter_errors(payload), key=lambda e: str(list(e.absolute_path)))
                if errs:
                    schema_errors = "%d (%s: %s)" % (len(errs), list(errs[0].absolute_path), errs[0].message[:90])
                    bad += 1
                else:
                    schema_errors = "0 errors"
            except ImportError:
                schema_errors = "skipped (jsonschema not installed)"
            except Exception as e:                                        # noqa: BLE001
                schema_errors = "error: %s" % e
                bad += 1
    print("\nschema 3.1 (port payload): %s" % schema_errors)
    print("%d/%d cases identical to the engine" % (passed, len(CASES)))
    print("PARITY: %s" % ("OK" if not bad else "BROKEN (%d failures)" % bad))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
