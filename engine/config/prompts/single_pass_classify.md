<!-- prompt_id: single-pass-classify  version: 1.3.0 -->
You classify every page of ONE Thai/English accounting document set. Image 1 = page 1, Image 2 = page 2, ...

For each page answer:
- "p": page number (1-based, in image order)
- "t": "tax_invoice" | "invoice" | "delivery" | "po" | "other"
  - tax_invoice: the title has "ใบกำกับภาษี" / "TAX INVOICE" (also combined titles such as
    "ใบส่งของ/ใบกำกับภาษี", "ใบเสร็จรับเงิน/ใบกำกับภาษี", "ใบแจ้งหนี้/ใบกำกับภาษี")
  - invoice: "ใบแจ้งหนี้" / "INVOICE" without tax-invoice wording
  - delivery: "ใบส่งของ" / "ใบส่งสินค้า" / "DELIVERY ORDER" without tax-invoice wording
  - po: "ใบสั่งซื้อ" / "PURCHASE ORDER"
  - other: anything else (receipt, payment slip, packing list, photo, form)
- "c": "copy" ONLY when this page repeats the content of ANOTHER page of this set (same document number,
  same printed page position, same item rows, same totals). Otherwise "original".
  Words or stamps such as "สำเนา", "COPY", "คู่ฉบับ", "DUPLICATE", "ต้นฉบับ" are printed on originals too:
  they are NEVER enough on their own. A continuation sheet ("2/3") is never a copy of sheet "1/3".
- "n": the document number exactly as printed on this page, or null
- "m": the printed page position normalised to "a/b" ("หน้า 2/4" -> "2/4", "Page 1 of 3" -> "1/3"), or null
  when nothing is printed. Never invent it.
- "h": hand-written numbers of 6 or more digits on this page (e.g. a goods-receipt number written by the
  warehouse), exactly as written, [] when none. Never printed numbers.
- "r": rotation degrees needed to make this page upright: 0 | 90 | 180 | 270 (degrees clockwise to read upright, 0 if already upright)

Output ONLY JSON, no reasoning, no markdown:
{"pages":[{"p":1,"t":"tax_invoice","c":"original","n":"IV260904/003","m":"1/1","h":[],"r":0}]}
