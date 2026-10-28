"""Build an offline scenario for one recorded document: the flow's own inputs, byte-for-byte from the engine.

  python harness/make_scenario.py 100            # -> fixtures/scn/100_scenario.json + p<N>.jpg files

Every page image is the JPEG the ENGINE sent (fixtures/rec/<doc>_ai_tape.json holds the request bodies), so
the flow "renders" exactly what the engine rendered: same DPI, same quality, same rotation, same bytes.
That is what makes the comparison a decision/extraction comparison rather than an image-pipeline one.
"""
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REC = os.path.join(ROOT, "fixtures", "rec")
SCN = os.path.join(ROOT, "fixtures", "scn")
ENGINE = os.path.dirname(os.path.dirname(ROOT))
sys.path.insert(0, HERE)
sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def jpeg_size(b):
    i = 2
    while i < len(b) - 9:
        if b[i] != 0xFF:
            i += 1
            continue
        m = b[i + 1]
        if 0xC0 <= m <= 0xCF and m not in (0xC4, 0xC8, 0xCC):
            return {"h": int.from_bytes(b[i + 5:i + 7], "big"), "w": int.from_bytes(b[i + 7:i + 9], "big")}
        i += 2 + int.from_bytes(b[i + 2:i + 4], "big")
    return {"w": 0, "h": 0}


def image_of(part):
    url = part["image_url"]["url"]
    return url.split(",", 1)[1] if url.startswith("data:") else url


def text_of(part):
    return part.get("text", "")


def build(doc, cfg_over=None):
    ai = json.load(io.open(os.path.join(REC, "%s_ai_tape.json" % doc), encoding="utf-8"))
    ext = json.load(io.open(os.path.join(REC, "%s_extraction.json" % doc), encoding="utf-8"))
    payload = json.load(io.open(os.path.join(REC, "%s_engine_payload.json" % doc), encoding="utf-8"))
    os.makedirs(SCN, exist_ok=True)
    os.makedirs(os.path.join(SCN, str(doc)), exist_ok=True)

    cls = ai[0]
    parts = cls["body"]["messages"][0]["content"]
    imgs = [p for p in parts if p.get("type") == "image_url"]
    page_dims, cls_files = [], []
    for i, im in enumerate(imgs, start=1):
        import base64
        raw = base64.b64decode(image_of(im))
        name = "%s/cls_p%d.jpg" % (doc, i)
        open(os.path.join(SCN, name), "wb").write(raw)
        d = jpeg_size(raw)
        page_dims.append({"page_no": i, "key": "cls_page_%d" % i, "w_px": d["w"], "h_px": d["h"],
                          "bytes": len(raw), "mime": "image/jpeg"})
        cls_files.append({"page_no": i, "file": name})

    selected = [int(p) for p in (ext["extra"]["selection"].get("selected") or [])]
    extract_calls = [e for e in ai[1:]]
    if len(extract_calls) != len(selected):
        print("  note: %d extract calls for selected %s (adjudicate/re-read calls are in the tape too)"
              % (len(extract_calls), selected))
    extract = []
    for page, e in zip(selected, extract_calls):
        parts = e["body"]["messages"][0]["content"]
        img = [p for p in parts if p.get("type") == "image_url"]
        txt = " ".join(text_of(p) for p in parts if p.get("type") == "text")
        m = re.search(r"page[_ ]?no[^0-9]{0,12}(\d{1,3})", txt, re.I)
        if m and int(m.group(1)) != page:
            print("  WARNING page number in prompt (%s) != tape order (%s) - trusting the prompt" % (m.group(1), page))
            page = int(m.group(1))
        import base64
        raw = base64.b64decode(image_of(img[0])) if img else b""
        name = "%s/p%d.jpg" % (doc, page)
        open(os.path.join(SCN, name), "wb").write(raw)
        extract.append({"page_no": page, "file": name, "answer": e["text"], "usage": e.get("usage") or {}})

    prompt_extract = io.open(os.path.join(ENGINE, "config", "prompts", "single_pass_extract.md"), encoding="utf-8").read()
    prompt_classify = io.open(os.path.join(ENGINE, "config", "prompts", "single_pass_classify.md"), encoding="utf-8").read()
    prompt_adj = os.path.join(ENGINE, "config", "prompts", "single_pass_adjudicate.md")
    config = {
        "doc_id": str(doc), "model": payload["versions"]["models"]["line_matcher"],
        "temperature": 0, "max_tokens": 8000, "max_pages": 12,
        "dpi_classify": 80, "dpi_extract": 150, "coord": "norm1000",
        "standard": "v6.6", "invoice_types": ["tax_invoice", "invoice"],
        "label_max_chars": 44, "font_size": 22, "max_boxes": 40,
        "colors": {"field": "#ff0000", "occurrence": "#ff8800", "line": "#00aa00", "table": "#0000ff",
                   "stamp": "#aa00aa", "signature": "#00aaaa", "signature_box": "#00aaaa", "other": "#888888"},
        # node 00 stores the prompt one newline SHORT of the file (the UI trims it); node 08 adds it back.
        "prompt_extract": prompt_extract[:-1] if prompt_extract.endswith("\n") else prompt_extract,
        "prompt_classify": prompt_classify[:-1] if prompt_classify.endswith("\n") else prompt_classify,
        "prompt_adjudicate": (io.open(prompt_adj, encoding="utf-8").read()
                              if os.path.exists(prompt_adj) else ""),
        "enable_thinking": False, "adjudicate": True, "taxid_retry_dpi": 300,
    }
    config.update(cfg_over or {})
    scen = {
        "doc": str(doc), "config": config,
        "paperless": {"id": int(doc), "versions": [{"checksum": ext["file_sha256"].split(":")[-1]}]},
        "file_sha256": ext["file_sha256"].split(":")[-1],
        "classify": {"answer": cls["text"], "usage": cls.get("usage") or {},
                     "request_meta": {"n_pages": len(imgs), "page_keys": [d["key"] for d in page_dims],
                                      "page_dims": page_dims, "thinking": False, "max_tokens_used": cls["body"]["max_tokens"]}},
        "extract": extract,
        "adjudicate": [],                                  # filled by callers testing R6-6
        "taxid_retry": ext["extra"].get("taxid_retry") or [],
    }
    out = os.path.join(SCN, "%s_scenario.json" % doc)
    json.dump(scen, io.open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("  %-6s pages=%d selected=%s extract_images=%d adjudicate=%d -> %s"
          % (doc, len(imgs), selected, len(extract), len(scen["adjudicate"]), os.path.relpath(out, ROOT)))
    return scen


if __name__ == "__main__":
    for d in (sys.argv[1:] or sorted({os.path.basename(f).split("_")[0] for f in os.listdir(REC)
                                      if f.endswith("_ai_tape.json")})):
        build(d)
