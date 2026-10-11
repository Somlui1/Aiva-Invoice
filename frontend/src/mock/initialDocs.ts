import { InvoiceDoc } from '../types/invoice'
import { companyOfOrg, companyOfTax } from './companies'

export const INITIAL_DOCS_RAW = [
  {
    "doc": "DMS-2026-000123",
    "inv": "IV6909245",
    "stax": "0105500000000",
    "oname": "ABC SUPPLY CO., LTD.",
    "release": null,
    "po": "42052823",
    "vendor": "ABC Supply Co., Ltd.",
    "org": 103,
    "tax": "0107545000179",
    "pages": 2,
    "rcv": "530340001",
    "receiver": "SOMSAK JAIDEE",
    "upl": "SOMSAK.J",
    "date": "2026-09-24",
    "up": "2026-10-01",
    "sub": 2910,
    "vat": 203.7,
    "total": 3113.7,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "HSS CENTRE DRILL A225 BS4 5/16\"",
        3,
        "PCS",
        130,
        390,
        1,
        3,
        130,
        "M1"
      ],
      [
        "CASTER WHEEL URETHANE-3\" (FIXED)",
        4,
        "PCS",
        310,
        1240,
        2,
        4,
        310,
        "M1"
      ],
      [
        "CASTER WHEEL URETHANE-3\" (SWIVEL)",
        4,
        "PCS",
        320,
        1280,
        3,
        4,
        320,
        "M1"
      ]
    ],
    "rtotal": 2910,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [],
    "aiva": "Auto-pass",
    "status": "Auto-pass",
    "tc": "Auto-pass ไม่มีรหัส · DR-07 ไม่พบคู่เทียบ",
    "grp": "A · ผลตรวจ AIVA"
  },
  {
    "doc": "DMS-2026-000201",
    "inv": "RD-2610-0011",
    "stax": "0105547055551",
    "oname": "RAYONG DIE SUPPLY CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Rayong Die Supply Co., Ltd.",
    "org": 103,
    "tax": "0107545000179",
    "pages": 1,
    "rcv": "530340201",
    "receiver": "SOMSAK JAIDEE",
    "upl": "SOMSAK.J",
    "date": "2026-10-02",
    "up": "2026-10-02",
    "sub": 5000,
    "vat": 350,
    "total": 5350,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Punch Pin D6 x 60L",
        3,
        "PCS",
        1666.6,
        4999.8,
        1,
        3,
        1666.6,
        "M1"
      ]
    ],
    "rtotal": 4999.8,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "fail",
        "exception_code": "E04",
        "severity": "Low",
        "evidence": "ผลรวมบรรทัด 4,999.80 vs ยอดก่อนภาษี 5,000.00 ต่าง 0.20 (ในกรอบ)",
        "page": 1
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [
      "E04"
    ],
    "aiva": "Auto-pass",
    "status": "Auto-pass",
    "tc": "Auto-pass มีเฉพาะ E04 Low",
    "grp": "A · ผลตรวจ AIVA"
  },
  {
    "doc": "DMS-2026-000202",
    "inv": "ST-2610-0102",
    "stax": "0105556055550",
    "oname": "STEEL TECH CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Steel Tech Co., Ltd.",
    "org": 352,
    "tax": "0145548001557",
    "pages": 1,
    "rcv": "530340202",
    "receiver": "WILAIWAN SRISUK",
    "upl": "WILAIWAN.S",
    "date": "2026-10-03",
    "up": "2026-10-03",
    "sub": 8600,
    "vat": 602,
    "total": 9202,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "SKD11 Plate 20 x 200 x 300",
        4,
        "PCS",
        2150,
        8600,
        1,
        4,
        2150,
        "M1"
      ]
    ],
    "rtotal": 8600,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "fail",
        "exception_code": "E01",
        "severity": "Medium",
        "evidence": "อ่าน Tax ID ลูกค้าไม่ได้ (หมึกจาง)",
        "page": 1
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [
      "E01"
    ],
    "aiva": "Review",
    "status": "Review",
    "tc": "E01 Medium · ผู้ใช้งานแก้",
    "grp": "A · ผลตรวจ AIVA"
  },
  {
    "doc": "DMS-2026-000152",
    "inv": "SR6909-1142",
    "stax": "0103554001122",
    "oname": null,
    "release": null,
    "po": "40120973",
    "vendor": "S R Y Engineering & Trading",
    "org": null,
    "tax": "0107545000179",
    "pages": 1,
    "rcv": "—",
    "receiver": null,
    "upl": "SOMSAK.J",
    "date": "2026-09-27",
    "up": "2026-09-28",
    "sub": 560,
    "vat": 39.2,
    "total": 599.2,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "ก๊าซ CO2 ขนาด 25 กก.",
        2,
        "CYL",
        280,
        520,
        null,
        null,
        null,
        "—"
      ]
    ],
    "rtotal": null,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "fail",
        "exception_code": "E02",
        "severity": "High",
        "evidence": "บรรทัด 1: 2 × 280.00 = 560.00 แต่ระบุ 520.00",
        "page": 1
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "not_evaluated",
        "halted_by": "V-02"
      },
      {
        "rule_id": "V-05",
        "result": "not_evaluated",
        "halted_by": "V-02"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "not_evaluated",
        "halted_by": "V-02"
      },
      {
        "rule_id": "V-08",
        "result": "not_evaluated",
        "halted_by": "V-02"
      },
      {
        "rule_id": "V-09",
        "result": "not_evaluated",
        "halted_by": "V-02"
      }
    ],
    "codes": [
      "E02"
    ],
    "aiva": "Hold",
    "status": "Hold",
    "tc": "E02 High · ไม่เรียก Oracle · ไม่มี Receiver → Reject เท่านั้น · ค้างจากเดือนก่อน",
    "grp": "A · ผลตรวจ AIVA",
    "halted": true
  },
  {
    "doc": "DMS-2026-000203",
    "inv": "TP-2610-0045",
    "stax": "0105552066662",
    "oname": "THAI PACKAGING CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Thai Packaging Co., Ltd.",
    "org": 103,
    "tax": "0107545000179",
    "pages": 1,
    "rcv": "530340203",
    "receiver": "SOMSAK JAIDEE",
    "upl": "SOMSAK.J",
    "date": "2026-10-02",
    "up": "2026-10-02",
    "sub": 10500,
    "vat": 735,
    "total": 11235,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Carton Box 40x30x30",
        500,
        "PCS",
        20,
        10000,
        1,
        500,
        20,
        "M1"
      ]
    ],
    "rtotal": 10000,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "fail",
        "exception_code": "E03",
        "severity": "High",
        "evidence": "ผลรวมบรรทัด 10,000.00 ≠ ยอดก่อนภาษี 10,500.00",
        "page": 1
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "fail",
        "exception_code": "E03",
        "severity": "High",
        "evidence": "ใบแจ้งหนี้ 10,500.00 vs ใบรับ 10,000.00",
        "page": 1
      }
    ],
    "codes": [
      "E03"
    ],
    "aiva": "Hold",
    "status": "Hold",
    "tc": "E03 High (V-03 และ V-09) · ฝ่ายบัญชีตัดสิน",
    "grp": "A · ผลตรวจ AIVA"
  },
  {
    "doc": "DMS-2026-000161",
    "inv": "TK-2609-0120",
    "stax": "0105551099887",
    "oname": null,
    "release": null,
    "po": "40121210",
    "vendor": "Sanwa Precision Tools Co., Ltd.",
    "org": null,
    "tax": "0145548001557",
    "pages": 1,
    "rcv": "—",
    "receiver": null,
    "upl": "WILAIWAN.S",
    "date": "2026-09-28",
    "up": "2026-09-29",
    "sub": 18400,
    "vat": 1288,
    "total": 19688,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Carbide Drill D8",
        20,
        "PCS",
        920,
        18400,
        null,
        null,
        null,
        "—"
      ]
    ],
    "rtotal": null,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "fail",
        "exception_code": "E05",
        "severity": "High",
        "evidence": "SQL ไม่คืนแถว: Tax ID ผู้ขาย 0105551099887 + SHIPMENT_NUM TK-2609-0120 (ตรวจ Tax ID ใน Vendor Master)",
        "page": 1
      },
      {
        "rule_id": "V-05",
        "result": "not_evaluated",
        "halted_by": "V-04"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "not_evaluated",
        "halted_by": "V-04"
      },
      {
        "rule_id": "V-08",
        "result": "not_evaluated",
        "halted_by": "V-04"
      },
      {
        "rule_id": "V-09",
        "result": "not_evaluated",
        "halted_by": "V-04"
      }
    ],
    "codes": [
      "E05"
    ],
    "aiva": "Hold",
    "status": "Hold",
    "tc": "E05 High · ไม่พบใบรับ · ไม่มี Receiver → Reject เท่านั้น · ค้างจากเดือนก่อน",
    "grp": "A · ผลตรวจ AIVA"
  },
  {
    "doc": "DMS-2026-000204",
    "inv": "MR-2610-0230",
    "stax": "0105544077773",
    "oname": "MEGA RUBBER CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Mega Rubber Co., Ltd.",
    "org": 103,
    "tax": "0107545000179",
    "pages": 1,
    "rcv": "530340204, 530340205",
    "receiver": "SOMSAK JAIDEE",
    "upl": "SOMSAK.J",
    "date": "2026-10-03",
    "up": "2026-10-03",
    "sub": 9000,
    "vat": 630,
    "total": 9630,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Rubber Bush 30A",
        200,
        "PCS",
        45,
        9000,
        1,
        200,
        45,
        "M1"
      ]
    ],
    "rtotal": 9000,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "fail",
        "exception_code": "E06",
        "severity": "High",
        "evidence": "พบ RECEIPT_NUM 2 ค่า: 530340204, 530340205",
        "page": 1
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "not_evaluated",
        "halted_by": "V-04"
      },
      {
        "rule_id": "V-08",
        "result": "not_evaluated",
        "halted_by": "V-04"
      },
      {
        "rule_id": "V-09",
        "result": "not_evaluated",
        "halted_by": "V-04"
      }
    ],
    "codes": [
      "E06"
    ],
    "aiva": "Hold",
    "status": "Hold",
    "tc": "E06 High · ใบรับ 2 ใบ · ข้าม STEP 3",
    "grp": "A · ผลตรวจ AIVA"
  },
  {
    "doc": "DMS-2026-000205",
    "inv": "SA-2610-0501",
    "stax": "0105539044556",
    "oname": "SIAM AUTO PARTS CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Siam Auto Parts Co., Ltd.",
    "org": 376,
    "tax": "0135546008650",
    "pages": 1,
    "rcv": "530340205",
    "receiver": "THANAKORN MANKONG",
    "upl": "THANAKORN.M",
    "date": "2026-10-04",
    "up": "2026-10-04",
    "sub": 10500,
    "vat": 735,
    "total": 11235,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Air Filter",
        50,
        "PCS",
        210,
        10500,
        1,
        50,
        210,
        "M1"
      ]
    ],
    "rtotal": 10500,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "fail",
        "exception_code": "E07",
        "severity": "High",
        "evidence": "Tax ID ลูกค้าบนใบแจ้งหนี้ 0135546008650 ≠ ตารางที่ 4 (0135546008643)",
        "page": 1
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [
      "E07"
    ],
    "aiva": "Hold",
    "status": "Hold",
    "tc": "E07 High · Tax ID ลูกค้าไม่ตรง",
    "grp": "A · ผลตรวจ AIVA",
    "ent": {
      "tax_id_match": false
    }
  },
  {
    "doc": "DMS-2026-000206",
    "inv": "SA-2610-0502",
    "stax": "0105539044556",
    "oname": "SIAM AUTO PARTS CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Siam Auto Parts Co., Ltd.",
    "org": 376,
    "tax": "0135546008643",
    "pages": 1,
    "rcv": "530340206",
    "receiver": "THANAKORN MANKONG",
    "upl": "THANAKORN.M",
    "date": "2026-10-04",
    "up": "2026-10-04",
    "sub": 7200,
    "vat": 504,
    "total": 7704,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Cabin Filter",
        40,
        "PCS",
        180,
        7200,
        1,
        40,
        180,
        "M1"
      ]
    ],
    "rtotal": 7200,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "fail",
        "exception_code": "E07",
        "severity": "Medium",
        "evidence": "ที่อยู่ลูกค้า 55 ถ.รามอินทรา 10230 ไม่ตรงกับสำนักงานใหญ่หรือสาขาในตารางที่ 4",
        "page": 1
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [
      "E07"
    ],
    "aiva": "Review",
    "status": "Review",
    "tc": "E07 Medium · ที่อยู่ลูกค้าไม่ตรง",
    "grp": "A · ผลตรวจ AIVA",
    "badAddr": "55 ถนนรามอินทรา แขวงคันนายาว เขตคันนายาว กรุงเทพมหานคร 10230",
    "ent": {
      "address_match": false,
      "address_matched": null
    }
  },
  {
    "doc": "DMS-2026-000131",
    "inv": "A631577",
    "stax": "0105536012345",
    "oname": "THAI STEEL SERVICE CO., LTD.",
    "release": "3",
    "po": "40100303",
    "vendor": "Thai Steel Service Co., Ltd.",
    "org": 103,
    "tax": "0107545000179",
    "pages": 2,
    "rcv": "530340112",
    "receiver": "SOMSAK JAIDEE",
    "upl": "SOMSAK.J",
    "date": "2026-09-26",
    "up": "2026-09-27",
    "sub": 18054,
    "vat": 1263.78,
    "total": 19317.78,
    "sig": [
      1,
      0
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "SPH270C-OD 2.0 x 225 x COIL",
        590,
        "KG",
        30.6,
        18054,
        1,
        590,
        30.6,
        "M1"
      ]
    ],
    "rtotal": 18054,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "fail",
        "exception_code": "E08",
        "severity": "High",
        "evidence": "ไม่พบลายเซ็นหรือตราในช่องผู้รับของ",
        "page": 1
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [
      "E08"
    ],
    "aiva": "Hold",
    "status": "Hold",
    "tc": "E08 High · ไม่มีลายเซ็นผู้รับของ · ค้างจากเดือนก่อน",
    "grp": "A · ผลตรวจ AIVA"
  },
  {
    "doc": "DMS-2026-000207",
    "inv": "PT-2610-0071",
    "stax": "0105548077777",
    "oname": "PRECISION TOOLS (THAILAND) CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Precision Tools (Thailand) Co., Ltd.",
    "org": 352,
    "tax": "0145548001557",
    "pages": 1,
    "rcv": "530340207",
    "receiver": "WILAIWAN SRISUK",
    "upl": "WILAIWAN.S",
    "date": "2026-10-05",
    "up": "2026-10-05",
    "sub": 7800,
    "vat": 546,
    "total": 8346,
    "sig": [
      0,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Carbide Insert CNMG120408",
        30,
        "PCS",
        260,
        7800,
        1,
        30,
        260,
        "M1"
      ]
    ],
    "rtotal": 7800,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "fail",
        "exception_code": "E08",
        "severity": "Medium",
        "evidence": "ไม่พบลายเซ็นหรือตราในช่องผู้ขาย/ผู้ส่งของ",
        "page": 1
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [
      "E08"
    ],
    "aiva": "Review",
    "status": "Review",
    "tc": "E08 Medium · ไม่มีลายเซ็นผู้ขาย",
    "grp": "A · ผลตรวจ AIVA"
  },
  {
    "doc": "DMS-2026-000208",
    "inv": "PT-2610-0088",
    "stax": "0105548077777",
    "oname": "PRECISION TOOLS (THAILAND) CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Precision Tools (Thailand) Co., Ltd.",
    "org": 352,
    "tax": "0145548001557",
    "pages": 1,
    "rcv": "530340208",
    "receiver": "WILAIWAN SRISUK",
    "upl": "WILAIWAN.S",
    "date": "2026-10-05",
    "up": "2026-10-05",
    "sub": 13000,
    "vat": 910,
    "total": 13910,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Collet ER32 10mm",
        25,
        "PCS",
        520,
        13000,
        1,
        25,
        480,
        "—"
      ]
    ],
    "rtotal": 12000,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "fail",
        "exception_code": "E09",
        "severity": "High",
        "evidence": "ราคา 520.00 vs ใบรับ 480.00 ต่าง 8.33% (เกินกรอบ)",
        "page": 1
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "fail",
        "exception_code": "E03",
        "severity": "High",
        "evidence": "ใบแจ้งหนี้ 13,000.00 vs ใบรับ 12,000.00",
        "page": 1
      }
    ],
    "codes": [
      "E09",
      "E03"
    ],
    "aiva": "Hold",
    "status": "Hold",
    "tc": "E09 High · ราคาต่างเกินกรอบ",
    "grp": "A · ผลตรวจ AIVA"
  },
  {
    "doc": "DMS-2026-000209",
    "inv": "AM-2610-0611",
    "stax": "0105539044556",
    "oname": "SIAM AUTO PARTS CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Siam Auto Parts Co., Ltd.",
    "org": 376,
    "tax": "0135546008643",
    "pages": 1,
    "rcv": "530340209",
    "receiver": "THANAKORN MANKONG",
    "upl": "THANAKORN.M",
    "date": "2026-10-06",
    "up": "2026-10-06",
    "sub": 11400,
    "vat": 798,
    "total": 12198,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Engine Oil 5W-30",
        120,
        "L",
        95,
        11400,
        1,
        120,
        95,
        "M1"
      ]
    ],
    "rtotal": 11400,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "fail",
        "exception_code": "E10",
        "severity": "Medium",
        "evidence": "หน่วยนับใบแจ้งหนี้ L vs ใบรับ BTL (ห้ามแปลงข้ามประเภท)",
        "page": 1
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [
      "E10"
    ],
    "aiva": "Review",
    "status": "Review",
    "tc": "E10 Medium · หน่วยนับไม่ตรง · ผู้ใช้งานแก้",
    "grp": "A · ผลตรวจ AIVA"
  },
  {
    "doc": "DMS-2026-000210",
    "inv": "TS-2610-0119",
    "stax": "0105536012345",
    "oname": "THAI STEEL SERVICE CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Thai Steel Service Co., Ltd.",
    "org": 103,
    "tax": "0107545000179",
    "pages": 1,
    "rcv": "530340210",
    "receiver": "SOMSAK JAIDEE",
    "upl": "SOMSAK.J",
    "date": "2026-10-06",
    "up": "2026-10-06",
    "sub": 3600,
    "vat": 252,
    "total": 3852,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Bolt M10 x 30",
        500,
        "PCS",
        4.5,
        2250,
        1,
        500,
        4.5,
        "M4"
      ],
      [
        "Bolt M10 x 40",
        300,
        "PCS",
        4.5,
        1350,
        2,
        300,
        4.5,
        "M4"
      ]
    ],
    "rtotal": 3600,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "fail",
        "exception_code": "E11",
        "severity": "Medium",
        "evidence": "ราคา 4.50 ตรง 2 บรรทัด จำนวนชี้ขาดไม่ได้ · ใช้คำบรรยายตัดสิน (M4)",
        "page": 1
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [
      "E11"
    ],
    "aiva": "Review",
    "status": "Review",
    "tc": "E11 Medium · จับคู่ด้วยคำบรรยาย",
    "grp": "A · ผลตรวจ AIVA"
  },
  {
    "doc": "DMS-2026-000158",
    "inv": "AM-2609-0412",
    "stax": "0105539044556",
    "oname": "SIAM AUTO PARTS CO., LTD.",
    "release": "12",
    "po": "45008812",
    "vendor": "Siam Auto Parts Co., Ltd.",
    "org": 376,
    "tax": "0135546008643",
    "pages": 2,
    "rcv": "560020415",
    "receiver": "THANAKORN MANKONG",
    "upl": "THANAKORN.M",
    "date": "2026-09-27",
    "up": "2026-09-27",
    "sub": 42600,
    "vat": 2982,
    "total": 45582,
    "sig": [
      1,
      1
    ],
    "custOn": "branch 00004",
    "lines": [
      [
        "Brake Pad Set Front",
        60,
        "SET",
        710,
        42600,
        1,
        60,
        712.5,
        "M5"
      ]
    ],
    "rtotal": 42750,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "fail",
        "exception_code": "E12",
        "severity": "Medium",
        "evidence": "ราคา 710.00 vs ใบรับ 712.50 ต่าง 0.35% (ในกรอบ)",
        "page": 1
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "fail",
        "exception_code": "E03",
        "severity": "High",
        "evidence": "ใบแจ้งหนี้ 42,600.00 vs ใบรับ 42,750.00",
        "page": 1
      }
    ],
    "codes": [
      "E12",
      "E03"
    ],
    "aiva": "Hold",
    "status": "Hold",
    "tc": "E12 Medium + E03 · ใบกำกับภาษีในนามสาขา 00004 · ค้างจากเดือนก่อน",
    "grp": "A · ผลตรวจ AIVA"
  },
  {
    "doc": "DMS-2026-000211",
    "inv": "TS-2610-0125",
    "stax": "0105536012345",
    "oname": "THAI STEEL SERVICE CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Thai Steel Service Co., Ltd.",
    "org": 103,
    "tax": "0107545000179",
    "pages": 1,
    "rcv": "530340211",
    "receiver": "SOMSAK JAIDEE",
    "upl": "SOMSAK.J",
    "date": "2026-10-06",
    "up": "2026-10-06",
    "sub": 720,
    "vat": 50.4,
    "total": 770.4,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Washer M12 Spring",
        400,
        "PCS",
        1.8,
        720,
        1,
        null,
        null,
        "—"
      ]
    ],
    "rtotal": 0,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "fail",
        "exception_code": "E13",
        "severity": "High",
        "evidence": "ระบุบรรทัดในใบรับไม่ได้ (Confidence 0.62)",
        "page": 1
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [
      "E13"
    ],
    "aiva": "Hold",
    "status": "Hold",
    "tc": "E13 High · ระบุบรรทัดไม่ได้",
    "grp": "A · ผลตรวจ AIVA"
  },
  {
    "doc": "DMS-2026-000140",
    "inv": "INV-2609-0088",
    "stax": "0105548077777",
    "oname": "PRECISION TOOLS (THAILAND) CO., LTD.",
    "release": null,
    "po": "40121082",
    "vendor": "Precision Tools (Thailand) Co., Ltd.",
    "org": 352,
    "tax": "0145548001557",
    "pages": 1,
    "rcv": "540112231",
    "receiver": "WILAIWAN SRISUK",
    "upl": "WILAIWAN.S",
    "date": "2026-09-25",
    "up": "2026-09-25",
    "sub": 11040,
    "vat": 772.8,
    "total": 11812.8,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Carbide End Mill D10 x 75L",
        12,
        "PCS",
        920,
        11040,
        1,
        10,
        920,
        "M1"
      ]
    ],
    "rtotal": 9200,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "fail",
        "exception_code": "E14",
        "severity": "High",
        "evidence": "บรรทัด 1 วางบิล 12 PCS > ใบรับ 10 PCS",
        "page": 1
      },
      {
        "rule_id": "V-09",
        "result": "fail",
        "exception_code": "E03",
        "severity": "High",
        "evidence": "ใบแจ้งหนี้ 11,040.00 vs ใบรับ 9,200.00",
        "page": 1
      }
    ],
    "codes": [
      "E14",
      "E03"
    ],
    "aiva": "Hold",
    "status": "Hold",
    "tc": "E14 High + E03 · จำนวนเกินใบรับ · ค้างจากเดือนก่อน",
    "grp": "A · ผลตรวจ AIVA"
  },
  {
    "doc": "DMS-2026-000212",
    "inv": "AM-2610-0640",
    "stax": "0105539044556",
    "oname": "SIAM AUTO PARTS CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Siam Auto Parts Co., Ltd.",
    "org": 376,
    "tax": "0135546008643",
    "pages": 1,
    "rcv": "530340212",
    "receiver": "THANAKORN MANKONG",
    "upl": "THANAKORN.M",
    "date": "2026-10-07",
    "up": "2026-10-07",
    "sub": 12000,
    "vat": 840,
    "total": 12840,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Wiper Blade 22\"",
        80,
        "PCS",
        150,
        12000,
        1,
        100,
        150,
        "M1"
      ]
    ],
    "rtotal": 15000,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "fail",
        "exception_code": "E15",
        "severity": "Medium",
        "evidence": "บรรทัด 1 วางบิล 80 PCS < ใบรับ 100 PCS",
        "page": 1
      },
      {
        "rule_id": "V-09",
        "result": "fail",
        "exception_code": "E03",
        "severity": "High",
        "evidence": "ใบแจ้งหนี้ 12,000.00 vs ใบรับ 15,000.00",
        "page": 1
      }
    ],
    "codes": [
      "E15",
      "E03"
    ],
    "aiva": "Hold",
    "status": "Hold",
    "tc": "E15 Medium + E03 · จำนวนน้อยกว่าใบรับ · เข้าระบบวันนี้",
    "grp": "A · ผลตรวจ AIVA"
  },
  {
    "doc": "DMS-2026-000170",
    "inv": "MG-2609-0009",
    "stax": "0105560033221",
    "oname": "METRO SUPPLY CO., LTD.",
    "release": null,
    "po": "48000121",
    "vendor": "Metro Supply Co., Ltd.",
    "org": 556,
    "tax": "—",
    "pages": 1,
    "rcv": "580001120",
    "receiver": "NARONG PHOLSRI",
    "upl": "NARONG.P",
    "date": "2026-09-29",
    "up": "2026-09-29",
    "sub": 5400,
    "vat": 378,
    "total": 5778,
    "sig": [
      1,
      1
    ],
    "custOn": null,
    "lines": [
      [
        "Service Kit",
        3,
        "SET",
        1800,
        5400,
        1,
        3,
        1800,
        "M1"
      ]
    ],
    "rtotal": 5400,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "manual_review",
        "evidence": "ORG_ID 556 สถานะยังไม่ทราบในตารางที่ 4"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [],
    "aiva": "Manual Review",
    "status": "Manual Review",
    "tc": "Manual Review · ORG_ID ยังไม่ทราบ (บริษัท ?) · Receiver ยังไม่เชื่อมบัญชี",
    "grp": "B · Manual Review"
  },
  {
    "doc": "DMS-2026-000213",
    "inv": "AT-2610-0004",
    "stax": "0105549044449",
    "oname": "ASIA TECH SERVICE CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Asia Tech Service Co., Ltd.",
    "org": 104,
    "tax": "—",
    "pages": 1,
    "rcv": "530340213",
    "receiver": "ANAN THONGDEE",
    "upl": "ANAN.T",
    "date": "2026-10-02",
    "up": "2026-10-02",
    "sub": 18500,
    "vat": 1295,
    "total": 19795,
    "sig": [
      1,
      1
    ],
    "custOn": null,
    "lines": [
      [
        "PM Service Contract",
        1,
        "JOB",
        18500,
        18500,
        1,
        1,
        18500,
        "M1"
      ]
    ],
    "rtotal": 18500,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "manual_review",
        "evidence": "ORG_ID 104 (ATD) สถานะยกเลิกในตารางที่ 4"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [],
    "aiva": "Manual Review",
    "status": "Manual Review",
    "tc": "Manual Review · ORG_ID ยกเลิก (ATD)",
    "grp": "B · Manual Review"
  },
  {
    "doc": "DMS-2026-000214",
    "inv": "FS-2610-1301",
    "stax": "0105550033338",
    "oname": "FASTENER NET CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Fastener Net Co., Ltd.",
    "org": 103,
    "tax": "0107545000179",
    "pages": 1,
    "rcv": "530340214",
    "receiver": "SOMSAK JAIDEE",
    "upl": "SOMSAK.J",
    "date": "2026-10-03",
    "up": "2026-10-03",
    "sub": 2100,
    "vat": 147,
    "total": 2247,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Hex Bolt M8 x 20",
        1000,
        "PCS",
        1.2,
        1200,
        1,
        1000,
        1.2,
        "M1"
      ],
      [
        "Hex Nut M8",
        1000,
        "PCS",
        0.6,
        600,
        2,
        1000,
        0.6,
        "M1"
      ],
      [
        "Flat Washer M8",
        1000,
        "PCS",
        0.3,
        300,
        3,
        1000,
        0.3,
        "M1"
      ]
    ],
    "rtotal": 2100,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "manual_review",
        "evidence": "SQL คืน 50 แถวพอดี อาจถูกตัด (ใบรับเกิน 50 บรรทัด)"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [],
    "aiva": "Manual Review",
    "status": "Manual Review",
    "tc": "Manual Review · SQL ได้ 50 แถวพอดี",
    "grp": "B · Manual Review"
  },
  {
    "doc": "DMS-2026-000215",
    "inv": "BK-2610-0021",
    "stax": "0105553088884",
    "oname": "BANGKOK OFFICE SUPPLY CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Bangkok Office Supply Co., Ltd.",
    "org": 103,
    "tax": "0107545000179",
    "pages": 1,
    "rcv": "530340215",
    "receiver": "SOMSAK JAIDEE",
    "upl": "SOMSAK.J",
    "date": "2026-10-04",
    "up": "2026-10-04",
    "sub": 5750,
    "vat": 402.5,
    "total": 6152.5,
    "sig": [
      1,
      1
    ],
    "custOn": "branch 00003",
    "lines": [
      [
        "Copy Paper A4 80g",
        50,
        "REAM",
        115,
        5750,
        1,
        50,
        115,
        "M1"
      ]
    ],
    "rtotal": 5750,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [],
    "aiva": "Auto-pass",
    "status": "Auto-pass",
    "tc": "Auto-pass · ใบกำกับภาษีในนาม AH สาขา 00003 กรุงเทพฯ",
    "grp": "C · ลูกค้า / นิติบุคคล"
  },
  {
    "doc": "DMS-2026-000216",
    "inv": "AHT-2610-0088",
    "stax": "0145548001557",
    "oname": "AAPICO HITECH TOOLING CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "AAPICO Hitech Tooling Co., Ltd.",
    "org": 103,
    "tax": "0107545000179",
    "pages": 1,
    "rcv": "530340216",
    "receiver": "SOMSAK JAIDEE",
    "upl": "SOMSAK.J",
    "date": "2026-10-05",
    "up": "2026-10-05",
    "sub": 38500,
    "vat": 2695,
    "total": 41195,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Die Repair Service",
        1,
        "JOB",
        38500,
        38500,
        1,
        1,
        38500,
        "M1"
      ]
    ],
    "rtotal": 38500,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [],
    "aiva": "Auto-pass",
    "status": "Auto-pass",
    "tc": "Auto-pass · Intercompany (ผู้ขาย AHT ส่งให้ AH)",
    "grp": "C · ลูกค้า / นิติบุคคล"
  },
  {
    "doc": "DMS-2026-000163",
    "inv": "PL-2610-0071",
    "stax": "0105541099995",
    "oname": "PRIME LUBRICANT CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Prime Lubricant Co., Ltd.",
    "org": 103,
    "tax": "0107545000179",
    "pages": 1,
    "rcv": "530340163",
    "receiver": "PRAPHAN KAEWKLA",
    "upl": "PRAPHAN.K",
    "date": "2026-10-05",
    "up": "2026-10-05",
    "sub": 13600,
    "vat": 952,
    "total": 14552,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Hydraulic Oil ISO 46",
        200,
        "L",
        68,
        13600,
        1,
        200,
        68,
        "M1"
      ]
    ],
    "rtotal": 13600,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "fail",
        "exception_code": "E10",
        "severity": "Medium",
        "evidence": "หน่วยนับใบแจ้งหนี้ L vs ใบรับ DRUM",
        "page": 1
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [
      "E10"
    ],
    "aiva": "Review",
    "status": "Review",
    "tc": "Receiver ยังไม่เชื่อมบัญชี · รหัสของผู้ใช้งานแต่ไม่มีผู้ใช้เห็น → ฝ่ายบัญชีดำเนินการได้",
    "grp": "D · ผู้รับผิดชอบ"
  },
  {
    "doc": "DMS-2026-000301",
    "inv": "DR-2610-0101",
    "stax": "0105546011116",
    "oname": "DELTA TRADING CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Delta Trading Co., Ltd.",
    "org": 103,
    "tax": "0107545000179",
    "pages": 1,
    "rcv": "530340301",
    "receiver": "SOMSAK JAIDEE",
    "upl": "SOMSAK.J",
    "date": "2026-10-01",
    "up": "2026-10-01",
    "sub": 8500,
    "vat": 595,
    "total": 9095,
    "sig": [
      1,
      0
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Safety Glove Nitrile",
        100,
        "PR",
        85,
        8500,
        1,
        100,
        85,
        "M1"
      ]
    ],
    "rtotal": 8500,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "fail",
        "exception_code": "E08",
        "severity": "High",
        "evidence": "ไม่พบลายเซ็นผู้รับของ",
        "page": 1
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [
      "E08"
    ],
    "aiva": "Hold",
    "status": "Superseded",
    "tc": "DR-01 ฉบับเดิม (Hold) → Superseded",
    "grp": "E · เอกสารซ้ำ (ตารางที่ 8A)",
    "supersededBy": "DMS-2026-000301-R1",
    "supRule": "DR-01 ฉบับใหม่ดีกว่า (Review vs Hold) → ฉบับเดิม Superseded",
    "xh": [
      {
        "t": "2026-10-03 08:40",
        "a": "Superseded",
        "d": "DR-01 ฉบับใหม่ดีกว่า (Review vs Hold) → ฉบับเดิม Superseded · ฉบับใหม่ DMS-2026-000301-R1",
        "k": "c"
      }
    ]
  },
  {
    "doc": "DMS-2026-000301-R1",
    "inv": "DR-2610-0101",
    "stax": "0105546011116",
    "oname": "DELTA TRADING CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Delta Trading Co., Ltd.",
    "org": 103,
    "tax": "0107545000179",
    "pages": 1,
    "rcv": "530341-R1",
    "receiver": "SOMSAK JAIDEE",
    "upl": "SOMSAK.J",
    "date": "2026-10-03",
    "up": "2026-10-03",
    "sub": 8500,
    "vat": 595,
    "total": 9095,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Safety Glove Nitrile",
        100,
        "PR",
        85,
        8500,
        1,
        100,
        85,
        "M4"
      ]
    ],
    "rtotal": 8500,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "fail",
        "exception_code": "E11",
        "severity": "Medium",
        "evidence": "จับคู่ด้วยคำบรรยาย (M4)",
        "page": 1
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [
      "E11"
    ],
    "aiva": "Review",
    "status": "Review",
    "tc": "DR-01 ฉบับใหม่ดีกว่า (Review) → ใช้ฉบับใหม่",
    "grp": "E · เอกสารซ้ำ (ตารางที่ 8A)",
    "supersedes": "DMS-2026-000301",
    "supRule": "DR-01 ฉบับใหม่ดีกว่า (Review vs Hold) → ฉบับเดิม Superseded",
    "xh": [
      {
        "t": "2026-10-03 08:40",
        "a": "แทนที่ฉบับเดิม",
        "d": "DR-01 ฉบับใหม่ดีกว่า (Review vs Hold) → ฉบับเดิม Superseded · ฉบับเดิม DMS-2026-000301",
        "k": "g"
      }
    ]
  },
  {
    "doc": "DMS-2026-000302",
    "inv": "DR-2610-0102",
    "stax": "0105546011116",
    "oname": "DELTA TRADING CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Delta Trading Co., Ltd.",
    "org": 352,
    "tax": "0145548001557",
    "pages": 1,
    "rcv": "530340302",
    "receiver": "WILAIWAN SRISUK",
    "upl": "WILAIWAN.S",
    "date": "2026-10-01",
    "up": "2026-10-01",
    "sub": 8400,
    "vat": 588,
    "total": 8988,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Ejector Pin 6 x 150",
        60,
        "PCS",
        140,
        8400,
        1,
        50,
        140,
        "M1"
      ]
    ],
    "rtotal": 7000,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "fail",
        "exception_code": "E14",
        "severity": "High",
        "evidence": "วางบิล 60 > ใบรับ 50",
        "page": 1
      },
      {
        "rule_id": "V-09",
        "result": "fail",
        "exception_code": "E03",
        "severity": "High",
        "evidence": "ใบแจ้งหนี้ 8,400.00 vs ใบรับ 7,000.00",
        "page": 1
      }
    ],
    "codes": [
      "E14",
      "E03"
    ],
    "aiva": "Hold",
    "status": "Superseded",
    "tc": "DR-02 ฉบับเดิม (Hold) → Superseded",
    "grp": "E · เอกสารซ้ำ (ตารางที่ 8A)",
    "supersededBy": "DMS-2026-000302-R1",
    "supRule": "DR-02 ฉบับใหม่เท่าเดิม (Hold vs Hold) → ฉบับเดิม Superseded",
    "xh": [
      {
        "t": "2026-10-04 08:40",
        "a": "Superseded",
        "d": "DR-02 ฉบับใหม่เท่าเดิม (Hold vs Hold) → ฉบับเดิม Superseded · ฉบับใหม่ DMS-2026-000302-R1",
        "k": "c"
      }
    ]
  },
  {
    "doc": "DMS-2026-000302-R1",
    "inv": "DR-2610-0102",
    "stax": "0105546011116",
    "oname": "DELTA TRADING CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Delta Trading Co., Ltd.",
    "org": 352,
    "tax": "0145548001557",
    "pages": 1,
    "rcv": "530342-R1",
    "receiver": "WILAIWAN SRISUK",
    "upl": "WILAIWAN.S",
    "date": "2026-10-04",
    "up": "2026-10-04",
    "sub": 7000,
    "vat": 490,
    "total": 7490,
    "sig": [
      1,
      0
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Ejector Pin 6 x 150",
        50,
        "PCS",
        140,
        7000,
        1,
        50,
        140,
        "M1"
      ]
    ],
    "rtotal": 7000,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "fail",
        "exception_code": "E08",
        "severity": "High",
        "evidence": "ไม่พบลายเซ็นผู้รับของ",
        "page": 1
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [
      "E08"
    ],
    "aiva": "Hold",
    "status": "Hold",
    "tc": "DR-02 ฉบับใหม่เท่าเดิม (Hold) → ใช้ฉบับใหม่",
    "grp": "E · เอกสารซ้ำ (ตารางที่ 8A)",
    "supersedes": "DMS-2026-000302",
    "supRule": "DR-02 ฉบับใหม่เท่าเดิม (Hold vs Hold) → ฉบับเดิม Superseded",
    "xh": [
      {
        "t": "2026-10-04 08:40",
        "a": "แทนที่ฉบับเดิม",
        "d": "DR-02 ฉบับใหม่เท่าเดิม (Hold vs Hold) → ฉบับเดิม Superseded · ฉบับเดิม DMS-2026-000302",
        "k": "g"
      }
    ]
  },
  {
    "doc": "DMS-2026-000303",
    "inv": "DR-2610-0103",
    "stax": "0105546011116",
    "oname": "DELTA TRADING CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Delta Trading Co., Ltd.",
    "org": 376,
    "tax": "0135546008643",
    "pages": 1,
    "rcv": "530340303",
    "receiver": "THANAKORN MANKONG",
    "upl": "THANAKORN.M",
    "date": "2026-10-02",
    "up": "2026-10-02",
    "sub": 6400,
    "vat": 448,
    "total": 6848,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Coolant Concentrate",
        20,
        "L",
        320,
        6400,
        1,
        20,
        320,
        "M1"
      ]
    ],
    "rtotal": 6400,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "fail",
        "exception_code": "E10",
        "severity": "Medium",
        "evidence": "หน่วยนับ L vs ใบรับ CAN",
        "page": 1
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [
      "E10"
    ],
    "aiva": "Review",
    "status": "Review",
    "tc": "DR-03 ฉบับเดิม (Review) → คงไว้",
    "grp": "E · เอกสารซ้ำ (ตารางที่ 8A)"
  },
  {
    "doc": "DMS-2026-000303-R1",
    "inv": "DR-2610-0103",
    "stax": "0105546011116",
    "oname": "DELTA TRADING CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Delta Trading Co., Ltd.",
    "org": 376,
    "tax": "0135546008643",
    "pages": 1,
    "rcv": "530343-R1",
    "receiver": "THANAKORN MANKONG",
    "upl": "THANAKORN.M",
    "date": "2026-10-05",
    "up": "2026-10-05",
    "sub": 6400,
    "vat": 448,
    "total": 6848,
    "sig": [
      1,
      0
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Coolant Concentrate",
        20,
        "L",
        320,
        6400,
        1,
        20,
        320,
        "M1"
      ]
    ],
    "rtotal": 6400,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "fail",
        "exception_code": "E08",
        "severity": "High",
        "evidence": "ไม่พบลายเซ็นผู้รับของ",
        "page": 1
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [
      "E08"
    ],
    "aiva": "Hold",
    "status": "Duplicate",
    "tc": "DR-03 ฉบับใหม่แย่กว่า (Hold) → Duplicate",
    "grp": "E · เอกสารซ้ำ (ตารางที่ 8A)",
    "dup": "DMS-2026-000303",
    "dupRule": "DR-03 ฉบับใหม่แย่กว่า (Hold vs Review) → ฉบับใหม่ Duplicate"
  },
  {
    "doc": "DMS-2026-000305",
    "inv": "DR-2610-0105",
    "stax": "0105546011116",
    "oname": "DELTA TRADING CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Delta Trading Co., Ltd.",
    "org": 103,
    "tax": "0107545000179",
    "pages": 1,
    "rcv": "530340305",
    "receiver": "SOMSAK JAIDEE",
    "upl": "SOMSAK.J",
    "date": "2026-09-15",
    "up": "2026-09-15",
    "sub": 4200,
    "vat": 294,
    "total": 4494,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Grease EP2",
        30,
        "KG",
        140,
        4200,
        1,
        30,
        120,
        "—"
      ]
    ],
    "rtotal": 3600,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "fail",
        "exception_code": "E09",
        "severity": "High",
        "evidence": "ราคา 140.00 vs ใบรับ 120.00",
        "page": 1
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "fail",
        "exception_code": "E03",
        "severity": "High",
        "evidence": "ใบแจ้งหนี้ 4,200.00 vs ใบรับ 3,600.00",
        "page": 1
      }
    ],
    "codes": [
      "E09",
      "E03"
    ],
    "aiva": "Hold",
    "status": "Rejected",
    "tc": "DR-05 ฉบับเดิม Rejected (เดือนก่อน)",
    "grp": "E · เอกสารซ้ำ (ตารางที่ 8A)",
    "xh": [
      {
        "t": "2026-09-16 10:05",
        "a": "Reject (Hold → Rejected)",
        "d": "ปณิดา รักงาน (เจ้าหน้าที่บัญชี) · ผู้ขายออกใบแจ้งหนี้ผิด · รอฉบับแก้ไข",
        "k": "c"
      }
    ]
  },
  {
    "doc": "DMS-2026-000305-R1",
    "inv": "DR-2610-0105",
    "stax": "0105546011116",
    "oname": "DELTA TRADING CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Delta Trading Co., Ltd.",
    "org": 103,
    "tax": "0107545000179",
    "pages": 1,
    "rcv": "530345-R1",
    "receiver": "SOMSAK JAIDEE",
    "upl": "SOMSAK.J",
    "date": "2026-10-02",
    "up": "2026-10-02",
    "sub": 3600,
    "vat": 252,
    "total": 3852,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Grease EP2",
        30,
        "KG",
        120,
        3600,
        1,
        30,
        120,
        "M1"
      ]
    ],
    "rtotal": 3600,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "fail",
        "exception_code": "E01",
        "severity": "Medium",
        "evidence": "อ่านวันที่ใบแจ้งหนี้ไม่ได้ (สแกนไม่ชัด)",
        "page": 1
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [
      "E01"
    ],
    "aiva": "Review",
    "status": "Review",
    "tc": "DR-05 ฉบับใหม่หลังฉบับเดิมถูก Reject → สถานะตามผลตรวจ",
    "grp": "E · เอกสารซ้ำ (ตารางที่ 8A)",
    "xh": [
      {
        "t": "2026-10-02 08:40",
        "a": "Portal ตรวจเอกสารซ้ำ",
        "d": "DR-05 ฉบับเดิม DMS-2026-000305 เป็น Rejected ไม่ใช้เป็นคู่เทียบ · ใช้ผลตรวจตามปกติ",
        "k": "s"
      }
    ]
  },
  {
    "doc": "DMS-2026-000306",
    "inv": "DR-2610-0106A",
    "stax": "0105546011116",
    "oname": "DELTA TRADING CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Delta Trading Co., Ltd.",
    "org": 352,
    "tax": "0145548001557",
    "pages": 1,
    "rcv": "540112600",
    "receiver": "WILAIWAN SRISUK",
    "upl": "WILAIWAN.S",
    "date": "2026-10-01",
    "up": "2026-10-01",
    "sub": 8400,
    "vat": 588,
    "total": 8988,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Spring Die 20 x 50",
        40,
        "PCS",
        210,
        8400,
        1,
        40,
        210,
        "M4"
      ]
    ],
    "rtotal": 8400,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "fail",
        "exception_code": "E11",
        "severity": "Medium",
        "evidence": "จับคู่ด้วยคำบรรยาย (M4)",
        "page": 1
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [
      "E11"
    ],
    "aiva": "Review",
    "status": "Review",
    "tc": "DR-06 ฉบับเดิม (ใบรับ 540112600) → คงไว้",
    "grp": "E · เอกสารซ้ำ (ตารางที่ 8A)"
  },
  {
    "doc": "DMS-2026-000307",
    "inv": "DR-2610-0106B",
    "stax": "0105546011116",
    "oname": "DELTA TRADING CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Delta Trading Co., Ltd.",
    "org": 352,
    "tax": "0145548001557",
    "pages": 1,
    "rcv": "540112600",
    "receiver": "WILAIWAN SRISUK",
    "upl": "WILAIWAN.S",
    "date": "2026-10-03",
    "up": "2026-10-03",
    "sub": 8400,
    "vat": 588,
    "total": 8988,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Spring Die 20 x 50",
        40,
        "PCS",
        210,
        8400,
        1,
        40,
        210,
        "M1"
      ]
    ],
    "rtotal": 8400,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [],
    "aiva": "Auto-pass",
    "status": "Duplicate",
    "tc": "DR-06 คนละเลขที่ใบแจ้งหนี้ แต่ใบรับเดียวกัน → Duplicate",
    "grp": "E · เอกสารซ้ำ (ตารางที่ 8A)",
    "dup": "DMS-2026-000306",
    "dupRule": "DR-06 ใช้ใบรับ 540112600 ซ้ำกับ DMS-2026-000306 (คนละเลขที่ใบแจ้งหนี้) → ฉบับใหม่ Duplicate"
  },
  {
    "doc": "DMS-2026-000180",
    "inv": "KS-2609-0301",
    "stax": "0105537011111",
    "oname": "KANOK STEEL CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Kanok Steel Co., Ltd.",
    "org": 103,
    "tax": "0107545000179",
    "pages": 1,
    "rcv": "530340310",
    "receiver": "SOMSAK JAIDEE",
    "upl": "SOMSAK.J",
    "date": "2026-09-26",
    "up": "2026-09-26",
    "sub": 25200,
    "vat": 1764,
    "total": 26964,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "SPCC 1.2 x 1219 x COIL",
        800,
        "KG",
        31.5,
        25200,
        1,
        800,
        31.5,
        "M1"
      ]
    ],
    "rtotal": 25200,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [],
    "aiva": "Auto-pass",
    "status": "Auto-pass",
    "tc": "Confirmed · ส่ง Batch ได้ · DR-04 ฉบับเดิม",
    "grp": "F · AP Interface",
    "ap": {
      "st": "Confirmed",
      "by": "u4",
      "at": "2026-09-29"
    }
  },
  {
    "doc": "DMS-2026-000181",
    "inv": "OSG-2609-0045",
    "stax": "0105549022222",
    "oname": "OSG THAI CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "OSG Thai Co., Ltd.",
    "org": 352,
    "tax": "0145548001557",
    "pages": 1,
    "rcv": "540112320",
    "receiver": "WILAIWAN SRISUK",
    "upl": "WILAIWAN.S",
    "date": "2026-09-26",
    "up": "2026-09-26",
    "sub": 15400,
    "vat": 1078,
    "total": 16478,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Tap M8 x 1.25",
        40,
        "PCS",
        385,
        15400,
        1,
        40,
        385,
        "M1"
      ]
    ],
    "rtotal": 15400,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [],
    "aiva": "Auto-pass",
    "status": "Auto-pass",
    "tc": "Confirmed · ส่ง Batch ได้",
    "grp": "F · AP Interface",
    "ap": {
      "st": "Confirmed",
      "by": "u4",
      "at": "2026-09-29"
    }
  },
  {
    "doc": "DMS-2026-000182",
    "inv": "AM-2609-0420",
    "stax": "0105539044556",
    "oname": "SIAM AUTO PARTS CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Siam Auto Parts Co., Ltd.",
    "org": 376,
    "tax": "0135546008643",
    "pages": 1,
    "rcv": "560020430",
    "receiver": "THANAKORN MANKONG",
    "upl": "THANAKORN.M",
    "date": "2026-09-30",
    "up": "2026-09-30",
    "sub": 22200,
    "vat": 1554,
    "total": 23754,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Oil Filter",
        120,
        "PCS",
        185,
        22200,
        1,
        120,
        185,
        "M1"
      ]
    ],
    "rtotal": 22200,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [],
    "aiva": "Auto-pass",
    "status": "Auto-pass",
    "tc": "Confirmed โดย APR · SoD: ผู้ยืนยันส่งเองไม่ได้",
    "grp": "F · AP Interface",
    "ap": {
      "st": "Confirmed",
      "by": "u6",
      "at": "2026-09-30"
    }
  },
  {
    "doc": "DMS-2026-000183",
    "inv": "FN-2609-1200",
    "stax": "0105545033333",
    "oname": "FANUC THAI LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Fanuc Thai Ltd.",
    "org": 103,
    "tax": "0107545000179",
    "pages": 1,
    "rcv": "530340355",
    "receiver": "SOMSAK JAIDEE",
    "upl": "SOMSAK.J",
    "date": "2026-09-30",
    "up": "2026-09-30",
    "sub": 1240000,
    "vat": 86800,
    "total": 1326800,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Servo Motor αiF 22",
        5,
        "PCS",
        248000,
        1240000,
        1,
        5,
        248000,
        "M1"
      ]
    ],
    "rtotal": 1240000,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [],
    "aiva": "Auto-pass",
    "status": "Auto-pass",
    "tc": "Confirmed · เกินวงเงิน 1,000,000 บาท",
    "grp": "F · AP Interface",
    "ap": {
      "st": "Confirmed",
      "by": "u4",
      "at": "2026-09-30"
    }
  },
  {
    "doc": "DMS-2026-000184",
    "inv": "NX-2609-0777",
    "stax": "0105551045678",
    "oname": "NX SHOJI (THAILAND) CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "NX Shoji (Thailand) Co., Ltd.",
    "org": 175,
    "tax": "0145548001549",
    "pages": 1,
    "rcv": "570010021",
    "receiver": "KITTI SOMBOON",
    "upl": "KITTI.S",
    "date": "2026-09-30",
    "up": "2026-09-30",
    "sub": 18600,
    "vat": 1302,
    "total": 19902,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Plastic Pallet 1100x1100",
        30,
        "PCS",
        620,
        18600,
        1,
        30,
        620,
        "M1"
      ]
    ],
    "rtotal": 18600,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [],
    "aiva": "Auto-pass",
    "status": "Auto-pass",
    "tc": "Confirmed · พบซ้ำตอนตรวจก่อนส่ง → Duplicate",
    "grp": "F · AP Interface",
    "ap": {
      "st": "Confirmed",
      "by": "u5",
      "at": "2026-09-30"
    },
    "dupAtPost": "IV ฉบับเดียวกันถูกส่งเข้า AP แล้วใน Batch B-260925-02"
  },
  {
    "doc": "DMS-2026-000185",
    "inv": "KS-2609-0288",
    "stax": "0105537011111",
    "oname": "KANOK STEEL CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Kanok Steel Co., Ltd.",
    "org": 103,
    "tax": "0107545000179",
    "pages": 1,
    "rcv": "530340290",
    "receiver": "SOMSAK JAIDEE",
    "upl": "SOMSAK.J",
    "date": "2026-09-28",
    "up": "2026-09-28",
    "sub": 19080,
    "vat": 1335.6,
    "total": 20415.6,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "SPCC 1.0 x 1219 x COIL",
        600,
        "KG",
        31.8,
        19080,
        1,
        600,
        31.8,
        "M1"
      ]
    ],
    "rtotal": 19080,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [],
    "aiva": "Auto-pass",
    "status": "Auto-pass",
    "tc": "Sent · รอผล Import",
    "grp": "F · AP Interface",
    "ap": {
      "st": "Sent",
      "by": "u4",
      "at": "2026-09-28",
      "batch": "B-261001-01",
      "sentBy": "u6",
      "sentAt": "2026-10-01 16:10"
    }
  },
  {
    "doc": "DMS-2026-000186",
    "inv": "OSG-2609-0031",
    "stax": "0105549022222",
    "oname": "OSG THAI CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "OSG Thai Co., Ltd.",
    "org": 352,
    "tax": "0145548001557",
    "pages": 1,
    "rcv": "540112290",
    "receiver": "WILAIWAN SRISUK",
    "upl": "WILAIWAN.S",
    "date": "2026-09-27",
    "up": "2026-09-27",
    "sub": 13800,
    "vat": 966,
    "total": 14766,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "End Mill D6",
        20,
        "PCS",
        690,
        13800,
        1,
        20,
        690,
        "M1"
      ]
    ],
    "rtotal": 13800,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [],
    "aiva": "Auto-pass",
    "status": "Auto-pass",
    "tc": "Posted · ปิดแล้ว (เดือนก่อน)",
    "grp": "F · AP Interface",
    "ap": {
      "st": "Posted",
      "by": "u4",
      "at": "2026-09-27",
      "batch": "B-260930-01",
      "sentBy": "u6",
      "sentAt": "2026-09-30 15:20",
      "apId": "AP-1188204"
    }
  },
  {
    "doc": "DMS-2026-000187",
    "inv": "PS-2609-0012",
    "stax": "0105560044444",
    "oname": "PROSERV ENGINEERING CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Proserv Engineering Co., Ltd.",
    "org": 103,
    "tax": "0107545000179",
    "pages": 1,
    "rcv": "530340250",
    "receiver": "SOMSAK JAIDEE",
    "upl": "SOMSAK.J",
    "date": "2026-09-27",
    "up": "2026-09-27",
    "sub": 45000,
    "vat": 3150,
    "total": 48150,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "ค่าบริการซ่อมเครื่องอัด",
        1,
        "JOB",
        45000,
        45000,
        1,
        1,
        45000,
        "M1"
      ]
    ],
    "rtotal": 45000,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [],
    "aiva": "Auto-pass",
    "status": "Auto-pass",
    "tc": "Import Failed · Return → Review (APR)",
    "grp": "F · AP Interface",
    "ap": {
      "st": "Import Failed",
      "by": "u4",
      "at": "2026-09-27",
      "batch": "B-260930-01",
      "sentBy": "u6",
      "sentAt": "2026-09-30 15:20",
      "err": "AP_INVOICES_INTERFACE · INVALID SUPPLIER SITE: Supplier site ของผู้ขายถูกปิดใช้งานใน Oracle"
    }
  },
  {
    "doc": "DMS-2026-000180-R1",
    "inv": "KS-2609-0301",
    "stax": "0105537011111",
    "oname": "KANOK STEEL CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Kanok Steel Co., Ltd.",
    "org": 103,
    "tax": "0107545000179",
    "pages": 1,
    "rcv": "530340310",
    "receiver": "SOMSAK JAIDEE",
    "upl": "SOMSAK.J",
    "date": "2026-10-06",
    "up": "2026-10-06",
    "sub": 25200,
    "vat": 1764,
    "total": 26964,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "SPCC 1.2 x 1219 x COIL",
        800,
        "KG",
        31.5,
        25200,
        1,
        800,
        31.5,
        "M1"
      ]
    ],
    "rtotal": 25200,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [],
    "aiva": "Auto-pass",
    "status": "Duplicate",
    "tc": "DR-04 ฉบับเดิม Confirmed → ฉบับใหม่ Duplicate",
    "grp": "E · เอกสารซ้ำ (ตารางที่ 8A)",
    "dup": "DMS-2026-000180",
    "dupRule": "DR-04 ฉบับเดิม DMS-2026-000180 Confirmed → ฉบับใหม่ Duplicate"
  },
  {
    "doc": "DMS-2026-000090",
    "inv": "OL-2608-0012",
    "stax": "0105558022227",
    "oname": "ORIENT LOGISTICS CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Orient Logistics Co., Ltd.",
    "org": 352,
    "tax": "0145548001557",
    "pages": 1,
    "rcv": "530340090",
    "receiver": "WILAIWAN SRISUK",
    "upl": "WILAIWAN.S",
    "date": "2026-08-18",
    "up": "2026-08-18",
    "sub": 14000,
    "vat": 980,
    "total": 14980,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Freight Bangkok–Ayutthaya",
        4,
        "TRIP",
        3500,
        14000,
        1,
        4,
        3200,
        "—"
      ]
    ],
    "rtotal": 12800,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "fail",
        "exception_code": "E09",
        "severity": "High",
        "evidence": "ราคา 3,500.00 vs ใบรับ 3,200.00",
        "page": 1
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "fail",
        "exception_code": "E03",
        "severity": "High",
        "evidence": "ใบแจ้งหนี้ 14,000.00 vs ใบรับ 12,800.00",
        "page": 1
      }
    ],
    "codes": [
      "E09",
      "E03"
    ],
    "aiva": "Hold",
    "status": "Hold",
    "tc": "ค้างนอกช่วง 2 เดือน (ส.ค.) · ต้องขึ้นแถบเตือน",
    "grp": "H · ช่วงเวลา"
  },
  {
    "doc": "DMS-2026-000091",
    "inv": "OL-2608-0020",
    "stax": "0105558022227",
    "oname": "ORIENT LOGISTICS CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Orient Logistics Co., Ltd.",
    "org": 103,
    "tax": "0107545000179",
    "pages": 1,
    "rcv": "530331020",
    "receiver": "SOMSAK JAIDEE",
    "upl": "SOMSAK.J",
    "date": "2026-08-20",
    "up": "2026-08-20",
    "sub": 8400,
    "vat": 588,
    "total": 8988,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Freight Rayong–Ayutthaya",
        2,
        "TRIP",
        4200,
        8400,
        1,
        2,
        4200,
        "M1"
      ]
    ],
    "rtotal": 8400,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "pass"
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [],
    "aiva": "Auto-pass",
    "status": "Auto-pass",
    "tc": "Posted (ส.ค.) · ปิดแล้ว ซ่อนได้ตามช่วงเวลา",
    "grp": "H · ช่วงเวลา",
    "ap": {
      "st": "Posted",
      "by": "u4",
      "at": "2026-08-21",
      "batch": "B-260822-01",
      "sentBy": "u6",
      "sentAt": "2026-08-22 15:00",
      "apId": "AP-1176011"
    }
  },
  {
    "doc": "DMS-2026-000092",
    "inv": "OL-2608-0031",
    "stax": "0105558022227",
    "oname": "ORIENT LOGISTICS CO., LTD.",
    "release": null,
    "po": "40130000",
    "vendor": "Orient Logistics Co., Ltd.",
    "org": 376,
    "tax": "0135546008600",
    "pages": 1,
    "rcv": "530340092",
    "receiver": "THANAKORN MANKONG",
    "upl": "THANAKORN.M",
    "date": "2026-08-25",
    "up": "2026-08-25",
    "sub": 8400,
    "vat": 588,
    "total": 8988,
    "sig": [
      1,
      1
    ],
    "custOn": "head_office_th",
    "lines": [
      [
        "Freight Bangna–Lat Phrao",
        3,
        "TRIP",
        2800,
        8400,
        1,
        3,
        2800,
        "M1"
      ]
    ],
    "rtotal": 8400,
    "rules": [
      {
        "rule_id": "V-01",
        "result": "pass"
      },
      {
        "rule_id": "V-02",
        "result": "pass"
      },
      {
        "rule_id": "V-03",
        "result": "pass"
      },
      {
        "rule_id": "V-04",
        "result": "pass"
      },
      {
        "rule_id": "V-05",
        "result": "fail",
        "exception_code": "E07",
        "severity": "High",
        "evidence": "Tax ID ลูกค้าบนใบแจ้งหนี้ไม่ตรงกับตารางที่ 4",
        "page": 1
      },
      {
        "rule_id": "V-06",
        "result": "pass"
      },
      {
        "rule_id": "V-07",
        "result": "pass"
      },
      {
        "rule_id": "V-08",
        "result": "pass"
      },
      {
        "rule_id": "V-09",
        "result": "pass"
      }
    ],
    "codes": [
      "E07"
    ],
    "aiva": "Hold",
    "status": "Rejected",
    "tc": "Rejected (ส.ค.) · ปิดแล้ว",
    "grp": "H · ช่วงเวลา",
    "ent": {
      "tax_id_match": false
    },
    "xh": [
      {
        "t": "2026-08-26 11:20",
        "a": "Reject (Hold → Rejected)",
        "d": "กมลวรรณ ใจงาม (เจ้าหน้าที่บัญชี) · ผู้ขายออกใบแจ้งหนี้ผิดนิติบุคคล",
        "k": "c"
      }
    ]
  }
] as const

