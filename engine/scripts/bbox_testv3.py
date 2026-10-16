"""
AIVA — Batch AI Vision OCR + bbox ทุกเอกสารใน Paperless (ทุกหน้า) เพื่อพิสูจน์ว่าใช้งานได้จริง

รัน (Windows / Linux):
    python bbox_testv3.py                        # ทุกเอกสารใน Paperless, ทุกหน้า
    python bbox_testv3.py --limit 20             # 20 ฉบับแรก (ไว้ลองก่อน)
    python bbox_testv3.py --ids 190,191,200-210  # เลือก doc id
    python bbox_testv3.py --tag AP --doc-type Invoice --query "AAPICO"   # filter ฝั่ง Paperless
    python bbox_testv3.py --workers 3            # ยิง AI พร้อมกัน 3 ฉบับ (ดูกำลัง LiteLLM/GPU)
    python bbox_testv3.py --force                # ทำซ้ำแม้เคยทำแล้ว (ปกติจะ resume ข้ามฉบับที่เสร็จ)
    python bbox_testv3.py --retry-errors         # ทำซ้ำเฉพาะฉบับที่ status ไม่ ok
    python bbox_testv3.py --report-only          # สร้าง report.html ใหม่จากผลที่มีอยู่ ไม่เรียก AI

.env ข้างสคริปต์ (อย่า commit):
    LITELLM_URL=http://aiva.aapico.com:4000/v1
    LITELLM_KEY=sk-...
    VLM_MODEL=nvidia/...
    PAPERLESS_BASE_URL=http://dms.aapico.com
    PAPERLESS_API_TOKEN=...
    RENDER_DPI=150            (option)

ผลลัพธ์ (default out/batch/):
    report.html                  รวมทุกฉบับ: ดูต่อเนื่อง หรือ ทีละฉบับ (← → เปลี่ยนฉบับ), filter ตามประเภท/สถานะ
    summary.csv                  1 แถว/ฉบับ: ประเภท, หน้า, กรอบที่เก็บ/ตัดทิ้ง, เวลา, error
    docs/doc_<id>/doc.json       ผลเต็มทุกหน้า (kept + dropped + raw)
    docs/doc_<id>/page_N.jpg     ภาพหน้าพร้อมกรอบ
    docs/doc_<id>/viewer.html    PDF จริง + กรอบซ้อน (PDF.js)

กติกากรอบ: กรอบที่ OCR ไม่ได้ข้อความ (text ว่าง / "-" / "unreadable" / ลายเซ็น "empty" ฯลฯ)
หรือพิกัดเสีย จะไม่ถูกวาด แต่ถูกเก็บไว้ใน doc.json → "dropped" พร้อมเหตุผล เพื่อตรวจย้อนได้
"""
import importlib.util
import subprocess
import sys

# Windows console มักเป็น cp874/cp1252 ทำให้ print ภาษาไทย/สัญลักษณ์ (·, ✗, ⚠) พังด้วย UnicodeEncodeError
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

# ---------------------------------------------------------------- auto-install
_REQ = {"pymupdf": "pymupdf", "openai": "openai", "PIL": "pillow", "requests": "requests", "dotenv": "python-dotenv"}
_missing = [pkg for mod, pkg in _REQ.items() if importlib.util.find_spec(mod) is None]
if _missing:
    print("กำลังติดตั้ง:", " ".join(_missing))
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", *_missing])

import argparse, base64, csv, html, io, json, os, re, threading, time, traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path

import pymupdf as fitz
import requests
from dotenv import load_dotenv
from openai import OpenAI
from PIL import Image, ImageDraw, ImageFont

_env_file = Path(__file__).with_name(".env")
if not _env_file.exists() and Path(__file__).with_name("env").exists():
    _env_file = Path(__file__).with_name("env")          # ใช้ไฟล์ชื่อ env ที่วางข้างสคริปต์ได้
load_dotenv(_env_file)
LITELLM_URL = os.getenv("LITELLM_URL", "http://aiva.aapico.com:4000/v1")
LITELLM_KEY = os.getenv("LITELLM_KEY", "")
VLM_MODEL = os.getenv("VLM_MODEL", "")
PL_URL = os.getenv("PAPERLESS_BASE_URL", "http://dms.aapico.com").rstrip("/")
PL_TOKEN = os.getenv("PAPERLESS_API_TOKEN", "")
DPI = int(os.getenv("RENDER_DPI", "150"))
MAX_TOKENS = int(os.getenv("VLM_MAX_TOKENS", "8000"))

COLORS = {  # ประเภทกรอบ -> สี
    "header": "#d62728", "supplier": "#ff7f0e", "customer": "#9467bd", "table": "#7f7f7f",
    "line": "#1f77b4", "total": "#2ca02c", "payment": "#bcbd22", "signature": "#e377c2",
    "stamp": "#8c564b", "other": "#17becf",
}
DOC_TYPES = ["tax_invoice", "invoice", "tax_invoice_receipt", "receipt", "delivery_note", "purchase_order",
             "osp", "goods_receipt", "billing_note", "credit_note", "debit_note", "quotation",
             "payment_voucher", "withholding_tax_cert", "other"]

