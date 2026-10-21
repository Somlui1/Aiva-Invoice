# Excluded Documents — Round 01

| doc_id | ประเภทเอกสารจริง | เหตุผลที่คัดออก | รูปหลักฐาน |
|---|---|---|---|
| DMS-223 | ORIGINAL DELIVERY ORDER (ใบส่งของล้วน) 2 หน้า + PO 1 หน้า | ไม่มีหน้าใบกำกับภาษีต้นฉบับเลยในทั้งไฟล์ (model จำแนก p1/p2=delivery, p3=po ถูกต้อง) — แผนข้อ 3 กรณีที่ 2; ระบบยังดึง sub/vat/total/date จากฟอร์มใบส่งของ ถือเป็น CLASSIFY FAIL ของ `select_invoice_pages()` | [p1](../source_images/DMS-223_p1.png), [p2](../source_images/DMS-223_p2.png), [review](review/DMS-223.md) |

หมายเหตุ: เอกสารที่มีทั้งหน้าต้นฉบับ + สำเนา/เอกสารอื่นในไฟล์เดียวกัน (DMS-134, DMS-24, DMS-117, DMS-223‑style copies ฯลฯ) **ไม่ถูกคัดออก** ตามแผนข้อ 3 กรณีที่ 1 — ให้เก็บไว้ในชุดทดสอบและแก้การเลือกหน้าแทน
