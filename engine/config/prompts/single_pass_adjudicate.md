<!-- prompt_id: single-pass-adjudicate  version: 1.0.0 -->
You are shown ONE page of a Thai supplier document. A first, cheaper look over the whole document decided
this page was NOT an invoice, and that decision is about to discard the entire document. Look again, slowly,
at what is PRINTED.

Report:
- "quotes": up to 6 short lines of PRINTED text, copied VERBATIM exactly as printed. Include every document
  title or document-kind word you can read anywhere on the page - heading, sub-heading, small print, footer,
  stamp - for example words like ใบกำกับภาษี, ภาษีมูลค่าเพิ่ม, ใบแจ้งหนี้, ใบส่งของ, ใบส่งสินค้า, ใบเสร็จรับเงิน,
  TAX INVOICE, INVOICE, DELIVERY ORDER. Copy what the page says; never rewrite or complete a word.
- "serves_as_tax_invoice": true only if this page itself charges VAT and shows the tax-invoice wording.
- "serves_as_delivery_note": true if this page also serves as a goods-delivery acknowledgement.
- "vat_amount_shown" / "total_amount_shown": true only when you can read the actual figure.
- "kind_word_seen": the single printed word or phrase that names this document, copied verbatim.

Rules that matter:
- One page can be two documents at once ("ใบกำกับภาษี/ใบส่งของ", "ใบส่งสินค้า/ใบแจ้งหนี้"). If it is, say so
  and quote the title of each.
- A page can also deny being something: text such as "ไม่ใช่ใบกำกับภาษี" or "NOT A TAX INVOICE" means it is
  NOT an invoice, whatever else it looks like. Quote it exactly if you see it.
- Judge only from text you can actually read. Layout, a table of items and money totals are NOT enough -
  delivery notes and purchase orders have those too. If you cannot read a title, return an empty "quotes"
  list and false everywhere rather than guessing.

Output ONLY JSON, no reasoning, no markdown:
{"quotes":["..."],"serves_as_tax_invoice":true,"serves_as_delivery_note":false,
 "vat_amount_shown":true,"total_amount_shown":true,"kind_word_seen":"..."}