PROMPT = """You are an OCR engine for Thai/English accounting documents.
First decide what kind of document THIS PAGE is (doc_type), one of:
- tax_invoice           ใบกำกับภาษี
- invoice               ใบแจ้งหนี้ (no tax-invoice wording)
- tax_invoice_receipt   ใบกำกับภาษี/ใบเสร็จรับเงิน (combined)
- receipt               ใบเสร็จรับเงิน
- delivery_note         ใบส่งของ / ใบส่งสินค้า / delivery order
- purchase_order        ใบสั่งซื้อ / PO
- osp                   outside-processing / subcontract service order or OSP document
- goods_receipt         ใบรับสินค้า / GR / receiving report
- billing_note          ใบวางบิล / ใบแจ้งยอด
- credit_note           ใบลดหนี้
- debit_note            ใบเพิ่มหนี้
- quotation             ใบเสนอราคา
- payment_voucher       ใบสำคัญจ่าย
- withholding_tax_cert  หนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ)
- other                 anything else

Then return EVERY readable region on the page, each with a tight bounding box.
Labels (type in brackets) — use the ones that exist on the page, add your own snake_case label if needed:
- [header]    doc_title, doc_no, doc_date, due_date, po_number, invoice_ref, delivery_no, receipt_no, job_no, page_no, credit_term
- [supplier]  supplier_name, supplier_address, supplier_tax_id, supplier_branch, supplier_phone
- [customer]  customer_name, customer_address, customer_tax_id, customer_branch, ship_to
- [table]     item_table (the whole table), table_header
- [line]      line_1, line_2, ... one box per FULL ROW of the item table (continuation rows are their own line_N)
- [total]     sub_total, discount, vat, wht, grand_total, amount_in_words, total_qty
- [payment]   bank_info, payment_terms, cheque_no, payment_method
- [signature] receiver_signature, deliverer_signature, authorized_signature, approver_signature
- [stamp]     company_stamp, received_stamp, date_stamp
- [other]     note, remark, qr_code, barcode, handwriting, logo_text

Rules:
- "text" = the text exactly as printed (Thai stays Thai, keep commas in numbers).
- If you cannot read a region, DO NOT return it. Never return empty text, "-", "?" or guesses.
- For signature/stamp write "signed"/"stamped" only if a mark is actually present; skip empty signature boxes.
- Coordinates: bbox_2d = [x1, y1, x2, y2] for the image you received.
- Do not invent items that are not on the page.

Return ONLY JSON, no markdown, no explanation:
{"doc_type": "tax_invoice", "items": [{"type": "header", "label": "doc_no", "text": "...", "bbox_2d": [x1, y1, x2, y2]}]}"""

EMPTY_TEXT = {"", "-", "--", "—", "?", "??", "...", "…", "n/a", "na", "null", "none", "nil", "unknown",
              "unreadable", "illegible", "not readable", "empty", "blank", "not visible", "no text", "[]"}
VISUAL_TYPES = {"signature", "stamp"}
MIN_BOX_PX = 4

_print_lock = threading.Lock()


def log(*a):
    with _print_lock:
        print(*a, flush=True)


# ---------------------------------------------------------------- paperless
def _h():
    return {"Authorization": f"Token {PL_TOKEN}", "Accept": "application/json"}


def parse_ids(s: str) -> list[int]:
    out = []
    for part in filter(None, (x.strip() for x in s.split(","))):
        if "-" in part:
            a, b = part.split("-", 1)
            out += list(range(int(a), int(b) + 1))
        else:
            out.append(int(part))
    return out


def list_documents(a) -> list[dict]:
    """ดึงรายการเอกสารจาก Paperless (ตาม pagination ทั้งหมด)"""
    if a.ids:
        return [{"id": i} for i in parse_ids(a.ids)]
    params = {"page_size": 100, "ordering": "id"}
    if a.query:
        params["query"] = a.query
    if a.tag:
        params["tags__name__iexact"] = a.tag
    if a.doc_type:
        params["document_type__name__iexact"] = a.doc_type
    url, docs = f"{PL_URL}/api/documents/", []
    while url:
        r = requests.get(url, headers=_h(), params=params, timeout=60)
        r.raise_for_status()
        j = r.json()
        docs += [{"id": d["id"], "title": d.get("title"), "document_type": d.get("document_type")}
                 for d in j.get("results", [])]
        url, params = j.get("next"), None          # next มี query string ครบแล้ว
        if a.limit and len(docs) >= a.limit:
            break
    return docs[: a.limit] if a.limit else docs


def doc_type_names() -> dict:
    try:
        r = requests.get(f"{PL_URL}/api/document_types/", headers=_h(), params={"page_size": 1000}, timeout=30)
        r.raise_for_status()
        return {t["id"]: t["name"] for t in r.json().get("results", [])}
    except Exception:
        return {}


def download_pdf(doc_id: int) -> tuple[bytes, dict]:
    """คืน PDF bytes: ใช้ original ถ้าเป็น PDF, ไม่งั้นใช้ archived PDF ของ Paperless, ไม่งั้นแปลงภาพเป็น PDF"""
    meta = requests.get(f"{PL_URL}/api/documents/{doc_id}/", headers=_h(), timeout=30)
    meta.raise_for_status()
    meta = meta.json()
    dl = f"{PL_URL}/api/documents/{doc_id}/download/"
    r = requests.get(dl, params={"original": "true"}, headers=_h(), timeout=180)
    r.raise_for_status()
    if r.content.startswith(b"%PDF"):
        return r.content, meta
    r2 = requests.get(dl, headers=_h(), timeout=180)                 # archived version (PDF/A)
    if r2.ok and r2.content.startswith(b"%PDF"):
        return r2.content, meta
    try:                                                              # รูปภาพ (jpg/png/tiff) -> PDF
        img_doc = fitz.open(stream=r.content, filetype=meta.get("original_file_name", "x.png").rsplit(".", 1)[-1])
        return img_doc.convert_to_pdf(), meta
    except Exception:
        raise RuntimeError(f"ไม่ใช่ PDF/ภาพที่เปิดได้ (content-type: {r.headers.get('content-type')})")


