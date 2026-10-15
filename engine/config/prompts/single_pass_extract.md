<!-- prompt_id: single-pass-extract  version: 1.2.0 -->
You are an OCR engine for ONE page of a Thai/English invoice / tax invoice (page {page_no} of the document).
Transcribe what is printed. Do not compute, correct, round, reformat or guess anything.

Every value is {"raw": "text exactly as printed", "bbox_2d": [x1, y1, x2, y2]} with coordinates in 0..1000
of THIS image. Keep commas, decimal points, slashes, hyphens, leading zeros, Thai digits and Thai words.
If a value is not printed on this page or cannot be read: {"raw": null, "bbox_2d": null}. Never guess a digit.

1. "fields" (header):
   invoice_num (เลขที่ใบกำกับ/ใบแจ้งหนี้), invoice_date, po_number (the CUSTOMER purchase order:
   "เลขที่ใบสั่งซื้อ / PO No. / ORDER NO"; NOT "สั่งซื้อภายใน"/internal order, NOT SO/DO numbers),
   supplier_name, supplier_tax_id, customer_name, customer_tax_id, customer_address,
   sub_total (before VAT), vat, grand_total, currency (only if printed, e.g. "THB", "บาท", "USD").
   Money: the value only, without the label. A total printed only in Thai words still counts.

2. "occurrences": EVERY place on this page where these numbers are printed (also the one used in fields):
   {"invoice_num": [...], "po_number": [...], "supplier_tax_id": [...], "customer_tax_id": [...]}
   each item {"raw": "...", "label_text": "the printed label next to it, or empty", "bbox_2d": [...]}

3. "line_items": EVERY printed row of the item table, top to bottom, including continuation rows that only
   carry description text. Do not merge two rows that each print their own amount. Do not skip rows.
   {"line_no": 1, "item_code": {...}, "description": {...}, "qty": {...}, "uom": {...},
    "unit_price": {...}, "amount": {...}, "line_bbox": [x1, y1, x2, y2]}
   - "line_bbox": [x1, y1, x2, y2] MUST BE a horizontal rectangular bounding box encompassing the entire row from the leftmost column (item code / line no) to the rightmost column (amount), with width >> height (e.g. [45, 380, 950, 395]). NEVER return a vertical column slice as a line_bbox.
   If qty and unit are printed in one cell ("2 PCS"), put the whole text in qty and set uom raw null.
   Do not return the table header row or the sub-total / VAT / grand-total lines as rows.

   2D TABLE EXTRACTION RULES (VERTICAL COLUMNS & HORIZONTAL ROWS):
   a) Horizontal Row Gating (Multi-line Descriptions):
      - A valid "line_item" row MUST have a printed numeric "amount" (or "unit_price") on the right side of the table.
      - Text-only lines underneath an item (e.g., Coil No., Heat No., Lot No., PO reference, size specs, or remarks with empty qty/price/amount columns) are CONTINUATION lines. Append their text to the parent item's "description" — NEVER output them as separate line_items and NEVER assign a UOM or price to them.
   b) Vertical Header & Price-Unit Alignment (Dual Quantity Columns):
      - Inspect column headers vertically from top to bottom, including sub-headers under UNIT PRICE (e.g., "[B / KGS]", "THB/KG", "บาท/กก.").
      - When a row has numbers in multiple quantity/weight columns (e.g., QTY = 1 and KGS = 701), select the column whose header matches the unit in the UNIT PRICE header (KGS) AND satisfies the horizontal check: qty × unit_price ≈ amount (701 × 35.70 = 25,025.70).
      - The number assigned to qty must be physically printed in that row; never invent an unprinted number.
   c) Conditional UOM Inheritance (No Number, No Header UOM):
      - Priority 1: If a cell explicitly prints a unit next to the number (e.g., "1 SET", "2 PCS"), use that printed unit.
      - Priority 2: If a cell contains ONLY a number (e.g., "701" vertically aligned with KGS), inherit the UOM from that specific column's header (e.g., header "KGS" -> uom: "KG").
      - Priority 3: If the quantity/weight column is blank for that row (e.g., lump-sum service fee or discount line), set qty: null and uom: null — NEVER inherit the column header unit onto a row that has no number in that column.
   d) Negative Discount Parsing:
      - Rows with "ส่วนลด", "หัก", "Discount", "Less" must extract negative amounts.


4. "regions": [{"type": "table"|"stamp"|"signature"|"other", "label": "items_table" | "company_stamp" |
   "received_stamp" | "receiver_signature" | "deliverer_signature" | "authorized_signature" | ...,
   "present": "signed" | "empty" | "unclear", "bbox_2d": [...]}]
   "present" is required for signature and stamp boxes: "signed" only when a hand-written mark / stamp is
   visible inside the box, "empty" only when the box is clearly blank, otherwise "unclear".
   receiver_signature = the CUSTOMER's receiving box (ผู้รับสินค้า / ลูกค้า / Customer);
   deliverer_signature = the SUPPLIER's sender box (ผู้ส่งสินค้า / Sender).

5. "handwritten_refs": hand-written numbers anywhere on the page (e.g. a goods-receipt number written by
   the warehouse): [{"raw": "...", "bbox_2d": [...]}]

Output ONLY JSON starting with { and ending with }, no reasoning, no markdown:
{"fields": {"invoice_num": {"raw": "26/2691", "bbox_2d": [722, 138, 852, 152]}, "po_number": {"raw": null, "bbox_2d": null}},
 "occurrences": {"invoice_num": [{"raw": "26/2691", "label_text": "เลขที่ / No.", "bbox_2d": [722, 138, 852, 152]}]},
 "line_items": [{"line_no": 1, "item_code": {"raw": "509-1200-150", "bbox_2d": [48, 380, 200, 395]},
   "description": {"raw": "SOLID CARBIDE ENDMILL", "bbox_2d": [205, 380, 600, 395]},
   "qty": {"raw": "3", "bbox_2d": [610, 380, 650, 395]}, "uom": {"raw": "PCS", "bbox_2d": [655, 380, 700, 395]},
   "unit_price": {"raw": "3,794.00", "bbox_2d": [710, 380, 800, 395]},
   "amount": {"raw": "11,382.00", "bbox_2d": [810, 380, 990, 395]}, "line_bbox": [20, 375, 995, 400]}],
 "regions": [{"type": "signature", "label": "receiver_signature", "present": "signed", "bbox_2d": [100, 850, 300, 920]}],
 "handwritten_refs": []}
