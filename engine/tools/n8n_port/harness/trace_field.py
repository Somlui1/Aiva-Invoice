"""Why does a cell look different to the engine than to the port?  Traces one field through the pipeline.

  python harness/trace_field.py 101 uom
  python harness/trace_field.py 101 uom --who V-01

Patches the engine's rule entry points so every rule that runs gets to report what the named cell looks
like at that moment, in pipeline order.  This is how a payload difference becomes an explanation.
"""
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REC = os.path.join(ROOT, "fixtures", "rec")
ENGINE = os.path.dirname(os.path.dirname(ROOT))
sys.path.insert(0, os.path.join(ENGINE, "src"))
sys.path.insert(0, HERE)
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from system_a.envfile import read_env_file                                     # noqa: E402
for _k, _v in read_env_file().items():                                        # noqa: E402
    os.environ.setdefault(_k, _v)

import engine_replay                                                          # noqa: E402
from system_a.domain import rules as R                                        # noqa: E402

TARGET = {"uom": "cell:uom", "qty": "cell:qty", "amount": "cell:amount", "po": "field:po_number",
          "name": "field:customer_name", "tax": "field:customer_tax_id"}.get(sys.argv[2], sys.argv[2])
WHO = sys.argv[3] if "--who" in sys.argv else None


def show(tag, c):
    d = c.doc
    if TARGET.startswith("cell:"):
        key = TARGET.split(":", 1)[1]
        for l in d.lines:
            cf = (l.cells or {}).get(key)
            print("   %-22s L%-3s ok=%-5s raw=%r value=%r nr=%s ev=%s"
                  % (tag, l.line_no, getattr(cf, "ok", "-"), (getattr(cf, "raw", None) or "")[:24],
                     getattr(cf, "value", None), getattr(cf, "null_reason", None),
                     list(getattr(cf, "evidence", ()) or ()))[:150])
    else:
        key = TARGET.split(":", 1)[1]
        cf = d.fields.get(key)
        print("   %-22s ok=%-5s raw=%r value=%r nr=%s ev=%s"
              % (tag, getattr(cf, "ok", "-"), (getattr(cf, "raw", None) or "")[:30], getattr(cf, "value", None),
                 getattr(cf, "null_reason", None), list(getattr(cf, "evidence", ()) or ()))[:170])


def main():
    doc_id = sys.argv[1]
    orig = {}

    def wrap(name):
        real = getattr(R, name)

        def inner(c):
            if WHO in (None, name.replace("_", "-").upper()):
                show(name, c)
            out = real(c)
            if WHO in (None, name.replace("_", "-").upper()) and getattr(out, "findings", None):
                for f in out.findings[:2]:
                    print("   %-22s -> %s %s" % (name, f.code, (f.actual or f.message_th or "")[:110]))
            return out
        orig[name] = real
        return inner

    # R.STEP1 holds the function objects, so patching module names would be ignored - rewrite the lists.
    for attr in ("STEP1", "STEP2", "STEP3"):
        lst = getattr(R, attr, None) or []
        setattr(R, attr, [wrap(f.__name__) if getattr(f, "__name__", "") else f for f in lst])
    settings = engine_replay.Settings()
    payload, used_ai, used_or = engine_replay.replay(doc_id, settings)
    for n, f in orig.items():
        setattr(R, n, f)
    print("\n  final V-01 evidence:")
    for ev in payload["evidence"]:
        if ev.get("rule_id") == "V-01":
            print("   ", ev.get("actual_value"))


if __name__ == "__main__":
    main()