def render_pages(pdf: bytes, max_pages: int):
    doc = fitz.open(stream=pdf, filetype="pdf")
    n = len(doc) if not max_pages else min(len(doc), max_pages)
    for i in range(n):
        pix = doc[i].get_pixmap(dpi=DPI)
        yield i + 1, len(doc), Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")


# ---------------------------------------------------------------- vision
def ask(client: OpenAI, img: Image.Image, retries: int = 1) -> tuple[str, float]:
    buf = io.BytesIO(); img.save(buf, "PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    for attempt in range(retries + 1):
        t0 = time.time()
        try:
            r = client.chat.completions.create(
                model=VLM_MODEL, temperature=0, max_tokens=MAX_TOKENS,
                messages=[{"role": "user", "content": [
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}},
                    {"type": "text", "text": PROMPT}]}])
            return r.choices[0].message.content or "", time.time() - t0
        except Exception:
            if attempt == retries:
                raise
            time.sleep(5)


def parse(text: str) -> tuple[str, list[dict]]:
    """คืน (doc_type, items) — รองรับทั้ง {doc_type, items} และ array เปล่า, เก็บเท่าที่ได้ถ้าถูกตัด"""
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.S)
    text = re.sub(r"```(?:json)?", "", text)
    m_type = re.search(r'"doc_type"\s*:\s*"([^"]+)"', text)
    doc_type = (m_type.group(1).strip().lower() if m_type else "unknown")
    items = None
    s, e = text.find("{"), text.rfind("}")
    if s != -1 and e > s:
        try:
            obj = json.loads(text[s:e + 1])
            if isinstance(obj, dict) and isinstance(obj.get("items"), list):
                items = obj["items"]
        except json.JSONDecodeError:
            pass
    if items is None:
        m = re.search(r"\[.*\]", text, re.S)
        if m:
            try:
                arr = json.loads(m.group(0))
                items = arr if isinstance(arr, list) else None
            except json.JSONDecodeError:
                pass
    if items is None:                                               # salvage object ทีละตัว
        items = []
        for x in re.findall(r"\{[^{}]*\"bbox_2d\"[^{}]*\}", text):
            try:
                items.append(json.loads(x))
            except json.JSONDecodeError:
                pass
    items = [it for it in items if isinstance(it, dict)]
    if doc_type not in DOC_TYPES and doc_type != "unknown":
        doc_type = "other"
    return doc_type, items


def text_ok(it: dict) -> str | None:
    """คืนเหตุผลถ้าต้องตัดทิ้ง, None ถ้าเก็บ"""
    b = it.get("bbox_2d")
    if not (isinstance(b, (list, tuple)) and len(b) == 4):
        return "bad_bbox"
    try:
        [float(v) for v in b]
    except (TypeError, ValueError):
        return "bad_bbox"
    t = it.get("text")
    t = "" if t is None else str(t).strip()
    if t.lower() in EMPTY_TEXT or re.fullmatch(r"[\W_]*", t):
        return "no_text"
    if it.get("type") in VISUAL_TYPES and t.lower() in {"unsigned", "no signature", "not signed", "no stamp"}:
        return "empty_mark"
    return None


def detect_coord(items: list[dict], w: int, h: int, forced: str) -> str:
    if forced != "auto":
        return forced
    mx = max((max(float(v) for v in it["bbox_2d"]) for it in items), default=0)
    if mx <= 1.0:
        return "norm1"
    if mx > 1000:
        return "pixel"
    return "norm1000" if max(w, h) > 1100 else "pixel"


def to_px(b, w, h, mode):
    x1, y1, x2, y2 = map(float, b)
    if mode == "norm1000":
        x1, x2, y1, y2 = x1 * w / 1000, x2 * w / 1000, y1 * h / 1000, y2 * h / 1000
    elif mode == "norm1":
        x1, x2, y1, y2 = x1 * w, x2 * w, y1 * h, y2 * h
    x1, x2 = sorted((max(0, min(w, x1)), max(0, min(w, x2))))
    y1, y2 = sorted((max(0, min(h, y1)), max(0, min(h, y2))))
    return x1, y1, x2, y2


def filter_items(items, w, h, forced):
    """แยก kept / dropped — กรอบที่ OCR ไม่ได้หรือพิกัดเสียจะไม่ถูกวาด"""
    kept, dropped, seen = [], [], set()
    pre = []
    for it in items:
        why = text_ok(it)
        (dropped.append({**it, "drop_reason": why}) if why else pre.append(it))
    mode = detect_coord(pre, w, h, forced)
    for it in pre:
        x1, y1, x2, y2 = to_px(it["bbox_2d"], w, h, mode)
        if x2 - x1 < MIN_BOX_PX or y2 - y1 < MIN_BOX_PX:
            dropped.append({**it, "drop_reason": "zero_area_or_out_of_page"}); continue
        key = (it.get("label"), round(x1), round(y1), round(x2), round(y2))
        if key in seen:
            dropped.append({**it, "drop_reason": "duplicate"}); continue
        seen.add(key)
        it = {**it, "text": str(it.get("text")).strip(), "type": it.get("type") if it.get("type") in COLORS else "other"}
        it["bbox_px"] = [round(v) for v in (x1, y1, x2, y2)]
        it["bbox_norm"] = [round(x1 / w, 4), round(y1 / h, 4), round((x2 - x1) / w, 4), round((y2 - y1) / h, 4)]
        kept.append(it)
    return kept, dropped, mode


