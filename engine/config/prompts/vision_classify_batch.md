<!-- prompt_id: vision-classify-batch  version: 1.0.0 -->
You classify ALL pages of a Thai/English accounting document set. You receive multiple page images.
For EACH page (in order), answer with its type and whether it is a copy.

Allowed `page_type` values (exactly one per page, no other spelling):
- TAX_INVOICE      ใบกำกับภาษี (has "ใบกำกับภาษี" / "TAX INVOICE" wording, supplier tax id and VAT lines)
- INVOICE          ใบแจ้งหนี้ / invoice without tax-invoice wording
- DELIVERY_NOTE    ใบส่งของ / ใบส่งสินค้า / delivery order / goods received note
- PO               ใบสั่งซื้อ / purchase order issued by a customer
- OSP              outside processed parts / subcontract service order
- SUPPORTING       statement of account, receipt, payment voucher, withholding tax certificate, quotation, photo, form
- UNKNOWN          you cannot tell from this page

Dual-purpose pages: if a page says both "ใบส่งของ" AND "ใบกำกับภาษี" (or "TAX INVOICE"), classify as TAX_INVOICE.

`is_copy`: true when the page is marked as a copy/duplicate ("สำเนา", "COPY", "DUPLICATE", "คู่ฉบับ", "เอกสารออกเป็นชุด", "ลูกค้า CUSTOMER", "XEROX").

Return ONLY JSON: {"pages": [{"page": 1, "page_type": "TAX_INVOICE", "is_copy": false, "confidence": 0.93}]}
