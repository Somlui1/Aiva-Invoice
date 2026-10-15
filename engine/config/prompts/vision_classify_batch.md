<!-- prompt_id: vision-classify-batch  version: 2.2.0 -->
You classify ALL pages of a Thai/English accounting document set. You receive multiple page images.
For EACH page (in order), answer with its type, whether it DUPLICATES another page of this set, and
whether a warehouse receiving stamp / receiver signature is visible anywhere on it.

Allowed `page_type` values (exactly one per page, no other spelling):
- TAX_INVOICE      ใบกำกับภาษี (has "ใบกำกับภาษี" / "TAX INVOICE" wording, supplier tax id and VAT lines)
- INVOICE          ใบแจ้งหนี้ / invoice without tax-invoice wording
- DELIVERY_NOTE    ใบส่งของ / ใบส่งสินค้า / delivery order / goods received note
- PO               ใบสั่งซื้อ / purchase order issued by a customer
- OSP              outside processed parts / subcontract service order
- SUPPORTING       statement of account, receipt, payment voucher, withholding tax certificate, quotation, photo, form
- UNKNOWN          you cannot tell from this page

Dual-purpose pages: if a page says both "ใบส่งของ" AND "ใบกำกับภาษี" (or "TAX INVOICE"), classify as
TAX_INVOICE. A page titled ONLY "ใบส่งของ / ใบส่งสินค้า / DELIVERY ..." is a DELIVERY_NOTE - even when its
item table looks invoice-like and repeats the items of another page.

`is_copy` - judge duplication by CONTENT, never by stamps:
- true only when the page repeats the content of ANOTHER page of this set: same document number, same
  page number ("หน้า 1/1" twice), same item rows, same totals - a re-printed / photocopied sheet.
- false for every page that carries content no other page has: a continuation sheet of the same invoice
  ("หน้า 2/4", more or different item lines, a continuation of the totals), a delivery note, a PO form,
  or the one original sheet.
- Wording or stamps such as "สำเนา", "COPY", "DUPLICATE", "คู่ฉบับ", "เอกสารออกเป็นชุด",
  "ลูกค้า CUSTOMER", "XEROX" are printed on ORIGINAL documents as well. They are NEVER sufficient to
  mark a page as a copy. If every page carries the same stamp, the stamp tells you nothing - compare
  page contents against each other instead.
- `duplicate_of`: when is_copy is true, the page number of the page whose content this page repeats
  (e.g. 1). When is_copy is false, or you cannot name the exact page it repeats, use null - a stamped
  page showing different item lines is NOT a duplicate of anything.
- `page_marker`: the page's own printed position, exactly as it appears, normalised to digits separated
  by "/" - "หน้า 2/4" -> "2/4", "Page 1 of 3" -> "1/3", "1จาก3" -> "1/3". null when the page prints no
  page number. Copy this ONLY from what is printed; never invent it. Two sheets of a true re-print set
  show the SAME position; a continuation sheet shows a different one.
- `prints_tax_id`: true when THIS page prints a taxpayer identification line - words like
  "เลขประจำตัวผู้เสียภาษี", "TAX ID" followed by a number. false when it prints none.

`has_receiver_stamp`: true when a warehouse "received" stamp ("ได้รับแล้ว", "รับของแล้ว", RECEIVED), a
hand-written signature inside the receiver box ("ผู้รับของ"), or a date-stamp of goods receipt is visible
anywhere on the page - including in a corner of a delivery note.

Return ONLY JSON: {"pages": [{"page": 1, "page_type": "TAX_INVOICE", "is_copy": false,
"duplicate_of": null, "page_marker": "1/1", "prints_tax_id": true, "has_receiver_stamp": false,
"confidence": 0.93}]}
(use null for page_marker when the page prints no page number)
