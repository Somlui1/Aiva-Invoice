"""What did the model actually answer for a document whose payload has values but no boxes anywhere?

DMS-147 and DMS-212 came out of the Final Full Round with eleven complete field values, line rows and totals -
and not one coordinate: every field, cell and line has ``region: null``, ``word_ids: []``, and the payload has
zero regions at all.  ``page_errors`` is empty and the call reports ``ok: true``, so nothing anywhere said
"this read has no geometry".

This tool runs the ordinary pipeline with one thing added: every model answer is written to disk before the
parser touches it.  The question it answers is narrow and important - did the model omit coordinates, or did it
send coordinates the parser threw away?  Those are different bugs with different fixes, and the difference is
only visible in the raw bytes.

  python bbox_testing/round_06/dump_extract_answer.py 147 212
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "src"))
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):                     # pragma: no cover
    pass

from dataclasses import replace                         # noqa: E402
from system_a.envfile import load_env                   # noqa: E402

load_env()
from system_a.container import Settings, build_perception, build_paperless   # noqa: E402


def main() -> int:
    ids = [int(v) for v in sys.argv[1:] if v.isdigit()] or [147, 212]
    s = replace(Settings(), mode="production", perception_engine="single_pass")
    reader = build_paperless(s)
    out = HERE / "raw_answers"
    out.mkdir(exist_ok=True)
    for doc in ids:
        cached = ROOT / ".cache" / "downloads" / f"DMS-{doc}.pdf"
        pdf = cached.read_bytes() if cached.exists() else reader.download(doc)
        pipe = build_perception(s)
        original, saved = pipe._ask, []

        def ask(kind, page, text, images, max_tokens):
            ans = original(kind, page, text, images, max_tokens)
            saved.append({"kind": kind, "page": page, "answer": ans})
            return ans

        pipe._ask = ask
        ext = pipe.extract(pdf, package_id=f"PKG-{doc}", dms_doc_id=str(doc))
        (out / f"DMS-{doc}.json").write_text(json.dumps(saved, ensure_ascii=False, indent=2), encoding="utf-8")
        for entry in saved:
            if entry["kind"] != "extract":
                continue
            ans = entry["answer"] or {}
            fields = ans.get("fields") or {}
            shaped = {k: (isinstance(v, dict) and ("bbox_2d" in v or "bbox" in v)) for k, v in fields.items()}
            rows = ans.get("line_items") or []
            print(f"DMS-{doc} extract: answer keys={sorted(ans)}")
            print(f"   fields={len(fields)} with a bbox key={sum(1 for v in shaped.values() if v)} "
                  f"| line_items={len(rows)} | regions={len(ans.get('regions') or [])}")
            print(f"   field shapes: " + ", ".join(f"{k}={'dict+bbox' if b else type(fields[k]).__name__}"
                                                   for k, b in list(shaped.items())[:6]))
            sample = json.dumps({k: fields[k] for k in list(fields)[:2]}, ensure_ascii=False)
            print(f"   raw sample: {sample[:220]}")
            if rows:
                print(f"   row sample : {json.dumps(rows[0], ensure_ascii=False)[:220]}")
        print(f"   delivered: fields={len(ext.fields)} regions={len(ext.regions)} lines={len(ext.lines)} "
              f"pages={ext.extra['invoice_pages']} page_errors={ext.extra['page_errors']}")
        print(f"   full raw answer -> {out / f'DMS-{doc}.json'}")
    print("\nif the answer has no bbox keys, the coordinates were never sent - the parser cannot be blamed for")
    print("a payload with no boxes, but it is also not allowed to call that a successful read.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