def font(size=16):
    for f in ("tahoma.ttf", "C:/Windows/Fonts/tahoma.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            pass
    return ImageFont.load_default()


def draw(img: Image.Image, items):
    out = img.copy()
    d = ImageDraw.Draw(out, "RGBA")
    f = font()
    for it in items:
        x1, y1, x2, y2 = it["bbox_px"]
        c = COLORS.get(it.get("type"), COLORS["other"])
        d.rectangle([x1, y1, x2, y2], outline=c, width=3)
        tag = str(it.get("label", "?"))
        tw = d.textlength(tag, font=f)
        ty = y1 - 20 if y1 > 20 else y2 + 2
        d.rectangle([x1, ty, x1 + tw + 6, ty + 19], fill=c)
        d.text((x1 + 3, ty + 1), tag, fill="white", font=f)
    return out


# ---------------------------------------------------------------- per-document
def process_doc(client, d: dict, root: Path, a, type_names: dict) -> dict:
    doc_id = d["id"]
    folder = root / "docs" / f"doc_{doc_id}"
    folder.mkdir(parents=True, exist_ok=True)
    t0 = time.time()
    res = {"doc_id": doc_id, "title": d.get("title") or str(doc_id), "paperless_type": None,
           "model": VLM_MODEL, "dpi": DPI, "pages_total": 0, "pages": [], "status": "ok", "error": None}
    try:
        pdf, meta = download_pdf(doc_id)
        res["title"] = meta.get("title") or res["title"]
        res["paperless_type"] = type_names.get(meta.get("document_type"))
        (folder / "original.pdf").write_bytes(pdf)
        for no, total, img in render_pages(pdf, a.max_pages):
            res["pages_total"] = total
            w, h = img.size
            pg = {"page": no, "image": f"docs/doc_{doc_id}/page_{no}.jpg", "image_size": [w, h]}
            try:
                raw, sec = ask(client, img)
                doc_type, items = parse(raw)
                kept, dropped, mode = filter_items(items, w, h, a.coord)
                draw(img, kept).save(folder / f"page_{no}.jpg", quality=85)
                pg.update(doc_type=doc_type, coord=mode, seconds=round(sec, 1), kept=kept, dropped=dropped, raw=raw,
                          error=None if items else "no JSON / no items")
            except Exception as e:
                img.save(folder / f"page_{no}.jpg", quality=85)
                pg.update(doc_type="unknown", coord=None, seconds=0, kept=[], dropped=[], raw="", error=repr(e))
            res["pages"].append(pg)
            log(f"  doc {doc_id} p{no}/{total}: {pg['doc_type']:<20} kept={len(pg['kept']):>3} "
                f"drop={len(pg['dropped']):>2} {pg['seconds']}s" + (f"  ⚠ {pg['error']}" if pg["error"] else ""))
        errs = sum(1 for p in res["pages"] if p["error"])
        res["status"] = "ok" if errs == 0 else ("error" if errs == len(res["pages"]) else "partial")
        write_viewer(folder, doc_id, pdf, res["pages"])
    except Exception as e:
        res["status"], res["error"] = "error", f"{e!r}"
        log(f"  doc {doc_id}: ✗ {e!r}")
        if a.debug:
            traceback.print_exc()
    res["seconds"] = round(time.time() - t0, 1)
    res["finished_at"] = datetime.now().isoformat(timespec="seconds")
    (folder / "doc.json").write_text(json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8")
    return res


# ---------------------------------------------------------------- summary + report
def load_results(root: Path) -> list[dict]:
    out = []
    for f in sorted((root / "docs").glob("doc_*/doc.json"), key=lambda p: int(p.parent.name[4:])):
        try:
            out.append(json.loads(f.read_text(encoding="utf-8")))
        except Exception:
            pass
    return out


def doc_types_of(r):
    seen = []
    for p in r["pages"]:
        if p.get("doc_type") and p["doc_type"] not in seen:
            seen.append(p["doc_type"])
    return seen or ["unknown"]


def write_summary(root: Path, results):
    with open(root / "summary.csv", "w", newline="", encoding="utf-8-sig") as f:   # utf-8-sig ให้ Excel อ่านไทยได้
        wr = csv.writer(f)
        wr.writerow(["doc_id", "title", "paperless_type", "ai_doc_types", "pages_total", "pages_done",
                     "boxes_kept", "boxes_dropped", "pages_error", "status", "seconds", "error"])
        for r in results:
            wr.writerow([r["doc_id"], r["title"], r.get("paperless_type") or "", "|".join(doc_types_of(r)),
                         r["pages_total"], len(r["pages"]), sum(len(p["kept"]) for p in r["pages"]),
                         sum(len(p["dropped"]) for p in r["pages"]), sum(1 for p in r["pages"] if p["error"]),
                         r["status"], r.get("seconds"), r.get("error") or ""])


REPORT_HTML = r"""<!doctype html><meta charset=utf-8><title>AIVA bbox batch report</title>
<style>
body{margin:0;font-family:Tahoma,sans-serif;font-size:13px}
#top{position:sticky;top:0;z-index:5;background:#eee;border-bottom:1px solid #bbb;padding:6px 10px;display:flex;gap:10px;flex-wrap:wrap;align-items:center}
#wrap{display:flex}
#side{width:260px;flex:none;height:calc(100vh - 42px);overflow:auto;border-right:1px solid #ccc;position:sticky;top:42px}
#side div{padding:3px 8px;cursor:pointer;border-bottom:1px solid #eee;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#side div:hover{background:#f3f3f3} #side div.cur{background:#dbe9ff}
#main{flex:1;padding:10px;min-width:0}
.doc{border:1px solid #bbb;margin-bottom:18px} .doc>h2{margin:0;padding:6px 8px;background:#f4f4f4;font-size:15px}
.pg{display:flex;gap:10px;padding:8px;border-top:1px dashed #ccc;align-items:flex-start}
.imgbox{position:relative;width:50%;flex:none}
.imgbox img{width:100%;display:block;border:1px solid #ccc}
.bx{position:absolute;box-sizing:border-box;border:1px solid transparent;cursor:pointer}
.bx.hot{border-width:3px;background:rgba(255,220,0,.30);z-index:3}
.bx.sel{border-width:3px;border-style:dashed;background:rgba(20,120,255,.20);z-index:4}
tr.hot{background:#fff8d5} tr.sel{background:#dbe9ff}
#tip{position:fixed;z-index:50;display:none;max-width:460px;background:#111;color:#fff;font-size:12px;line-height:1.4;padding:6px 8px;border-radius:4px;pointer-events:none;white-space:pre-wrap}
#pin{position:fixed;right:12px;bottom:12px;z-index:40;display:none;max-width:420px;background:#fff;border:2px solid #333;font-size:12px;line-height:1.4;padding:7px 26px 7px 9px;border-radius:5px;box-shadow:0 2px 10px #0006;white-space:pre-wrap}
#unc{position:absolute;right:6px;top:4px;color:#666;font-weight:bold}
.no-ov .bx{display:none}
.pg .info{flex:1;min-width:0}
table{border-collapse:collapse;width:100%;font-size:12px} td,th{border:1px solid #ddd;padding:2px 5px;vertical-align:top;text-align:left}
th{background:#fafafa} .dr td{color:#999;text-decoration:line-through}
.ok{color:#2a2} .partial{color:#d80} .error{color:#c00} .lg span{color:#fff;padding:1px 6px;margin-right:3px}
.sw{display:inline-block;width:10px;height:10px;margin-right:4px}
.hide-tbl .info table{display:none}
</style>
<div id=top>
 <b>AIVA bbox batch</b>
 <span id=stat></span>
 <label>มุมมอง <select id=mode><option value=all>ต่อเนื่อง</option><option value=one>ทีละฉบับ</option></select></label>
 <button id=prev>◀</button><button id=next>▶</button>
 <label>ประเภท <select id=ft><option value="">ทั้งหมด</option></select></label>
 <label>สถานะ <select id=fs><option value="">ทั้งหมด</option><option>ok</option><option>partial</option><option>error</option></select></label>
 <input id=q placeholder="ค้น id / ชื่อ / ข้อความ" size=18>
 <label><input type=checkbox id=tb checked> ตาราง</label>
 <label><input type=checkbox id=dp> แสดงที่ตัดทิ้ง</label>
 <label><input type=checkbox id=ov checked> กรอบโต้ตอบ</label>
 <span style="color:#555">ชี้กรอบ/แถว = ดูข้อความ · คลิก = ตรึงข้อมูล + ไปแถวนั้น · Esc = ปิด</span>
 <span class=lg>__LEGEND__</span>
</div>
<div id=wrap><div id=side></div><div id=main></div></div>
<div id=tip></div><div id=pin></div>
<script>
const DATA=__DATA__, COLORS=__COLORS__;
const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let list=[], cur=0;
const types=[...new Set(DATA.flatMap(d=>d.types))].sort();
$('ft').innerHTML+=types.map(t=>`<option>${t}</option>`).join('');
const tot=DATA.reduce((a,d)=>(a.p+=d.pages.length,a.k+=d.kept,a.x+=d.dropped,a[d.status]=(a[d.status]||0)+1,a),{p:0,k:0,x:0});
$('stat').innerHTML=`${DATA.length} ฉบับ · ${tot.p} หน้า · ${tot.k} กรอบ (ตัดทิ้ง ${tot.x}) · <span class=ok>ok ${tot.ok||0}</span> <span class=partial>partial ${tot.partial||0}</span> <span class=error>error ${tot.error||0}</span>`;
function docHtml(d){
  const showDrop=$('dp').checked;
  const pages=d.pages.map(p=>{
    const rows=p.kept.map((i,ix)=>`<tr data-i=${ix}><td><span class=sw style="background:${COLORS[i.type]||COLORS.other}"></span>${esc(i.type)}</td><td>${esc(i.label)}</td><td>${esc(i.text)}</td></tr>`).join('')
      +(showDrop?p.dropped.map(i=>`<tr class=dr><td>${esc(i.type)}</td><td>${esc(i.label)}</td><td>${esc(i.text)} [${esc(i.drop_reason)}]</td></tr>`).join(''):'');
    const boxes=p.kept.map((i,ix)=>{const b=i.bbox_norm||[0,0,0,0];
      return `<div class=bx data-i=${ix} data-t="${esc(i.type||'other')}" style="left:${b[0]*100}%;top:${b[1]*100}%;width:${b[2]*100}%;height:${b[3]*100}%;border-color:${COLORS[i.type]||COLORS.other}"></div>`}).join('');
    return `<div class=pg data-d=${d.id} data-p=${p.page}><div class=imgbox><a href="${p.image}" target=_blank><img loading=lazy src="${p.image}"></a>${boxes}</div><div class=info>
      <b>หน้า ${p.page}</b> · ${esc(p.doc_type)} · ${p.kept.length} กรอบ · ตัดทิ้ง ${p.dropped.length} · coord=${esc(p.coord)} · ${p.seconds}s
      ${p.error?`<div class=error>⚠ ${esc(p.error)}</div>`:''}
      <table><tr><th>type</th><th>label</th><th>text</th></tr>${rows}</table></div></div>`}).join('');
  return `<div class=doc id="d${d.id}"><h2>#${d.id} · ${esc(d.title)} · <span class=${d.status}>${d.status}</span>
    · AI: ${esc(d.types.join(', '))} · Paperless: ${esc(d.ptype||'-')} · ${d.pages.length}/${d.pages_total} หน้า · ${d.seconds}s
    · <a href="docs/doc_${d.id}/viewer.html" target=_blank>เปิดบน PDF</a></h2>
    ${d.error?`<div class=error style="padding:6px">✗ ${esc(d.error)}</div>`:''}${pages}</div>`;
}
function apply(){
  const ft=$('ft').value, fs=$('fs').value, q=$('q').value.trim().toLowerCase();
  list=DATA.filter(d=>(!ft||d.types.includes(ft))&&(!fs||d.status===fs)&&(!q||String(d.id)===q||d.search.includes(q)));
  cur=Math.min(cur,Math.max(0,list.length-1));
  $('side').innerHTML=list.map((d,i)=>`<div data-i=${i} title="${esc(d.title)}"><span class=${d.status}>●</span> #${d.id} ${esc(d.types[0])} · ${esc(d.title)}</div>`).join('');
  render();
}
function render(){
  unpin();
  const one=$('mode').value==='one';
  $('main').innerHTML=list.length?(one?docHtml(list[cur]):list.map(docHtml).join('')):'ไม่มีเอกสารตามเงื่อนไข';
  [...$('side').children].forEach((el,i)=>el.classList.toggle('cur',one&&i===cur));
  if(one) window.scrollTo(0,0);
}
$('side').onclick=e=>{const el=e.target.closest('[data-i]'); if(!el)return; cur=+el.dataset.i;
  if($('mode').value==='one') render(); else $('d'+list[cur].id).scrollIntoView();};
$('prev').onclick=()=>{cur=Math.max(0,cur-1); $('mode').value==='one'?render():$('d'+list[cur].id)?.scrollIntoView()};
$('next').onclick=()=>{cur=Math.min(list.length-1,cur+1); $('mode').value==='one'?render():$('d'+list[cur].id)?.scrollIntoView()};
document.onkeydown=e=>{if(e.target.tagName==='INPUT')return; if(e.key==='ArrowLeft')$('prev').click(); if(e.key==='ArrowRight')$('next').click();};
['ft','fs','mode','dp'].forEach(id=>$(id).onchange=apply); $('q').oninput=apply;
$('tb').onchange=e=>document.body.classList.toggle('hide-tbl',!e.target.checked);
$('ov').onchange=e=>document.body.classList.toggle('no-ov',!e.target.checked);

// ---------- ชี้/คลิกกรอบ (overlay บนภาพ) เพื่อดูข้อมูล และ sync กับตาราง ----------
const tip=$('tip'), pin=$('pin');
let hot=null, pinned=null;
const pgEl=(d,p)=>document.querySelector(`.pg[data-d="${d}"][data-p="${p}"]`);
function itemOf(d,p,i){const dd=DATA.find(x=>String(x.id)===String(d)); const pp=dd&&dd.pages.find(z=>String(z.page)===String(p)); return pp&&pp.kept[i]}
function tipHtml(it){const b=it.bbox_norm||[], px=it.bbox_px||[];
  return `<b style="color:${COLORS[it.type]||COLORS.other}">${esc(it.type)} · ${esc(it.label)}</b>\n${esc(it.text)}\n<span style="color:#aaa">px [${px.join(', ')}] · norm [${b.join(', ')}]</span>`}
function mark(d,p,i,cls,on){const g=pgEl(d,p); if(g)g.querySelectorAll(`.bx[data-i="${i}"],tr[data-i="${i}"]`).forEach(e=>e.classList.toggle(cls,on))}
function clearHot(){if(hot)mark(hot.d,hot.p,hot.i,'hot',false); hot=null; tip.style.display='none'}
function moveTip(e){const r=tip.getBoundingClientRect(); let x=e.clientX+14,y=e.clientY+14;
  if(x+r.width>innerWidth-6)x=e.clientX-r.width-12; if(y+r.height>innerHeight-6)y=innerHeight-r.height-6;
  tip.style.left=Math.max(4,x)+'px'; tip.style.top=Math.max(4,y)+'px'}
function pinIt(d,p,i){const it=itemOf(d,p,i); if(!it)return;
  if(pinned)mark(pinned.d,pinned.p,pinned.i,'sel',false);
  pinned={d,p,i}; mark(d,p,i,'sel',true);
  pin.innerHTML=tipHtml(it)+'<span id=unc onclick=unpin()>✕</span>'; pin.style.display='block';
  const g=pgEl(d,p), t=g&&g.querySelector(`tr[data-i="${i}"]`); if(t&&t.scrollIntoView)t.scrollIntoView({block:'center'})}
function unpin(){if(pinned)mark(pinned.d,pinned.p,pinned.i,'sel',false); pinned=null; pin.style.display='none'}
function idxOf(e){const g=e.target.closest('.pg'); if(!g)return null; const bx=e.target.closest('.bx'), tr=e.target.closest('tr[data-i]');
  const i=bx?+bx.dataset.i:(tr?+tr.dataset.i:null); return i===null?null:{d:g.dataset.d,p:g.dataset.p,i}}
document.addEventListener('mousemove',e=>{const h=idxOf(e); const it=h&&itemOf(h.d,h.p,h.i);
  if(!h||!it){clearHot(); return}
  if(!hot||hot.d!==h.d||hot.p!==h.p||hot.i!==h.i){clearHot(); hot=h; mark(h.d,h.p,h.i,'hot',true); tip.innerHTML=tipHtml(it); tip.style.display='block'}
  moveTip(e)});
document.addEventListener('click',e=>{const h=idxOf(e); if(!h)return;
  if(pinned&&String(pinned.d)===h.d&&String(pinned.p)===h.p&&pinned.i===h.i){unpin(); return}
  pinIt(h.d,h.p,h.i)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'||e.key.startsWith('Arrow'))unpin()});
window.addEventListener('scroll',()=>{if(hot)tip.style.display='none'},{passive:true});
apply();
</script>"""


def write_report(root: Path, results):
    data = []
    for r in results:
        kept = sum(len(p["kept"]) for p in r["pages"])
        texts = " ".join(str(i.get("text", "")) for p in r["pages"] for i in p["kept"])
        data.append({
            "id": r["doc_id"], "title": r["title"], "ptype": r.get("paperless_type"), "types": doc_types_of(r),
            "status": r["status"], "error": r.get("error"), "seconds": r.get("seconds"),
            "pages_total": r["pages_total"], "kept": kept, "dropped": sum(len(p["dropped"]) for p in r["pages"]),
            "search": f"{r['doc_id']} {r['title']} {texts}".lower()[:5000],
            "pages": [{"page": p["page"], "image": p["image"], "doc_type": p.get("doc_type"), "coord": p.get("coord"),
                       "seconds": p.get("seconds"), "error": p.get("error"),
                       "kept": [{k: i.get(k) for k in ("type", "label", "text", "bbox_norm", "bbox_px")} for i in p["kept"]],
                       "dropped": [{k: i.get(k) for k in ("type", "label", "text", "drop_reason")} for i in p["dropped"]]}
                      for p in r["pages"]]})
    legend = "".join(f"<span style='background:{c}'>{k}</span>" for k, c in COLORS.items())
    page = (REPORT_HTML.replace("__LEGEND__", legend)
            .replace("__DATA__", json.dumps(data, ensure_ascii=False).replace("</", "<\\/"))
            .replace("__COLORS__", json.dumps(COLORS)))
    (root / "report.html").write_text(page, encoding="utf-8")
    write_summary(root, results)


# ---------------------------------------------------------------- PDF viewer (PDF.js + overlay) ต่อฉบับ
VIEWER_HTML = """<!doctype html><meta charset=utf-8><title>AIVA bbox viewer · doc __DOC__</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<style>
body{margin:0;font-family:Tahoma,sans-serif;background:#525659}
#bar{position:sticky;top:0;z-index:9;background:#222;color:#fff;padding:8px 12px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
#bar button{padding:3px 10px} #bar label{font-size:12px;cursor:pointer}
#pages{display:flex;flex-direction:column;align-items:center;gap:16px;padding:16px}
.page{position:relative;box-shadow:0 2px 8px #0008;background:#fff}
.page canvas{display:block}
.box{position:absolute;border:2px solid;box-sizing:border-box;cursor:pointer}
.box:hover{background:rgba(255,230,0,.25)}
.box span{position:absolute;left:-2px;top:-17px;font-size:11px;line-height:15px;color:#fff;padding:0 4px;white-space:nowrap}
#tip{position:fixed;display:none;max-width:420px;background:#111;color:#fff;font-size:12px;padding:6px 8px;border-radius:4px;z-index:99;pointer-events:none}
.hide-labels .box span{display:none}
</style>
<div id=bar><b>Doc __DOC__</b> <button id=zo>−</button><span id=zv></span><button id=zi>+</button>
<label><input type=checkbox id=lb checked> label</label><span id=types></span></div>
<div id=pages></div><div id=tip></div>
<script>
const PDF_B64="__PDF__", DATA=__DATA__, COLORS=__COLORS__;
pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
let scale=1.4, pdf, hidden=new Set();
const tip=document.getElementById('tip');
const types=[...new Set(Object.values(DATA).flat().map(i=>i.type||'other'))];
document.getElementById('types').innerHTML=types.map(t=>`<label style="color:${COLORS[t]||COLORS.other}"><input type=checkbox data-t="${t}" checked> ${t}</label>`).join(' ');
document.getElementById('types').onchange=e=>{const t=e.target.dataset.t;e.target.checked?hidden.delete(t):hidden.add(t);
  document.querySelectorAll('.box').forEach(b=>b.style.display=hidden.has(b.dataset.t)?'none':'')};
document.getElementById('lb').onchange=e=>document.body.classList.toggle('hide-labels',!e.target.checked);
document.getElementById('zi').onclick=()=>{scale=Math.min(4,scale+0.2);draw()};
document.getElementById('zo').onclick=()=>{scale=Math.max(0.4,scale-0.2);draw()};
async function draw(){
  document.getElementById('zv').textContent=Math.round(scale*100)+'%';
  const host=document.getElementById('pages'); host.innerHTML='';
  for(let n=1;n<=pdf.numPages;n++){
    const page=await pdf.getPage(n);
    const vp=page.getViewport({scale});
    const ratio=window.devicePixelRatio||1;
    const div=document.createElement('div'); div.className='page';
    div.style.width=vp.width+'px'; div.style.height=vp.height+'px';
    const cv=document.createElement('canvas');
    cv.width=vp.width*ratio; cv.height=vp.height*ratio; cv.style.width=vp.width+'px'; cv.style.height=vp.height+'px';
    div.appendChild(cv); host.appendChild(div);
    await page.render({canvasContext:cv.getContext('2d'),viewport:vp,transform:[ratio,0,0,ratio,0,0]}).promise;
    for(const it of (DATA[n]||[])){
      const [x,y,w,h]=it.bbox_norm, c=COLORS[it.type]||COLORS.other;
      const b=document.createElement('div'); b.className='box'; b.dataset.t=it.type||'other';
      Object.assign(b.style,{left:x*vp.width+'px',top:y*vp.height+'px',width:w*vp.width+'px',height:h*vp.height+'px',borderColor:c,
        display:hidden.has(b.dataset.t)?'none':''});
      const s=document.createElement('span'); s.style.background=c; s.textContent=it.label||''; b.appendChild(s);
      b.onmousemove=e=>{tip.style.display='block';tip.style.left=e.clientX+12+'px';tip.style.top=e.clientY+12+'px';
        tip.textContent=`${it.label}: ${it.text??''}  [${it.bbox_norm.join(', ')}]`};
      b.onmouseleave=()=>tip.style.display='none';
      div.appendChild(b);
    }
  }
}
(async()=>{const bin=Uint8Array.from(atob(PDF_B64),c=>c.charCodeAt(0));
  pdf=await pdfjsLib.getDocument({data:bin}).promise; draw();})();
</script>"""


def write_viewer(folder: Path, doc_id, pdf: bytes, pages):
    data = {p["page"]: [{k: it.get(k) for k in ("type", "label", "text", "bbox_norm")} for it in p["kept"]] for p in pages}
    page_html = (VIEWER_HTML.replace("__DOC__", str(doc_id))
                 .replace("__PDF__", base64.b64encode(pdf).decode())
                 .replace("__DATA__", json.dumps(data, ensure_ascii=False).replace("</", "<\\/"))
                 .replace("__COLORS__", json.dumps(COLORS)))
    (folder / "viewer.html").write_text(page_html, encoding="utf-8")


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description="Batch AI Vision OCR + bbox จาก Paperless")
    ap.add_argument("--ids", default="", help="เช่น 190,191,200-210 (ไม่ใส่ = ทุกฉบับ)")
    ap.add_argument("--query", default="", help="Paperless full-text query")
    ap.add_argument("--tag", default="", help="ชื่อ tag ใน Paperless")
    ap.add_argument("--doc-type", default="", help="ชื่อ document type ใน Paperless")
    ap.add_argument("--limit", type=int, default=0, help="จำนวนฉบับสูงสุด (0 = ทั้งหมด)")
    ap.add_argument("--max-pages", type=int, default=0, help="จำกัดหน้าต่อฉบับ (0 = ทุกหน้า)")
    ap.add_argument("--workers", type=int, default=2, help="จำนวนฉบับที่ประมวลผลพร้อมกัน")
    ap.add_argument("--coord", default="auto", choices=["auto", "pixel", "norm1000", "norm1"])
    ap.add_argument("--out", default="out/batch")
    ap.add_argument("--force", action="store_true", help="ทำซ้ำฉบับที่เคยทำแล้ว")
    ap.add_argument("--retry-errors", action="store_true", help="ทำซ้ำเฉพาะฉบับที่ status ไม่ใช่ ok")
    ap.add_argument("--report-only", action="store_true")
    ap.add_argument("--debug", action="store_true")
    a = ap.parse_args()

    root = Path(a.out)
    (root / "docs").mkdir(parents=True, exist_ok=True)
    if a.report_only:
        write_report(root, load_results(root))
        print("report:", (root / "report.html").resolve())
        return

    for k, v in {"LITELLM_KEY": LITELLM_KEY, "VLM_MODEL": VLM_MODEL, "PAPERLESS_API_TOKEN": PL_TOKEN}.items():
        if not v:
            raise SystemExit(f"ยังไม่ได้ตั้งค่า {k} ในไฟล์ .env")

    docs = list_documents(a)
    todo = []
    for d in docs:
        f = root / "docs" / f"doc_{d['id']}" / "doc.json"
        if f.exists() and not a.force:
            if not a.retry_errors:
                continue
            if json.loads(f.read_text(encoding="utf-8")).get("status") == "ok":
                continue
        todo.append(d)
    print(f"Paperless: {len(docs)} ฉบับ · ต้องทำ {len(todo)} · ข้าม (ทำแล้ว) {len(docs) - len(todo)} · workers={a.workers}")

    type_names = doc_type_names()
    client = OpenAI(base_url=LITELLM_URL, api_key=LITELLM_KEY, timeout=600)
    t0, done = time.time(), 0
    with ThreadPoolExecutor(max_workers=max(1, a.workers)) as ex:
        futs = {ex.submit(process_doc, client, d, root, a, type_names): d for d in todo}
        for fu in as_completed(futs):
            r = fu.result()
            done += 1
            kept = sum(len(p["kept"]) for p in r["pages"])
            log(f"[{done}/{len(todo)}] doc {r['doc_id']} {r['status']} · {len(r['pages'])} หน้า · {kept} กรอบ · "
                f"{', '.join(doc_types_of(r))} · {r['seconds']}s")
            if done % 5 == 0 or done == len(todo):            # อัปเดต report ระหว่างทาง เปิดดูได้เลย
                write_report(root, load_results(root))
    write_report(root, load_results(root))
    print(f"เสร็จ {done} ฉบับใน {time.time() - t0:.0f}s")
    print("report :", (root / "report.html").resolve())
    print("summary:", (root / "summary.csv").resolve())


if __name__ == "__main__":
    main()