export const INITIAL_DOCS: InvoiceDoc[] = INITIAL_DOCS_RAW.map((d: any) => {
  const company = d.org ? companyOfOrg(d.org) : companyOfTax(d.tax || '')
  return {
    ...d,
    doc: d.doc,
    company: d.company || company || '?',
    vendor: d.vendor,
    stax: d.stax,
    inv: d.inv,
    dt: d.date || d.dt || '2026-10-01',
    total: d.total,
    sub: d.sub ?? Math.round((d.total / 1.07) * 100) / 100,
    vat: d.vat ?? Math.round((d.total - (d.sub ?? Math.round((d.total / 1.07) * 100) / 100)) * 100) / 100,
    po: d.po,
    rcv: d.rcv,
    org: d.org,
    release: d.release,
    oname: d.oname,
    upl: d.upl || 'SOMSAK.J',
    sig: d.sig || [1, 1],
    custOn: d.custOn,
    rtotal: d.rtotal,
    receiver: d.receiver || undefined,
    receiverActive: d.receiverActive ?? (!!d.receiver),
    owner: d.receiver,
    ownerSrc: d.receiver ? 'RCV_VRC_HDS_V.RECEIVER' : '—',
    assigned: d.assigned || (d.codes && d.codes.some((c: string) => ['E01', 'E05', 'E06', 'E08', 'E10'].includes(c)) ? 'eu' : 'acc'),
    status: d.status || d.aiva,
    round: d.round || 1,
    up: d.up || '2026-10-01',
    codes: d.codes || [],
    rules: (d.rules || []).map((r: any, idx: number) => ({
      id: r.rule_id || 'R-' + idx,
      rule: r.rule_id || '',
      name: r.rule_id || '',
      status: r.result === 'pass' ? 'PASS' : r.result === 'fail' ? 'FAIL' : r.result === 'manual_review' ? 'WARN' : 'SKIP',
      result: r.result,
      exception_code: r.exception_code,
      severity: r.severity,
      detail: r.evidence,
      evidence: r.evidence,
      page: r.page || 1,
      halted_by: r.halted_by
    })),
    lines: (d.lines || []).map((l: any, idx: number) => ({
      no: idx + 1,
      desc: l[0],
      qty: l[1],
      unit: l[2],
      price: l[3],
      amount: l[4],
      po_line: l[5],
      po_qty: l[6],
      po_price: l[7],
      match_level: l[8],
      diff: l[8] === '—' || l[8] === 'M5'
    })),
    oracleReceiptLines: (d.lines || []).map((l: any, idx: number) => ({
      poNumber: d.po || '42052823',
      receiptNum: d.rcv || '530340001',
      lineNo: idx + 1,
      rcvLineId: `${d.rcv || '530340001'}-${idx + 1}`,
      itemCode: `ITEM-${idx + 1}`,
      itemDesc: l[0],
      qty: l[6] ?? l[1],
      uom: l[2] ?? 'PCS',
      unitPrice: l[7] ?? l[3],
      lineAmount: (l[6] ?? l[1]) * (l[7] ?? l[3]),
      qtyBilled: l[1],
      lineStatus: 'FULLY RECEIVED',
      poLineStatus: 'CLOSED',
      receiver: d.receiver,
    })),
    pages: d.pages || 1,
    history: d.xh ? d.xh.map((x: any) => ({
      dt: x.t ? x.t.split(' ')[0] : '2026-10-01',
      t: x.t ? x.t.split(' ')[1] || '08:00' : '08:00',
      who: x.a || 'ระบบ AIVA',
      act: x.a || '',
      d: x.d || '',
      k: x.k
    })) : [
      {
        dt: d.up || '2026-10-01',
        t: '08:30:00',
        who: 'ระบบ AIVA',
        act: 'นำเข้าเอกสาร',
        d: 'ผลตรวจเบื้องต้น: ' + (d.status || d.aiva),
        k: 'h'
      }
    ],
    unres: d.unres ?? (d.org === 556 || d.org === 104 || !d.receiver),
    grp: d.grp,
    duplicate_of: d.dup || d.duplicateOf,
    dup: d.dup || d.duplicateOf,
    supersededBy: d.supersededBy,
    supersedes: d.supersedes,
    supRule: d.supRule,
    dupRule: d.dupRule,
    tc: d.tc,
    halted: d.halted
  }
})

export const initialDocs = INITIAL_DOCS

