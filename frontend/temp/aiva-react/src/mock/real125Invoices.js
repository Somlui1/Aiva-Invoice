// Real 125 Invoices from Engine v5.5
export const REAL_125_INVOICES = [
  {
    "doc": "DMS-15",
    "company": "AH",
    "vendor": "บริษัท จรูญรัตน์ โปรดักส์ จำกัด JAROONRAT PRODUCTS CO.,LTD.",
    "stax": "0135537003456",
    "inv": "SQ26/071249",
    "dt": "2026-07-08",
    "total": 472.94,
    "sub": 442,
    "vat": 30.94,
    "po": "40117545",
    "rcv": "510517699",
    "org": 101,
    "oname": "บริษัท อาปิโก ไฮเทค จำกัด (มหาชน)",
    "sig": [
      1,
      1
    ],
    "rtotal": 442,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 510517699 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 442.00 = receipt 442"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "MB3C-2C296-E-PIA-14 BRACKET",
        "qty": 50,
        "unit": "PCS",
        "price": 4.42,
        "amount": 221,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 50,
        "match_level": "M4"
      },
      {
        "no": 2,
        "desc": "MB3C-9K337-BA-02 BRKT FUL TUB CLP SUPT",
        "qty": 50,
        "unit": "PCS",
        "price": 4.42,
        "amount": 221,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 50,
        "match_level": "M4"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "40117545",
        "receiptNum": "510517699",
        "lineNo": 1,
        "rcvLineId": "510517699-1",
        "itemCode": "POP0000508A",
        "itemDesc": "MB3C-2C296-E-PIA-14  BRACKET (PLATING; OUTSIDE)",
        "qty": 50,
        "uom": "Piece",
        "unitPrice": 4.42,
        "lineAmount": 221,
        "qtyBilled": 600,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40117545",
          "ITEM_CODE": "POP0000508A",
          "SHIPMENT_NUM": "SQ26/071249",
          "PACKING_SLIP": "SQ26/071249",
          "QTY_BILLED": "600"
        }
      },
      {
        "poNumber": "40117545",
        "receiptNum": "510517699",
        "lineNo": 2,
        "rcvLineId": "510517699-2",
        "itemCode": "POP0000579A",
        "itemDesc": "MB3C-9K337-BA  BRKT FUL TUB CLP SUPT (PLATING; OUTSIDE)",
        "qty": 50,
        "uom": "Piece",
        "unitPrice": 4.42,
        "lineAmount": 221,
        "qtyBilled": 1000,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40117545",
          "ITEM_CODE": "POP0000579A",
          "SHIPMENT_NUM": "SQ26/071249",
          "PACKING_SLIP": "SQ26/071249",
          "QTY_BILLED": "1000"
        }
      }
    ],
    "pages": 1,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:15:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-19",
    "company": "AHT",
    "vendor": "DAIDO DMS (THAILAND) CO., LTD.",
    "stax": "0115538001783",
    "inv": "0851392",
    "dt": "2026-09-01",
    "total": 27212.24,
    "sub": 25432,
    "vat": 1780.24,
    "po": "42052696",
    "rcv": "50220043181",
    "org": 195,
    "oname": "บริษัท อาปิโก ไฮเทค อยุธยา จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 25432,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043181 (INV-BY-PO-VENDOR)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 25,432.00 = receipt 25,432"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "95 x 220 x 250",
        "qty": 2,
        "unit": "PCS",
        "price": 6950,
        "amount": 13900,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 2,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "135 x 180 x 180",
        "qty": 2,
        "unit": "PCS",
        "price": 5766,
        "amount": 11532,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 2,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052696",
        "receiptNum": "50220043181",
        "lineNo": 1,
        "rcvLineId": "50220043181-1",
        "itemCode": "DRM0034916A",
        "itemDesc": "FINISHED PLATE GO5\\95X220X250",
        "qty": 2,
        "uom": "Piece",
        "unitPrice": 6950,
        "lineAmount": 13900,
        "qtyBilled": 2,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052696",
          "ITEM_CODE": "DRM0034916A",
          "SHIPMENT_NUM": "0851392",
          "PACKING_SLIP": "0851392",
          "QTY_BILLED": "2"
        }
      },
      {
        "poNumber": "42052696",
        "receiptNum": "50220043181",
        "lineNo": 2,
        "rcvLineId": "50220043181-2",
        "itemCode": "DRM0034917A",
        "itemDesc": "FINISHED PLATE GO5\\135X180X180",
        "qty": 2,
        "uom": "Piece",
        "unitPrice": 5766,
        "lineAmount": 11532,
        "qtyBilled": 2,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052696",
          "ITEM_CODE": "DRM0034917A",
          "SHIPMENT_NUM": "0851392",
          "PACKING_SLIP": "0851392",
          "QTY_BILLED": "2"
        }
      }
    ],
    "pages": 4,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:17:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-20",
    "company": "AHT",
    "vendor": "บริษัท ไทยเวิร์ธ จำกัด THAI WORTH COMPANY LIMITED",
    "stax": "0105537063173",
    "inv": "26/2691",
    "dt": "2026-09-02",
    "total": 52660.05,
    "sub": 49215,
    "vat": 3445.05,
    "po": "42052405",
    "rcv": "50220043196",
    "org": 195,
    "oname": "บริษัท อาปิโก ไฮเทค จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 49215,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 6 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043196 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "WARN",
        "result": "manual_review",
        "detail": "ความมั่นใจต่ำ: ['deliverer']"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 49,215.00 = receipt 49,215"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "SOLID CARBIDE BN45 BALLNOSE ENDMILL / 509-1200-150,G6110 (DIA.12 x11=16xI2=110xL=150xR6x2F) (944-1200-150, B0819) HPEB",
        "qty": 3,
        "unit": "PCS",
        "price": 3794,
        "amount": 11382,
        "diff": false,
        "gr_line": 12,
        "gr_qty": 3,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "SOLID CARBIDE BN45 BALLNOSE ENDMILL / 509-1000-150,G6110 (DIA.10 x 11=14xl2=100xL=150xR5x2F) (944-1000-150, B0819) HPEB",
        "qty": 3,
        "unit": "PCS",
        "price": 2936,
        "amount": 8808,
        "diff": false,
        "gr_line": 7,
        "gr_qty": 3,
        "match_level": "M1"
      },
      {
        "no": 3,
        "desc": "SOLID CARBIDE SE45 ENDMILL / 202-1200,G6110 (DIA.12 x 11=75xL=150x4F) HPES",
        "qty": 3,
        "unit": "PCS",
        "price": 4117,
        "amount": 12351,
        "diff": false,
        "gr_line": 8,
        "gr_qty": 3,
        "match_level": "M1"
      },
      {
        "no": 4,
        "desc": "SOLID CARBIDE SE45 ENDMILL / 202-1000,G6110 (DIA.10 x 11=57xL=125x4F) HPES",
        "qty": 3,
        "unit": "PCS",
        "price": 2648,
        "amount": 7944,
        "diff": false,
        "gr_line": 9,
        "gr_qty": 3,
        "match_level": "M1"
      },
      {
        "no": 5,
        "desc": "SOLID CARBIDE SE45 ENDMILL / 202-0800,G6110 (DIA.8 x 11=41xL=100x4F) HPES",
        "qty": 3,
        "unit": "PCS",
        "price": 1749,
        "amount": 5247,
        "diff": false,
        "gr_line": 10,
        "gr_qty": 3,
        "match_level": "M1"
      },
      {
        "no": 6,
        "desc": "SOLID CARBIDE SE45 ENDMILL / 202-0600,G6110 (DIA.6 x 11=38xL=100x4F) HPES",
        "qty": 3,
        "unit": "PCS",
        "price": 1161,
        "amount": 3483,
        "diff": false,
        "gr_line": 11,
        "gr_qty": 3,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052405",
        "receiptNum": "50220043196",
        "lineNo": 1,
        "rcvLineId": "50220043196-1",
        "itemCode": "AFS0003971A",
        "itemDesc": "SOLID CARBIDE BN45 BALLNOSE ENDMILL\\ 509-1200-150,G6110(DIA.12 x l1=16x l2=110xL=150xR6x2F)\\TWC",
        "qty": 0,
        "uom": "Piece",
        "unitPrice": 3794,
        "lineAmount": 0,
        "qtyBilled": 3,
        "lineStatus": "EXPECTED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052405",
          "ITEM_CODE": "AFS0003971A",
          "SHIPMENT_NUM": "26/2691",
          "PACKING_SLIP": "26/2691",
          "QTY_BILLED": "3"
        }
      },
      {
        "poNumber": "42052405",
        "receiptNum": "50220043196",
        "lineNo": 2,
        "rcvLineId": "50220043196-2",
        "itemCode": "AFS0003970A",
        "itemDesc": "SOLID CARBIDE BN45 BALLNOSE ENDMILL\\ 509-1000-150,G6110(DIA.10 x l1=14x l2=100xL=150xR5x2F)\\TWC",
        "qty": 0,
        "uom": "Piece",
        "unitPrice": 2936,
        "lineAmount": 0,
        "qtyBilled": 3,
        "lineStatus": "EXPECTED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052405",
          "ITEM_CODE": "AFS0003970A",
          "SHIPMENT_NUM": "26/2691",
          "PACKING_SLIP": "26/2691",
          "QTY_BILLED": "3"
        }
      },
      {
        "poNumber": "42052405",
        "receiptNum": "50220043196",
        "lineNo": 3,
        "rcvLineId": "50220043196-3",
        "itemCode": "AFS0003963A",
        "itemDesc": "SOLID CARBIDE SE45 ENDMILL\\ 202-1200,G6110(DIA.12 x l1=75x L=150x4F)\\TWC",
        "qty": 0,
        "uom": "Piece",
        "unitPrice": 4117,
        "lineAmount": 0,
        "qtyBilled": 3,
        "lineStatus": "EXPECTED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052405",
          "ITEM_CODE": "AFS0003963A",
          "SHIPMENT_NUM": "26/2691",
          "PACKING_SLIP": "26/2691",
          "QTY_BILLED": "3"
        }
      },
      {
        "poNumber": "42052405",
        "receiptNum": "50220043196",
        "lineNo": 4,
        "rcvLineId": "50220043196-4",
        "itemCode": "AFS0003962A",
        "itemDesc": "SOLID CARBIDE SE45 ENDMILL\\ 202-1000,G6110(DIA.10 x l1=57x L=125x4F)\\TWC",
        "qty": 0,
        "uom": "Piece",
        "unitPrice": 2648,
        "lineAmount": 0,
        "qtyBilled": 3,
        "lineStatus": "EXPECTED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052405",
          "ITEM_CODE": "AFS0003962A",
          "SHIPMENT_NUM": "26/2691",
          "PACKING_SLIP": "26/2691",
          "QTY_BILLED": "3"
        }
      },
      {
        "poNumber": "42052405",
        "receiptNum": "50220043196",
        "lineNo": 5,
        "rcvLineId": "50220043196-5",
        "itemCode": "AFS0003961A",
        "itemDesc": "SOLID CARBIDE SE45 ENDMILL\\ 202-0800,G6110(DIA.8 x l1=41x L=100x4F)\\TWC",
        "qty": 0,
        "uom": "Piece",
        "unitPrice": 1749,
        "lineAmount": 0,
        "qtyBilled": 3,
        "lineStatus": "EXPECTED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052405",
          "ITEM_CODE": "AFS0003961A",
          "SHIPMENT_NUM": "26/2691",
          "PACKING_SLIP": "26/2691",
          "QTY_BILLED": "3"
        }
      },
      {
        "poNumber": "42052405",
        "receiptNum": "50220043196",
        "lineNo": 6,
        "rcvLineId": "50220043196-6",
        "itemCode": "AFS0003960A",
        "itemDesc": "SOLID CARBIDE SE45 ENDMILL\\ 202-0600,G6110(DIA.6 x l1=38x L=100x4F)\\TWC",
        "qty": 0,
        "uom": "Piece",
        "unitPrice": 1161,
        "lineAmount": 0,
        "qtyBilled": 3,
        "lineStatus": "EXPECTED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052405",
          "ITEM_CODE": "AFS0003960A",
          "SHIPMENT_NUM": "26/2691",
          "PACKING_SLIP": "26/2691",
          "QTY_BILLED": "3"
        }
      },
      {
        "poNumber": "42052405",
        "receiptNum": "50220043196",
        "lineNo": 7,
        "rcvLineId": "50220043196-7",
        "itemCode": "AFS0003970A",
        "itemDesc": "SOLID CARBIDE BN45 BALLNOSE ENDMILL\\ 509-1000-150,G6110(DIA.10 x l1=14x l2=100xL=150xR5x2F)\\TWC",
        "qty": 3,
        "uom": "Piece",
        "unitPrice": 2936,
        "lineAmount": 8808,
        "qtyBilled": 3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052405",
          "ITEM_CODE": "AFS0003970A",
          "SHIPMENT_NUM": "26/2691",
          "PACKING_SLIP": "26/2691",
          "QTY_BILLED": "3"
        }
      },
      {
        "poNumber": "42052405",
        "receiptNum": "50220043196",
        "lineNo": 8,
        "rcvLineId": "50220043196-8",
        "itemCode": "AFS0003963A",
        "itemDesc": "SOLID CARBIDE SE45 ENDMILL\\ 202-1200,G6110(DIA.12 x l1=75x L=150x4F)\\TWC",
        "qty": 3,
        "uom": "Piece",
        "unitPrice": 4117,
        "lineAmount": 12351,
        "qtyBilled": 3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052405",
          "ITEM_CODE": "AFS0003963A",
          "SHIPMENT_NUM": "26/2691",
          "PACKING_SLIP": "26/2691",
          "QTY_BILLED": "3"
        }
      },
      {
        "poNumber": "42052405",
        "receiptNum": "50220043196",
        "lineNo": 9,
        "rcvLineId": "50220043196-9",
        "itemCode": "AFS0003962A",
        "itemDesc": "SOLID CARBIDE SE45 ENDMILL\\ 202-1000,G6110(DIA.10 x l1=57x L=125x4F)\\TWC",
        "qty": 3,
        "uom": "Piece",
        "unitPrice": 2648,
        "lineAmount": 7944,
        "qtyBilled": 3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052405",
          "ITEM_CODE": "AFS0003962A",
          "SHIPMENT_NUM": "26/2691",
          "PACKING_SLIP": "26/2691",
          "QTY_BILLED": "3"
        }
      },
      {
        "poNumber": "42052405",
        "receiptNum": "50220043196",
        "lineNo": 10,
        "rcvLineId": "50220043196-10",
        "itemCode": "AFS0003961A",
        "itemDesc": "SOLID CARBIDE SE45 ENDMILL\\ 202-0800,G6110(DIA.8 x l1=41x L=100x4F)\\TWC",
        "qty": 3,
        "uom": "Piece",
        "unitPrice": 1749,
        "lineAmount": 5247,
        "qtyBilled": 3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052405",
          "ITEM_CODE": "AFS0003961A",
          "SHIPMENT_NUM": "26/2691",
          "PACKING_SLIP": "26/2691",
          "QTY_BILLED": "3"
        }
      },
      {
        "poNumber": "42052405",
        "receiptNum": "50220043196",
        "lineNo": 11,
        "rcvLineId": "50220043196-11",
        "itemCode": "AFS0003960A",
        "itemDesc": "SOLID CARBIDE SE45 ENDMILL\\ 202-0600,G6110(DIA.6 x l1=38x L=100x4F)\\TWC",
        "qty": 3,
        "uom": "Piece",
        "unitPrice": 1161,
        "lineAmount": 3483,
        "qtyBilled": 3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052405",
          "ITEM_CODE": "AFS0003960A",
          "SHIPMENT_NUM": "26/2691",
          "PACKING_SLIP": "26/2691",
          "QTY_BILLED": "3"
        }
      },
      {
        "poNumber": "42052405",
        "receiptNum": "50220043196",
        "lineNo": 12,
        "rcvLineId": "50220043196-12",
        "itemCode": "AFS0003971A",
        "itemDesc": "SOLID CARBIDE BN45 BALLNOSE ENDMILL\\ 509-1200-150,G6110(DIA.12 x l1=16x l2=110xL=150xR6x2F)\\TWC",
        "qty": 3,
        "uom": "Piece",
        "unitPrice": 3794,
        "lineAmount": 11382,
        "qtyBilled": 3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052405",
          "ITEM_CODE": "AFS0003971A",
          "SHIPMENT_NUM": "26/2691",
          "PACKING_SLIP": "26/2691",
          "QTY_BILLED": "3"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:18:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-21",
    "company": "AHT",
    "vendor": "POLAR STAR ENGINEERING (THAILAND) CO.,LTD. (Head Office) บริษัท โพลาร์ สตาร์ เอ็นจิเนียริ่ง (ประเทศไทย) จำกัด (สำนักงานใหญ่)",
    "stax": "0245557001458",
    "inv": "IV2609043",
    "dt": "2026-09-04",
    "total": 4174.5,
    "sub": 3901.4,
    "vat": 273.1,
    "po": "42052690",
    "rcv": "50220043212",
    "org": 195,
    "oname": "AAPICO HITECH TOOLING CO.,LTD. (HEAD OFFICE)",
    "sig": [
      1,
      1
    ],
    "rtotal": 3901.4,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 6 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043212 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 3,901.40 = receipt 3,901.4"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "7553422740 ENDGATE STRIKER",
        "qty": 200,
        "unit": "PCS",
        "price": 0.94,
        "amount": 188,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 200,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "7553219780 ADHESIVE;TAPE BRKT END GATE STRIKER",
        "qty": 120,
        "unit": "PCS",
        "price": 0.45,
        "amount": 54,
        "diff": false,
        "gr_line": 4,
        "gr_qty": 120,
        "match_level": "M1"
      },
      {
        "no": 3,
        "desc": "8975503100 ADHESIVE;TAPE PUBX FRT CROSS",
        "qty": 120,
        "unit": "PCS",
        "price": 0.72,
        "amount": 86.4,
        "diff": false,
        "gr_line": 5,
        "gr_qty": 120,
        "match_level": "M1"
      },
      {
        "no": 4,
        "desc": "7553117361 SEAL;TAPE PUBX SIDE OTR",
        "qty": 250,
        "unit": "PCS",
        "price": 8.25,
        "amount": 2062.5,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 250,
        "match_level": "M1"
      },
      {
        "no": 5,
        "desc": "7553233741 SEAL;TAPE PUBX SIDE OTR",
        "qty": 250,
        "unit": "PCS",
        "price": 4.21,
        "amount": 1052.5,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 250,
        "match_level": "M1"
      },
      {
        "no": 6,
        "desc": "7552905890 SEAL;TAPE BOX RR FLOOR",
        "qty": 100,
        "unit": "PCS",
        "price": 4.58,
        "amount": 458,
        "diff": false,
        "gr_line": 6,
        "gr_qty": 100,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052690",
        "receiptNum": "50220043212",
        "lineNo": 1,
        "rcvLineId": "50220043212-1",
        "itemCode": "DCM0033005A",
        "itemDesc": "7553117361\\SEAL;TAPE,PUBX SIDE OTR",
        "qty": 250,
        "uom": "Piece",
        "unitPrice": 8.25,
        "lineAmount": 2062.5,
        "qtyBilled": 250,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052690",
          "ITEM_CODE": "DCM0033005A",
          "SHIPMENT_NUM": "IV2609043",
          "PACKING_SLIP": "IV2609043",
          "QTY_BILLED": "250"
        }
      },
      {
        "poNumber": "42052690",
        "receiptNum": "50220043212",
        "lineNo": 2,
        "rcvLineId": "50220043212-2",
        "itemCode": "DCM0033006A",
        "itemDesc": "7553233741\\SEAL;TAPE,PUBX SIDE OTR",
        "qty": 250,
        "uom": "Piece",
        "unitPrice": 4.21,
        "lineAmount": 1052.5,
        "qtyBilled": 250,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052690",
          "ITEM_CODE": "DCM0033006A",
          "SHIPMENT_NUM": "IV2609043",
          "PACKING_SLIP": "IV2609043",
          "QTY_BILLED": "250"
        }
      },
      {
        "poNumber": "42052690",
        "receiptNum": "50220043212",
        "lineNo": 3,
        "rcvLineId": "50220043212-3",
        "itemCode": "DCM0033317A",
        "itemDesc": "7553422740\\SEALER; QUADRANGLE TYPE",
        "qty": 200,
        "uom": "Piece",
        "unitPrice": 0.94,
        "lineAmount": 188,
        "qtyBilled": 200,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052690",
          "ITEM_CODE": "DCM0033317A",
          "SHIPMENT_NUM": "IV2609043",
          "PACKING_SLIP": "IV2609043",
          "QTY_BILLED": "200"
        }
      },
      {
        "poNumber": "42052690",
        "receiptNum": "50220043212",
        "lineNo": 4,
        "rcvLineId": "50220043212-4",
        "itemCode": "DCM0032961A",
        "itemDesc": "7553219780\\ADHESIVE;TAPE BRKT END GATE STRIKER",
        "qty": 120,
        "uom": "Piece",
        "unitPrice": 0.45,
        "lineAmount": 54,
        "qtyBilled": 120,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052690",
          "ITEM_CODE": "DCM0032961A",
          "SHIPMENT_NUM": "IV2609043",
          "PACKING_SLIP": "IV2609043",
          "QTY_BILLED": "120"
        }
      },
      {
        "poNumber": "42052690",
        "receiptNum": "50220043212",
        "lineNo": 5,
        "rcvLineId": "50220043212-5",
        "itemCode": "DCM0032962A",
        "itemDesc": "8975503100\\ADHESIVE;TAPE PUBX FRT CROSS",
        "qty": 120,
        "uom": "Piece",
        "unitPrice": 0.72,
        "lineAmount": 86.4,
        "qtyBilled": 120,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052690",
          "ITEM_CODE": "DCM0032962A",
          "SHIPMENT_NUM": "IV2609043",
          "PACKING_SLIP": "IV2609043",
          "QTY_BILLED": "120"
        }
      },
      {
        "poNumber": "42052690",
        "receiptNum": "50220043212",
        "lineNo": 6,
        "rcvLineId": "50220043212-6",
        "itemCode": "DCM0032965A",
        "itemDesc": "7552905890\\SEAL;TAPE BOX RR FLOOR",
        "qty": 100,
        "uom": "Piece",
        "unitPrice": 4.58,
        "lineAmount": 458,
        "qtyBilled": 100,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052690",
          "ITEM_CODE": "DCM0032965A",
          "SHIPMENT_NUM": "IV2609043",
          "PACKING_SLIP": "IV2609043",
          "QTY_BILLED": "100"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:18:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-22",
    "company": "AHT",
    "vendor": "ASIAN ADVANCED TECHNICA CO.,LTD. HEAD OFFICE",
    "stax": "0105546003064",
    "inv": "169090082",
    "dt": "2026-09-02",
    "total": 32679.21,
    "sub": 30541.32,
    "vat": 2137.89,
    "po": "42052663",
    "rcv": "50220043185",
    "org": 195,
    "oname": "บริษัท อาวโก โซเทค ทูลลิ่ง จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 30541.32,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E10"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 10 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043185 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "Line Arithmetic Inconsistency",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 4 (Invoice: CAM UNIT : B-SACD 52-00 (MEVAN) #64): หน่วยนับต่างกลุ่มหลังแปลง (Inv: SET→SET, Rcv: Piece→PCS)",
        "exception_code": "E10",
        "severity": "Medium",
        "actual": "SET",
        "expected": "PCS",
        "page": 1,
        "bbox": {
          "x": 0.028,
          "y": 0.398,
          "w": 0.866,
          "h": 0.013,
          "page": 1
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "WARN",
        "result": "manual_review",
        "detail": "AI/facts ไม่สอดคล้อง หรือเทียบจำนวนไม่ได้"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 30,541.32 = receipt 30,541.32"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "LOCATING KEY : B-LK 20-60 #94A01,94A04",
        "qty": 1,
        "unit": "PCS",
        "price": 62,
        "amount": 62,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 3,
        "match_level": "M3"
      },
      {
        "no": 2,
        "desc": "LOCATING KEY : B-LK 20-60 #94A01,94A04",
        "qty": 2,
        "unit": "PCS",
        "price": 62,
        "amount": 124,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 3,
        "match_level": "M3"
      },
      {
        "no": 3,
        "desc": "GUIDE POST SETS : B-MYP 32-140 #94A03",
        "qty": 4,
        "unit": "PCS",
        "price": 362.88,
        "amount": 1451.52,
        "diff": false,
        "gr_line": 4,
        "gr_qty": 4,
        "match_level": "M1"
      },
      {
        "no": 4,
        "desc": "CAM UNIT : B-SACD 52-00 (MEVAN) #64",
        "qty": 3,
        "unit": "SET",
        "price": 8037,
        "amount": 24111,
        "diff": true,
        "gr_line": 8,
        "gr_qty": 3,
        "match_level": "M4"
      },
      {
        "no": 5,
        "desc": "HOOK : B-CHPL 32 #69A09",
        "qty": 4,
        "unit": "PCS",
        "price": 192,
        "amount": 768,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 4,
        "match_level": "M1"
      },
      {
        "no": 6,
        "desc": "SPRING GUIDE RETAINERS : B-SGC 23-40 #78A02",
        "qty": 8,
        "unit": "PCS",
        "price": 37.8,
        "amount": 302.4,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 8,
        "match_level": "M1"
      },
      {
        "no": 7,
        "desc": "SPOOL RETAINERS : B-CSR 16-65 #7RA02",
        "qty": 6,
        "unit": "PCS",
        "price": 68.4,
        "amount": 410.4,
        "diff": false,
        "gr_line": 9,
        "gr_qty": 6,
        "match_level": "M1"
      },
      {
        "no": 8,
        "desc": "SPOOL RETAINER : B-CSRE 16-70-S10 #59A02",
        "qty": 2,
        "unit": "PCS",
        "price": 344,
        "amount": 688,
        "diff": false,
        "gr_line": 7,
        "gr_qty": 2,
        "match_level": "M1"
      },
      {
        "no": 9,
        "desc": "STROKE END BLOCKS : B-SBV 32-80-R-80 #59A03",
        "qty": 4,
        "unit": "PCS",
        "price": 312,
        "amount": 1248,
        "diff": false,
        "gr_line": 5,
        "gr_qty": 4,
        "match_level": "M1"
      },
      {
        "no": 10,
        "desc": "SPOOL RETAINER : B-CSRE 16-70-S20 #59A01 ( Project:AHD_AS (P703 BUNDLE 1.6), Task:07.2 - DFG0011022A )",
        "qty": 4,
        "unit": "PCS",
        "price": 344,
        "amount": 1376,
        "diff": false,
        "gr_line": 6,
        "gr_qty": 4,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052663",
        "receiptNum": "50220043185",
        "lineNo": 1,
        "rcvLineId": "50220043185-1",
        "itemCode": "DCM0002062A",
        "itemDesc": "SPRING GUIDE RETAINER\\SGC 23-40\\AAT",
        "qty": 8,
        "uom": "Piece",
        "unitPrice": 37.8,
        "lineAmount": 302.4,
        "qtyBilled": 8,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052663",
          "ITEM_CODE": "DCM0002062A",
          "SHIPMENT_NUM": "169090082",
          "PACKING_SLIP": "169090082",
          "QTY_BILLED": "8"
        }
      },
      {
        "poNumber": "42052663",
        "receiptNum": "50220043185",
        "lineNo": 2,
        "rcvLineId": "50220043185-2",
        "itemCode": "DCM0007628A",
        "itemDesc": "LOCATING KEY\\LK 20-60\\AAT",
        "qty": 3,
        "uom": "Piece",
        "unitPrice": 62,
        "lineAmount": 186,
        "qtyBilled": 3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052663",
          "ITEM_CODE": "DCM0007628A",
          "SHIPMENT_NUM": "169090082",
          "PACKING_SLIP": "169090082",
          "QTY_BILLED": "3"
        }
      },
      {
        "poNumber": "42052663",
        "receiptNum": "50220043185",
        "lineNo": 3,
        "rcvLineId": "50220043185-3",
        "itemCode": "DCM0024019A",
        "itemDesc": "HOOKS\\CHPL 32\\AAT",
        "qty": 4,
        "uom": "Piece",
        "unitPrice": 192,
        "lineAmount": 768,
        "qtyBilled": 4,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052663",
          "ITEM_CODE": "DCM0024019A",
          "SHIPMENT_NUM": "169090082",
          "PACKING_SLIP": "169090082",
          "QTY_BILLED": "4"
        }
      },
      {
        "poNumber": "42052663",
        "receiptNum": "50220043185",
        "lineNo": 4,
        "rcvLineId": "50220043185-4",
        "itemCode": "DCM0024020A",
        "itemDesc": "GUIDE POST\\MYP 32-140\\AAT",
        "qty": 4,
        "uom": "Piece",
        "unitPrice": 362.88,
        "lineAmount": 1451.52,
        "qtyBilled": 4,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052663",
          "ITEM_CODE": "DCM0024020A",
          "SHIPMENT_NUM": "169090082",
          "PACKING_SLIP": "169090082",
          "QTY_BILLED": "4"
        }
      },
      {
        "poNumber": "42052663",
        "receiptNum": "50220043185",
        "lineNo": 5,
        "rcvLineId": "50220043185-5",
        "itemCode": "DCM0028670A",
        "itemDesc": "STROKE END BLOCK\\B-SBV 32-80.0-R-80\\AAT",
        "qty": 4,
        "uom": "Piece",
        "unitPrice": 312,
        "lineAmount": 1248,
        "qtyBilled": 4,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052663",
          "ITEM_CODE": "DCM0028670A",
          "SHIPMENT_NUM": "169090082",
          "PACKING_SLIP": "169090082",
          "QTY_BILLED": "4"
        }
      },
      {
        "poNumber": "42052663",
        "receiptNum": "50220043185",
        "lineNo": 6,
        "rcvLineId": "50220043185-6",
        "itemCode": "DCM0033315A",
        "itemDesc": "STROKE ADJUSTMENT COLLARS\\B-CSRE 16-70-S20\\AAT",
        "qty": 4,
        "uom": "Piece",
        "unitPrice": 344,
        "lineAmount": 1376,
        "qtyBilled": 4,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052663",
          "ITEM_CODE": "DCM0033315A",
          "SHIPMENT_NUM": "169090082",
          "PACKING_SLIP": "169090082",
          "QTY_BILLED": "4"
        }
      },
      {
        "poNumber": "42052663",
        "receiptNum": "50220043185",
        "lineNo": 7,
        "rcvLineId": "50220043185-7",
        "itemCode": "DCM0033316A",
        "itemDesc": "STROKE ADJUSTMENT COLLARS\\B-CSRE 16-70-S10\\AAT",
        "qty": 2,
        "uom": "Piece",
        "unitPrice": 344,
        "lineAmount": 688,
        "qtyBilled": 2,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052663",
          "ITEM_CODE": "DCM0033316A",
          "SHIPMENT_NUM": "169090082",
          "PACKING_SLIP": "169090082",
          "QTY_BILLED": "2"
        }
      },
      {
        "poNumber": "42052663",
        "receiptNum": "50220043185",
        "lineNo": 8,
        "rcvLineId": "50220043185-8",
        "itemCode": "DCM0033318A",
        "itemDesc": "CAM UNIT\\B-SACD 52-00\\AAT",
        "qty": 3,
        "uom": "Piece",
        "unitPrice": 8037,
        "lineAmount": 24111,
        "qtyBilled": 3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052663",
          "ITEM_CODE": "DCM0033318A",
          "SHIPMENT_NUM": "169090082",
          "PACKING_SLIP": "169090082",
          "QTY_BILLED": "3"
        }
      },
      {
        "poNumber": "42052663",
        "receiptNum": "50220043185",
        "lineNo": 9,
        "rcvLineId": "50220043185-9",
        "itemCode": "DCM0033314A",
        "itemDesc": "SPOOL RETAINER\\B-CSR 16-65\\AAT",
        "qty": 6,
        "uom": "Piece",
        "unitPrice": 68.4,
        "lineAmount": 410.4,
        "qtyBilled": 6,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052663",
          "ITEM_CODE": "DCM0033314A",
          "SHIPMENT_NUM": "169090082",
          "PACKING_SLIP": "169090082",
          "QTY_BILLED": "6"
        }
      }
    ],
    "pages": 6,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:25:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-23",
    "company": "AHT",
    "vendor": "ษัท ที.เอ็น.สตีล จำกัด",
    "stax": "0145538000833",
    "inv": "42052739",
    "dt": "—",
    "total": 2423.55,
    "sub": 2265,
    "vat": 158.55,
    "po": "42052739",
    "rcv": "—",
    "org": null,
    "oname": "บริษัท อาปิโก ไฮเทค ทูลลิ่ง จำกัด สำนักงานใหญ่",
    "sig": [
      1,
      1
    ],
    "rtotal": null,
    "status": "Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: invoice_num(INVALID_FORMAT:NOT_A_LOOKUP_KEY), po_number(CONFLICT_BETWEEN_SOURCES), customer_name(LOW_CONFIDENCE), customer_address(LOW_CONFIDENCE), customer_tax_id(CONFLICT_BETWEEN_SOURCES), L1.uom(LOW_CONFIDENCE)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.625,
          "y": 0.322,
          "w": 0.025,
          "h": 0.014,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "เลข Invoice ที่อ่านได้ใช้ค้นใบรับไม่ได้ (รูปแบบไม่ปลอดภัยสำหรับ SQL)",
        "halted_by": "V-01"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ไม่มีใบรับ จึงไม่มี ORG_ID",
        "halted_by": "V-04"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ข้ามตาม gate",
        "halted_by": "V-01"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ข้ามตาม gate",
        "halted_by": "V-01"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ข้ามตาม gate",
        "halted_by": "V-01"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "เหล็กท่อกลมดำ 2\" x 3.2 มม.ชมพ",
        "qty": 3,
        "unit": "",
        "price": 755,
        "amount": 2265,
        "diff": false
      }
    ],
    "oracleReceiptLines": [],
    "pages": 2,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:15:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": true,
    "up": "2026-10-09"
  },
  {
    "doc": "DMS-24",
    "company": "AHT",
    "vendor": "บริษัท วอลเตอร์ (ประเทศไทย) จำกัด",
    "stax": "0105548003860",
    "inv": "9290186640",
    "dt": "2026-09-02",
    "total": 19144.44,
    "sub": 17892,
    "vat": 1252.44,
    "po": "42052615",
    "rcv": "50220043199",
    "org": 195,
    "oname": "Aapico Hitech Tooling Co.,Ltd",
    "sig": [
      1,
      1
    ],
    "rtotal": 17892,
    "status": "Review",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: po_number(CONFLICT_BETWEEN_SOURCES)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.45,
          "y": 0.4265,
          "w": 0.05,
          "h": 0.0097,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043199 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 17,892.00 = receipt 17,892"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "XNMU070508-F57 WKP35S",
        "qty": 30,
        "unit": "PCS",
        "price": 596.4,
        "amount": 17892,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 30,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052615",
        "receiptNum": "50220043199",
        "lineNo": 1,
        "rcvLineId": "50220043199-1",
        "itemCode": "AFS0006063A",
        "itemDesc": "FACE MILLING INSERT/XNMU070508-F57 WKP35S",
        "qty": 30,
        "uom": "Piece",
        "unitPrice": 596.4,
        "lineAmount": 17892,
        "qtyBilled": 30,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052615",
          "ITEM_CODE": "AFS0006063A",
          "SHIPMENT_NUM": "9290186640",
          "PACKING_SLIP": "9290186640",
          "QTY_BILLED": "30"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:17:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-25",
    "company": "AHT",
    "vendor": "TOP LASER PROCESSING CO., LTD.",
    "stax": "0205549020741",
    "inv": "TLP-IV-69-09-0006",
    "dt": "2026-09-08",
    "total": 156990.4,
    "sub": 146720,
    "vat": 10270.4,
    "po": "42052640",
    "rcv": "50220043233",
    "org": 195,
    "oname": "บริษัท อาปิโก ไฮเทค บุรีรัมย์ จำกัด",
    "sig": [
      0,
      1
    ],
    "rtotal": 146720,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 4 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043233 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "WARN",
        "result": "manual_review",
        "detail": "ความมั่นใจต่ำ: ['deliverer']"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 146,720.00 = receipt 146,720"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "DOP0000004A RMA ( KING ) LASER CUT PART SPK50002 (3D) (Job : TRADING - RMA - 8130331 , Operation : 10 ) ( Project : AHD AHP( DIE MAINT )2026 Task : 01 1 Spare part)",
        "qty": 492,
        "unit": "PCS",
        "price": 165,
        "amount": 81180,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 492,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "DOP0000004A RMA ( KING ) SETTING PART SPK50002 (Job : TRADING - RMA - 8130331 , Operation : 10 ) ( Project : AHD AHP( DIE MAINT )2026 Task : 01 1 Spare part)",
        "qty": 1,
        "unit": "SET",
        "price": 1200,
        "amount": 1200,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 1,
        "match_level": "M4"
      },
      {
        "no": 3,
        "desc": "DOP0000004A RMA ( KING ) LASER CUT PART SPK50003 (3D) (Job : TRADING - RMA - 8130337 , Operation : 10 ) ( Project : AHD AHP( DIE MAINT )2026 Task : 01 1 Spare part)",
        "qty": 287,
        "unit": "PCS",
        "price": 220,
        "amount": 63140,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 287,
        "match_level": "M1"
      },
      {
        "no": 4,
        "desc": "DOP0000004A RMA ( KING ) SETTING PART SPK50003 (3D) (Job : TRADING - RMA - 8130337 , Operation : 10 ) ( Project : AHD AHP( DIE MAINT )2026 Task : 01 1 Spare part)",
        "qty": 1,
        "unit": "SET",
        "price": 1200,
        "amount": 1200,
        "diff": false,
        "gr_line": 4,
        "gr_qty": 1,
        "match_level": "M4"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052640",
        "receiptNum": "50220043233",
        "lineNo": 1,
        "rcvLineId": "50220043233-1",
        "itemCode": "DOP0000004A",
        "itemDesc": "RMA (KING)\\LASER CUT PART SPK50002 (3D)",
        "qty": 492,
        "uom": "Piece",
        "unitPrice": 165,
        "lineAmount": 81180,
        "qtyBilled": 492,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052640",
          "ITEM_CODE": "DOP0000004A",
          "SHIPMENT_NUM": "TLP-IV-69-09-0006",
          "PACKING_SLIP": "TLP-IV-69-09-0006",
          "QTY_BILLED": "492"
        }
      },
      {
        "poNumber": "42052640",
        "receiptNum": "50220043233",
        "lineNo": 2,
        "rcvLineId": "50220043233-2",
        "itemCode": "DOP0000004A",
        "itemDesc": "RMA (KING)\\SETTING PART SPK50002",
        "qty": 1,
        "uom": "Set",
        "unitPrice": 1200,
        "lineAmount": 1200,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052640",
          "ITEM_CODE": "DOP0000004A",
          "SHIPMENT_NUM": "TLP-IV-69-09-0006",
          "PACKING_SLIP": "TLP-IV-69-09-0006",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42052640",
        "receiptNum": "50220043233",
        "lineNo": 3,
        "rcvLineId": "50220043233-3",
        "itemCode": "DOP0000004A",
        "itemDesc": "RMA (KING)\\LASER CUT PART SPK50003 (3D)",
        "qty": 287,
        "uom": "Piece",
        "unitPrice": 220,
        "lineAmount": 63140,
        "qtyBilled": 287,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052640",
          "ITEM_CODE": "DOP0000004A",
          "SHIPMENT_NUM": "TLP-IV-69-09-0006",
          "PACKING_SLIP": "TLP-IV-69-09-0006",
          "QTY_BILLED": "287"
        }
      },
      {
        "poNumber": "42052640",
        "receiptNum": "50220043233",
        "lineNo": 4,
        "rcvLineId": "50220043233-4",
        "itemCode": "DOP0000004A",
        "itemDesc": "RMA (KING)\\SETTING PART SPK50003",
        "qty": 1,
        "uom": "Set",
        "unitPrice": 1200,
        "lineAmount": 1200,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052640",
          "ITEM_CODE": "DOP0000004A",
          "SHIPMENT_NUM": "TLP-IV-69-09-0006",
          "PACKING_SLIP": "TLP-IV-69-09-0006",
          "QTY_BILLED": "1"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:17:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-26",
    "company": "AHT",
    "vendor": "TOOL MANAGEMENT CO.,LTD. บริษัท ทูล เมเนจเม้นท์ จำกัด",
    "stax": "0105558024428",
    "inv": "SI-TM2609-127",
    "dt": "2026-09-04",
    "total": 0,
    "sub": 0,
    "vat": 7,
    "po": "42052711",
    "rcv": "50220043229",
    "org": 195,
    "oname": "AAPICO HI-TECH TOOLING CO.,LTD.",
    "sig": [
      1,
      1
    ],
    "rtotal": 36029.5,
    "status": "Hold",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E13",
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: sub_total(INVALID_FORMAT:NOT_A_NUMBER), vat(CONFLICT_BETWEEN_SOURCES), grand_total(INVALID_FORMAT:NOT_A_NUMBER)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.606,
          "y": 0.724,
          "w": 0.349,
          "h": 0.024,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 24 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ยอดรวมหรือราคารวมต่อรายการอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043229 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "GR Quantity Exceeded",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 20 (Invoice: AF50003173A HITACHI INSERT\\JDMT12T308L\\JDMT12T308L\\PTH30E): ระบุบรรทัดในใบรับไม่ได้",
        "exception_code": "E13",
        "severity": "High",
        "page": 4,
        "bbox": {
          "x": 0.004,
          "y": 0.41,
          "w": 0.952,
          "h": 0.022,
          "page": 4
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ยอดก่อนภาษีอ่านไม่ได้",
        "halted_by": "V-01"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "AFS0000281A SCOTCH BRITE 3M",
        "qty": 20,
        "unit": "PCS",
        "price": 8.5,
        "amount": 170,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 20,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "AFS0000405A PAINT BRUSH SIZE 2",
        "qty": 3,
        "unit": "PCS",
        "price": 13,
        "amount": 39,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 3,
        "match_level": "M1"
      },
      {
        "no": 3,
        "desc": "AFS0000488A BRASS SHIMS 20 (0.5 MM.)",
        "qty": 5,
        "unit": "FOOT",
        "price": 855,
        "amount": 4275,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 5,
        "match_level": "M1"
      },
      {
        "no": 4,
        "desc": "AFS0000406A PAINT BRUSH SIZE 4",
        "qty": 2,
        "unit": "PCS",
        "price": 30,
        "amount": 60,
        "diff": false,
        "gr_line": 4,
        "gr_qty": 2,
        "match_level": "M1"
      },
      {
        "no": 5,
        "desc": "AFS0000533A MACHINE TAP M6x1.0",
        "qty": 1,
        "unit": "PCS",
        "price": 196,
        "amount": 196,
        "diff": false,
        "gr_line": 5,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 6,
        "desc": "AFS0002521A HAND REAMER 12.0 MM",
        "qty": 1,
        "unit": "PCS",
        "price": 640,
        "amount": 640,
        "diff": false,
        "gr_line": 6,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 7,
        "desc": "AFS0000414A MARKER UNI PAINT PX-21 (YELLOW)",
        "qty": 3,
        "unit": "PCS",
        "price": 33.5,
        "amount": 100.5,
        "diff": false,
        "gr_line": 7,
        "gr_qty": 3,
        "match_level": "M1"
      },
      {
        "no": 8,
        "desc": "AOS0000040A DOUBLE FOAM COATED TAPE SIZE 3/4",
        "qty": 1,
        "unit": "ROLL",
        "price": 11,
        "amount": 11,
        "diff": false,
        "gr_line": 8,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 9,
        "desc": "AFS0000233A ABRASIVE SHEET 9x11 No.320",
        "qty": 5,
        "unit": "PCS",
        "price": 9.8,
        "amount": 49,
        "diff": false,
        "gr_line": 9,
        "gr_qty": 5,
        "match_level": "M1"
      },
      {
        "no": 10,
        "desc": "AFS0000535A MACHINE TAP M8x1.25",
        "qty": 2,
        "unit": "PCS",
        "price": 376,
        "amount": 752,
        "diff": false,
        "gr_line": 10,
        "gr_qty": 2,
        "match_level": "M1"
      },
      {
        "no": 11,
        "desc": "AFS0000254A ROTARY MOUNTED POINT M0 101",
        "qty": 30,
        "unit": "PCS",
        "price": 40,
        "amount": 1200,
        "diff": false,
        "gr_line": 11,
        "gr_qty": 30,
        "match_level": "M1"
      },
      {
        "no": 12,
        "desc": "AFS0000255A ROTARY MOUNTED POINT M0 201",
        "qty": 20,
        "unit": "PCS",
        "price": 37,
        "amount": 740,
        "diff": false,
        "gr_line": 12,
        "gr_qty": 20,
        "match_level": "M1"
      },
      {
        "no": 13,
        "desc": "AFS0000259A ROTARY MOUNTED POINT M0.380",
        "qty": 100,
        "unit": "PCS",
        "price": 56,
        "amount": 5600,
        "diff": false,
        "gr_line": 13,
        "gr_qty": 100,
        "match_level": "M1"
      },
      {
        "no": 14,
        "desc": "AFS0003164A HITACHI AHJ-HOLDER(AHJL17RS",
        "qty": 1,
        "unit": "PCS",
        "price": 6255,
        "amount": 6255,
        "diff": false,
        "gr_line": 14,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 15,
        "desc": "AFS0003173A HITACHI INSERT\\JDMT12T308L\\JDMT12T308L\\PTH30E",
        "qty": 10,
        "unit": "PCS",
        "price": 235,
        "amount": 2350,
        "diff": false,
        "gr_line": 15,
        "gr_qty": 10,
        "match_level": "M1"
      },
      {
        "no": 16,
        "desc": "AFS0003174A HITACHI INSERT\\JDMT12T308R\\JDMT12T308R\\PTH30E",
        "qty": 10,
        "unit": "PCS",
        "price": 236,
        "amount": 2360,
        "diff": false,
        "gr_line": 16,
        "gr_qty": 10,
        "match_level": "M1"
      },
      {
        "no": 17,
        "desc": "AFS0002692A DRILL L-500\\D5.8 MM",
        "qty": 1,
        "unit": "PCS",
        "price": 66,
        "amount": 66,
        "diff": false,
        "gr_line": 17,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 18,
        "desc": "AFS0017752A MACHINE TAP M12X1.75",
        "qty": 1,
        "unit": "PCS",
        "price": 490,
        "amount": 490,
        "diff": false,
        "gr_line": 18,
        "gr_qty": 1,
        "match_level": "M3"
      },
      {
        "no": 19,
        "desc": "AFS0004664A ENDMILL\\GM-2BL-D16X32LX150LX16D",
        "qty": 2,
        "unit": "PCS",
        "price": 5338,
        "amount": 10676,
        "diff": false,
        "gr_line": 19,
        "gr_qty": 2,
        "match_level": "M3"
      },
      {
        "no": 20,
        "desc": "AF50003173A HITACHI INSERT\\JDMT12T308L\\JDMT12T308L\\PTH30E",
        "qty": 10,
        "unit": "PCS",
        "price": 235,
        "amount": 2350,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 21,
        "desc": "AF50003174A HITACHI INSERT\\JDMT12T308R\\JDMT12T308R\\PTH30E",
        "qty": 10,
        "unit": "PCS",
        "price": 236,
        "amount": 2360,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 22,
        "desc": "AF50002692A DRILL L-500\\D5.8 MM",
        "qty": 1,
        "unit": "PCS",
        "price": 66,
        "amount": 66,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 23,
        "desc": "AFS0017752A MACHINE TAP M12X1.75",
        "qty": 1,
        "unit": "PCS",
        "price": 490,
        "amount": 490,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 24,
        "desc": "AFS0004664A ENDMILL\\GM-2BL-D16X32LX150LX16D",
        "qty": 2,
        "unit": "PCS",
        "price": 5338,
        "amount": 10676,
        "diff": true,
        "match_level": "NONE"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052711",
        "receiptNum": "50220043229",
        "lineNo": 1,
        "rcvLineId": "50220043229-1",
        "itemCode": "AFS0000281A",
        "itemDesc": "SCOTCH BRITE \"3M\"",
        "qty": 20,
        "uom": "Piece",
        "unitPrice": 8.5,
        "lineAmount": 170,
        "qtyBilled": 20,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052711",
          "ITEM_CODE": "AFS0000281A",
          "SHIPMENT_NUM": "SI-TM2609-127",
          "PACKING_SLIP": "SI-TM2609-127",
          "QTY_BILLED": "20"
        }
      },
      {
        "poNumber": "42052711",
        "receiptNum": "50220043229",
        "lineNo": 2,
        "rcvLineId": "50220043229-2",
        "itemCode": "AFS0000405A",
        "itemDesc": "PAINT BRUSH SIZE 2\"",
        "qty": 3,
        "uom": "Piece",
        "unitPrice": 13,
        "lineAmount": 39,
        "qtyBilled": 3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052711",
          "ITEM_CODE": "AFS0000405A",
          "SHIPMENT_NUM": "SI-TM2609-127",
          "PACKING_SLIP": "SI-TM2609-127",
          "QTY_BILLED": "3"
        }
      },
      {
        "poNumber": "42052711",
        "receiptNum": "50220043229",
        "lineNo": 3,
        "rcvLineId": "50220043229-3",
        "itemCode": "AFS0000488A",
        "itemDesc": "BRASS SHIM\\BS 20 (0.5 MM.)",
        "qty": 5,
        "uom": "Foot",
        "unitPrice": 855,
        "lineAmount": 4275,
        "qtyBilled": 5,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052711",
          "ITEM_CODE": "AFS0000488A",
          "SHIPMENT_NUM": "SI-TM2609-127",
          "PACKING_SLIP": "SI-TM2609-127",
          "QTY_BILLED": "5"
        }
      },
      {
        "poNumber": "42052711",
        "receiptNum": "50220043229",
        "lineNo": 4,
        "rcvLineId": "50220043229-4",
        "itemCode": "AFS0000406A",
        "itemDesc": "PAINT BRUSH SIZE 4\"",
        "qty": 2,
        "uom": "Piece",
        "unitPrice": 30,
        "lineAmount": 60,
        "qtyBilled": 2,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052711",
          "ITEM_CODE": "AFS0000406A",
          "SHIPMENT_NUM": "SI-TM2609-127",
          "PACKING_SLIP": "SI-TM2609-127",
          "QTY_BILLED": "2"
        }
      },
      {
        "poNumber": "42052711",
        "receiptNum": "50220043229",
        "lineNo": 5,
        "rcvLineId": "50220043229-5",
        "itemCode": "AFS0000533A",
        "itemDesc": "MACHINE TAP M6x1.0",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 196,
        "lineAmount": 196,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052711",
          "ITEM_CODE": "AFS0000533A",
          "SHIPMENT_NUM": "SI-TM2609-127",
          "PACKING_SLIP": "SI-TM2609-127",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42052711",
        "receiptNum": "50220043229",
        "lineNo": 6,
        "rcvLineId": "50220043229-6",
        "itemCode": "AFS0002521A",
        "itemDesc": "HAND REAMER 12.0 MM (TAYLOR&JONES)",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 640,
        "lineAmount": 640,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052711",
          "ITEM_CODE": "AFS0002521A",
          "SHIPMENT_NUM": "SI-TM2609-127",
          "PACKING_SLIP": "SI-TM2609-127",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42052711",
        "receiptNum": "50220043229",
        "lineNo": 7,
        "rcvLineId": "50220043229-7",
        "itemCode": "AFS0000414A",
        "itemDesc": "MARKER UNI PAINT PX-21 (YELLOW)",
        "qty": 3,
        "uom": "Piece",
        "unitPrice": 33.5,
        "lineAmount": 100.5,
        "qtyBilled": 3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052711",
          "ITEM_CODE": "AFS0000414A",
          "SHIPMENT_NUM": "SI-TM2609-127",
          "PACKING_SLIP": "SI-TM2609-127",
          "QTY_BILLED": "3"
        }
      },
      {
        "poNumber": "42052711",
        "receiptNum": "50220043229",
        "lineNo": 8,
        "rcvLineId": "50220043229-8",
        "itemCode": "AOS0000040A",
        "itemDesc": "DOUBLE FOAM COATED TAPE SIZE 3/4\" THIN TYPE (3877486)",
        "qty": 1,
        "uom": "Roll",
        "unitPrice": 11,
        "lineAmount": 11,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052711",
          "ITEM_CODE": "AOS0000040A",
          "SHIPMENT_NUM": "SI-TM2609-127",
          "PACKING_SLIP": "SI-TM2609-127",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42052711",
        "receiptNum": "50220043229",
        "lineNo": 9,
        "rcvLineId": "50220043229-9",
        "itemCode": "AFS0000233A",
        "itemDesc": "ABRASIVE SHEET 9\"X11\" NO. 320 \"TIERCEL\"",
        "qty": 5,
        "uom": "Piece",
        "unitPrice": 9.8,
        "lineAmount": 49,
        "qtyBilled": 5,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052711",
          "ITEM_CODE": "AFS0000233A",
          "SHIPMENT_NUM": "SI-TM2609-127",
          "PACKING_SLIP": "SI-TM2609-127",
          "QTY_BILLED": "5"
        }
      },
      {
        "poNumber": "42052711",
        "receiptNum": "50220043229",
        "lineNo": 10,
        "rcvLineId": "50220043229-10",
        "itemCode": "AFS0000535A",
        "itemDesc": "MACHINE TAP M8x1.25, ( EX-SFT,OH2 ) NO.11601\\OSG",
        "qty": 2,
        "uom": "Piece",
        "unitPrice": 376,
        "lineAmount": 752,
        "qtyBilled": 2,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052711",
          "ITEM_CODE": "AFS0000535A",
          "SHIPMENT_NUM": "SI-TM2609-127",
          "PACKING_SLIP": "SI-TM2609-127",
          "QTY_BILLED": "2"
        }
      },
      {
        "poNumber": "42052711",
        "receiptNum": "50220043229",
        "lineNo": 11,
        "rcvLineId": "50220043229-11",
        "itemCode": "AFS0000254A",
        "itemDesc": "ROTARY MOUNTED POINT MO 101 5X13X3X30 \"FSK.\"",
        "qty": 30,
        "uom": "Piece",
        "unitPrice": 40,
        "lineAmount": 1200,
        "qtyBilled": 30,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052711",
          "ITEM_CODE": "AFS0000254A",
          "SHIPMENT_NUM": "SI-TM2609-127",
          "PACKING_SLIP": "SI-TM2609-127",
          "QTY_BILLED": "30"
        }
      },
      {
        "poNumber": "42052711",
        "receiptNum": "50220043229",
        "lineNo": 12,
        "rcvLineId": "50220043229-12",
        "itemCode": "AFS0000255A",
        "itemDesc": "ROTARY MOUNTED POINT MO 201 8X13X3X30 MM. \"FSK.\"",
        "qty": 20,
        "uom": "Piece",
        "unitPrice": 37,
        "lineAmount": 740,
        "qtyBilled": 20,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052711",
          "ITEM_CODE": "AFS0000255A",
          "SHIPMENT_NUM": "SI-TM2609-127",
          "PACKING_SLIP": "SI-TM2609-127",
          "QTY_BILLED": "20"
        }
      },
      {
        "poNumber": "42052711",
        "receiptNum": "50220043229",
        "lineNo": 13,
        "rcvLineId": "50220043229-13",
        "itemCode": "AFS0000259A",
        "itemDesc": "ROTARY MOUNTED POINT\\ MO. 380 \\ FSK",
        "qty": 100,
        "uom": "Piece",
        "unitPrice": 56,
        "lineAmount": 5600,
        "qtyBilled": 100,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052711",
          "ITEM_CODE": "AFS0000259A",
          "SHIPMENT_NUM": "SI-TM2609-127",
          "PACKING_SLIP": "SI-TM2609-127",
          "QTY_BILLED": "100"
        }
      },
      {
        "poNumber": "42052711",
        "receiptNum": "50220043229",
        "lineNo": 14,
        "rcvLineId": "50220043229-14",
        "itemCode": "AFS0003164A",
        "itemDesc": "HITACHI  AHJ-HOLDER\\AHJL17RS\\DIA. 17x175x8.5x33x16",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 6255,
        "lineAmount": 6255,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052711",
          "ITEM_CODE": "AFS0003164A",
          "SHIPMENT_NUM": "SI-TM2609-127",
          "PACKING_SLIP": "SI-TM2609-127",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42052711",
        "receiptNum": "50220043229",
        "lineNo": 15,
        "rcvLineId": "50220043229-15",
        "itemCode": "AFS0003173A",
        "itemDesc": "HITACHI  INSERT\\JDMT12T308L\\JDMT12T308L\\PTH30E",
        "qty": 10,
        "uom": "Piece",
        "unitPrice": 235,
        "lineAmount": 2350,
        "qtyBilled": 10,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052711",
          "ITEM_CODE": "AFS0003173A",
          "SHIPMENT_NUM": "SI-TM2609-127",
          "PACKING_SLIP": "SI-TM2609-127",
          "QTY_BILLED": "10"
        }
      },
      {
        "poNumber": "42052711",
        "receiptNum": "50220043229",
        "lineNo": 16,
        "rcvLineId": "50220043229-16",
        "itemCode": "AFS0003174A",
        "itemDesc": "HITACHI  INSERT\\JDMT12T308R\\JDMT12T308R\\PTH30E",
        "qty": 10,
        "uom": "Piece",
        "unitPrice": 236,
        "lineAmount": 2360,
        "qtyBilled": 10,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052711",
          "ITEM_CODE": "AFS0003174A",
          "SHIPMENT_NUM": "SI-TM2609-127",
          "PACKING_SLIP": "SI-TM2609-127",
          "QTY_BILLED": "10"
        }
      },
      {
        "poNumber": "42052711",
        "receiptNum": "50220043229",
        "lineNo": 17,
        "rcvLineId": "50220043229-17",
        "itemCode": "AFS0002692A",
        "itemDesc": "DRILL L-500\\D5.8 MM.\\NACHI",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 66,
        "lineAmount": 66,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052711",
          "ITEM_CODE": "AFS0002692A",
          "SHIPMENT_NUM": "SI-TM2609-127",
          "PACKING_SLIP": "SI-TM2609-127",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42052711",
        "receiptNum": "50220043229",
        "lineNo": 18,
        "rcvLineId": "50220043229-18",
        "itemCode": "AFS0017752A",
        "itemDesc": "MACHINE TAP M12X1.75 (YH2,T2809502-C)\\YG",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 490,
        "lineAmount": 490,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052711",
          "ITEM_CODE": "AFS0017752A",
          "SHIPMENT_NUM": "SI-TM2609-127",
          "PACKING_SLIP": "SI-TM2609-127",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42052711",
        "receiptNum": "50220043229",
        "lineNo": 19,
        "rcvLineId": "50220043229-19",
        "itemCode": "AFS0004664A",
        "itemDesc": "ENDMILL\\GM-2BL-D16X32LX150LX16D",
        "qty": 2,
        "uom": "Piece",
        "unitPrice": 5338,
        "lineAmount": 10676,
        "qtyBilled": 2,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052711",
          "ITEM_CODE": "AFS0004664A",
          "SHIPMENT_NUM": "SI-TM2609-127",
          "PACKING_SLIP": "SI-TM2609-127",
          "QTY_BILLED": "2"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:26:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Hold · ความรุนแรงสูงสุด High",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-27",
    "company": "AHT",
    "vendor": "บริษัท มิซูมิ (ไทยแลนด์) จำกัด MISUMI (THAILAND) CO., LTD.",
    "stax": "0105540008888",
    "inv": "LN6056314700H2",
    "dt": "—",
    "total": 5319.37,
    "sub": 4971.37,
    "vat": 348,
    "po": "42052664",
    "rcv": "50220043208",
    "org": 195,
    "oname": "AAPICO HITECH TOOLING CO., LTD. (HEAD OFFICE)",
    "sig": [
      1,
      1
    ],
    "rtotal": 4971.37,
    "status": "Hold",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E13",
      "E14",
      "E01",
      "E11",
      "E12"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: L11.qty(NOT_PRESENT), L11.unit_price(NOT_PRESENT), L11.amount(NOT_PRESENT), L12.qty(NOT_PRESENT), L12.uom(NOT_PRESENT), L12.unit_price(NOT_PRESENT), L12.amount(NOT_PRESENT), L13.qty(NOT_PRESENT), L13.unit_price(NOT_PRESENT), L13.amount(NOT_PRESENT), L14.qty(NOT_PRESENT), L14.uom(NOT_PRESENT), L14.unit_price(NOT_PRESENT), L14.amount(NOT_PRESENT)",
        "exception_code": "E01",
        "severity": "Medium"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 10 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ยอดรวมหรือราคารวมต่อรายการอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043208 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "Duplicate Item",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 2 (Invoice: MWF38-100 OIL FREE SLIDE PLATES): จับคู่ด้วยคำบรรยาย (ITEM MWF38-100, 1 PCS, ราคา 75.90, RCV 1 ล็อต)",
        "exception_code": "E11",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.133,
          "y": 0.505,
          "w": 0.845,
          "h": 0.065,
          "page": 1
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "Tax Calculation Mismatch",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 2 (Invoice: MWF38-100 OIL FREE SLIDE PLATES): จำนวนวางบิลเกินใบรับ (Inv: 1, Rcv: 1)",
        "exception_code": "E14",
        "severity": "High",
        "actual": "1",
        "expected": "1",
        "page": 1,
        "bbox": {
          "x": 0.133,
          "y": 0.505,
          "w": 0.845,
          "h": 0.065,
          "page": 1
        }
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 4,971.37 = receipt 4,971.37"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "SLPSH8-P7.8-B5-T5 LOCATING PILOT PIN",
        "qty": 1,
        "unit": "PCS",
        "price": 482.66,
        "amount": 482.66,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "MWF38-100 OIL FREE SLIDE PLATES",
        "qty": 1,
        "unit": "PCS",
        "price": 75.9,
        "amount": 75.9,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M4"
      },
      {
        "no": 3,
        "desc": "H-APJAL10-LC85-P8.0 PUNCH",
        "qty": 1,
        "unit": "PCS",
        "price": 1585.95,
        "amount": 1585.95,
        "diff": true,
        "gr_line": 5,
        "gr_qty": 1,
        "match_level": "M4"
      },
      {
        "no": 4,
        "desc": "SLPSH8-P7.8-B5-T5 LOCATING PILOT PIN",
        "qty": 1,
        "unit": "PCS",
        "price": 482.65,
        "amount": 482.65,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 5,
        "desc": "MWF38-100 OIL FREE SLIDE PLATES",
        "qty": 1,
        "unit": "PCS",
        "price": 75.9,
        "amount": 75.9,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M4"
      },
      {
        "no": 6,
        "desc": "H-APJAL10-LC85-P8.0 PUNCH",
        "qty": 1,
        "unit": "PCS",
        "price": 1585.95,
        "amount": 1585.95,
        "diff": true,
        "gr_line": 5,
        "gr_qty": 1,
        "match_level": "M4"
      },
      {
        "no": 7,
        "desc": "H-APJAL10-80-P8.30 PUNCH",
        "qty": 1,
        "unit": "PCS",
        "price": 1560,
        "amount": 1560,
        "diff": true,
        "gr_line": 3,
        "gr_qty": 1,
        "match_level": "M5"
      },
      {
        "no": 8,
        "desc": "H-APJAL10-80-P6.5 PUNCH",
        "qty": 1,
        "unit": "PCS",
        "price": 1266,
        "amount": 1266,
        "diff": false,
        "gr_line": 4,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 9,
        "desc": "42052664 3 H-APJAL10-80-P8.30 FUNCH",
        "qty": 1,
        "unit": "PCS",
        "price": 1560,
        "amount": 1560,
        "diff": true,
        "gr_line": 3,
        "gr_qty": 1,
        "match_level": "M5"
      },
      {
        "no": 10,
        "desc": "42052664 4 H-APJAL10-80-P6.5 FUNCH",
        "qty": 1,
        "unit": "PCS",
        "price": 1260,
        "amount": 1260,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 11,
        "desc": "4 42052664 3 H-APJAL10-80-P8.30 PUNCH 27 Aug 2026 1 PCS FB116G943G 1,560.66 1,560.66 015885 9610",
        "qty": 0,
        "unit": "PCS",
        "price": 0,
        "amount": 0,
        "diff": true,
        "gr_line": 3,
        "gr_qty": 1,
        "match_level": "M5"
      },
      {
        "no": 12,
        "desc": "5 42052664 4 H-APJAL10-80-P6.5 PUNCH 27 Aug 2026 1 PCS FB116G943G 1,266.00 1,266.00 015886 9610",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 13,
        "desc": "4 42052664 3 H-APJAL10-80-P8.30 PUNCH 27 Aug 2026 1 PCS FB116G943G 1,560.86 1,560.86 015885 9610",
        "qty": 0,
        "unit": "PCS",
        "price": 0,
        "amount": 0,
        "diff": true,
        "gr_line": 3,
        "gr_qty": 1,
        "match_level": "M5"
      },
      {
        "no": 14,
        "desc": "5 42052664 4 H-APJAL10-80-P6.5 PUNCH 27 Aug 2026 1 PCS FB116G943G 1,266.00 1,266.00 015886 9610",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052664",
        "receiptNum": "50220043208",
        "lineNo": 1,
        "rcvLineId": "50220043208-1",
        "itemCode": "DCM0002244A",
        "itemDesc": "WEAR PLATE\\MWF 38-100\\MISUMI",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 75.9,
        "lineAmount": 75.9,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052664",
          "ITEM_CODE": "DCM0002244A",
          "SHIPMENT_NUM": "LN6056314700H2",
          "PACKING_SLIP": "LN6056314700H2",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42052664",
        "receiptNum": "50220043208",
        "lineNo": 2,
        "rcvLineId": "50220043208-2",
        "itemCode": "DCM0020502A",
        "itemDesc": "LOCATING PILOT PIN\\SLPSH 8-P7.80-B5-T5\\MISUMI",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 482.66,
        "lineAmount": 482.66,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052664",
          "ITEM_CODE": "DCM0020502A",
          "SHIPMENT_NUM": "LN6056314700H2",
          "PACKING_SLIP": "LN6056314700H2",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42052664",
        "receiptNum": "50220043208",
        "lineNo": 3,
        "rcvLineId": "50220043208-3",
        "itemCode": "DCM0022754A",
        "itemDesc": "JECTOOR PUNCHES\\H-APJAL 10-80-P8.30\\MISMI",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 1560.86,
        "lineAmount": 1560.86,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052664",
          "ITEM_CODE": "DCM0022754A",
          "SHIPMENT_NUM": "LN6056314700H2",
          "PACKING_SLIP": "LN6056314700H2",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42052664",
        "receiptNum": "50220043208",
        "lineNo": 4,
        "rcvLineId": "50220043208-4",
        "itemCode": "DCM0022756A",
        "itemDesc": "JECTOOR PUNCHES\\H-APJAL 10-80-P6.50\\MISUMI",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 1266,
        "lineAmount": 1266,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052664",
          "ITEM_CODE": "DCM0022756A",
          "SHIPMENT_NUM": "LN6056314700H2",
          "PACKING_SLIP": "LN6056314700H2",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42052664",
        "receiptNum": "50220043208",
        "lineNo": 5,
        "rcvLineId": "50220043208-5",
        "itemCode": "DCM0033313A",
        "itemDesc": "JECTOR PUNCH\\H-APJAL 10-LC85-P8.0\\MISUMI",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 1585.95,
        "lineAmount": 1585.95,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052664",
          "ITEM_CODE": "DCM0033313A",
          "SHIPMENT_NUM": "LN6056314700H2",
          "PACKING_SLIP": "LN6056314700H2",
          "QTY_BILLED": "1"
        }
      }
    ],
    "pages": 11,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:38:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Hold · ความรุนแรงสูงสุด High",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-28",
    "company": "AH",
    "vendor": "TT AUTOMOTIVE STEEL (THAILAND) CO.,LTD.",
    "stax": "0105548107746",
    "inv": "SSA1-260901-059",
    "dt": "—",
    "total": 53555,
    "sub": 50051.4,
    "vat": 3503.6,
    "po": "40121491",
    "rcv": "510521297",
    "org": 101,
    "oname": "AAPICO HITECH PUBLIC CO., LTD.",
    "sig": [
      1,
      1
    ],
    "rtotal": 50051.4,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 510521297 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 50,051.40 = receipt 50,051.4"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "SPC590 1.200 X 416.0 X C 1-580444",
        "qty": 701,
        "unit": "KG",
        "price": 35.7,
        "amount": 25025.7,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1402,
        "match_level": "M3"
      },
      {
        "no": 2,
        "desc": "SPC590 1.200 X 416.0 X C 1-580445",
        "qty": 701,
        "unit": "KG",
        "price": 35.7,
        "amount": 25025.7,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1402,
        "match_level": "M3"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "40121491",
        "receiptNum": "510521297",
        "lineNo": 1,
        "rcvLineId": "510521297-1",
        "itemCode": "PRM0002103B",
        "itemDesc": "SPC590 1.2 x 416 x COIL (TBAS 737D)",
        "qty": 1402,
        "uom": "Kilogram",
        "unitPrice": 35.7,
        "lineAmount": 50051.4,
        "qtyBilled": 1402,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AH PC 04, K.Nittayaporn",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40121491",
          "ITEM_CODE": "PRM0002103B",
          "SHIPMENT_NUM": "SSA1-260901-059",
          "PACKING_SLIP": "SSA1-260901-059",
          "QTY_BILLED": "1402"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:23:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AH PC 04, K.Nittayaporn"
  },
  {
    "doc": "DMS-29",
    "company": "AHT",
    "vendor": "บริษัท มิซูมิ (ไทยแลนด์) จำกัด MISUMI (THAILAND) CO., LTD.",
    "stax": "0105540008838",
    "inv": "LN6056314700H2",
    "dt": "—",
    "total": 5319.37,
    "sub": 4971.37,
    "vat": 348,
    "po": "42052664",
    "rcv": "50220043208",
    "org": 195,
    "oname": "AAPICO HITECH TOOLING CO., LTD. (HEAD OFFICE)",
    "sig": [
      1,
      1
    ],
    "rtotal": 4971.37,
    "status": "Hold",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E13",
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: L6.qty(NOT_PRESENT), L6.uom(NOT_PRESENT), L6.unit_price(NOT_PRESENT), L6.amount(NOT_PRESENT), L7.qty(NOT_PRESENT), L7.uom(NOT_PRESENT), L7.unit_price(NOT_PRESENT), L7.amount(NOT_PRESENT), L8.qty(NOT_PRESENT), L8.uom(NOT_PRESENT), L8.unit_price(NOT_PRESENT), L8.amount(NOT_PRESENT), L9.qty(NOT_PRESENT), L9.uom(NOT_PRESENT), L9.unit_price(NOT_PRESENT), L9.amount(NOT_PRESENT)",
        "exception_code": "E01",
        "severity": "Medium"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 5 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ยอดรวมหรือราคารวมต่อรายการอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043208 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "GR Quantity Exceeded",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 6 (Invoice: 4 42052664 3 H-APJAL10-80-P8.30 PUNCH 27 Aug 2026 1 PCS FB116G943G 1,560.86 1,560.86 015885 9610): ระบุบรรทัดในใบรับไม่ได้",
        "exception_code": "E13",
        "severity": "High",
        "page": 9,
        "bbox": {
          "x": 0.1452,
          "y": 0.248,
          "w": 0.8548,
          "h": 0.0342,
          "page": 9
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 4,971.37 = receipt 4,971.37"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "SLPSH8-P7.8-B5-T5 LOCATING PILOT PIN",
        "qty": 1,
        "unit": "PCS",
        "price": 482.66,
        "amount": 482.66,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "MWF38-100 OIL FREE SLIDE PLATES",
        "qty": 1,
        "unit": "PCS",
        "price": 75.9,
        "amount": 75.9,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 3,
        "desc": "H-APJAL10-LC85-P8.0 PUNCH",
        "qty": 1,
        "unit": "PCS",
        "price": 1585.95,
        "amount": 1585.95,
        "diff": false,
        "gr_line": 5,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 4,
        "desc": "42052664 3 H-APJAL10-80-P8.30 PUNCH",
        "qty": 1,
        "unit": "PCS",
        "price": 1560.86,
        "amount": 1560.86,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 5,
        "desc": "42052664 4 H-APJAL10-80-P6.5 PUNCH",
        "qty": 1,
        "unit": "PCS",
        "price": 1266,
        "amount": 1266,
        "diff": false,
        "gr_line": 4,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 6,
        "desc": "4 42052664 3 H-APJAL10-80-P8.30 PUNCH 27 Aug 2026 1 PCS FB116G943G 1,560.86 1,560.86 015885 9610",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 7,
        "desc": "5 42052664 4 H-APJAL10-80-P6.5 PUNCH 27 Aug 2026 1 PCS FB116G943G 1,266.00 1,266.00 015886 9610",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 8,
        "desc": "4 42052664 3 H-APJAL10-80-P8.30 PUNCH 27 Aug 2026 1 PCS FB118G943G 1,560.86 1,560.86 015885 9610",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 9,
        "desc": "5 42052664 4 H-APJAL10-80-P6.5 PUNCH 27 Aug 2026 1 PCS FB118G943G 1,266.00 1,266.00 015886 9610",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052664",
        "receiptNum": "50220043208",
        "lineNo": 1,
        "rcvLineId": "50220043208-1",
        "itemCode": "DCM0002244A",
        "itemDesc": "WEAR PLATE\\MWF 38-100\\MISUMI",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 75.9,
        "lineAmount": 75.9,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052664",
          "ITEM_CODE": "DCM0002244A",
          "SHIPMENT_NUM": "LN6056314700H2",
          "PACKING_SLIP": "LN6056314700H2",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42052664",
        "receiptNum": "50220043208",
        "lineNo": 2,
        "rcvLineId": "50220043208-2",
        "itemCode": "DCM0020502A",
        "itemDesc": "LOCATING PILOT PIN\\SLPSH 8-P7.80-B5-T5\\MISUMI",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 482.66,
        "lineAmount": 482.66,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052664",
          "ITEM_CODE": "DCM0020502A",
          "SHIPMENT_NUM": "LN6056314700H2",
          "PACKING_SLIP": "LN6056314700H2",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42052664",
        "receiptNum": "50220043208",
        "lineNo": 3,
        "rcvLineId": "50220043208-3",
        "itemCode": "DCM0022754A",
        "itemDesc": "JECTOOR PUNCHES\\H-APJAL 10-80-P8.30\\MISMI",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 1560.86,
        "lineAmount": 1560.86,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052664",
          "ITEM_CODE": "DCM0022754A",
          "SHIPMENT_NUM": "LN6056314700H2",
          "PACKING_SLIP": "LN6056314700H2",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42052664",
        "receiptNum": "50220043208",
        "lineNo": 4,
        "rcvLineId": "50220043208-4",
        "itemCode": "DCM0022756A",
        "itemDesc": "JECTOOR PUNCHES\\H-APJAL 10-80-P6.50\\MISUMI",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 1266,
        "lineAmount": 1266,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052664",
          "ITEM_CODE": "DCM0022756A",
          "SHIPMENT_NUM": "LN6056314700H2",
          "PACKING_SLIP": "LN6056314700H2",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42052664",
        "receiptNum": "50220043208",
        "lineNo": 5,
        "rcvLineId": "50220043208-5",
        "itemCode": "DCM0033313A",
        "itemDesc": "JECTOR PUNCH\\H-APJAL 10-LC85-P8.0\\MISUMI",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 1585.95,
        "lineAmount": 1585.95,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052664",
          "ITEM_CODE": "DCM0033313A",
          "SHIPMENT_NUM": "LN6056314700H2",
          "PACKING_SLIP": "LN6056314700H2",
          "QTY_BILLED": "1"
        }
      }
    ],
    "pages": 11,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:29:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Hold · ความรุนแรงสูงสุด High",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-30",
    "company": "AH",
    "vendor": "SIRISUK ENGINEERING & SUPPLY CO., LTD.",
    "stax": "0105556094925",
    "inv": "SES08470",
    "dt": "2026-09-05",
    "total": 8228.3,
    "sub": 7690,
    "vat": 538.3,
    "po": "40121803",
    "rcv": "510521578",
    "org": 101,
    "oname": "AAPICO HITECH PUBLIC COMPANY LIMITED",
    "sig": [
      1,
      1
    ],
    "rtotal": 7690,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 11 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 510521578 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 7,690.00 = receipt 7,690"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "KCF GUIDE PIN IBM-8K 8.8",
        "qty": 2,
        "unit": "PCS",
        "price": 340,
        "amount": 680,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 2,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "LOWER ELECTRODE DIA : 25 X 17 MM. (NUT M6) (7.0) STD.",
        "qty": 2,
        "unit": "PCS",
        "price": 130,
        "amount": 260,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 2,
        "match_level": "M1"
      },
      {
        "no": 3,
        "desc": "TIP DIP D16 S 16 P",
        "qty": 10,
        "unit": "PCS",
        "price": 115,
        "amount": 1150,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 10,
        "match_level": "M1"
      },
      {
        "no": 4,
        "desc": "GUIDE PIN PN-A-M6 (7.0) : TMT MODEL 380A_PART NO.57607-0D040-00 (PROCESS SPOT NUT M6)",
        "qty": 2,
        "unit": "PCS",
        "price": 325,
        "amount": 650,
        "diff": false,
        "gr_line": 4,
        "gr_qty": 2,
        "match_level": "M1"
      },
      {
        "no": 5,
        "desc": "GUIDE PIN PN-A-M8 (9.0) : TMT MODEL 380A_PART NO.57607-0D040-00 (PROCESS SPOT NUT M8)",
        "qty": 7,
        "unit": "PCS",
        "price": 300,
        "amount": 2100,
        "diff": false,
        "gr_line": 5,
        "gr_qty": 7,
        "match_level": "M1"
      },
      {
        "no": 6,
        "desc": "LOWER ERLECTRODE NUT M8 DAI. 25X17 MM (9.0)",
        "qty": 5,
        "unit": "PCS",
        "price": 130,
        "amount": 650,
        "diff": false,
        "gr_line": 6,
        "gr_qty": 5,
        "match_level": "M1"
      },
      {
        "no": 7,
        "desc": "UPPER ELECTRODE BOLT DIA : 25 X 65 MM. D20L33 MAT. CRM16 R (LINE ISUZU MODEL U725)",
        "qty": 2,
        "unit": "PCS",
        "price": 490,
        "amount": 980,
        "diff": false,
        "gr_line": 7,
        "gr_qty": 2,
        "match_level": "M1"
      },
      {
        "no": 8,
        "desc": "KCF GUIDE PIN W-PN-6P (6.5)",
        "qty": 2,
        "unit": "PCS",
        "price": 250,
        "amount": 500,
        "diff": false,
        "gr_line": 8,
        "gr_qty": 2,
        "match_level": "M1"
      },
      {
        "no": 9,
        "desc": "LOWER ELECTRODE DIA : 25 X 17 MM. PIN 6.5P MAT EK-2",
        "qty": 2,
        "unit": "PCS",
        "price": 120,
        "amount": 240,
        "diff": false,
        "gr_line": 9,
        "gr_qty": 2,
        "match_level": "M4"
      },
      {
        "no": 10,
        "desc": "LOWER ELECTRODE DIA : 25 X 17 MM PIN 8.8",
        "qty": 2,
        "unit": "PCS",
        "price": 120,
        "amount": 240,
        "diff": false,
        "gr_line": 10,
        "gr_qty": 2,
        "match_level": "M4"
      },
      {
        "no": 11,
        "desc": "UPPER ELECTRODE DIA : 20 X 25 MM. HOLD 7",
        "qty": 2,
        "unit": "PCS",
        "price": 120,
        "amount": 240,
        "diff": false,
        "gr_line": 11,
        "gr_qty": 2,
        "match_level": "M4"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "40121803",
        "receiptNum": "510521578",
        "lineNo": 1,
        "rcvLineId": "510521578-1",
        "itemCode": "AFS0002261A",
        "itemDesc": "KCF GUIDE PIN IBM-8K 8.8",
        "qty": 2,
        "uom": "Piece",
        "unitPrice": 340,
        "lineAmount": 680,
        "qtyBilled": 2,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AH PC 04, K.Nittayaporn",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40121803",
          "ITEM_CODE": "AFS0002261A",
          "SHIPMENT_NUM": "SES 08470",
          "PACKING_SLIP": "SES 08470",
          "QTY_BILLED": "2"
        }
      },
      {
        "poNumber": "40121803",
        "receiptNum": "510521578",
        "lineNo": 2,
        "rcvLineId": "510521578-2",
        "itemCode": "AFS0002841A",
        "itemDesc": "LOWER ELECTRODE DIA: 25 X 17 MM. (NUT M6 (7.0)STD.",
        "qty": 2,
        "uom": "Piece",
        "unitPrice": 130,
        "lineAmount": 260,
        "qtyBilled": 2,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AH PC 04, K.Nittayaporn",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40121803",
          "ITEM_CODE": "AFS0002841A",
          "SHIPMENT_NUM": "SES 08470",
          "PACKING_SLIP": "SES 08470",
          "QTY_BILLED": "2"
        }
      },
      {
        "poNumber": "40121803",
        "receiptNum": "510521578",
        "lineNo": 3,
        "rcvLineId": "510521578-3",
        "itemCode": "AFS0004347A",
        "itemDesc": "TIP DIP D16 S 16 P",
        "qty": 10,
        "uom": "Piece",
        "unitPrice": 115,
        "lineAmount": 1150,
        "qtyBilled": 10,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AH PC 04, K.Nittayaporn",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40121803",
          "ITEM_CODE": "AFS0004347A",
          "SHIPMENT_NUM": "SES 08470",
          "PACKING_SLIP": "SES 08470",
          "QTY_BILLED": "10"
        }
      },
      {
        "poNumber": "40121803",
        "receiptNum": "510521578",
        "lineNo": 4,
        "rcvLineId": "510521578-4",
        "itemCode": "AFS0005034A",
        "itemDesc": "GUIDE PIN PN-A-M6 (7.0) : TMT MODEL 380A_PART NO.57607-0D040-00 (PROCESS SPOT  NUT M6)",
        "qty": 2,
        "uom": "Piece",
        "unitPrice": 325,
        "lineAmount": 650,
        "qtyBilled": 2,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AH PC 04, K.Nittayaporn",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40121803",
          "ITEM_CODE": "AFS0005034A",
          "SHIPMENT_NUM": "SES 08470",
          "PACKING_SLIP": "SES 08470",
          "QTY_BILLED": "2"
        }
      },
      {
        "poNumber": "40121803",
        "receiptNum": "510521578",
        "lineNo": 5,
        "rcvLineId": "510521578-5",
        "itemCode": "AFS0005035A",
        "itemDesc": "GUIDE PIN PN-A-M8 (9.0) : TMT MODEL 380A_PART NO.57607-0D040-00 (PROCESS SPOT  NUT M8)",
        "qty": 7,
        "uom": "Piece",
        "unitPrice": 300,
        "lineAmount": 2100,
        "qtyBilled": 7,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AH PC 04, K.Nittayaporn",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40121803",
          "ITEM_CODE": "AFS0005035A",
          "SHIPMENT_NUM": "SES 08470",
          "PACKING_SLIP": "SES 08470",
          "QTY_BILLED": "7"
        }
      },
      {
        "poNumber": "40121803",
        "receiptNum": "510521578",
        "lineNo": 6,
        "rcvLineId": "510521578-6",
        "itemCode": "AFS0005036A",
        "itemDesc": "LOWER ELECTRODE NUT M8 DAI. 25X17 MM (9.0)",
        "qty": 5,
        "uom": "Piece",
        "unitPrice": 130,
        "lineAmount": 650,
        "qtyBilled": 5,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AH PC 04, K.Nittayaporn",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40121803",
          "ITEM_CODE": "AFS0005036A",
          "SHIPMENT_NUM": "SES 08470",
          "PACKING_SLIP": "SES 08470",
          "QTY_BILLED": "5"
        }
      },
      {
        "poNumber": "40121803",
        "receiptNum": "510521578",
        "lineNo": 7,
        "rcvLineId": "510521578-7",
        "itemCode": "AFS0009862A",
        "itemDesc": "UPPER ELECTRODE BOLT DIA :25 X 65 MM.D20L33 MAT. CRM16 R ( LINE ISUZU MODEL U725 )",
        "qty": 2,
        "uom": "Piece",
        "unitPrice": 490,
        "lineAmount": 980,
        "qtyBilled": 2,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AH PC 04, K.Nittayaporn",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40121803",
          "ITEM_CODE": "AFS0009862A",
          "SHIPMENT_NUM": "SES 08470",
          "PACKING_SLIP": "SES 08470",
          "QTY_BILLED": "2"
        }
      },
      {
        "poNumber": "40121803",
        "receiptNum": "510521578",
        "lineNo": 8,
        "rcvLineId": "510521578-8",
        "itemCode": "AFS0012663A",
        "itemDesc": "KCF GUIDE PIN W - PN - 6P (6.5 )",
        "qty": 2,
        "uom": "Piece",
        "unitPrice": 250,
        "lineAmount": 500,
        "qtyBilled": 2,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AH PC 04, K.Nittayaporn",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40121803",
          "ITEM_CODE": "AFS0012663A",
          "SHIPMENT_NUM": "SES 08470",
          "PACKING_SLIP": "SES 08470",
          "QTY_BILLED": "2"
        }
      },
      {
        "poNumber": "40121803",
        "receiptNum": "510521578",
        "lineNo": 9,
        "rcvLineId": "510521578-9",
        "itemCode": "AFS0012664A",
        "itemDesc": "LOWER ELECTRODE DIA :25 X 17 MM. PIN 6.5P MAT EK - 2",
        "qty": 2,
        "uom": "Piece",
        "unitPrice": 120,
        "lineAmount": 240,
        "qtyBilled": 2,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AH PC 04, K.Nittayaporn",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40121803",
          "ITEM_CODE": "AFS0012664A",
          "SHIPMENT_NUM": "SES 08470",
          "PACKING_SLIP": "SES 08470",
          "QTY_BILLED": "2"
        }
      },
      {
        "poNumber": "40121803",
        "receiptNum": "510521578",
        "lineNo": 10,
        "rcvLineId": "510521578-10",
        "itemCode": "AFS0012764A",
        "itemDesc": "LOWER ELECTRODE DIA : 25 X 17 MM  PIN 8.8",
        "qty": 2,
        "uom": "Piece",
        "unitPrice": 120,
        "lineAmount": 240,
        "qtyBilled": 2,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AH PC 04, K.Nittayaporn",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40121803",
          "ITEM_CODE": "AFS0012764A",
          "SHIPMENT_NUM": "SES 08470",
          "PACKING_SLIP": "SES 08470",
          "QTY_BILLED": "2"
        }
      },
      {
        "poNumber": "40121803",
        "receiptNum": "510521578",
        "lineNo": 11,
        "rcvLineId": "510521578-11",
        "itemCode": "AFS0012763A",
        "itemDesc": "UPPER ELECTRODE DIA : 20X 25 MM. HOLD 7",
        "qty": 2,
        "uom": "Piece",
        "unitPrice": 120,
        "lineAmount": 240,
        "qtyBilled": 2,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AH PC 04, K.Nittayaporn",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40121803",
          "ITEM_CODE": "AFS0012763A",
          "SHIPMENT_NUM": "SES 08470",
          "PACKING_SLIP": "SES 08470",
          "QTY_BILLED": "2"
        }
      }
    ],
    "pages": 4,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:23:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AH PC 04, K.Nittayaporn"
  },
  {
    "doc": "DMS-31",
    "company": "AH",
    "vendor": "บริษัท ทรี่ พีซ (ไทยแลนด์) จำกัด THREE PIECE (THAILAND) CO.,LTD.",
    "stax": "0115554004198",
    "inv": "IV2609009",
    "dt": "2026-09-01",
    "total": 27161.74,
    "sub": 25384.8,
    "vat": 1776.94,
    "po": "40121193",
    "rcv": "510521162",
    "org": 101,
    "oname": "บริษัท อาปิโก ไฮเทค จำกัด (มหาชน)",
    "sig": [
      1,
      1
    ],
    "rtotal": 25384.800000000003,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 510521162 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 25,384.80 = receipt 25,384.8"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "8983865561 REINF;ASM PUBX SILL#1,RH",
        "qty": 840,
        "unit": "PCS",
        "price": 15.08,
        "amount": 12667.2,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 840,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "8983864681 REINF;ASM PUBX SILL#1,LH",
        "qty": 840,
        "unit": "PCS",
        "price": 15.14,
        "amount": 12717.6,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 840,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "40121193",
        "receiptNum": "510521162",
        "lineNo": 1,
        "rcvLineId": "510521162-1",
        "itemCode": "PPR0002107BSF",
        "itemDesc": "8983864681 REINF ASM;PUBX SILL#1,LH (PRESS;SF-B)",
        "qty": 840,
        "uom": "Piece",
        "unitPrice": 15.14,
        "lineAmount": 12717.6,
        "qtyBilled": 840,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40121193",
          "ITEM_CODE": "PPR0002107BSF",
          "SHIPMENT_NUM": "IV2609009",
          "PACKING_SLIP": "IV2609009",
          "QTY_BILLED": "840"
        }
      },
      {
        "poNumber": "40121193",
        "receiptNum": "510521162",
        "lineNo": 2,
        "rcvLineId": "510521162-2",
        "itemCode": "PPR0002108BSF",
        "itemDesc": "8983865561 REINF ASM;PUBX SILL#1,RH (PRESS;SF-B)",
        "qty": 840,
        "uom": "Piece",
        "unitPrice": 15.08,
        "lineAmount": 12667.2,
        "qtyBilled": 840,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40121193",
          "ITEM_CODE": "PPR0002108BSF",
          "SHIPMENT_NUM": "IV2609009",
          "PACKING_SLIP": "IV2609009",
          "QTY_BILLED": "840"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:22:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-32",
    "company": "AH",
    "vendor": "MC METAL SERVICE ASIA (THAILAND) CO., LTD.",
    "stax": "0105540070207",
    "inv": "312609070126",
    "dt": "—",
    "total": 41809.77,
    "sub": 39074.55,
    "vat": 2735.22,
    "po": "40120618",
    "rcv": "510521576",
    "org": 101,
    "oname": "AAAPICO HI-TECH PUBLIC COMPANY LIMITED",
    "sig": [
      0,
      1
    ],
    "rtotal": 39074.55,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 510521576 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "WARN",
        "result": "manual_review",
        "detail": "ความมั่นใจต่ำ: ['deliverer']"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 39,074.55 = receipt 39,074.55"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "SP781-590BE 1,000x413.0x0 S2044454010P BRKT ASSY-FR BMPR, R+LH",
        "qty": 993,
        "unit": "KG",
        "price": 39.35,
        "amount": 39074.55,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 993,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "40120618",
        "receiptNum": "510521576",
        "lineNo": 1,
        "rcvLineId": "510521576-1",
        "itemCode": "PRM0001936B",
        "itemDesc": "SP781-590BE 1.0 X 413 X COIL (TOPRE 5F00)",
        "qty": 993,
        "uom": "Kilogram",
        "unitPrice": 39.35,
        "lineAmount": 39074.55,
        "qtyBilled": 3223,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AH PC 04, K.Nittayaporn",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40120618",
          "ITEM_CODE": "PRM0001936B",
          "SHIPMENT_NUM": "312609070126",
          "PACKING_SLIP": "312609070126",
          "QTY_BILLED": "3223"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:25:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AH PC 04, K.Nittayaporn"
  },
  {
    "doc": "DMS-33",
    "company": "AH",
    "vendor": "TT AUTOMOTIVE STEEL (THAILAND) CO.,LTD.",
    "stax": "0105548107746",
    "inv": "SSA1-260901-056",
    "dt": "—",
    "total": 141927.05,
    "sub": 132642.1,
    "vat": 9284.95,
    "po": "40118928",
    "rcv": "510521124",
    "org": 101,
    "oname": "AAPICO HITECH PUBLIC CO., LTD.",
    "sig": [
      1,
      1
    ],
    "rtotal": 132642.1,
    "status": "Review",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: po_number(CONFLICT_BETWEEN_SOURCES)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.502,
          "y": 0.187,
          "w": 0.19,
          "h": 0.009,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 10 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 510521124 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 132,642.10 = receipt 132,642.1"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "SPH440-OD 2.000 X 103.0 X C 1-462439",
        "qty": 465,
        "unit": "KG",
        "price": 32.5,
        "amount": 15112.5,
        "diff": false,
        "gr_line": 4,
        "gr_qty": 465,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "SCGA270D 45 2.000 X 162.0 X C 1-543620",
        "qty": 642,
        "unit": "KG",
        "price": 35.8,
        "amount": 22983.6,
        "diff": false,
        "gr_line": 6,
        "gr_qty": 642,
        "match_level": "M1"
      },
      {
        "no": 3,
        "desc": "SPH440-OD 2.000 X 235.0 X C 1-548872",
        "qty": 912,
        "unit": "KG",
        "price": 31.6,
        "amount": 28819.2,
        "diff": false,
        "gr_line": 5,
        "gr_qty": 912,
        "match_level": "M1"
      },
      {
        "no": 4,
        "desc": "SCGA440 45/45 2.000 X 230.0 X C 1-561512",
        "qty": 359,
        "unit": "KG",
        "price": 37.2,
        "amount": 13354.8,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 359,
        "match_level": "M1"
      },
      {
        "no": 5,
        "desc": "SCGA440 45/45 2.000 X 225.0 X C 1-563645",
        "qty": 296,
        "unit": "KG",
        "price": 39.5,
        "amount": 11692,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 296,
        "match_level": "M1"
      },
      {
        "no": 6,
        "desc": "SCGA270E 45/45 2.000 X 153.0 X C 1-567379",
        "qty": 226,
        "unit": "KG",
        "price": 36,
        "amount": 8136,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1130,
        "match_level": "M3"
      },
      {
        "no": 7,
        "desc": "SCGA270E 45/45 2.000 X 153.0 X C 1-567380",
        "qty": 226,
        "unit": "KG",
        "price": 36,
        "amount": 8136,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1130,
        "match_level": "M3"
      },
      {
        "no": 8,
        "desc": "SCGA270E 45/45 2.000 X 153.0 X C 1-567381",
        "qty": 226,
        "unit": "KG",
        "price": 36,
        "amount": 8136,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1130,
        "match_level": "M3"
      },
      {
        "no": 9,
        "desc": "SCGA270E 45/45 2.000 X 153.0 X C 1-567382",
        "qty": 226,
        "unit": "KG",
        "price": 36,
        "amount": 8136,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1130,
        "match_level": "M3"
      },
      {
        "no": 10,
        "desc": "SCGA270E 45/45 2.000 X 153.0 X C 1-567383",
        "qty": 226,
        "unit": "KG",
        "price": 36,
        "amount": 8136,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1130,
        "match_level": "M3"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "40118928",
        "receiptNum": "510521124",
        "lineNo": 1,
        "rcvLineId": "510521124-1",
        "itemCode": "PRM0002045B",
        "itemDesc": "SCGA270E-45 2.0 x 153 x COIL (581D)",
        "qty": 1130,
        "uom": "Kilogram",
        "unitPrice": 36,
        "lineAmount": 40680,
        "qtyBilled": 1130,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AH PC 04, K.Nittayaporn",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40118928",
          "ITEM_CODE": "PRM0002045B",
          "SHIPMENT_NUM": "SSA1-260901-056",
          "PACKING_SLIP": "SSA1-260901-056",
          "QTY_BILLED": "1130"
        }
      },
      {
        "poNumber": "40118928",
        "receiptNum": "510521124",
        "lineNo": 2,
        "rcvLineId": "510521124-2",
        "itemCode": "PRM0000936BRM",
        "itemDesc": "SCGA440-45 2.0 X 225 X COIL",
        "qty": 296,
        "uom": "Kilogram",
        "unitPrice": 39.5,
        "lineAmount": 11692,
        "qtyBilled": 296,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AH PC 04, K.Nittayaporn",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40118928",
          "ITEM_CODE": "PRM0000936BRM",
          "SHIPMENT_NUM": "SSA1-260901-056",
          "PACKING_SLIP": "SSA1-260901-056",
          "QTY_BILLED": "296"
        }
      },
      {
        "poNumber": "40118928",
        "receiptNum": "510521124",
        "lineNo": 3,
        "rcvLineId": "510521124-3",
        "itemCode": "PRM0000935BRM",
        "itemDesc": "SCGA440-45 2.0 X 230 X COIL",
        "qty": 359,
        "uom": "Kilogram",
        "unitPrice": 37.2,
        "lineAmount": 13354.8,
        "qtyBilled": 359,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AH PC 04, K.Nittayaporn",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40118928",
          "ITEM_CODE": "PRM0000935BRM",
          "SHIPMENT_NUM": "SSA1-260901-056",
          "PACKING_SLIP": "SSA1-260901-056",
          "QTY_BILLED": "359"
        }
      },
      {
        "poNumber": "40118928",
        "receiptNum": "510521124",
        "lineNo": 4,
        "rcvLineId": "510521124-4",
        "itemCode": "PRM0001817B",
        "itemDesc": "SPH440-OD 2.0 X 103 X COIL (D03B)",
        "qty": 465,
        "uom": "Kilogram",
        "unitPrice": 32.5,
        "lineAmount": 15112.5,
        "qtyBilled": 743,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AH PC 04, K.Nittayaporn",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40118928",
          "ITEM_CODE": "PRM0001817B",
          "SHIPMENT_NUM": "SSA1-260901-056",
          "PACKING_SLIP": "SSA1-260901-056",
          "QTY_BILLED": "743"
        }
      },
      {
        "poNumber": "40118928",
        "receiptNum": "510521124",
        "lineNo": 5,
        "rcvLineId": "510521124-5",
        "itemCode": "PRM0000905B",
        "itemDesc": "SPH440-OD 2.0 X 235 X COIL",
        "qty": 912,
        "uom": "Kilogram",
        "unitPrice": 31.6,
        "lineAmount": 28819.2,
        "qtyBilled": 1824,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AH PC 04, K.Nittayaporn",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40118928",
          "ITEM_CODE": "PRM0000905B",
          "SHIPMENT_NUM": "SSA1-260901-056",
          "PACKING_SLIP": "SSA1-260901-056",
          "QTY_BILLED": "1824"
        }
      },
      {
        "poNumber": "40118928",
        "receiptNum": "510521124",
        "lineNo": 6,
        "rcvLineId": "510521124-6",
        "itemCode": "PRM0000013A",
        "itemDesc": "SCGA270D-45 2.0 X 162 X COIL",
        "qty": 642,
        "uom": "Kilogram",
        "unitPrice": 35.8,
        "lineAmount": 22983.6,
        "qtyBilled": 642,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AH PC 04, K.Nittayaporn",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40118928",
          "ITEM_CODE": "PRM0000013A",
          "SHIPMENT_NUM": "SSA1-260901-056",
          "PACKING_SLIP": "SSA1-260901-056",
          "QTY_BILLED": "642"
        }
      }
    ],
    "pages": 4,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:33:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AH PC 04, K.Nittayaporn"
  },
  {
    "doc": "DMS-35",
    "company": "AHP",
    "vendor": "บริษัท จรูญรัตน์ โปรดักส์ จำกัด JAROONRAT PRODUCTS CO.,LTD.",
    "stax": "0135537003456",
    "inv": "SQ26/085013",
    "dt": "2026-08-29",
    "total": 5780.14,
    "sub": 5402,
    "vat": 378.14,
    "po": "43026973, 43041729, 43043027",
    "rcv": "530336710",
    "org": 176,
    "oname": "บริษัท อาปิโก ไฮเทค พาร์ทส์ จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 5402,
    "status": "Review",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: po_number(INVALID_FORMAT:PO_NOT_8_DIGITS)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.635,
          "y": 0.26,
          "w": 0.163,
          "h": 0.012,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 3 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530336710 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 5,402.00 = receipt 5,402.0"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "507A0 4JJ0A PLATE ASSY-FLUID GUIDE",
        "qty": 240,
        "unit": "PCS",
        "price": 3.29,
        "amount": 789.6,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 240,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "51130 5KA0A HOOK ASSY-RR TOWING (ตัดครบ+ชุด)",
        "qty": 248,
        "unit": "PCS",
        "price": 16.15,
        "amount": 4005.2,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 248,
        "match_level": "M1"
      },
      {
        "no": 3,
        "desc": "50990 8AM0B BRKT ASSY-FR UNDER COVER LH",
        "qty": 80,
        "unit": "PCS",
        "price": 7.59,
        "amount": 607.2,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 80,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43026973",
        "receiptNum": "530336710",
        "lineNo": 1,
        "rcvLineId": "530336710-1",
        "itemCode": "POP3000263A",
        "itemDesc": "507A04JJ0A PLATE ASSY-FLUIDE GUIDE (OUTSIDE PLATING)",
        "qty": 240,
        "uom": "Piece",
        "unitPrice": 3.29,
        "lineAmount": 789.6,
        "qtyBilled": 300,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43026973",
          "ITEM_CODE": "POP3000263A",
          "SHIPMENT_NUM": "SQ26/085013",
          "PACKING_SLIP": "SQ26/085013",
          "QTY_BILLED": "300"
        }
      },
      {
        "poNumber": "43041729",
        "receiptNum": "530336710",
        "lineNo": 2,
        "rcvLineId": "530336710-2",
        "itemCode": "POP3000311A",
        "itemDesc": "511305KA0A HOOK ASSY-RR TOWING (OUTSIDE PROCESSING)",
        "qty": 248,
        "uom": "Piece",
        "unitPrice": 16.15,
        "lineAmount": 4005.2,
        "qtyBilled": 248,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43041729",
          "ITEM_CODE": "POP3000311A",
          "SHIPMENT_NUM": "SQ26/085013",
          "PACKING_SLIP": "SQ26/085013",
          "QTY_BILLED": "248"
        }
      },
      {
        "poNumber": "43043027",
        "receiptNum": "530336710",
        "lineNo": 3,
        "rcvLineId": "530336710-3",
        "itemCode": "POP3000433A",
        "itemDesc": "509908AM0B BRKT ASSY-FR UNDER COVER LH (OUTSIDE-PLATING)(NMT H60E)",
        "qty": 80,
        "uom": "Piece",
        "unitPrice": 7.59,
        "lineAmount": 607.2,
        "qtyBilled": 100,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43043027",
          "ITEM_CODE": "POP3000433A",
          "SHIPMENT_NUM": "SQ26/085013",
          "PACKING_SLIP": "SQ26/085013",
          "QTY_BILLED": "100"
        }
      }
    ],
    "pages": 6,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:30:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-36",
    "company": "AHP",
    "vendor": "บริษัท นิปปอน สตีล ไพพ์ (ประเทศไทย) จำกัด NIPPON STEEL PIPE (THAILAND) CO., LTD.",
    "stax": "0145548001549",
    "inv": "2690046",
    "dt": "2026-09-01",
    "total": 98696.8,
    "sub": 92240,
    "vat": 6456.8,
    "po": "43042506",
    "rcv": "530336756",
    "org": 176,
    "oname": "AAPICO",
    "sig": [
      1,
      1
    ],
    "rtotal": 92240,
    "status": "Review",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: customer_address(LOW_CONFIDENCE), customer_tax_id(NOT_PRESENT)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.1371,
          "y": 0.4105,
          "w": 0.1532,
          "h": 0.0912,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530336756 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "Tax ID ลูกค้าอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 92,240.00 = receipt 92,240"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "2NP1HCO STAM1470 35.0X2.0X920.92 801864JAOA BEAM",
        "qty": 800,
        "unit": "PCS",
        "price": 115.3,
        "amount": 92240,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 800,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43042506",
        "receiptNum": "530336756",
        "lineNo": 1,
        "rcvLineId": "530336756-1",
        "itemCode": "PPR3000767BSF",
        "itemDesc": "801864JA0A BEAM (STAM1470 35 X 2.0 X 920.92)",
        "qty": 800,
        "uom": "Piece",
        "unitPrice": 115.3,
        "lineAmount": 92240,
        "qtyBilled": 800,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHP PC 06, K.Naruemon K.",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43042506",
          "ITEM_CODE": "PPR3000767BSF",
          "SHIPMENT_NUM": "2690046",
          "QTY_BILLED": "800"
        }
      }
    ],
    "pages": 4,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:33:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHP PC 06, K.Naruemon K."
  },
  {
    "doc": "DMS-37",
    "company": "AHP",
    "vendor": "IWATA BOLT (THAILAND) CO., LTD. (Head office)",
    "stax": "0115542006310",
    "inv": "67V403596",
    "dt": "2026-09-02",
    "total": 9523,
    "sub": 8900,
    "vat": 623,
    "po": "43027739",
    "rcv": "530336827",
    "org": 176,
    "oname": "AAPICO HITECH PARTS COMPANY LIMITED",
    "sig": [
      1,
      1
    ],
    "rtotal": 8900,
    "status": "Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E07"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530336827 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "Customer Mismatch",
        "status": "FAIL",
        "result": "fail",
        "detail": "ที่อยู่ลูกค้า (เลขที่ 99/2, รหัสไปรษณีย์ None) ไม่ตรงกับที่อยู่ของ ORG_ID 176",
        "exception_code": "E07",
        "severity": "Medium",
        "actual": "99/2 Moo 1 Hi-tech Industrial Estate Tambol BanlaneAmpur BangPa-In, Ayutthaya, Thailand",
        "page": 1,
        "bbox": {
          "x": 0.125,
          "y": 0.188,
          "w": 0.407,
          "h": 0.036,
          "page": 1
        }
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 8,900.00 = receipt 8,900"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "90145SJK3000 BOLT WELD M6X28 PO 43027739-124 LOT 51025092216761",
        "qty": 2000,
        "unit": "PCS",
        "price": 2.5,
        "amount": 5000,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 2000,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "90145TRTA000H1 BOLT WELD M6 PO 43027739-124 LOT 3041251133497",
        "qty": 2000,
        "unit": "PCS",
        "price": 1.95,
        "amount": 3900,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 2000,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43027739",
        "receiptNum": "530336827",
        "lineNo": 1,
        "rcvLineId": "530336827-1",
        "itemCode": "PCP3000299A",
        "itemDesc": "90145-TRT-A000-H1 BOLT-WELD,M6",
        "qty": 2000,
        "uom": "Piece",
        "unitPrice": 1.95,
        "lineAmount": 3900,
        "qtyBilled": 2000,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43027739",
          "ITEM_CODE": "PCP3000299A",
          "SHIPMENT_NUM": "67V403596",
          "PACKING_SLIP": "67V403596",
          "QTY_BILLED": "2000"
        }
      },
      {
        "poNumber": "43027739",
        "receiptNum": "530336827",
        "lineNo": 2,
        "rcvLineId": "530336827-2",
        "itemCode": "PCP3000297A",
        "itemDesc": "90145-SJK-3000 BOLT-WELD,M6 X 28",
        "qty": 2000,
        "uom": "Piece",
        "unitPrice": 2.5,
        "lineAmount": 5000,
        "qtyBilled": 2000,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43027739",
          "ITEM_CODE": "PCP3000297A",
          "SHIPMENT_NUM": "67V403596",
          "PACKING_SLIP": "67V403596",
          "QTY_BILLED": "2000"
        }
      }
    ],
    "pages": 4,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:29:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-38",
    "company": "AHP",
    "vendor": "QST (THAILAND) CO., LTD.",
    "stax": "0205545000583",
    "inv": "IV2609014",
    "dt": "2026-09-02",
    "total": 22245.3,
    "sub": 20790,
    "vat": 1455.3,
    "po": "43039142",
    "rcv": "530336841",
    "org": 176,
    "oname": "Aapico Hitech Parts Company Limited",
    "sig": [
      1,
      1
    ],
    "rtotal": 20790,
    "status": "Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E07"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530336841 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "Customer Mismatch",
        "status": "FAIL",
        "result": "fail",
        "detail": "ที่อยู่ลูกค้า (เลขที่ 99/2, รหัสไปรษณีย์ None) ไม่ตรงกับที่อยู่ของ ORG_ID 176",
        "exception_code": "E07",
        "severity": "Medium",
        "actual": "99/2 Moo. 1 Hi-tech Industrial Estate",
        "page": 1,
        "bbox": {
          "x": 0.108,
          "y": 0.305,
          "w": 0.275,
          "h": 0.013,
          "page": 1
        }
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 20,790.00 = receipt 20,790"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "M8-1.25x20.6,Weld Bolt (Cr3+) Lot.No. C5041380011A",
        "qty": 9000,
        "unit": "PCS",
        "price": 2.31,
        "amount": 20790,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 9000,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43039142",
        "receiptNum": "530336841",
        "lineNo": 1,
        "rcvLineId": "530336841-1",
        "itemCode": "PCP3000264A",
        "itemDesc": "80498JR20A BOLT SPECIAL (CR3+)",
        "qty": 9000,
        "uom": "Piece",
        "unitPrice": 2.31,
        "lineAmount": 20790,
        "qtyBilled": 9000,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43039142",
          "ITEM_CODE": "PCP3000264A",
          "SHIPMENT_NUM": "IV2609014",
          "PACKING_SLIP": "IV2609014",
          "QTY_BILLED": "9000"
        }
      }
    ],
    "pages": 4,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:29:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-39",
    "company": "AHP",
    "vendor": "บริษัท เจ เอส ออโต้เวิร์ค จำกัด J S AUTOWORK CO.,LTD.",
    "stax": "0135546004966",
    "inv": "JSA69/05154",
    "dt": "2026-09-02",
    "total": 91786.74,
    "sub": 85782,
    "vat": 6004.74,
    "po": "43041043",
    "rcv": "530336868",
    "org": 176,
    "oname": "บริษัท อาปิโก ไฮเทค พาร์ทส์ จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 85782,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530336868 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 85,782.00 = receipt 85,782"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "511144JA0B BRKT-FR TOWING HOOK,RH INR (PRESS;SF-M)",
        "qty": 2000,
        "unit": "PCS",
        "price": 33.39,
        "amount": 66780,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 2000,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "51132-5KA0A HOOK-RR TOWING",
        "qty": 300,
        "unit": "PCS",
        "price": 63.34,
        "amount": 19002,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 300,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43041043",
        "receiptNum": "530336868",
        "lineNo": 1,
        "rcvLineId": "530336868-1",
        "itemCode": "PPR3000896MSF",
        "itemDesc": "511144JA0B BRKT - FR TOWING HOOK, RH INR (PRESS;SF-M)",
        "qty": 2000,
        "uom": "Piece",
        "unitPrice": 33.39,
        "lineAmount": 66780,
        "qtyBilled": 4000,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43041043",
          "ITEM_CODE": "PPR3000896MSF",
          "SHIPMENT_NUM": "JSA69/05154",
          "PACKING_SLIP": "JSA69/05154",
          "QTY_BILLED": "4000"
        }
      },
      {
        "poNumber": "43041043",
        "receiptNum": "530336868",
        "lineNo": 2,
        "rcvLineId": "530336868-2",
        "itemCode": "PPR3000968BSF",
        "itemDesc": "511325KA0A HOOK-RR TOWING (PRESS;B-SF)",
        "qty": 300,
        "uom": "Piece",
        "unitPrice": 63.34,
        "lineAmount": 19002,
        "qtyBilled": 300,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43041043",
          "ITEM_CODE": "PPR3000968BSF",
          "SHIPMENT_NUM": "JSA69/05154",
          "PACKING_SLIP": "JSA69/05154",
          "QTY_BILLED": "300"
        }
      }
    ],
    "pages": 4,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:32:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-40",
    "company": "AHP",
    "vendor": "บริษัท เจ.พัฒนา ออโต้พาร์ท อินดัสตรี จำกัด J. PHIPHAT AUTO PART INDUSTRY COMPANY LIMITED",
    "stax": "0135535002053",
    "inv": "ED6909/0142",
    "dt": "2026-09-03",
    "total": 7752.15,
    "sub": 7245,
    "vat": 507.15,
    "po": "43031517",
    "rcv": "530336911",
    "org": 176,
    "oname": "AAPICO HITECH PARTS CO., LTD.",
    "sig": [
      1,
      1
    ],
    "rtotal": 7245,
    "status": "Review",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: pages_complete(false)",
        "exception_code": "E01",
        "severity": "Medium"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 7 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530336911 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "สแกนไม่ครบหน้า (E01 ไม่ใช่ E08)",
        "halted_by": "V-01"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 7,245.00 = receipt 7,245.0"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "74300-T20-A000 / STAY COMP R,RR SUBFRAME RR 43031517 1203",
        "qty": 45,
        "unit": "PCS",
        "price": 10.5,
        "amount": 472.5,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 45,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "74300-T20-A000 / STAY COMP R,RR SUBFRAME RR 43031517 1205",
        "qty": 60,
        "unit": "PCS",
        "price": 10.5,
        "amount": 630,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 60,
        "match_level": "M4"
      },
      {
        "no": 3,
        "desc": "74300-T20-A000 / STAY COMP R,RR SUBFRAME RR 43031517 1207",
        "qty": 240,
        "unit": "PCS",
        "price": 10.5,
        "amount": 2520,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 240,
        "match_level": "M1"
      },
      {
        "no": 4,
        "desc": "74300-T20-A000 / STAY COMP R,RR SUBFRAME RR 43031517 1208",
        "qty": 15,
        "unit": "PCS",
        "price": 10.5,
        "amount": 157.5,
        "diff": false,
        "gr_line": 4,
        "gr_qty": 15,
        "match_level": "M4"
      },
      {
        "no": 5,
        "desc": "74350-T20-A000 / STAY COMP L,RR SUBFRAME RR 43031517 1202",
        "qty": 60,
        "unit": "PCS",
        "price": 10.5,
        "amount": 630,
        "diff": false,
        "gr_line": 5,
        "gr_qty": 60,
        "match_level": "M4"
      },
      {
        "no": 6,
        "desc": "74350-T20-A000 / STAY COMP L,RR SUBFRAME RR 43031517 1204",
        "qty": 15,
        "unit": "PCS",
        "price": 10.5,
        "amount": 157.5,
        "diff": false,
        "gr_line": 6,
        "gr_qty": 15,
        "match_level": "M4"
      },
      {
        "no": 7,
        "desc": "74350-T20-A000 / STAY COMP L,RR SUBFRAME RR 43031517 1206",
        "qty": 255,
        "unit": "PCS",
        "price": 10.5,
        "amount": 2677.5,
        "diff": false,
        "gr_line": 7,
        "gr_qty": 255,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43031517",
        "receiptNum": "530336911",
        "lineNo": 1,
        "rcvLineId": "530336911-1",
        "itemCode": "POP3000344A",
        "itemDesc": "74300-T20-A000 STAY COMP R,FR SUBFRAME RR (OUTSIDE PLATING)",
        "qty": 45,
        "uom": "Piece",
        "unitPrice": 10.5,
        "lineAmount": 472.5,
        "qtyBilled": 270,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43031517",
          "ITEM_CODE": "POP3000344A",
          "SHIPMENT_NUM": "ED6909/0142",
          "PACKING_SLIP": "ED6909/0142",
          "QTY_BILLED": "270"
        }
      },
      {
        "poNumber": "43031517",
        "receiptNum": "530336911",
        "lineNo": 2,
        "rcvLineId": "530336911-2",
        "itemCode": "POP3000344A",
        "itemDesc": "74300-T20-A000 STAY COMP R,FR SUBFRAME RR (OUTSIDE PLATING)",
        "qty": 60,
        "uom": "Piece",
        "unitPrice": 10.5,
        "lineAmount": 630,
        "qtyBilled": 60,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43031517",
          "ITEM_CODE": "POP3000344A",
          "SHIPMENT_NUM": "ED6909/0142",
          "PACKING_SLIP": "ED6909/0142",
          "QTY_BILLED": "60"
        }
      },
      {
        "poNumber": "43031517",
        "receiptNum": "530336911",
        "lineNo": 3,
        "rcvLineId": "530336911-3",
        "itemCode": "POP3000344A",
        "itemDesc": "74300-T20-A000 STAY COMP R,FR SUBFRAME RR (OUTSIDE PLATING)",
        "qty": 240,
        "uom": "Piece",
        "unitPrice": 10.5,
        "lineAmount": 2520,
        "qtyBilled": 240,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43031517",
          "ITEM_CODE": "POP3000344A",
          "SHIPMENT_NUM": "ED6909/0142",
          "PACKING_SLIP": "ED6909/0142",
          "QTY_BILLED": "240"
        }
      },
      {
        "poNumber": "43031517",
        "receiptNum": "530336911",
        "lineNo": 4,
        "rcvLineId": "530336911-4",
        "itemCode": "POP3000344A",
        "itemDesc": "74300-T20-A000 STAY COMP R,FR SUBFRAME RR (OUTSIDE PLATING)",
        "qty": 15,
        "uom": "Piece",
        "unitPrice": 10.5,
        "lineAmount": 157.5,
        "qtyBilled": 60,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43031517",
          "ITEM_CODE": "POP3000344A",
          "SHIPMENT_NUM": "ED6909/0142",
          "PACKING_SLIP": "ED6909/0142",
          "QTY_BILLED": "60"
        }
      },
      {
        "poNumber": "43031517",
        "receiptNum": "530336911",
        "lineNo": 5,
        "rcvLineId": "530336911-5",
        "itemCode": "POP3000345A",
        "itemDesc": "74350-T20-A000 STAY COMP L,FR SUBFRAME RR (OUTSIDE PLATING)",
        "qty": 60,
        "uom": "Piece",
        "unitPrice": 10.5,
        "lineAmount": 630,
        "qtyBilled": 300,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43031517",
          "ITEM_CODE": "POP3000345A",
          "SHIPMENT_NUM": "ED6909/0142",
          "PACKING_SLIP": "ED6909/0142",
          "QTY_BILLED": "300"
        }
      },
      {
        "poNumber": "43031517",
        "receiptNum": "530336911",
        "lineNo": 6,
        "rcvLineId": "530336911-6",
        "itemCode": "POP3000345A",
        "itemDesc": "74350-T20-A000 STAY COMP L,FR SUBFRAME RR (OUTSIDE PLATING)",
        "qty": 15,
        "uom": "Piece",
        "unitPrice": 10.5,
        "lineAmount": 157.5,
        "qtyBilled": 15,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43031517",
          "ITEM_CODE": "POP3000345A",
          "SHIPMENT_NUM": "ED6909/0142",
          "PACKING_SLIP": "ED6909/0142",
          "QTY_BILLED": "15"
        }
      },
      {
        "poNumber": "43031517",
        "receiptNum": "530336911",
        "lineNo": 7,
        "rcvLineId": "530336911-7",
        "itemCode": "POP3000345A",
        "itemDesc": "74350-T20-A000 STAY COMP L,FR SUBFRAME RR (OUTSIDE PLATING)",
        "qty": 255,
        "uom": "Piece",
        "unitPrice": 10.5,
        "lineAmount": 2677.5,
        "qtyBilled": 300,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43031517",
          "ITEM_CODE": "POP3000345A",
          "SHIPMENT_NUM": "ED6909/0142",
          "PACKING_SLIP": "ED6909/0142",
          "QTY_BILLED": "300"
        }
      }
    ],
    "pages": 12,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:38:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-41",
    "company": "AHP",
    "vendor": "บริษัท เอสโก้ พรีเมี่ยม จำกัด",
    "stax": "0105533090371",
    "inv": "IV6906765",
    "dt": "2026-09-01",
    "total": 4558.2,
    "sub": 4260,
    "vat": 298.2,
    "po": "43043079",
    "rcv": "530336938",
    "org": 176,
    "oname": "บริษัท อาปิโก ไฮเทค พาร์ทส์ จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 4260,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530336938 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 4,260.00 = receipt 4,260"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "แว่นตานิริกภัย ผิและตก ยกเว้น E. & O.E.",
        "qty": 60,
        "unit": "PCS",
        "price": 71,
        "amount": 4260,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 60,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43043079",
        "receiptNum": "530336938",
        "lineNo": 1,
        "rcvLineId": "530336938-1",
        "itemCode": "AFS0000445A",
        "itemDesc": "SAFETY GLASS\\TORNADO 9175C\\HOUSE",
        "qty": 60,
        "uom": "Piece",
        "unitPrice": 71,
        "lineAmount": 4260,
        "qtyBilled": 60,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHP PC 06, K.Naruemon K.",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43043079",
          "ITEM_CODE": "AFS0000445A",
          "SHIPMENT_NUM": "IV6906765",
          "QTY_BILLED": "60"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:33:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHP PC 06, K.Naruemon K."
  },
  {
    "doc": "DMS-42",
    "company": "AHP",
    "vendor": "บริษัท บีทีดี ออโต้พาร์ท (ประเทศไทย) จำกัด BTD AUTOPART (THAILAND) COMPANY LIMITED",
    "stax": "0205557002730",
    "inv": "IV690900287",
    "dt": "2026-09-04",
    "total": 10714.98,
    "sub": 10014,
    "vat": 700.98,
    "po": "43041243",
    "rcv": "530336931",
    "org": 176,
    "oname": "บริษัท อาชิโกะ ไฮเทค พาร์ทส์ จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 10014,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 3 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530336931 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 10,014.00 = receipt 10,014"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "PLATE-RR WH INR LH",
        "qty": 300,
        "unit": "PCS",
        "price": 14.32,
        "amount": 4296,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 300,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "BOLT-PLATE",
        "qty": 300,
        "unit": "PCS",
        "price": 9.93,
        "amount": 2979,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 300,
        "match_level": "M1"
      },
      {
        "no": 3,
        "desc": "BRKT-FUEL TANK MTG RR A",
        "qty": 300,
        "unit": "PCS",
        "price": 9.13,
        "amount": 2739,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 300,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43041243",
        "receiptNum": "530336931",
        "lineNo": 1,
        "rcvLineId": "530336931-1",
        "itemCode": "PPR3001244BSF",
        "itemDesc": "767B95KA0A PLATE-RR WHINR LH (PRESS;SF-B)",
        "qty": 300,
        "uom": "Piece",
        "unitPrice": 14.32,
        "lineAmount": 4296,
        "qtyBilled": 300,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43041243",
          "ITEM_CODE": "PPR3001244BSF",
          "SHIPMENT_NUM": "IV690900287",
          "PACKING_SLIP": "IV690900287",
          "QTY_BILLED": "300"
        }
      },
      {
        "poNumber": "43041243",
        "receiptNum": "530336931",
        "lineNo": 2,
        "rcvLineId": "530336931-2",
        "itemCode": "PPR3001245BSF",
        "itemDesc": "756385KA0A BRKT-FUEL TANK MTG RR A (PRESS;SF-B)",
        "qty": 300,
        "uom": "Piece",
        "unitPrice": 9.13,
        "lineAmount": 2739,
        "qtyBilled": 300,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43041243",
          "ITEM_CODE": "PPR3001245BSF",
          "SHIPMENT_NUM": "IV690900287",
          "PACKING_SLIP": "IV690900287",
          "QTY_BILLED": "300"
        }
      },
      {
        "poNumber": "43041243",
        "receiptNum": "530336931",
        "lineNo": 3,
        "rcvLineId": "530336931-3",
        "itemCode": "PPR3001268BSF",
        "itemDesc": "673974KD0A BOLT- PALTE (PRESS;SF-B)",
        "qty": 300,
        "uom": "Piece",
        "unitPrice": 9.93,
        "lineAmount": 2979,
        "qtyBilled": 300,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43041243",
          "ITEM_CODE": "PPR3001268BSF",
          "SHIPMENT_NUM": "IV690900287",
          "PACKING_SLIP": "IV690900287",
          "QTY_BILLED": "300"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:33:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-43",
    "company": "AHP",
    "vendor": "บริษัท บีเคเอส เอ็นเตอร์ไพรส์ จำกัด BKS ENTERPRISE CO., LTD.",
    "stax": "0105562195321",
    "inv": "IV6909119",
    "dt": "2026-09-04",
    "total": 3071.54,
    "sub": 2870.6,
    "vat": 200.94,
    "po": "43043062",
    "rcv": "530336982",
    "org": 176,
    "oname": "APCHP",
    "sig": [
      1,
      1
    ],
    "rtotal": 2870.6,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E03",
      "E10"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 8 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "Total Mismatch",
        "status": "FAIL",
        "result": "fail",
        "detail": "ยอดรวมภายในใบแจ้งหนี้ไม่สอดคล้อง {'lines_vs_sub_total': '14.40', 'vat_7pct': '0.00', 'sub_plus_vat_vs_grand': '0.00'}",
        "exception_code": "E03",
        "severity": "High",
        "actual": "2870.60",
        "expected": "2885.00",
        "page": 1,
        "bbox": {
          "x": 0.632,
          "y": 0.716,
          "w": 0.334,
          "h": 0.017,
          "page": 1
        }
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530336982 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "Line Arithmetic Inconsistency",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 1 (Invoice: G-108208-00 ROTER BLADE): หน่วยนับต่างกลุ่มหลังแปลง (Inv: PCS→PCS, Rcv: Job→JOB)",
        "exception_code": "E10",
        "severity": "Medium",
        "actual": "PCS",
        "expected": "JOB",
        "page": 1,
        "bbox": {
          "x": 0.028,
          "y": 0.31,
          "w": 0.938,
          "h": 0.013,
          "page": 1
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "WARN",
        "result": "manual_review",
        "detail": "AI/facts ไม่สอดคล้อง หรือเทียบจำนวนไม่ได้"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 2,870.60 = receipt 2,870.6"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "G-108208-00 ROTER BLADE",
        "qty": 4,
        "unit": "PCS",
        "price": 108,
        "amount": 432,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M4"
      },
      {
        "no": 2,
        "desc": "A-005221-00 SPINDER BEARING",
        "qty": 1,
        "unit": "PCS",
        "price": 558,
        "amount": 558,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M4"
      },
      {
        "no": 3,
        "desc": "A-122301-01 WHEEL FLAGE (B)",
        "qty": 1,
        "unit": "PCS",
        "price": 372,
        "amount": 372,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M4"
      },
      {
        "no": 4,
        "desc": "BB-606 BALL BEALING",
        "qty": 1,
        "unit": "PCS",
        "price": 190,
        "amount": 190,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M4"
      },
      {
        "no": 5,
        "desc": "BB-609MN BALL BEALING",
        "qty": 1,
        "unit": "PCS",
        "price": 186,
        "amount": 186,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M4"
      },
      {
        "no": 6,
        "desc": "BB-605 BALL BEARING",
        "qty": 1,
        "unit": "PCS",
        "price": 165,
        "amount": 165,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M4"
      },
      {
        "no": 7,
        "desc": "BB-6001 BALL BEARING",
        "qty": 1,
        "unit": "PCS",
        "price": 232,
        "amount": 232,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M4"
      },
      {
        "no": 8,
        "desc": "อะไหล่เครื่อง FA-2C-1 NO.06569 -หักส่วนลด 14.40.-",
        "qty": 1,
        "unit": "PCS",
        "price": 750,
        "amount": 750,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M4"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43043062",
        "receiptNum": "530336982",
        "lineNo": 1,
        "rcvLineId": "530336982-1",
        "itemCode": null,
        "itemDesc": "CHANGE NEW ROTOR BLADE,SPINDER BEARING ,WHEEL FLAGE (B),BALL BEALING,BALL BEARING,spare part FA 2C 1 NO.06569",
        "qty": 1,
        "uom": "Job",
        "unitPrice": 2870.6,
        "lineAmount": 2870.6,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHP PC 06, K.Naruemon K.",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43043062",
          "SHIPMENT_NUM": "IV6909119",
          "QTY_BILLED": "1"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:35:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด High",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHP PC 06, K.Naruemon K."
  },
  {
    "doc": "DMS-44",
    "company": "AHP",
    "vendor": "S & S PATTARACHARD CO., LTD.",
    "stax": "0105541062224",
    "inv": "69/09/0059",
    "dt": "2026-09-01",
    "total": 7623.75,
    "sub": 7125,
    "vat": 498.75,
    "po": "43043075",
    "rcv": "530336988",
    "org": 176,
    "oname": "บริษัท อาปิโก ไฮเทค พาร์ทส์ จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 7125,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530336988 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 7,125.00 = receipt 7,125"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "PP BOARD BLACK 1025*1070*4mm. ( 1000 GSM)",
        "qty": 60,
        "unit": "PCS",
        "price": 118.75,
        "amount": 7125,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 60,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43043075",
        "receiptNum": "530336988",
        "lineNo": 1,
        "rcvLineId": "530336988-1",
        "itemCode": "AFS0012098A",
        "itemDesc": "PP BOARD BLACK SIZE 1025*1070*4MM",
        "qty": 60,
        "uom": "Piece",
        "unitPrice": 118.75,
        "lineAmount": 7125,
        "qtyBilled": 60,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHP PC 06, K.Naruemon K.",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43043075",
          "ITEM_CODE": "AFS0012098A",
          "SHIPMENT_NUM": "69/09/0059",
          "QTY_BILLED": "60"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:34:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHP PC 06, K.Naruemon K."
  },
  {
    "doc": "DMS-45",
    "company": "AHP",
    "vendor": "บริษัท ป.สุณี เทรดดิ้ง จำกัด",
    "stax": "0145548001549",
    "inv": "IV69090041",
    "dt": "2026-09-01",
    "total": 263.22,
    "sub": 246,
    "vat": 17.22,
    "po": "43043074",
    "rcv": "530336989",
    "org": 176,
    "oname": "บริษัท อาปิโก ไฮเทค พาร์ทส์ จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 246,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530336989 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 246.00 = receipt 246"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "\"KOBE\" สีสเปรย์ NO.900 (WHITE)",
        "qty": 6,
        "unit": "CAN",
        "price": 41,
        "amount": 246,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 6,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43043074",
        "receiptNum": "530336989",
        "lineNo": 1,
        "rcvLineId": "530336989-1",
        "itemCode": "AFS0002086A",
        "itemDesc": "SPRAY COLOR\\WHITE\\KOBE",
        "qty": 6,
        "uom": "Can",
        "unitPrice": 41,
        "lineAmount": 246,
        "qtyBilled": 6,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHP PC 06, K.Naruemon K.",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43043074",
          "ITEM_CODE": "AFS0002086A",
          "SHIPMENT_NUM": "IV69090041",
          "QTY_BILLED": "6"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:37:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHP PC 06, K.Naruemon K."
  },
  {
    "doc": "DMS-46",
    "company": "AHP",
    "vendor": "บริษัท ทริปเปิล แวลู จำกัด (สำนักงานใหญ่)",
    "stax": "0145555000137",
    "inv": "IV69-0410",
    "dt": "2026-09-03",
    "total": 6848,
    "sub": 6400,
    "vat": 448,
    "po": "43043106",
    "rcv": "530336990",
    "org": 176,
    "oname": "บริษัท อาปิโก ไฮเทค พาร์ทส์ จำกัด (สำนักงานใหญ่)",
    "sig": [
      1,
      1
    ],
    "rtotal": 6400,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530336990 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 6,400.00 = receipt 6,400"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "RWR RIBBON WAX RESIN SIZE 102 MMX 200 M. คำ F/O แกน 1\"",
        "qty": 20,
        "unit": "ROLL",
        "price": 320,
        "amount": 6400,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 20,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43043106",
        "receiptNum": "530336990",
        "lineNo": 1,
        "rcvLineId": "530336990-1",
        "itemCode": "AOS0001058A",
        "itemDesc": "RIBBON WAX RESIN SIZE 102mm. x 200m. OUT",
        "qty": 20,
        "uom": "Roll",
        "unitPrice": 320,
        "lineAmount": 6400,
        "qtyBilled": 20,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHP PC 06, K.Naruemon K.",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43043106",
          "ITEM_CODE": "AOS0001058A",
          "SHIPMENT_NUM": "IV69-0410",
          "QTY_BILLED": "20"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:36:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHP PC 06, K.Naruemon K."
  },
  {
    "doc": "DMS-47",
    "company": "AHP",
    "vendor": "SIAM NEJI CO., LTD.",
    "stax": "0105546035721",
    "inv": "IV2609057",
    "dt": "2026-09-01",
    "total": 9244.8,
    "sub": 8640,
    "vat": 604.8,
    "po": "43029104",
    "rcv": "530336786",
    "org": 176,
    "oname": "บริษัท อาซีไก ฮาเทค พาร์ทส์ จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 8640,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530336786 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 8,640.00 = receipt 8,640"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "PLATE NUT M12x1.25x19x17.5x29x3.5",
        "qty": 1200,
        "unit": "PCS",
        "price": 7.2,
        "amount": 8640,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1200,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43029104",
        "receiptNum": "530336786",
        "lineNo": 1,
        "rcvLineId": "530336786-1",
        "itemCode": "PCP3000280A",
        "itemDesc": "75699 5JS0A PLATE-NUT",
        "qty": 1200,
        "uom": "Piece",
        "unitPrice": 7.2,
        "lineAmount": 8640,
        "qtyBilled": 1200,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43029104",
          "ITEM_CODE": "PCP3000280A",
          "SHIPMENT_NUM": "IV2609057",
          "PACKING_SLIP": "IV2609057",
          "QTY_BILLED": "1200"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:39:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-48",
    "company": "AHP",
    "vendor": "บริษัท อิสเทิร์น ยูไนเต็ด จำกัด (สำนักงานใหญ่) EASTERN UNITED CO.,LTD. (HEAD OFFICE)",
    "stax": "0205557010449",
    "inv": "IV260904/003",
    "dt": "2026-09-04",
    "total": 8062.24,
    "sub": 7534.8,
    "vat": 527.44,
    "po": "43043110",
    "rcv": "530337062",
    "org": 176,
    "oname": "บริษัท อาปิโก ไฮเทค พาร์ทส์ จำกัด (สำนักงานใหญ่)",
    "sig": [
      1,
      1
    ],
    "rtotal": 7534.8,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530337062 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 7,534.80 = receipt 7,534.8"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "BHV75975 BRACKET ; RR BODY MTG C 69-00360",
        "qty": 2520,
        "unit": "PCS",
        "price": 2.99,
        "amount": 7534.8,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 2520,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43043110",
        "receiptNum": "530337062",
        "lineNo": 1,
        "rcvLineId": "530337062-1",
        "itemCode": "POP3000435A",
        "itemDesc": "BHV75975 BRACKET;RR BODY MTG C (OUTSIDE-PLATING)(ASP 20TF)",
        "qty": 2520,
        "uom": "Piece",
        "unitPrice": 2.99,
        "lineAmount": 7534.8,
        "qtyBilled": 2520,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHP PC 06, K.Naruemon K.",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43043110",
          "ITEM_CODE": "POP3000435A",
          "SHIPMENT_NUM": "IV260904/003",
          "QTY_BILLED": "2520"
        }
      }
    ],
    "pages": 6,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:37:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHP PC 06, K.Naruemon K."
  },
  {
    "doc": "DMS-49",
    "company": "AHP",
    "vendor": "SUMMIT CHUGOKU SEIRA CO., LTD. (HEAD OFFICE)",
    "stax": "0105539055941",
    "inv": "IND2609-0570",
    "dt": "2026-09-08",
    "total": 1765.5,
    "sub": 1650,
    "vat": 115.5,
    "po": "43043038",
    "rcv": "530337086",
    "org": 176,
    "oname": "บริษัท ออโต้ไบค์ ไฮเทค พาร์ทส จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 1650,
    "status": "Review",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: pages_complete(false)",
        "exception_code": "E01",
        "severity": "Medium"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530337086 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "สแกนไม่ครบหน้า (E01 ไม่ใช่ E08)",
        "halted_by": "V-01"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 1,650.00 = receipt 1,650"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "Square weld nut",
        "qty": 3000,
        "unit": "PCS",
        "price": 0.55,
        "amount": 1650,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 3000,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43043038",
        "receiptNum": "530337086",
        "lineNo": 1,
        "rcvLineId": "530337086-1",
        "itemCode": "PCP3000345A",
        "itemDesc": "MF927420 NUT,WELD,M8X1.25(AA-5K45)",
        "qty": 3000,
        "uom": "Piece",
        "unitPrice": 0.55,
        "lineAmount": 1650,
        "qtyBilled": 3000,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43043038",
          "ITEM_CODE": "PCP3000345A",
          "SHIPMENT_NUM": "IND2609-0570",
          "PACKING_SLIP": "IND2609-0570",
          "QTY_BILLED": "3000"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:56:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-50",
    "company": "AHP",
    "vendor": "บริษัท มาเตฮัน สยาม แลมพ์ด้า จำกัด",
    "stax": "0205538003866",
    "inv": "CB6909050",
    "dt": "2026-09-08",
    "total": 16050,
    "sub": 15000,
    "vat": 1050,
    "po": "43042676",
    "rcv": "530337176",
    "org": 176,
    "oname": "AAPICO Hitech Parts Co., Ltd.",
    "sig": [
      1,
      1
    ],
    "rtotal": 15000,
    "status": "Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E07"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530337176 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "Customer Mismatch",
        "status": "FAIL",
        "result": "fail",
        "detail": "ที่อยู่ลูกค้า (เลขที่ 99/2, รหัสไปรษณีย์ 12160) ไม่ตรงกับที่อยู่ของ ORG_ID 176",
        "exception_code": "E07",
        "severity": "Medium",
        "actual": "99/2 Moo 1 Hitech Industrial Estate, Tambol Ban lane, Amphur Bang Pa-in, Ayutthaya 12160",
        "page": 1,
        "bbox": {
          "x": 0.062,
          "y": 0.214,
          "w": 0.362,
          "h": 0.024,
          "page": 1
        }
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 15,000.00 = receipt 15,000"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "RENTAL : SECOND HAND FORKLIFT TRUCK 5881 HELI CPD15-GB3LI-M # 05015DM4335 START : 1/6/26-31/12/26 PERIOD : 1-30/9/26 4/7 REMARK : ค่าเช่า หัก ณ ที่จ่าย 5%",
        "qty": 1,
        "unit": "JOB",
        "price": 15000,
        "amount": 15000,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43042676",
        "receiptNum": "530337176",
        "lineNo": 1,
        "rcvLineId": "530337176-1",
        "itemCode": null,
        "itemDesc": "RENTAL : NEW FORKLIFT EV \"HELI\" MODEL :CPD15-GB3LI-M-M300 1.5 TON NO.10 (Sep'26)",
        "qty": 1,
        "uom": "Job",
        "unitPrice": 15000,
        "lineAmount": 15000,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHP PC 06, K.Naruemon K.",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43042676",
          "SHIPMENT_NUM": "CB6909050",
          "QTY_BILLED": "1"
        }
      }
    ],
    "pages": 2,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:38:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHP PC 06, K.Naruemon K."
  },
  {
    "doc": "DMS-51",
    "company": "AHP",
    "vendor": "บจก. อินศรี คอนซัลติ้ง แอนด์ เอนจิเนียริ่ง INSRI CONSULTING & ENGINEERING LTD.,PART.",
    "stax": "0113528000049",
    "inv": "035/00303",
    "dt": "2026-09-08",
    "total": 35297.16,
    "sub": 32988,
    "vat": 2309.16,
    "po": "43042462",
    "rcv": "530337077",
    "org": 176,
    "oname": "บริษัท อาปิโกไฮเทค พาร์ทส์ จำกัด (สำนักงานใหญ่)",
    "sig": [
      1,
      1
    ],
    "rtotal": 32988,
    "status": "Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E07"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 3 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530337077 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "Customer Mismatch",
        "status": "FAIL",
        "result": "fail",
        "detail": "ที่อยู่ลูกค้า (เลขที่ 99/2, รหัสไปรษณีย์ None) ไม่ตรงกับที่อยู่ของ ORG_ID 176",
        "exception_code": "E07",
        "severity": "Medium",
        "actual": "99/2 ม. 1 นิคมอุตสาหกรรมไฮเทค ต. บ้านเลน อ. บางปะอิน จ.พระนครศรีอยุธยา",
        "page": 1,
        "bbox": {
          "x": 0.132,
          "y": 0.295,
          "w": 0.303,
          "h": 0.033,
          "page": 1
        }
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 32,988.00 = receipt 32,988"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "PPR3001558BFG 205P0JR500 CLP ASSY",
        "qty": 400,
        "unit": "PCS",
        "price": 4.83,
        "amount": 1932,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 400,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "PSA3000907BFG 205PAJR51A INSUL-HEAT,UPR",
        "qty": 400,
        "unit": "PCS",
        "price": 61.38,
        "amount": 24552,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 400,
        "match_level": "M1"
      },
      {
        "no": 3,
        "desc": "PPR3001559BFG 205P6JR51A INSUL-HEAT,UPR",
        "qty": 400,
        "unit": "PCS",
        "price": 16.26,
        "amount": 6504,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 400,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43042462",
        "receiptNum": "530337077",
        "lineNo": 1,
        "rcvLineId": "530337077-1",
        "itemCode": "PPR3001558BFG",
        "itemDesc": "205P0JR500 CLP ASSY (PRESS;FG-B) (SCAL P60A)",
        "qty": 400,
        "uom": "Piece",
        "unitPrice": 4.83,
        "lineAmount": 1932,
        "qtyBilled": 400,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43042462",
          "ITEM_CODE": "PPR3001558BFG",
          "SHIPMENT_NUM": "035/00303",
          "PACKING_SLIP": "035/00303",
          "QTY_BILLED": "400"
        }
      },
      {
        "poNumber": "43042462",
        "receiptNum": "530337077",
        "lineNo": 2,
        "rcvLineId": "530337077-2",
        "itemCode": "PPR3001559BFG",
        "itemDesc": "205P6JR51A INSUL - HEAT,UPR (PRESS;FG-B)(SCAL P60A)",
        "qty": 400,
        "uom": "Piece",
        "unitPrice": 16.26,
        "lineAmount": 6504,
        "qtyBilled": 400,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43042462",
          "ITEM_CODE": "PPR3001559BFG",
          "SHIPMENT_NUM": "035/00303",
          "PACKING_SLIP": "035/00303",
          "QTY_BILLED": "400"
        }
      },
      {
        "poNumber": "43042462",
        "receiptNum": "530337077",
        "lineNo": 3,
        "rcvLineId": "530337077-3",
        "itemCode": "PSA3000907BFG",
        "itemDesc": "205PAJR51A INSUL - HEAT,UPR (ASSY;FG-B) (SCAL P60A)",
        "qty": 400,
        "uom": "Piece",
        "unitPrice": 61.38,
        "lineAmount": 24552,
        "qtyBilled": 400,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43042462",
          "ITEM_CODE": "PSA3000907BFG",
          "SHIPMENT_NUM": "035/00303",
          "PACKING_SLIP": "035/00303",
          "QTY_BILLED": "400"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:41:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-52",
    "company": "AHP",
    "vendor": "หจก. อนันตกิจ พรินติ้งเซ็นเตอร์ ANANKIJ PRINTING CENTER LTD., PART.",
    "stax": "0133539003389",
    "inv": "4362",
    "dt": "2026-09-08",
    "total": 6420,
    "sub": 6000,
    "vat": 420,
    "po": "43043076",
    "rcv": "530337175",
    "org": 176,
    "oname": "บริษัท ออร์โต้ ไชน่า เซ็นเตอร์ จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 6000,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E13",
      "E01",
      "E10"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: po_number(INVALID_FORMAT:PO_NOT_8_DIGITS), L1.amount(INVALID_FORMAT:NOT_A_NUMBER), L2.amount(INVALID_FORMAT:NOT_A_NUMBER)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.162,
          "y": 0.332,
          "w": 0.108,
          "h": 0.028,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ยอดรวมหรือราคารวมต่อรายการอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530337175 (TAX-INV-SUFFIX)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "Line Arithmetic Inconsistency",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 2 (Invoice: แผ่น Document Projection Spot DXC. NO.9.3.0.6-1 - ขนาด A4 - ขนาดเสมอ 130g): หน่วยนับต่างกลุ่มหลังแปลง (Inv: แผ่น→SHT, Rcv: Book→BOOK)",
        "exception_code": "E10",
        "severity": "Medium",
        "actual": "SHT",
        "expected": "BOOK",
        "page": 1,
        "bbox": {
          "x": 0.062,
          "y": 0.425,
          "w": 0.868,
          "h": 0.027,
          "page": 1
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "WARN",
        "result": "manual_review",
        "detail": "AI/facts ไม่สอดคล้อง หรือเทียบจำนวนไม่ได้"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 6,000 = receipt 6,000"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "แผ่น Document Projection Spot",
        "qty": 10,
        "unit": "SHT",
        "price": 300,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 2,
        "desc": "แผ่น Document Projection Spot DXC. NO.9.3.0.6-1 - ขนาด A4 - ขนาดเสมอ 130g",
        "qty": 10,
        "unit": "SHT",
        "price": 300,
        "amount": 0,
        "diff": true,
        "gr_line": 2,
        "gr_qty": 10,
        "match_level": "M3"
      },
      {
        "no": 3,
        "desc": "แผ่น Document Projection Spot",
        "qty": 10,
        "unit": "SHT",
        "price": 300,
        "amount": 3000,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 10,
        "match_level": "M3"
      },
      {
        "no": 4,
        "desc": "แผ่น Document Projection Spot XX. NO. 9.3.8.6-1 - 1 เลน A4 - ขนาด 15x20 ซม., หมึก 130",
        "qty": 10,
        "unit": "SHT",
        "price": 300,
        "amount": 3000,
        "diff": true,
        "match_level": "NONE"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43043076",
        "receiptNum": "530337175",
        "lineNo": 1,
        "rcvLineId": "530337175-1",
        "itemCode": "AOS0000491A",
        "itemDesc": "DOCUMENT PROJECTION SPOT",
        "qty": 10,
        "uom": "Book",
        "unitPrice": 300,
        "lineAmount": 3000,
        "qtyBilled": 10,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHP PC 06, K.Naruemon K.",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43043076",
          "ITEM_CODE": "AOS0000491A",
          "SHIPMENT_NUM": "088/4362",
          "QTY_BILLED": "10"
        }
      },
      {
        "poNumber": "43043076",
        "receiptNum": "530337175",
        "lineNo": 2,
        "rcvLineId": "530337175-2",
        "itemCode": "AOS0000492A",
        "itemDesc": "DOCUMENT PROJECTION SPOT DOC NO.9.3.0.6-1",
        "qty": 10,
        "uom": "Book",
        "unitPrice": 300,
        "lineAmount": 3000,
        "qtyBilled": 10,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHP PC 06, K.Naruemon K.",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43043076",
          "ITEM_CODE": "AOS0000492A",
          "SHIPMENT_NUM": "088/4362",
          "QTY_BILLED": "10"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:47:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด High",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHP PC 06, K.Naruemon K."
  },
  {
    "doc": "DMS-53",
    "company": "AHP",
    "vendor": "บริษัท อาปิโก ฮitech จำกัด",
    "stax": "0145556001111",
    "inv": "112603889",
    "dt": "2026-09-09",
    "total": 18423.69,
    "sub": 17218.4,
    "vat": 1205.29,
    "po": "43041240",
    "rcv": "530337131",
    "org": 176,
    "oname": "AAPIKO HITECH PARTS COMPANY LIMITED",
    "sig": [
      0,
      0
    ],
    "rtotal": 17218.4,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 8 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530337131 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "WARN",
        "result": "manual_review",
        "detail": "ความมั่นใจต่ำ: ['receiver', 'deliverer']"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 17,218.40 = receipt 17,218.4"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "PPR3000771BFG 631824JA0A STAY -FR FDR,RH 43041240-220",
        "qty": 200,
        "unit": "PCS",
        "price": 5.74,
        "amount": 1148,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 200,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "PPR3000772BFG 631834JA0A STAY -FR,LH 43041240-220",
        "qty": 200,
        "unit": "PCS",
        "price": 5.74,
        "amount": 1148,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 200,
        "match_level": "M1"
      },
      {
        "no": 3,
        "desc": "PSA3000388BFG 762904JA0A BRKT ASSY-FR FDR 43041240-220",
        "qty": 800,
        "unit": "PCS",
        "price": 2.07,
        "amount": 1656,
        "diff": false,
        "gr_line": 7,
        "gr_qty": 800,
        "match_level": "M1"
      },
      {
        "no": 4,
        "desc": "PPR3000773BSF 801924JA0A BRKT -FR DOOR GUARD 43041240-220",
        "qty": 2000,
        "unit": "PCS",
        "price": 1.25,
        "amount": 2500,
        "diff": false,
        "gr_line": 4,
        "gr_qty": 2000,
        "match_level": "M1"
      },
      {
        "no": 5,
        "desc": "PPR3000774BSF 801844JA0A BRKT -FR DOOR GUARD RR,RH 43041240-220",
        "qty": 400,
        "unit": "PCS",
        "price": 5.34,
        "amount": 2136,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 400,
        "match_level": "M1"
      },
      {
        "no": 6,
        "desc": "PPR3000878BSF 764354JG0C BRACE-SILL OTR,LH 43041240-220",
        "qty": 600,
        "unit": "PCS",
        "price": 6.98,
        "amount": 4188,
        "diff": false,
        "gr_line": 6,
        "gr_qty": 600,
        "match_level": "M1"
      },
      {
        "no": 7,
        "desc": "PPR3000902BSF 764364JT0C REINF ASSY-SILL OTR,RH (PRESS;SF-B) 43041240-220",
        "qty": 240,
        "unit": "PCS",
        "price": 9.61,
        "amount": 2306.4,
        "diff": false,
        "gr_line": 8,
        "gr_qty": 240,
        "match_level": "M1"
      },
      {
        "no": 8,
        "desc": "PPR3000775BSF 801854JA0A BRKT -FR DOOR GUARD RR,LH 43041240-220",
        "qty": 400,
        "unit": "PCS",
        "price": 5.34,
        "amount": 2136,
        "diff": false,
        "gr_line": 5,
        "gr_qty": 400,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43041240",
        "receiptNum": "530337131",
        "lineNo": 1,
        "rcvLineId": "530337131-1",
        "itemCode": "PPR3000771BFG",
        "itemDesc": "631824JA0A STAY -FR FDR,RH",
        "qty": 200,
        "uom": "Piece",
        "unitPrice": 5.74,
        "lineAmount": 1148,
        "qtyBilled": 200,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43041240",
          "ITEM_CODE": "PPR3000771BFG",
          "SHIPMENT_NUM": "112603889",
          "PACKING_SLIP": "112603889",
          "QTY_BILLED": "200"
        }
      },
      {
        "poNumber": "43041240",
        "receiptNum": "530337131",
        "lineNo": 2,
        "rcvLineId": "530337131-2",
        "itemCode": "PPR3000772BFG",
        "itemDesc": "631834JA0A STAY -FR FDR,LH",
        "qty": 200,
        "uom": "Piece",
        "unitPrice": 5.74,
        "lineAmount": 1148,
        "qtyBilled": 200,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43041240",
          "ITEM_CODE": "PPR3000772BFG",
          "SHIPMENT_NUM": "112603889",
          "PACKING_SLIP": "112603889",
          "QTY_BILLED": "200"
        }
      },
      {
        "poNumber": "43041240",
        "receiptNum": "530337131",
        "lineNo": 3,
        "rcvLineId": "530337131-3",
        "itemCode": "PPR3000774BSF",
        "itemDesc": "801844JA0A BRKT-FR DOOR GUARD RR,RH",
        "qty": 400,
        "uom": "Piece",
        "unitPrice": 5.34,
        "lineAmount": 2136,
        "qtyBilled": 400,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43041240",
          "ITEM_CODE": "PPR3000774BSF",
          "SHIPMENT_NUM": "112603889",
          "PACKING_SLIP": "112603889",
          "QTY_BILLED": "400"
        }
      },
      {
        "poNumber": "43041240",
        "receiptNum": "530337131",
        "lineNo": 4,
        "rcvLineId": "530337131-4",
        "itemCode": "PPR3000773BSF",
        "itemDesc": "801924JA0A BRKT-FR DOOR GUARD A",
        "qty": 2000,
        "uom": "Piece",
        "unitPrice": 1.25,
        "lineAmount": 2500,
        "qtyBilled": 2000,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43041240",
          "ITEM_CODE": "PPR3000773BSF",
          "SHIPMENT_NUM": "112603889",
          "PACKING_SLIP": "112603889",
          "QTY_BILLED": "2000"
        }
      },
      {
        "poNumber": "43041240",
        "receiptNum": "530337131",
        "lineNo": 5,
        "rcvLineId": "530337131-5",
        "itemCode": "PPR3000775BSF",
        "itemDesc": "801854JA0A BRKT-FR DOOR GUARD RR,LH",
        "qty": 400,
        "uom": "Piece",
        "unitPrice": 5.34,
        "lineAmount": 2136,
        "qtyBilled": 400,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43041240",
          "ITEM_CODE": "PPR3000775BSF",
          "SHIPMENT_NUM": "112603889",
          "PACKING_SLIP": "112603889",
          "QTY_BILLED": "400"
        }
      },
      {
        "poNumber": "43041240",
        "receiptNum": "530337131",
        "lineNo": 6,
        "rcvLineId": "530337131-6",
        "itemCode": "PPR3000878BSF",
        "itemDesc": "764354JG0C BRACE-SILL OTR,LH (PRESS;SF-B)",
        "qty": 600,
        "uom": "Piece",
        "unitPrice": 6.98,
        "lineAmount": 4188,
        "qtyBilled": 600,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43041240",
          "ITEM_CODE": "PPR3000878BSF",
          "SHIPMENT_NUM": "112603889",
          "PACKING_SLIP": "112603889",
          "QTY_BILLED": "600"
        }
      },
      {
        "poNumber": "43041240",
        "receiptNum": "530337131",
        "lineNo": 7,
        "rcvLineId": "530337131-7",
        "itemCode": "PSA3000388BFG",
        "itemDesc": "762904JA0A BRKT ASSY-FR FDR (ASSY;FG-BUY)",
        "qty": 800,
        "uom": "Piece",
        "unitPrice": 2.07,
        "lineAmount": 1656,
        "qtyBilled": 800,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43041240",
          "ITEM_CODE": "PSA3000388BFG",
          "SHIPMENT_NUM": "112603889",
          "PACKING_SLIP": "112603889",
          "QTY_BILLED": "800"
        }
      },
      {
        "poNumber": "43041240",
        "receiptNum": "530337131",
        "lineNo": 8,
        "rcvLineId": "530337131-8",
        "itemCode": "PPR3000902BSF",
        "itemDesc": "764364JT0C REINF ASSY-SILL OTR,RH (PRESS;SF-B)",
        "qty": 240,
        "uom": "Piece",
        "unitPrice": 9.61,
        "lineAmount": 2306.4,
        "qtyBilled": 240,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43041240",
          "ITEM_CODE": "PPR3000902BSF",
          "SHIPMENT_NUM": "112603889",
          "PACKING_SLIP": "112603889",
          "QTY_BILLED": "240"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:42:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-54",
    "company": "AHP",
    "vendor": "บริษัท อาปีโก ฮีเทค จำกัด",
    "stax": "0145556001111",
    "inv": "112603888",
    "dt": "2026-09-09",
    "total": 29965.48,
    "sub": 28005.12,
    "vat": 1960.36,
    "po": "43041240",
    "rcv": "530337132",
    "org": 176,
    "oname": "AAPICO HITECH PARTS COMPANY LIMITED",
    "sig": [
      0,
      0
    ],
    "rtotal": 28005.12,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530337132 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "WARN",
        "result": "manual_review",
        "detail": "ความมั่นใจต่ำ: ['receiver', 'deliverer']"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 28,005.12 = receipt 28,005.12"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "PPR3000952BSF 74362 5JS0A BRKT-BODY MTG,2ND RH 43041240-220",
        "qty": 576,
        "unit": "PCS",
        "price": 24.31,
        "amount": 14002.56,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 576,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "PPR3000953BSF 74363 5JS0A BRKT-BODY MTG,2ND LH 43041240-220",
        "qty": 576,
        "unit": "PCS",
        "price": 24.31,
        "amount": 14002.56,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 576,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43041240",
        "receiptNum": "530337132",
        "lineNo": 1,
        "rcvLineId": "530337132-1",
        "itemCode": "PPR3000952BSF",
        "itemDesc": "743625JS0A BRKT-BODY MTG,2ND RH (PRESS;B-SF)",
        "qty": 576,
        "uom": "Piece",
        "unitPrice": 24.31,
        "lineAmount": 14002.56,
        "qtyBilled": 576,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43041240",
          "ITEM_CODE": "PPR3000952BSF",
          "SHIPMENT_NUM": "112603888",
          "PACKING_SLIP": "112603888",
          "QTY_BILLED": "576"
        }
      },
      {
        "poNumber": "43041240",
        "receiptNum": "530337132",
        "lineNo": 2,
        "rcvLineId": "530337132-2",
        "itemCode": "PPR3000953BSF",
        "itemDesc": "743635JS0A BRKT-BODY MTG,2ND LH (PRESS;B-SF)",
        "qty": 576,
        "uom": "Piece",
        "unitPrice": 24.31,
        "lineAmount": 14002.56,
        "qtyBilled": 576,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43041240",
          "ITEM_CODE": "PPR3000953BSF",
          "SHIPMENT_NUM": "112603888",
          "PACKING_SLIP": "112603888",
          "QTY_BILLED": "576"
        }
      }
    ],
    "pages": 2,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:41:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-55",
    "company": "AHP",
    "vendor": "บริษัท อาปิโก ไฮเทค จำกัด (มหาชน)",
    "stax": "0107545000179",
    "inv": "691319070",
    "dt": "2026-09-07",
    "total": 4536.8,
    "sub": 4240,
    "vat": 296.8,
    "po": "43042818",
    "rcv": "530337020",
    "org": 176,
    "oname": "AAPICO HITECH PARTS COMPANY LIMITED",
    "sig": [
      0,
      0
    ],
    "rtotal": 4240,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530337020 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "WARN",
        "result": "manual_review",
        "detail": "ความมั่นใจต่ำ: ['receiver', 'deliverer']"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 4,240.00 = receipt 4,240"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "PPR3000158A 93795EB70A REINF HOOK ROPE 43042818-215-33205920",
        "qty": 1600,
        "unit": "PCS",
        "price": 2.65,
        "amount": 4240,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1600,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43042818",
        "receiptNum": "530337020",
        "lineNo": 1,
        "rcvLineId": "530337020-1",
        "itemCode": "PPR3000158A",
        "itemDesc": "93795EB70A REINF HOOK ROPE (PRESS)",
        "qty": 1600,
        "uom": "Piece",
        "unitPrice": 2.65,
        "lineAmount": 4240,
        "qtyBilled": 1600,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43042818",
          "ITEM_CODE": "PPR3000158A",
          "SHIPMENT_NUM": "691319070",
          "PACKING_SLIP": "691319070",
          "QTY_BILLED": "1600"
        }
      }
    ],
    "pages": 2,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:41:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-56",
    "company": "AHP",
    "vendor": "บริษัท อาปิโก ไฮเทค จำกัด (มหาชน)",
    "stax": "0107545000179",
    "inv": "691319071",
    "dt": "2026-09-07",
    "total": 16611.75,
    "sub": 15525,
    "vat": 1086.75,
    "po": "43042818",
    "rcv": "530337019",
    "org": 176,
    "oname": "AAPICO HITECH PARTS COMPANY LIMITED",
    "sig": [
      0,
      1
    ],
    "rtotal": 15525,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530337019 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "WARN",
        "result": "manual_review",
        "detail": "ความมั่นใจต่ำ: ['receiver', 'deliverer']"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 15,525.00 = receipt 15,525"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "PPR3000411A 745101HJ0A PLATE RR FLOOR 43042818-216-33205921",
        "qty": 2700,
        "unit": "PCS",
        "price": 5.75,
        "amount": 15525,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 2700,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43042818",
        "receiptNum": "530337019",
        "lineNo": 1,
        "rcvLineId": "530337019-1",
        "itemCode": "PPR3000411A",
        "itemDesc": "745101HJ0A PLATE RR FLOOR (PRESS, SF-M)",
        "qty": 2700,
        "uom": "Piece",
        "unitPrice": 5.75,
        "lineAmount": 15525,
        "qtyBilled": 2700,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43042818",
          "ITEM_CODE": "PPR3000411A",
          "SHIPMENT_NUM": "691319071",
          "PACKING_SLIP": "691319071",
          "QTY_BILLED": "2700"
        }
      }
    ],
    "pages": 2,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:41:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-57",
    "company": "AHP",
    "vendor": "บริษัท อาปิโกไฮเทค พูหลิ่ง จำกัด",
    "stax": "0145548001557",
    "inv": "132600164",
    "dt": "2026-09-08",
    "total": 3355.52,
    "sub": 3136,
    "vat": 219.52,
    "po": "43043121",
    "rcv": "530337096",
    "org": 176,
    "oname": "AAPICO HITECH PARTS CO., LTD.",
    "sig": [
      0,
      1
    ],
    "rtotal": 3136,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530337096 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "WARN",
        "result": "manual_review",
        "detail": "ความมั่นใจต่ำ: ['deliverer']"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 3,136.00 = receipt 3,136"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "PPR3001715MFG 55292D070P BRKT-LWR LINK, REINF 43043121",
        "qty": 320,
        "unit": "PCS",
        "price": 9.8,
        "amount": 3136,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 320,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43043121",
        "receiptNum": "530337096",
        "lineNo": 1,
        "rcvLineId": "530337096-1",
        "itemCode": "PPR3001715MFG",
        "itemDesc": "55292D070P BRKT-LWR LINK, REINF (PRESS ; FG-M)(MMTh/AA 5K45)",
        "qty": 320,
        "uom": "Piece",
        "unitPrice": 9.8,
        "lineAmount": 3136,
        "qtyBilled": 320,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHP PC 06, K.Naruemon K.",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43043121",
          "ITEM_CODE": "PPR3001715MFG",
          "SHIPMENT_NUM": "132600164",
          "QTY_BILLED": "320"
        }
      }
    ],
    "pages": 2,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:41:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHP PC 06, K.Naruemon K."
  },
  {
    "doc": "DMS-58",
    "company": "AHP",
    "vendor": "บริษัท ซัมมิท แอดวานซ์ แมททีเรียล จำกัด Summit Advanced Materials Co., Ltd.",
    "stax": "0115533000479",
    "inv": "260900159",
    "dt": "2026-09-01",
    "total": 14049.1,
    "sub": 13130,
    "vat": 919.1,
    "po": "43042329",
    "rcv": "530337111",
    "org": 176,
    "oname": "บริษัท อาปิโก ไฮเทค พาร์ทส์ จำกัด",
    "sig": [
      0,
      1
    ],
    "rtotal": 13130,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E10"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530337111 (INV-BY-PO-VENDOR)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "WARN",
        "result": "manual_review",
        "detail": "ความมั่นใจต่ำ: ['deliverer']"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "Line Arithmetic Inconsistency",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 1 (Invoice: SUH409L-2D 0.80 X 154.00 X 210.00 Pack 26F2086653 /26F2086654): หน่วยนับต่างกลุ่มหลังแปลง (Inv: Pcs→PCS, Rcv: Sheet→SHT)",
        "exception_code": "E10",
        "severity": "Medium",
        "actual": "PCS",
        "expected": "SHT",
        "page": 1,
        "bbox": {
          "x": 0.7742,
          "y": 0.3734,
          "w": 0.0968,
          "h": 0.0371,
          "page": 1
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "WARN",
        "result": "manual_review",
        "detail": "AI/facts ไม่สอดคล้อง หรือเทียบจำนวนไม่ได้"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 13,130.00 = receipt 13,130"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "SUH409L-2D 0.80 X 154.00 X 210.00 Pack 26F2086653 /26F2086654",
        "qty": 1000,
        "unit": "PCS",
        "price": 13.13,
        "amount": 13130,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 1000,
        "match_level": "M3"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43042329",
        "receiptNum": "530337111",
        "lineNo": 1,
        "rcvLineId": "530337111-1",
        "itemCode": "SRM3001285B",
        "itemDesc": "SUH409L-2D 0.8 X 154 X 210 (SCAL P60A) (TRADING)",
        "qty": 1000,
        "uom": "Sheet",
        "unitPrice": 13.13,
        "lineAmount": 13130,
        "qtyBilled": 1000,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHP PC 02, K.Supannee Y.",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43042329",
          "ITEM_CODE": "SRM3001285B",
          "SHIPMENT_NUM": "260900159",
          "PACKING_SLIP": "260900159",
          "QTY_BILLED": "1000"
        }
      }
    ],
    "pages": 4,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:50:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHP PC 02, K.Supannee Y."
  },
  {
    "doc": "DMS-59",
    "company": "AHP",
    "vendor": "ยูไนเต็ดคอยล์เซ็นเตอร์ จำกัด UNITED COIL CENTER LIMITED",
    "stax": "010552110157",
    "inv": "A26I0186",
    "dt": "2026-09-01",
    "total": 117355.46,
    "sub": 109678,
    "vat": 7677.46,
    "po": "43042912",
    "rcv": "530337115",
    "org": 176,
    "oname": "บริษัท ไทยเท็คซ์ อินโนเวชั่น จำกัด สำนักงานใหญ่",
    "sig": [
      0,
      1
    ],
    "rtotal": 109678,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E13",
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: customer_name(LOW_CONFIDENCE), customer_address(LOW_CONFIDENCE), customer_tax_id(INVALID_FORMAT:TAX_ID_CHECKSUM), L1.qty(CONFLICT_BETWEEN_SOURCES), L1.unit_price(CONFLICT_BETWEEN_SOURCES), L1.amount(CONFLICT_BETWEEN_SOURCES)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.56,
          "y": 0.225,
          "w": 0.04,
          "h": 0.015,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ยอดรวมหรือราคารวมต่อรายการอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530337115 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "Tax ID ลูกค้าอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "WARN",
        "result": "manual_review",
        "detail": "ความมั่นใจต่ำ: ['deliverer']"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "GR Quantity Exceeded",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 1 (Invoice: CR.SP152-410BQ 01204D 766309 5KAGA DUE 01/09/2026): ระบุบรรทัดในใบรับไม่ได้",
        "exception_code": "E13",
        "severity": "High",
        "page": 1,
        "bbox": {
          "x": 0.1,
          "y": 0.005,
          "w": 0.7,
          "h": 0.74,
          "page": 1
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 109,678.00 = receipt 109,678"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "CR.SP152-410BQ 01204D 766309 5KAGA DUE 01/09/2026",
        "qty": 0,
        "unit": "KG",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 2,
        "desc": "W26H0616SB01 1204B 76638/9 5KA0A DUE 01/09/2026 CR SP152-440BQ 0.80 X 1,100.00X C",
        "qty": 3050,
        "unit": "KG",
        "price": 35.96,
        "amount": 109678,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 3050,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43042912",
        "receiptNum": "530337115",
        "lineNo": 1,
        "rcvLineId": "530337115-1",
        "itemCode": "SRM3001204B",
        "itemDesc": "SP152-440BQ 0.8 X 1100 X COIL P60A T-PROJECT (TRADING)",
        "qty": 3050,
        "uom": "Kilogram",
        "unitPrice": 35.96,
        "lineAmount": 109678,
        "qtyBilled": 3050,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHP PC 02, K.Supannee Y.",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43042912",
          "ITEM_CODE": "SRM3001204B",
          "SHIPMENT_NUM": "A26I0186",
          "PACKING_SLIP": "A26I0186",
          "QTY_BILLED": "3050"
        }
      }
    ],
    "pages": 4,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:56:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด High",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHP PC 02, K.Supannee Y."
  },
  {
    "doc": "DMS-60",
    "company": "AHP",
    "vendor": "SUMISHO METAL (THAILAND) CO.",
    "stax": "0105523016402",
    "inv": "D268T006839",
    "dt": "2026-09-01",
    "total": 315912.45,
    "sub": 295245.28,
    "vat": 20667.17,
    "po": "43030473",
    "rcv": "530336771",
    "org": 176,
    "oname": "บริษัท อาปิโก ไฮเทค พาร์ทส์ จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 295245.28,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530336771 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 295,245.28 = receipt 295,245.28"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "MB3B-41111K34/35-A FILL FLR TNL REINF RH/LH WSS-M1A367-A45 2.00x940.00xC 667877",
        "qty": 3006,
        "unit": "KG",
        "price": 49.94,
        "amount": 150119.64,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 5912,
        "match_level": "M3"
      },
      {
        "no": 2,
        "desc": "MB3B-41111K34/35-A FILL FLR TNL REINF RH/LH WSS-M1A367-A45 2.00x940.00xC 667877",
        "qty": 2906,
        "unit": "KG",
        "price": 49.94,
        "amount": 145125.64,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 5912,
        "match_level": "M3"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43030473",
        "receiptNum": "530336771",
        "lineNo": 1,
        "rcvLineId": "530336771-1",
        "itemCode": "PRM3001198B",
        "itemDesc": "WSS-M1A367-A45 2.0 X 940 X COIL AAT-FORD (P703/U704)",
        "qty": 5912,
        "uom": "Kilogram",
        "unitPrice": 49.94,
        "lineAmount": 295245.28,
        "qtyBilled": 5912,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHP PC 02, K.Supannee Y.",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43030473",
          "ITEM_CODE": "PRM3001198B",
          "SHIPMENT_NUM": "T-26090007",
          "PACKING_SLIP": "T-26090007",
          "QTY_BILLED": "5912"
        }
      }
    ],
    "pages": 8,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:53:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHP PC 02, K.Supannee Y."
  },
  {
    "doc": "DMS-61",
    "company": "AHP",
    "vendor": "POSCO (Thailand) Co.,Ltd.",
    "stax": "0105540007475",
    "inv": "S22026090100016",
    "dt": "2026-09-01",
    "total": 26180.76,
    "sub": 24468,
    "vat": 1712.76,
    "po": "43040853",
    "rcv": "530336778",
    "org": 176,
    "oname": "AAPICO HITECH PARTS CO.,LTD.",
    "sig": [
      1,
      1
    ],
    "rtotal": 24468,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530336778 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 24,468.00 = receipt 24,468"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "CR Sheet 31B196474A1B2 SP121BQ 0.70x960.00x685 PRM30001175B",
        "qty": 200,
        "unit": "SHT",
        "price": 122.34,
        "amount": 24468,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 200,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43040853",
        "receiptNum": "530336778",
        "lineNo": 1,
        "rcvLineId": "530336778-1",
        "itemCode": "PRM3001175B",
        "itemDesc": "SP121BQ 0.7 X 960 X 685 (P60A T-PROJECT)",
        "qty": 200,
        "uom": "Sheet",
        "unitPrice": 122.34,
        "lineAmount": 24468,
        "qtyBilled": 200,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHP PC 02, K.Supannee Y.",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43040853",
          "ITEM_CODE": "PRM3001175B",
          "SHIPMENT_NUM": "S22026090100016",
          "PACKING_SLIP": "S22026090100016",
          "QTY_BILLED": "200"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:48:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHP PC 02, K.Supannee Y."
  },
  {
    "doc": "DMS-62",
    "company": "AHP",
    "vendor": "บริษัท เอ็มซี เมทัลเซอร์วิส เอเชีย (ประเทศไทย) จำกัด MC METAL SERVICE ASIA (THAILAND) CO., LTD.",
    "stax": "0105540070207",
    "inv": "312609010351",
    "dt": "—",
    "total": 245877.87,
    "sub": 229792.4,
    "vat": 16085.47,
    "po": "43042727",
    "rcv": "530336784",
    "org": 176,
    "oname": "AAPICO HITECH PARTS COMPANY LIMITED",
    "sig": [
      1,
      1
    ],
    "rtotal": 229792.4,
    "status": "Hold",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E03",
      "E13"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 3 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "Total Mismatch",
        "status": "FAIL",
        "result": "fail",
        "detail": "ยอดรวมภายในใบแจ้งหนี้ไม่สอดคล้อง {'lines_vs_sub_total': '114896.20', 'vat_7pct': '0.00', 'sub_plus_vat_vs_grand': '0.00'}",
        "exception_code": "E03",
        "severity": "High",
        "actual": "229792.40",
        "expected": "344688.60",
        "page": 1,
        "bbox": {
          "x": 0.54,
          "y": 0.2,
          "w": 0.19,
          "h": 0.03,
          "page": 1
        }
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530336784 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "GR Quantity Exceeded",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 3 (Invoice: JSH440W-P 3.80Dx573.0xC BHA64015/BHA63654S BRKT,SUS.I,WR,OUTER, 4X4, LH/RH): ระบุบรรทัดในใบรับไม่ได้",
        "exception_code": "E13",
        "severity": "High",
        "page": 2,
        "bbox": {
          "x": 0.3,
          "y": 0.662,
          "w": 0.432,
          "h": 0.15,
          "page": 2
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 229,792.40 = receipt 229,792.4"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "JSH440W-P 3,600x573.0xC BHA64015/BHA63654S BRKT;SUS;LWR;OUTER; 4X4; LHRH",
        "qty": 3995,
        "unit": "KG",
        "price": 28.76,
        "amount": 114896.2,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 7990,
        "match_level": "M3"
      },
      {
        "no": 2,
        "desc": "JSH440W-P 3,600x573.0xC BHA64015/BHA63654S BRKT;SUS;LWR;OUTER; 4X4; LHRH",
        "qty": 3995,
        "unit": "KG",
        "price": 28.76,
        "amount": 114896.2,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 7990,
        "match_level": "M3"
      },
      {
        "no": 3,
        "desc": "JSH440W-P 3.80Dx573.0xC BHA64015/BHA63654S BRKT,SUS.I,WR,OUTER, 4X4, LH/RH",
        "qty": 3995,
        "unit": "KG",
        "price": 28.76,
        "amount": 114896.2,
        "diff": true,
        "match_level": "NONE"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43042727",
        "receiptNum": "530336784",
        "lineNo": 1,
        "rcvLineId": "530336784-1",
        "itemCode": "PRM3000997B",
        "itemDesc": "JSH440W-P 3.6 X 573 X COIL (ASP 20TF)",
        "qty": 7990,
        "uom": "Kilogram",
        "unitPrice": 28.76,
        "lineAmount": 229792.4,
        "qtyBilled": 7990,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHP PC 02, K.Supannee Y.",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43042727",
          "ITEM_CODE": "PRM3000997B",
          "SHIPMENT_NUM": "312609010351",
          "PACKING_SLIP": "312609010351",
          "QTY_BILLED": "7990"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:55:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Hold · ความรุนแรงสูงสุด High",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHP PC 02, K.Supannee Y."
  },
  {
    "doc": "DMS-63",
    "company": "AHP",
    "vendor": "POSCO (Thailand) Co.,Ltd.",
    "stax": "0105540007475",
    "inv": "S32026090100068",
    "dt": "2026-09-01",
    "total": 10483.86,
    "sub": 9798,
    "vat": 685.86,
    "po": "43040853",
    "rcv": "530336807",
    "org": 176,
    "oname": "AAPICO HITECH PARTS CO.,LTD.",
    "sig": [
      1,
      1
    ],
    "rtotal": 9798,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530336807 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 9,798.00 = receipt 9,798"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "GA Sheet 31C189756A3A2 SP781BQ 0.55x240.00x880 PRM3000842B",
        "qty": 300,
        "unit": "SHT",
        "price": 32.66,
        "amount": 9798,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 300,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43040853",
        "receiptNum": "530336807",
        "lineNo": 1,
        "rcvLineId": "530336807-1",
        "itemCode": "PRM3000842B",
        "itemDesc": "SP781BQ 0.55 X 240 X 880 (NMT H60A)",
        "qty": 300,
        "uom": "Sheet",
        "unitPrice": 32.66,
        "lineAmount": 9798,
        "qtyBilled": 300,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHP PC 02, K.Supannee Y.",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43040853",
          "ITEM_CODE": "PRM3000842B",
          "SHIPMENT_NUM": "S32026090100068",
          "PACKING_SLIP": "S32026090100068",
          "QTY_BILLED": "300"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:49:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHP PC 02, K.Supannee Y."
  },
  {
    "doc": "DMS-64",
    "company": "AHP",
    "vendor": "MC METAL SERVICE ASIA (THAILAND) CO., LTD.",
    "stax": "0105540070207",
    "inv": "312609020165",
    "dt": "—",
    "total": 217381.88,
    "sub": 203160.64,
    "vat": 14221.24,
    "po": "43042727",
    "rcv": "530336870",
    "org": 176,
    "oname": "AAPICO HITECH PARTS COMPANY LIMITED",
    "sig": [
      1,
      1
    ],
    "rtotal": 203160.64,
    "status": "Hold",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E13",
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: L3.qty(CONFLICT_BETWEEN_SOURCES), L3.uom(NOT_PRESENT), L3.unit_price(CONFLICT_BETWEEN_SOURCES), L3.amount(CONFLICT_BETWEEN_SOURCES), L4.qty(CONFLICT_BETWEEN_SOURCES), L4.uom(NOT_PRESENT), L4.unit_price(CONFLICT_BETWEEN_SOURCES), L4.amount(CONFLICT_BETWEEN_SOURCES)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 3,
        "bbox": {
          "x": 0.47,
          "y": 0.833,
          "w": 0.012,
          "h": 0.015,
          "page": 3
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ยอดรวมหรือราคารวมต่อรายการอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530336870 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "GR Quantity Exceeded",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 3 (Invoice: JSH440W-P 3.60Dx391.0xC BHA62147/BHA62177S BRKT; RR SPRG FRT 4x4 INNER, LH/): ระบุบรรทัดในใบรับไม่ได้",
        "exception_code": "E13",
        "severity": "High",
        "page": 3,
        "bbox": {
          "x": 0.352,
          "y": 0.808,
          "w": 0.38,
          "h": 0.072,
          "page": 3
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 203,160.64 = receipt 203,160.64"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "JSH440WLP 3,600x3910xC BHA62147/BHA62177S BRKT; RR SPRG FRT 4x4 INNER, LH/",
        "qty": 3532,
        "unit": "KG",
        "price": 28.76,
        "amount": 101580.32,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 7064,
        "match_level": "M3"
      },
      {
        "no": 2,
        "desc": "JSH440WLP 3,600x3910xC BHA62147/BHA62177S BRKT; RR SPRG FRT 4x4 INNER, LH/",
        "qty": 3532,
        "unit": "KG",
        "price": 28.76,
        "amount": 101580.32,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 7064,
        "match_level": "M3"
      },
      {
        "no": 3,
        "desc": "JSH440W-P 3.60Dx391.0xC BHA62147/BHA62177S BRKT; RR SPRG FRT 4x4 INNER, LH/",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 4,
        "desc": "JSH440W-P 3.60Dx391.0xC BHA62147/BHA62177S BRKT; RR SPRG FRT 4x4 INNER, LH/",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43042727",
        "receiptNum": "530336870",
        "lineNo": 1,
        "rcvLineId": "530336870-1",
        "itemCode": "PRM3001002B",
        "itemDesc": "JSH440W-P 3.6 X 391 X COIL (ASP 20TF)",
        "qty": 7064,
        "uom": "Kilogram",
        "unitPrice": 28.76,
        "lineAmount": 203160.64,
        "qtyBilled": 7064,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHP PC 02, K.Supannee Y.",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43042727",
          "ITEM_CODE": "PRM3001002B",
          "SHIPMENT_NUM": "312609020165",
          "PACKING_SLIP": "312609020165",
          "QTY_BILLED": "7064"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:57:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Hold · ความรุนแรงสูงสุด High",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHP PC 02, K.Supannee Y."
  },
  {
    "doc": "DMS-65",
    "company": "AHP",
    "vendor": "บริษัท ซัมมิท แอดวานซ์ แมททีเรียล จำกัด Summit Advanced Materials Co., Ltd.",
    "stax": "0115533000479",
    "inv": "260900569",
    "dt": "2026-09-03",
    "total": 39443.01,
    "sub": 36862.63,
    "vat": 2580.38,
    "po": "43041696",
    "rcv": "530336886",
    "org": 176,
    "oname": "บริษัท อาปิโก ไฮเทค พาร์ทส์ จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 36862.630000000005,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530336886 (INV-BY-PO-VENDOR)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 36,862.63 = receipt 36,862.63"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "เหล็กค้างตัด 901485KA0A SP781BQ 1.20 X 180.00 X C REINF-BACK DOOR LOCK 1 Pack 26H2026467",
        "qty": 415,
        "unit": "KG",
        "price": 35.35,
        "amount": 14670.25,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 415,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "821825KA0A SP781BQ 1.20 X 335.00 X C BRKT-RR DOOR GUARD,FR RH 1 Pack 26A2077897",
        "qty": 618,
        "unit": "KG",
        "price": 35.91,
        "amount": 22192.38,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 618,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43041696",
        "receiptNum": "530336886",
        "lineNo": 1,
        "rcvLineId": "530336886-1",
        "itemCode": "PRM3000973B",
        "itemDesc": "SP781BQ 1.2 X 335 X COIL (NMT P60A)",
        "qty": 618,
        "uom": "Kilogram",
        "unitPrice": 35.91,
        "lineAmount": 22192.38,
        "qtyBilled": 618,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHP PC 02, K.Supannee Y.",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43041696",
          "ITEM_CODE": "PRM3000973B",
          "SHIPMENT_NUM": "260900569",
          "PACKING_SLIP": "260900569",
          "QTY_BILLED": "618"
        }
      },
      {
        "poNumber": "43041696",
        "receiptNum": "530336886",
        "lineNo": 2,
        "rcvLineId": "530336886-2",
        "itemCode": "PRM3000975B",
        "itemDesc": "SP781BQ 1.2 X 180 X COIL (NMT P60A)",
        "qty": 415,
        "uom": "Kilogram",
        "unitPrice": 35.35,
        "lineAmount": 14670.25,
        "qtyBilled": 415,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHP PC 02, K.Supannee Y.",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43041696",
          "ITEM_CODE": "PRM3000975B",
          "SHIPMENT_NUM": "260900569",
          "PACKING_SLIP": "260900569",
          "QTY_BILLED": "415"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:54:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHP PC 02, K.Supannee Y."
  },
  {
    "doc": "DMS-66",
    "company": "AHP",
    "vendor": "บริษัท บีทีดี ออโต้พาร์ท (ประเทศไทย) จำกัด BTD AUTOPART (THAILAND) COMPANY LIMITED",
    "stax": "0205557002730",
    "inv": "IV690900285",
    "dt": "2026-09-04",
    "total": 59881.48,
    "sub": 55964,
    "vat": 3917.48,
    "po": "43041243",
    "rcv": "530336929",
    "org": 176,
    "oname": "บริษัท อาซิโก ไฮเทค พาร์ทส์ จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 55964,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E10"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530336929 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "Line Arithmetic Inconsistency",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 1 (Invoice: 76472/73-4 UGOA . SP781-440BQ 1.0X1220X699 (BLANK)): หน่วยนับต่างกลุ่มหลังแปลง (Inv: PCS→PCS, Rcv: Sheet→SHT)",
        "exception_code": "E10",
        "severity": "Medium",
        "actual": "PCS",
        "expected": "SHT",
        "page": 1,
        "bbox": {
          "x": 0.01,
          "y": 0.41,
          "w": 0.94,
          "h": 0.025,
          "page": 1
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "WARN",
        "result": "manual_review",
        "detail": "AI/facts ไม่สอดคล้อง หรือเทียบจำนวนไม่ได้"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 55,964.00 = receipt 55,964"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "76472/73-4 UGOA . SP781-440BQ 1.0X1220X699 (BLANK)",
        "qty": 400,
        "unit": "PCS",
        "price": 139.91,
        "amount": 55964,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 400,
        "match_level": "M3"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43041243",
        "receiptNum": "530336929",
        "lineNo": 1,
        "rcvLineId": "530336929-1",
        "itemCode": "PBL3000247BSF",
        "itemDesc": "BLANK - 76472/73 4JG0A (NISSAN H60A)",
        "qty": 400,
        "uom": "Sheet",
        "unitPrice": 139.91,
        "lineAmount": 55964,
        "qtyBilled": 400,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43041243",
          "ITEM_CODE": "PBL3000247BSF",
          "SHIPMENT_NUM": "IV690900285",
          "PACKING_SLIP": "IV690900285",
          "QTY_BILLED": "400"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:54:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-67",
    "company": "AHP",
    "vendor": "JFE Shoji (Thailand) Ltd. (HEAD OFFICE)",
    "stax": "0105518000234",
    "inv": "6090259",
    "dt": "—",
    "total": 159446.35,
    "sub": 149015.28,
    "vat": 10431.07,
    "po": "43042621",
    "rcv": "530336814",
    "org": 176,
    "oname": "AAPICO HITECH PARTS CO.,LTD.",
    "sig": [
      1,
      1
    ],
    "rtotal": 149015.28,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 530336814 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 149,015.28 = receipt 149,015.28"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "PARTS NO/PARTS NAME P/O NO : 43042621-27 SP791Q 2.9000 X 226.00 X C MM 74363A020P/62A020P BRKT-BODY MTG 2ND LH/RH S11308031104 840.00KG S11308031105 840.00KG S11308031106 824.00KG S11308031107 824.00KG S11308031108 824.00KG DELIVERY TO: A04701 AAPICO HITECH PARTS CO.,LTD. REMARKS: DO NO.MSAT 1857009",
        "qty": 4152,
        "unit": "KG",
        "price": 35.89,
        "amount": 149015.28,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 4152,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "43042621",
        "receiptNum": "530336814",
        "lineNo": 1,
        "rcvLineId": "530336814-1",
        "itemCode": "PRM3001289B",
        "itemDesc": "SP791Q 2.9 x 226 x COIL (TOPRE 5F00 VAVE)",
        "qty": 4152,
        "uom": "Kilogram",
        "unitPrice": 35.89,
        "lineAmount": 149015.28,
        "qtyBilled": 4152,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHP PC 02, K.Supannee Y.",
        "ouName": "Aapico Hitech Parts Legal",
        "extra": {
          "PO_NUM": "43042621",
          "ITEM_CODE": "PRM3001289B",
          "SHIPMENT_NUM": "6090259",
          "PACKING_SLIP": "6090259",
          "QTY_BILLED": "4152"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:53:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHP PC 02, K.Supannee Y."
  },
  {
    "doc": "DMS-68",
    "company": "AHT",
    "vendor": "บริษัท โมดิด จำกัด MODIC CO., LTD.",
    "stax": "0105535143838",
    "inv": "DS69090351",
    "dt": "2026-09-08",
    "total": 1551.5,
    "sub": 1450,
    "vat": 101.5,
    "po": "42052729",
    "rcv": "50220043239",
    "org": 195,
    "oname": "บริษัท ฮาวิโก ไฮเทค พลัส จำกัด",
    "sig": [
      0,
      1
    ],
    "rtotal": 1450,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: customer_name(LOW_CONFIDENCE), customer_tax_id(INVALID_FORMAT:TAX_ID_CHECKSUM)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 2,
        "bbox": {
          "x": 0.08,
          "y": 0.215,
          "w": 0.245,
          "h": 0.017,
          "page": 2
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043239 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "Tax ID ลูกค้าอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "WARN",
        "result": "manual_review",
        "detail": "ความมั่นใจต่ำ: ['deliverer']"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 1,450.00 = receipt 1,450"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "URETHANE SPRING LA 20-200",
        "qty": 5,
        "unit": "PCS",
        "price": 145,
        "amount": 725,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 5,
        "match_level": "M4"
      },
      {
        "no": 2,
        "desc": "URETHANE SPRING C 20-200",
        "qty": 5,
        "unit": "PCS",
        "price": 145,
        "amount": 725,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 5,
        "match_level": "M4"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052729",
        "receiptNum": "50220043239",
        "lineNo": 1,
        "rcvLineId": "50220043239-1",
        "itemCode": "DCM0033336A",
        "itemDesc": "URETHANE SPRING\\LA 20-200\\MODIC",
        "qty": 5,
        "uom": "Piece",
        "unitPrice": 145,
        "lineAmount": 725,
        "qtyBilled": 5,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052729",
          "ITEM_CODE": "DCM0033336A",
          "SHIPMENT_NUM": "DS69090351",
          "PACKING_SLIP": "DS69090351",
          "QTY_BILLED": "5"
        }
      },
      {
        "poNumber": "42052729",
        "receiptNum": "50220043239",
        "lineNo": 2,
        "rcvLineId": "50220043239-2",
        "itemCode": "DCM0033337A",
        "itemDesc": "URETHANE SPRING\\C 20-200\\MODIC",
        "qty": 5,
        "uom": "Piece",
        "unitPrice": 145,
        "lineAmount": 725,
        "qtyBilled": 5,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052729",
          "ITEM_CODE": "DCM0033337A",
          "SHIPMENT_NUM": "DS69090351",
          "PACKING_SLIP": "DS69090351",
          "QTY_BILLED": "5"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:57:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-69",
    "company": "AHT",
    "vendor": "บริษัท ฟูจิมากิ สตีล (ประเทศไทย) จำกัด สำนักงานใหญ่ FUJIMAKI STEEL (THAILAND) CO., LTD. HEAD OFFICE",
    "stax": "0205554008923",
    "inv": "T260908-033",
    "dt": "2026-09-08",
    "total": 808.92,
    "sub": 756,
    "vat": 52.92,
    "po": "42052737",
    "rcv": "50220043241",
    "org": 195,
    "oname": "AAPICO HITECH TOOLING COMPANY LIMITED",
    "sig": [
      1,
      1
    ],
    "rtotal": 756,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043241 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 756.00 = receipt 756"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "Material Steel S50C F/P 40x60x360 6F DFG0011003A",
        "qty": 2,
        "unit": "PCS",
        "price": 378,
        "amount": 756,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 2,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052737",
        "receiptNum": "50220043241",
        "lineNo": 1,
        "rcvLineId": "50220043241-1",
        "itemCode": "DRM0034940A",
        "itemDesc": "FINISHED PLATE S50C\\40X60X360",
        "qty": 2,
        "uom": "Piece",
        "unitPrice": 378,
        "lineAmount": 756,
        "qtyBilled": 2,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052737",
          "ITEM_CODE": "DRM0034940A",
          "SHIPMENT_NUM": "T260908-033",
          "PACKING_SLIP": "T260908-033",
          "QTY_BILLED": "2"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:57:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-70",
    "company": "AHT",
    "vendor": "Hi Mach CNC Service Co.,Ltd.",
    "stax": "0105552115642",
    "inv": "IV2609005",
    "dt": "2026-09-08",
    "total": 18297,
    "sub": 17100,
    "vat": 1197,
    "po": "42052679",
    "rcv": "50220043251",
    "org": 195,
    "oname": "บริษัท อาปิโก ไฮเทค ทูลลิ่ง จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 17100,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043251 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 17,100.00 = receipt 17,100"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "REPAIR MOTOR CHIPCONVEYOR 'Liming' SV-A10 - S/N : M811629009 Note : CNC YCM EV1020A#10138",
        "qty": 1,
        "unit": "JOB",
        "price": 17100,
        "amount": 17100,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052679",
        "receiptNum": "50220043251",
        "lineNo": 1,
        "rcvLineId": "50220043251-1",
        "itemCode": null,
        "itemDesc": "SERVICE CHARGE FOR REPAIR YCM M/C",
        "qty": 1,
        "uom": "Job",
        "unitPrice": 17100,
        "lineAmount": 17100,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052679",
          "SHIPMENT_NUM": "IV2609005",
          "PACKING_SLIP": "IV2609005",
          "QTY_BILLED": "1"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:56:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-71",
    "company": "AHT",
    "vendor": "INTERTOOL TECHNOLOGIES COMPANY LIMITED",
    "stax": "0115533001629",
    "inv": "69A/18520",
    "dt": "2026-09-09",
    "total": 507.44,
    "sub": 474.24,
    "vat": 33.2,
    "po": "42052665",
    "rcv": "50220043261",
    "org": 195,
    "oname": "บริษัท อาปิโก ไฮเทค พูลลิ่ง จำกัด สำนักงานใหญ่",
    "sig": [
      1,
      1
    ],
    "rtotal": 474.24,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 3 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043261 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 474.24 = receipt 474.24"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "โครง BSA-W16-16-P7.16",
        "qty": 1,
        "unit": "PCS",
        "price": 159.6,
        "amount": 159.6,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M4"
      },
      {
        "no": 2,
        "desc": "โครง BSA-W16-20-P8.66",
        "qty": 1,
        "unit": "PCS",
        "price": 155.04,
        "amount": 155.04,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 3,
        "desc": "โครง BSA-W16-16-P8.96",
        "qty": 1,
        "unit": "PCS",
        "price": 159.6,
        "amount": 159.6,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 1,
        "match_level": "M4"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052665",
        "receiptNum": "50220043261",
        "lineNo": 1,
        "rcvLineId": "50220043261-1",
        "itemCode": "DCM0004201A",
        "itemDesc": "BUTTON DIE\\BSA-W16-16-P7.16\\INTERTOOL",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 159.6,
        "lineAmount": 159.6,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052665",
          "ITEM_CODE": "DCM0004201A",
          "SHIPMENT_NUM": "69A/18520",
          "PACKING_SLIP": "69A/18520",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42052665",
        "receiptNum": "50220043261",
        "lineNo": 2,
        "rcvLineId": "50220043261-2",
        "itemCode": "DCM0025776A",
        "itemDesc": "BUTTON DIE\\BSA-W16-20-P8.66\\INTERTOOL",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 155.04,
        "lineAmount": 155.04,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052665",
          "ITEM_CODE": "DCM0025776A",
          "SHIPMENT_NUM": "69A/18520",
          "PACKING_SLIP": "69A/18520",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42052665",
        "receiptNum": "50220043261",
        "lineNo": 3,
        "rcvLineId": "50220043261-3",
        "itemCode": "DCM0033311A",
        "itemDesc": "BUTTON DIES\\BSA-W16-16-P8.96\\INTERTOOL",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 159.6,
        "lineAmount": 159.6,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052665",
          "ITEM_CODE": "DCM0033311A",
          "SHIPMENT_NUM": "69A/18520",
          "PACKING_SLIP": "69A/18520",
          "QTY_BILLED": "1"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:00:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-72",
    "company": "AHT",
    "vendor": "บริษัท โอบอม เกจ เทคโนโลยี จำกัด",
    "stax": "0135556001820",
    "inv": "INV-6909035",
    "dt": "2026-09-08",
    "total": 79394,
    "sub": 74200,
    "vat": 5194,
    "po": "42050066",
    "rcv": "50220043265",
    "org": 195,
    "oname": "บริษัท อาปิโก ไฮเทค พลัส จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 74200,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 3 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043265 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "WARN",
        "result": "manual_review",
        "detail": "วางบิลเป็นงวด 3 บรรทัด (ยอดเงินตรงใบรับ แต่ราคา/จำนวนเป็นสัดส่วนงวด) — รอมาตรฐานกำหนด ให้คนตรวจ"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "WARN",
        "result": "manual_review",
        "detail": "AI/facts ไม่สอดคล้อง หรือเทียบจำนวนไม่ได้"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 74,200.00 = receipt 74,200"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "1. 71410-64P00-000 \\ C/F ASSY [D25-09-3197]",
        "qty": 1,
        "unit": "SET",
        "price": 49000,
        "amount": 49000,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 0.7,
        "match_level": "M4"
      },
      {
        "no": 2,
        "desc": "2. 71412-64P00-000 \\ C/F RH [D25-09-3207]",
        "qty": 1,
        "unit": "SET",
        "price": 12600,
        "amount": 12600,
        "diff": true,
        "gr_line": 2,
        "gr_qty": 0.7,
        "match_level": "M4"
      },
      {
        "no": 3,
        "desc": "3. 71413-64P00-000 \\ C/F LH [D25-09-3208]",
        "qty": 1,
        "unit": "SET",
        "price": 12600,
        "amount": 12600,
        "diff": true,
        "gr_line": 3,
        "gr_qty": 0.7,
        "match_level": "M4"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42050066",
        "receiptNum": "50220043265",
        "lineNo": 1,
        "rcvLineId": "50220043265-1",
        "itemCode": "DFG0010466A",
        "itemDesc": "71410-64P00-000 \\ C/F ASSY [D25-09-3197]",
        "qty": 0.7,
        "uom": "Set",
        "unitPrice": 70000,
        "lineAmount": 49000,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42050066",
          "ITEM_CODE": "DFG0010466A",
          "SHIPMENT_NUM": "INV-6909035",
          "PACKING_SLIP": "INV-6909035",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42050066",
        "receiptNum": "50220043265",
        "lineNo": 2,
        "rcvLineId": "50220043265-2",
        "itemCode": "DFG0010476A",
        "itemDesc": "71412-64P00-000 \\ C/F RH [D25-09-3207]",
        "qty": 0.7,
        "uom": "Set",
        "unitPrice": 18000,
        "lineAmount": 12600,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42050066",
          "ITEM_CODE": "DFG0010476A",
          "SHIPMENT_NUM": "INV-6909035",
          "PACKING_SLIP": "INV-6909035",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42050066",
        "receiptNum": "50220043265",
        "lineNo": 3,
        "rcvLineId": "50220043265-3",
        "itemCode": "DFG0010477A",
        "itemDesc": "71413-64P00-000 \\ C/F LH [D25-09-3208]",
        "qty": 0.7,
        "uom": "Set",
        "unitPrice": 18000,
        "lineAmount": 12600,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42050066",
          "ITEM_CODE": "DFG0010477A",
          "SHIPMENT_NUM": "INV-6909035",
          "PACKING_SLIP": "INV-6909035",
          "QTY_BILLED": "1"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:01:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-73",
    "company": "AHT",
    "vendor": "ASIAN ADVANCED TECHNICA CO.,LTD. HEAD OFFICE",
    "stax": "0105546003064",
    "inv": "169090263",
    "dt": "2026-09-08",
    "total": 2899.33,
    "sub": 2709.65,
    "vat": 189.68,
    "po": "42052758",
    "rcv": "50220043254",
    "org": 195,
    "oname": "บริษัท อาวิโก้ ไทเทค ทูลลิ่ง จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 2709.6499999999996,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 7 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043254 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 2,709.65 = receipt 2,709.65"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "HOOK : B-CHPL 25 #69A03",
        "qty": 4,
        "unit": "PCS",
        "price": 105,
        "amount": 420,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 4,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "SPRING GUIDE RETAINERS : B-SGC 19-40 #78A02",
        "qty": 10,
        "unit": "PCS",
        "price": 35,
        "amount": 350,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 10,
        "match_level": "M1"
      },
      {
        "no": 3,
        "desc": "RETAINER : B-AP-AP 13 #7RA02",
        "qty": 1,
        "unit": "PCS",
        "price": 283.5,
        "amount": 283.5,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 4,
        "desc": "STRIPPER GUIDE BUSHINGS : B-SGBH 16-25 #57",
        "qty": 4,
        "unit": "PCS",
        "price": 60,
        "amount": 240,
        "diff": false,
        "gr_line": 4,
        "gr_qty": 4,
        "match_level": "M1"
      },
      {
        "no": 5,
        "desc": "RETAINER : B-CPAR 16 #7RA01",
        "qty": 4,
        "unit": "PCS",
        "price": 189.8,
        "amount": 759.2,
        "diff": false,
        "gr_line": 5,
        "gr_qty": 4,
        "match_level": "M1"
      },
      {
        "no": 6,
        "desc": "STRIPPER GUIDE PINS : B-SGPH 16-90 #77A01",
        "qty": 4,
        "unit": "PCS",
        "price": 72,
        "amount": 288,
        "diff": false,
        "gr_line": 6,
        "gr_qty": 4,
        "match_level": "M1"
      },
      {
        "no": 7,
        "desc": "GUIDE POST SETS : B-MYP 32-130 #67A02 ( Project:AHD_AS (P703 BUNDLE 1.6), Task:06.2 - DFG0011021A )",
        "qty": 1,
        "unit": "PCS",
        "price": 368.95,
        "amount": 368.95,
        "diff": false,
        "gr_line": 7,
        "gr_qty": 1,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052758",
        "receiptNum": "50220043254",
        "lineNo": 1,
        "rcvLineId": "50220043254-1",
        "itemCode": "DCM0001895A",
        "itemDesc": "HOOK\\CHPL 25\\AAT",
        "qty": 4,
        "uom": "Piece",
        "unitPrice": 105,
        "lineAmount": 420,
        "qtyBilled": 4,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052758",
          "ITEM_CODE": "DCM0001895A",
          "SHIPMENT_NUM": "169090263",
          "PACKING_SLIP": "169090263",
          "QTY_BILLED": "4"
        }
      },
      {
        "poNumber": "42052758",
        "receiptNum": "50220043254",
        "lineNo": 2,
        "rcvLineId": "50220043254-2",
        "itemCode": "DCM0007392A",
        "itemDesc": "SPRING GUIDE RETAINER\\SGC 19-40\\AAT",
        "qty": 10,
        "uom": "Piece",
        "unitPrice": 35,
        "lineAmount": 350,
        "qtyBilled": 10,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052758",
          "ITEM_CODE": "DCM0007392A",
          "SHIPMENT_NUM": "169090263",
          "PACKING_SLIP": "169090263",
          "QTY_BILLED": "10"
        }
      },
      {
        "poNumber": "42052758",
        "receiptNum": "50220043254",
        "lineNo": 3,
        "rcvLineId": "50220043254-3",
        "itemCode": "DCM0024581A",
        "itemDesc": "END RETAINER SETS\\AP-AP 13\\AAT",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 283.5,
        "lineAmount": 283.5,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052758",
          "ITEM_CODE": "DCM0024581A",
          "SHIPMENT_NUM": "169090263",
          "PACKING_SLIP": "169090263",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42052758",
        "receiptNum": "50220043254",
        "lineNo": 4,
        "rcvLineId": "50220043254-4",
        "itemCode": "DCM0033379A",
        "itemDesc": "GUIDE BUSHING\\B-SGBH 16-25\\AAT",
        "qty": 4,
        "uom": "Piece",
        "unitPrice": 60,
        "lineAmount": 240,
        "qtyBilled": 4,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052758",
          "ITEM_CODE": "DCM0033379A",
          "SHIPMENT_NUM": "169090263",
          "PACKING_SLIP": "169090263",
          "QTY_BILLED": "4"
        }
      },
      {
        "poNumber": "42052758",
        "receiptNum": "50220043254",
        "lineNo": 5,
        "rcvLineId": "50220043254-5",
        "itemCode": "DCM0033380A",
        "itemDesc": "RETAINER\\B-CPAR 16\\AAT",
        "qty": 4,
        "uom": "Piece",
        "unitPrice": 189.8,
        "lineAmount": 759.2,
        "qtyBilled": 4,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052758",
          "ITEM_CODE": "DCM0033380A",
          "SHIPMENT_NUM": "169090263",
          "PACKING_SLIP": "169090263",
          "QTY_BILLED": "4"
        }
      },
      {
        "poNumber": "42052758",
        "receiptNum": "50220043254",
        "lineNo": 6,
        "rcvLineId": "50220043254-6",
        "itemCode": "DCM0033381A",
        "itemDesc": "GUIDE PIN\\B-SGPH 16-90\\AAT",
        "qty": 4,
        "uom": "Piece",
        "unitPrice": 72,
        "lineAmount": 288,
        "qtyBilled": 4,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052758",
          "ITEM_CODE": "DCM0033381A",
          "SHIPMENT_NUM": "169090263",
          "PACKING_SLIP": "169090263",
          "QTY_BILLED": "4"
        }
      },
      {
        "poNumber": "42052758",
        "receiptNum": "50220043254",
        "lineNo": 7,
        "rcvLineId": "50220043254-7",
        "itemCode": "DCM0032465A",
        "itemDesc": "GUIDE POST SET\\B-MYP 32-130\\AAT",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 368.95,
        "lineAmount": 368.95,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052758",
          "ITEM_CODE": "DCM0032465A",
          "SHIPMENT_NUM": "169090263",
          "PACKING_SLIP": "169090263",
          "QTY_BILLED": "1"
        }
      }
    ],
    "pages": 6,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:01:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-74",
    "company": "AHT",
    "vendor": "TOZZHIN INTERNATIONAL CORPORATION CO., LTD. (HEAD OFFICE)",
    "stax": "0105545014275",
    "inv": "IV260900997",
    "dt": "2026-09-08",
    "total": 1455.2,
    "sub": 1360,
    "vat": 95.2,
    "po": "42052762",
    "rcv": "50220043264",
    "org": 195,
    "oname": "AAPICO HITECH TOOLING COMPANY LIMITED.(HEAD OFFICE)",
    "sig": [
      1,
      1
    ],
    "rtotal": 1360,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043264 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 1,360.00 = receipt 1,360"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "S50C ,55 mm. x 240 mm. x 275 mm.",
        "qty": 1,
        "unit": "PCS",
        "price": 1360,
        "amount": 1360,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052762",
        "receiptNum": "50220043264",
        "lineNo": 1,
        "rcvLineId": "50220043264-1",
        "itemCode": "DRM0034948A",
        "itemDesc": "FINISHED PLATE S50C\\55X240X275",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 1360,
        "lineAmount": 1360,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052762",
          "ITEM_CODE": "DRM0034948A",
          "SHIPMENT_NUM": "IV260900997",
          "PACKING_SLIP": "IV260900997",
          "QTY_BILLED": "1"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "02:59:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-75",
    "company": "AHT",
    "vendor": "ASIAN ADVANCED TECHNICA CO.,LTD. HEAD OFFICE",
    "stax": "0105546003064",
    "inv": "169090282",
    "dt": "2026-09-09",
    "total": 1155.6,
    "sub": 1080,
    "vat": 75.6,
    "po": "42052769",
    "rcv": "50220043256",
    "org": 195,
    "oname": "บริษัท อาเซียน ไบโอเทค ฮูลิ่ง จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 1080,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043256 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 1,080.00 = receipt 1,080"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "LOCATING KEY : B-LK 20-LC40 ( Project:AHD_IMCT (RS00), Task:249.2 - DFG0011004A )",
        "qty": 6,
        "unit": "PCS",
        "price": 180,
        "amount": 1080,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 6,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052769",
        "receiptNum": "50220043256",
        "lineNo": 1,
        "rcvLineId": "50220043256-1",
        "itemCode": "DCM0018889A",
        "itemDesc": "LOCATING KEY\\LK 20-LC40\\AAT",
        "qty": 6,
        "uom": "Piece",
        "unitPrice": 180,
        "lineAmount": 1080,
        "qtyBilled": 6,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052769",
          "ITEM_CODE": "DCM0018889A",
          "SHIPMENT_NUM": "169090282",
          "PACKING_SLIP": "169090282",
          "QTY_BILLED": "6"
        }
      }
    ],
    "pages": 6,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:01:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-76",
    "company": "AHT",
    "vendor": "GKONCHAI KOLAKARN LTD., PART.",
    "stax": "0103522008471",
    "inv": "3792",
    "dt": "—",
    "total": 58.85,
    "sub": 55,
    "vat": 3.85,
    "po": "42052742",
    "rcv": "50220043236",
    "org": 195,
    "oname": "บริษัท อมรไกรโยธิน ทูลลิ่ง จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 55,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: po_number(CONFLICT_BETWEEN_SOURCES), customer_name(LOW_CONFIDENCE), customer_address(LOW_CONFIDENCE), customer_tax_id(INVALID_FORMAT:TAX_ID_CHECKSUM), L1.unit_price(CONFLICT_BETWEEN_SOURCES)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.712,
          "y": 0.43,
          "w": 0.033,
          "h": 0.022,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ไม่มีบรรทัดที่อ่านค่าครบ",
        "halted_by": "V-01"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043236 (TAX-INV-SUFFIX)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "Tax ID ลูกค้าอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "WARN",
        "result": "manual_review",
        "detail": "ความมั่นใจต่ำ: ['receiver']"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 55 = receipt 55"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "",
        "qty": 100,
        "unit": "PCS",
        "price": 0,
        "amount": 55,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 100,
        "match_level": "M3"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052742",
        "receiptNum": "50220043236",
        "lineNo": 1,
        "rcvLineId": "50220043236-1",
        "itemCode": "ACU0000301A",
        "itemDesc": "PLAIN WASHER M12",
        "qty": 100,
        "uom": "Piece",
        "unitPrice": 0.55,
        "lineAmount": 55,
        "qtyBilled": 100,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052742",
          "ITEM_CODE": "ACU0000301A",
          "PACKING_SLIP": "076/3792",
          "QTY_BILLED": "100"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:01:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-77",
    "company": "AH",
    "vendor": "ห.จ.ก. มงคลชัยกลการ สำนักงานใหญ่ MONGKONCHAI KOLAKARN LTD., PART.",
    "stax": "0103522008471",
    "inv": "3793",
    "dt": "—",
    "total": 454.75,
    "sub": 425,
    "vat": 29.75,
    "po": "40023970",
    "rcv": "510132380",
    "org": 101,
    "oname": "บริษัท อมรกิจโตโยต้า จำกัด อีหอด",
    "sig": [
      1,
      1
    ],
    "rtotal": 4025.3,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E03",
      "E13",
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: customer_name(LOW_CONFIDENCE), customer_address(LOW_CONFIDENCE), customer_tax_id(INVALID_FORMAT:TAX_ID_CHECKSUM), L1.uom(NOT_PRESENT), L2.uom(LOW_CONFIDENCE), L2.unit_price(INVALID_FORMAT:NOT_A_NUMBER), L2.amount(INVALID_FORMAT:NOT_A_NUMBER)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.11,
          "y": 0.315,
          "w": 0.465,
          "h": 0.023,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ยอดรวมหรือราคารวมต่อรายการอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 510132380 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "Tax ID ลูกค้าอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "WARN",
        "result": "manual_review",
        "detail": "ความมั่นใจต่ำ: ['receiver']"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "GR Quantity Exceeded",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 1 (Invoice: -): ระบุบรรทัดในใบรับไม่ได้",
        "exception_code": "E13",
        "severity": "High",
        "page": 1,
        "bbox": {
          "x": 0.115,
          "y": 0.408,
          "w": 0.845,
          "h": 0.037,
          "page": 1
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ทุกบรรทัดระบุคู่ในใบรับไม่ได้",
        "halted_by": "V-07"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "Total Mismatch",
        "status": "FAIL",
        "result": "fail",
        "detail": "ยอดก่อนภาษี 425 ≠ ยอดใบรับ 4025.3",
        "exception_code": "E03",
        "severity": "High",
        "actual": "425",
        "expected": "4025.3",
        "page": 1,
        "bbox": {
          "x": 0.675,
          "y": 0.718,
          "w": 0.285,
          "h": 0.027,
          "page": 1
        }
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "",
        "qty": 5,
        "unit": "",
        "price": 85,
        "amount": 425,
        "diff": false,
        "match_level": "NONE"
      },
      {
        "no": 2,
        "desc": "ลวดเชื่อม MB x 1 M. RM Po 42052707",
        "qty": 5,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": false,
        "match_level": "NONE"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "40023970",
        "receiptNum": "510132380",
        "lineNo": 1,
        "rcvLineId": "510132380-1",
        "itemCode": "AFS0000443A",
        "itemDesc": "APRON (JEANS) 70X120 CM.",
        "qty": 10,
        "uom": "Piece",
        "unitPrice": 74.03,
        "lineAmount": 740.3,
        "qtyBilled": 10,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AH PC 08, K.Jiraporn Parnpet",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40023970",
          "ITEM_CODE": "AFS0000443A",
          "QTY_BILLED": "10"
        }
      },
      {
        "poNumber": "40023970",
        "receiptNum": "510132380",
        "lineNo": 2,
        "rcvLineId": "510132380-2",
        "itemCode": "AFS0000286A",
        "itemDesc": "WATER WIPPER",
        "qty": 10,
        "uom": "Piece",
        "unitPrice": 328.5,
        "lineAmount": 3285,
        "qtyBilled": 10,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AH PC 08, K.Jiraporn Parnpet",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40023970",
          "ITEM_CODE": "AFS0000286A",
          "QTY_BILLED": "10"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:01:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด High",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AH PC 08, K.Jiraporn Parnpet"
  },
  {
    "doc": "DMS-78",
    "company": "AHT",
    "vendor": "บริษัท ป.สุณี เทรดดิ้ง จำกัด P.SUNEE TRADING CO., LTD.",
    "stax": "0105546047223",
    "inv": "IV69090226",
    "dt": "2026-09-08",
    "total": 4896.32,
    "sub": 4576,
    "vat": 320.32,
    "po": "42052744",
    "rcv": "50220043240",
    "org": 195,
    "oname": "บริษัท อาปิโก ไฮเทค พูลลิ่ง จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 4576,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043240 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 4,576.00 = receipt 4,576"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "แผ่นอะคริลิคใส 4'X 8' หนา 5MM",
        "qty": 2,
        "unit": "PCS",
        "price": 2288,
        "amount": 4576,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 2,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052744",
        "receiptNum": "50220043240",
        "lineNo": 1,
        "rcvLineId": "50220043240-1",
        "itemCode": "JRM0000544A",
        "itemDesc": "ACRYLIC SHEET (CLEAR)\\T4.76MMX4'X8'",
        "qty": 2,
        "uom": "Piece",
        "unitPrice": 2288,
        "lineAmount": 4576,
        "qtyBilled": 2,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052744",
          "ITEM_CODE": "JRM0000544A",
          "SHIPMENT_NUM": "IV69090226",
          "PACKING_SLIP": "IV69090226",
          "QTY_BILLED": "2"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:02:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-79",
    "company": "AHT",
    "vendor": "บริษัท จุถาวรณ จำกัด JUTHA WAN METAL LTD.",
    "stax": "0105521010334",
    "inv": "ITAM26900328",
    "dt": "2026-09-05",
    "total": 1048.6,
    "sub": 980,
    "vat": 68.6,
    "po": "42052703",
    "rcv": "50220043252",
    "org": 195,
    "oname": "บริษัท อาปิโก ไฮเทค พูลลิ่ง จำกัด (สำนักงานใหญ่)",
    "sig": [
      1,
      1
    ],
    "rtotal": 980,
    "status": "Review",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: customer_tax_id(NOT_PRESENT)",
        "exception_code": "E01",
        "severity": "Medium"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043252 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "Tax ID ลูกค้าอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 980.00 = receipt 980"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "MILLING S50C F 95X140X220 มม.",
        "qty": 1,
        "unit": "PCS",
        "price": 980,
        "amount": 980,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052703",
        "receiptNum": "50220043252",
        "lineNo": 1,
        "rcvLineId": "50220043252-1",
        "itemCode": "DRM0027878A",
        "itemDesc": "FINISHED PLATE S50C\\95X140X220",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 980,
        "lineAmount": 980,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052703",
          "ITEM_CODE": "DRM0027878A",
          "SHIPMENT_NUM": "ITAM26900328",
          "PACKING_SLIP": "ITAM26900328",
          "QTY_BILLED": "1"
        }
      }
    ],
    "pages": 2,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:01:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-80",
    "company": "AH",
    "vendor": "บริษัท ซัมมิท โอโต บอดี้ อินดัสตรี จำกัด SUMMIT AUTO BODY INDUSTRY CO., LTD.",
    "stax": "0105529036791",
    "inv": "AC4-1-001",
    "dt": "2026-09-11",
    "total": 28098.2,
    "sub": 26260,
    "vat": 1838.2,
    "po": "42037791",
    "rcv": "50220025613",
    "org": 195,
    "oname": "บริษัท ฮาโตโก ไทเทค จำกัด (มหาชน)",
    "sig": [
      1,
      1
    ],
    "rtotal": 51120,
    "status": "Hold",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E03",
      "E07",
      "E09",
      "E14",
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: customer_address(LOW_CONFIDENCE)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.028,
          "y": 0.232,
          "w": 0.492,
          "h": 0.026,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220025613 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "Customer Mismatch",
        "status": "FAIL",
        "result": "fail",
        "detail": "Tax ID ลูกค้า 0107545000179 ≠ 0145548001557 (ORG_ID 195)",
        "exception_code": "E07",
        "severity": "High",
        "actual": "0107545000179",
        "expected": "0145548001557",
        "page": 1,
        "bbox": {
          "x": 0.142,
          "y": 0.255,
          "w": 0.17,
          "h": 0.011,
          "page": 1
        }
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "Price Variance",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 1 (Invoice: CLAMP EVAPOLINE HOSE-UPR): ราคาต่างเกินกรอบ (Inv: 26.26, Rcv: 50.12)",
        "exception_code": "E09",
        "severity": "High",
        "actual": "26.26",
        "expected": "50.12",
        "page": 1,
        "bbox": {
          "x": 0.028,
          "y": 0.332,
          "w": 0.904,
          "h": 0.02,
          "page": 1
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "Tax Calculation Mismatch",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 1 (Invoice: CLAMP EVAPOLINE HOSE-UPR): จำนวนวางบิลเกินใบรับ (Inv: 1000, Rcv: 400)",
        "exception_code": "E14",
        "severity": "High",
        "actual": "1000",
        "page": 1,
        "bbox": {
          "x": 0.028,
          "y": 0.332,
          "w": 0.904,
          "h": 0.02,
          "page": 1
        }
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "Total Mismatch",
        "status": "FAIL",
        "result": "fail",
        "detail": "ยอดก่อนภาษี 26260.00 ≠ ยอดใบรับ 51120",
        "exception_code": "E03",
        "severity": "High",
        "actual": "26260.00",
        "expected": "51120",
        "page": 1,
        "bbox": {
          "x": 0.028,
          "y": 0.662,
          "w": 0.904,
          "h": 0.03,
          "page": 1
        }
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "CLAMP EVAPOLINE HOSE-UPR",
        "qty": 1000,
        "unit": "PCS",
        "price": 26.26,
        "amount": 26260,
        "diff": true,
        "gr_line": 2,
        "gr_qty": 400,
        "match_level": "M5"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42037791",
        "receiptNum": "50220025613",
        "lineNo": 1,
        "rcvLineId": "50220025613-1",
        "itemCode": "DCM0024841A",
        "itemDesc": "8978278900\\HOSE EVAPOLINE",
        "qty": 400,
        "uom": "Piece",
        "unitPrice": 77.68,
        "lineAmount": 31072,
        "qtyBilled": 400,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Engineering 01, K.Nampung S.",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42037791",
          "ITEM_CODE": "DCM0024841A",
          "SHIPMENT_NUM": "AC4-1-001",
          "QTY_BILLED": "400"
        }
      },
      {
        "poNumber": "42037791",
        "receiptNum": "50220025613",
        "lineNo": 2,
        "rcvLineId": "50220025613-2",
        "itemCode": "DCM0024842A",
        "itemDesc": "8982322660\\CLAMP; HOSE EVAPOLINE",
        "qty": 400,
        "uom": "Piece",
        "unitPrice": 50.12,
        "lineAmount": 20048,
        "qtyBilled": 400,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Engineering 01, K.Nampung S.",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42037791",
          "ITEM_CODE": "DCM0024842A",
          "SHIPMENT_NUM": "AC4-1-001",
          "QTY_BILLED": "400"
        }
      }
    ],
    "pages": 4,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:04:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Hold · ความรุนแรงสูงสุด High",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Engineering 01, K.Nampung S."
  },
  {
    "doc": "DMS-81",
    "company": "AH",
    "vendor": "บริษัท อาโอยาม่าไทย จำกัด AOYAMA THAI COMPANY LIMITED",
    "stax": "0115542000559",
    "inv": "A647410",
    "dt": "—",
    "total": 115591,
    "sub": 108029,
    "vat": 7562,
    "po": "40100303",
    "rcv": "510521931",
    "org": 101,
    "oname": "AAPICO HITECH PUBLIC COMPANY LIMITED",
    "sig": [
      1,
      1
    ],
    "rtotal": 108029,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E13",
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: L5.uom(NOT_PRESENT), L6.qty(CONFLICT_BETWEEN_SOURCES), L6.uom(NOT_PRESENT), L6.unit_price(INVALID_FORMAT:NOT_A_NUMBER), L6.amount(CONFLICT_BETWEEN_SOURCES), L7.uom(NOT_PRESENT), L8.uom(NOT_PRESENT)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 3,
        "bbox": {
          "x": 0.073,
          "y": 0.415,
          "w": 0.852,
          "h": 0.105,
          "page": 3
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 7 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ยอดรวมหรือราคารวมต่อรายการอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 510521931 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "GR Quantity Exceeded",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 5 (Invoice: 90119-T0136 BOLT): ระบุบรรทัดในใบรับไม่ได้",
        "exception_code": "E13",
        "severity": "High",
        "page": 3,
        "bbox": {
          "x": 0.073,
          "y": 0.415,
          "w": 0.852,
          "h": 0.105,
          "page": 3
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "WARN",
        "result": "manual_review",
        "detail": "AI/facts ไม่สอดคล้อง หรือเทียบจำนวนไม่ได้"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 108,029 = receipt 108,029"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "92616-60614 BOLT WELD M6X14 6T PO 40100303-265",
        "qty": 2000,
        "unit": "PCS",
        "price": 1,
        "amount": 2000,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 2000,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "90174-T0006 WELD NUT SQUARE M6 8N PO 40100303-265",
        "qty": 2000,
        "unit": "PCS",
        "price": 0.64,
        "amount": 1280,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 2000,
        "match_level": "M1"
      },
      {
        "no": 3,
        "desc": "90119-T0136 BOLT W/WASHER F/W M6X14 8T PO 40100303-265",
        "qty": 1500,
        "unit": "PCS",
        "price": 1.47,
        "amount": 2205,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1500,
        "match_level": "M1"
      },
      {
        "no": 4,
        "desc": "92616-60832 BOLT WELD M8X32 PO 40100303-265",
        "qty": 23200,
        "unit": "PCS",
        "price": 4.42,
        "amount": 102544,
        "diff": false,
        "gr_line": 4,
        "gr_qty": 23200,
        "match_level": "M1"
      },
      {
        "no": 5,
        "desc": "90119-T0136 BOLT",
        "qty": 1500,
        "unit": "",
        "price": 1.47,
        "amount": 2205,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 6,
        "desc": "90174-T0006 NUT WELD",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 7,
        "desc": "92616-60614 BOLT WELD M6",
        "qty": 2000,
        "unit": "",
        "price": 1,
        "amount": 2000,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 8,
        "desc": "92616-60832 BOLT WELD",
        "qty": 23200,
        "unit": "",
        "price": 4.42,
        "amount": 102544,
        "diff": true,
        "match_level": "NONE"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "40100303",
        "receiptNum": "510521931",
        "lineNo": 1,
        "rcvLineId": "510521931-1",
        "itemCode": "PCP0000321A",
        "itemDesc": "90119-T0136 BOLT",
        "qty": 1500,
        "uom": "Piece",
        "unitPrice": 1.47,
        "lineAmount": 2205,
        "qtyBilled": 1500,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40100303",
          "ITEM_CODE": "PCP0000321A",
          "SHIPMENT_NUM": "A647410",
          "PACKING_SLIP": "A647410",
          "QTY_BILLED": "1500"
        }
      },
      {
        "poNumber": "40100303",
        "receiptNum": "510521931",
        "lineNo": 2,
        "rcvLineId": "510521931-2",
        "itemCode": "PCP0000342A",
        "itemDesc": "90174-T0006 NUT WELD",
        "qty": 2000,
        "uom": "Piece",
        "unitPrice": 0.64,
        "lineAmount": 1280,
        "qtyBilled": 2000,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40100303",
          "ITEM_CODE": "PCP0000342A",
          "SHIPMENT_NUM": "A647410",
          "PACKING_SLIP": "A647410",
          "QTY_BILLED": "2000"
        }
      },
      {
        "poNumber": "40100303",
        "receiptNum": "510521931",
        "lineNo": 3,
        "rcvLineId": "510521931-3",
        "itemCode": "PCP0000341A",
        "itemDesc": "92616-60614 BOLT WELD M6",
        "qty": 2000,
        "uom": "Piece",
        "unitPrice": 1,
        "lineAmount": 2000,
        "qtyBilled": 2000,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40100303",
          "ITEM_CODE": "PCP0000341A",
          "SHIPMENT_NUM": "A647410",
          "PACKING_SLIP": "A647410",
          "QTY_BILLED": "2000"
        }
      },
      {
        "poNumber": "40100303",
        "receiptNum": "510521931",
        "lineNo": 4,
        "rcvLineId": "510521931-4",
        "itemCode": "PCP0000397A",
        "itemDesc": "92616-60832 BOLT WELD",
        "qty": 23200,
        "uom": "Piece",
        "unitPrice": 4.42,
        "lineAmount": 102544,
        "qtyBilled": 23200,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40100303",
          "ITEM_CODE": "PCP0000397A",
          "SHIPMENT_NUM": "A647410",
          "PACKING_SLIP": "A647410",
          "QTY_BILLED": "23200"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:08:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด High",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-82",
    "company": "AH",
    "vendor": "SUMMIT CHUGOKU SEIRA CO., LTD. (HEAD OFFICE)",
    "stax": "0105539055941",
    "inv": "IND2609-1049",
    "dt": "2026-09-11",
    "total": 12733,
    "sub": 11900,
    "vat": 833,
    "po": "40109933",
    "rcv": "510521941",
    "org": 101,
    "oname": "AAPICO HI-TECH PUBLIC CO.,LTD.",
    "sig": [
      1,
      1
    ],
    "rtotal": 11900,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 510521941 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 11,900.00 = receipt 11,900"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "Square weld nut",
        "qty": 14000,
        "unit": "PCS",
        "price": 0.85,
        "amount": 11900,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 14000,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "40109933",
        "receiptNum": "510521941",
        "lineNo": 1,
        "rcvLineId": "510521941-1",
        "itemCode": "PCP0000404A",
        "itemDesc": "9091140680 NUT;PROJECTION M8",
        "qty": 14000,
        "uom": "Piece",
        "unitPrice": 0.85,
        "lineAmount": 11900,
        "qtyBilled": 24000,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40109933",
          "ITEM_CODE": "PCP0000404A",
          "SHIPMENT_NUM": "IND2609-1049",
          "PACKING_SLIP": "IND2609-1049",
          "QTY_BILLED": "24000"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:05:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-83",
    "company": "AH",
    "vendor": "S.C. CNC. ENGINEERING CO.,LTD.",
    "stax": "0125547004676",
    "inv": "2609039",
    "dt": "2026-09-11",
    "total": 8699.64,
    "sub": 8130.5,
    "vat": 569.14,
    "po": "40121683",
    "rcv": "510521949",
    "org": 101,
    "oname": "บริษัท อาซีโก ไทยเทค จำกัด (มหาชน)",
    "sig": [
      1,
      1
    ],
    "rtotal": 34902.5,
    "status": "Hold",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E03",
      "E09"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 510521949 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "Price Variance",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 1 (Invoice: 4-1106-T06-B6133 BRACKET (AB3917618AA-PIA04)): ราคาต่างเกินกรอบ (Inv: 7.07, Rcv: 30.35)",
        "exception_code": "E09",
        "severity": "High",
        "actual": "7.07",
        "expected": "30.35",
        "page": 1,
        "bbox": {
          "x": 0.052,
          "y": 0.385,
          "w": 0.893,
          "h": 0.34,
          "page": 1
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "Total Mismatch",
        "status": "FAIL",
        "result": "fail",
        "detail": "ยอดก่อนภาษี 8130.50 ≠ ยอดใบรับ 34902.5",
        "exception_code": "E03",
        "severity": "High",
        "actual": "8130.50",
        "expected": "34902.5",
        "page": 1,
        "bbox": {
          "x": 0.85,
          "y": 0.73,
          "w": 0.062,
          "h": 0.013,
          "page": 1
        }
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "4-1106-T06-B6133 BRACKET (AB3917618AA-PIA04)",
        "qty": 1150,
        "unit": "PCS",
        "price": 7.07,
        "amount": 8130.5,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1150,
        "match_level": "M5"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "40121683",
        "receiptNum": "510521949",
        "lineNo": 1,
        "rcvLineId": "510521949-1",
        "itemCode": "PPL0000287A",
        "itemDesc": "4-1106-T06-B6133 BRACKET(AB3917618AA-PIA04)",
        "qty": 1150,
        "uom": "Piece",
        "unitPrice": 30.35,
        "lineAmount": 34902.5,
        "qtyBilled": 1150,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AERP Prod 02, K.Woraya C.",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40121683",
          "ITEM_CODE": "PPL0000287A",
          "SHIPMENT_NUM": "2609039",
          "PACKING_SLIP": "2609039",
          "QTY_BILLED": "1150"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:05:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Hold · ความรุนแรงสูงสุด High",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AERP Prod 02, K.Woraya C."
  },
  {
    "doc": "DMS-84",
    "company": "AH",
    "vendor": "บริษัท เจ.พีพัฒน์ ออโต้พาร์ท อินดัสตรี จำกัด J. PHIPHAT AUTO PART INDUSTRY COMPANY LIMITED",
    "stax": "0135535002053",
    "inv": "ED6909/0452",
    "dt": "2026-09-11",
    "total": 19907.78,
    "sub": 18605.4,
    "vat": 1302.38,
    "po": "40114210, 40117199, 40118686",
    "rcv": "510521950",
    "org": 101,
    "oname": "บริษัท อาปิโก ไฮเทค จำกัด (มหาชน)",
    "sig": [
      1,
      1
    ],
    "rtotal": 18605.399999999998,
    "status": "Review",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: po_number(NOT_PRESENT)",
        "exception_code": "E01",
        "severity": "Medium"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 7 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 510521950 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 18,605.40 = receipt 18,605.40"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "51082-0K190 / STAY SUB-ASSY,SIDE STER,NO.1 LH 40118686 -624",
        "qty": 15,
        "unit": "PCS",
        "price": 7.67,
        "amount": 115.05,
        "diff": false,
        "gr_line": 6,
        "gr_qty": 15,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "51082-0K190 / STAY SUB-ASSY,SIDE STER,NO.1 LH 40118686 -629",
        "qty": 735,
        "unit": "PCS",
        "price": 7.67,
        "amount": 5637.45,
        "diff": false,
        "gr_line": 7,
        "gr_qty": 735,
        "match_level": "M1"
      },
      {
        "no": 3,
        "desc": "44592-0K120 / BRACKET,BRAKE ACTUATOR, NO.2 40114210 -1140",
        "qty": 630,
        "unit": "PCS",
        "price": 6.39,
        "amount": 4025.7,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 630,
        "match_level": "M1"
      },
      {
        "no": 4,
        "desc": "44590-0K160#1 / BRKT S/A, BRAKE ACTUATOR 40114210 1141",
        "qty": 456,
        "unit": "PCS",
        "price": 6.39,
        "amount": 2913.84,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 456,
        "match_level": "M1"
      },
      {
        "no": 5,
        "desc": "44590-0K160#1 / BRKT S/A, BRAKE ACTUATOR 40114210-1135",
        "qty": 24,
        "unit": "PCS",
        "price": 6.39,
        "amount": 153.36,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 24,
        "match_level": "M1"
      },
      {
        "no": 6,
        "desc": "51081-0G010 / STAY SUB-ASSY,SIDE STEP,NO.2 RH 40117199 -418",
        "qty": 360,
        "unit": "PCS",
        "price": 8,
        "amount": 2880,
        "diff": false,
        "gr_line": 4,
        "gr_qty": 360,
        "match_level": "M4"
      },
      {
        "no": 7,
        "desc": "51081-0G010 / STAY SUB-ASSY,SIDE STEP,NO.2 RH 40117199 -423",
        "qty": 360,
        "unit": "PCS",
        "price": 8,
        "amount": 2880,
        "diff": false,
        "gr_line": 5,
        "gr_qty": 360,
        "match_level": "M4"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "40114210",
        "receiptNum": "510521950",
        "lineNo": 1,
        "rcvLineId": "510521950-1",
        "itemCode": "POP0000668A",
        "itemDesc": "44592-0K120 BRACKET, BRAKE ACTUATOR, NO.2 (PLATING; OUTSIDE)",
        "qty": 630,
        "uom": "Piece",
        "unitPrice": 6.39,
        "lineAmount": 4025.7,
        "qtyBilled": 630,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40114210",
          "ITEM_CODE": "POP0000668A",
          "SHIPMENT_NUM": "ED6909/0452",
          "PACKING_SLIP": "ED6909/0452",
          "QTY_BILLED": "630"
        }
      },
      {
        "poNumber": "40114210",
        "receiptNum": "510521950",
        "lineNo": 2,
        "rcvLineId": "510521950-2",
        "itemCode": "POP0000669A",
        "itemDesc": "44590-0K160#1 BRACKET SUB-ASSY, BRAKE ACTUATOR (PLATING; OUTSIDE)",
        "qty": 456,
        "uom": "Piece",
        "unitPrice": 6.39,
        "lineAmount": 2913.84,
        "qtyBilled": 480,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40114210",
          "ITEM_CODE": "POP0000669A",
          "SHIPMENT_NUM": "ED6909/0452",
          "PACKING_SLIP": "ED6909/0452",
          "QTY_BILLED": "480"
        }
      },
      {
        "poNumber": "40114210",
        "receiptNum": "510521950",
        "lineNo": 3,
        "rcvLineId": "510521950-3",
        "itemCode": "POP0000669A",
        "itemDesc": "44590-0K160#1 BRACKET SUB-ASSY, BRAKE ACTUATOR (PLATING; OUTSIDE)",
        "qty": 24,
        "uom": "Piece",
        "unitPrice": 6.39,
        "lineAmount": 153.36,
        "qtyBilled": 240,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40114210",
          "ITEM_CODE": "POP0000669A",
          "SHIPMENT_NUM": "ED6909/0452",
          "PACKING_SLIP": "ED6909/0452",
          "QTY_BILLED": "240"
        }
      },
      {
        "poNumber": "40117199",
        "receiptNum": "510521950",
        "lineNo": 4,
        "rcvLineId": "510521950-4",
        "itemCode": "POP0000601A",
        "itemDesc": "51081-0G010 STAY SUB-ASSY, SIDE STEP, NO.1 RH (PLATING; OUTSIDE)",
        "qty": 360,
        "uom": "Piece",
        "unitPrice": 8,
        "lineAmount": 2880,
        "qtyBilled": 360,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40117199",
          "ITEM_CODE": "POP0000601A",
          "SHIPMENT_NUM": "ED6909/0452",
          "PACKING_SLIP": "ED6909/0452",
          "QTY_BILLED": "360"
        }
      },
      {
        "poNumber": "40117199",
        "receiptNum": "510521950",
        "lineNo": 5,
        "rcvLineId": "510521950-5",
        "itemCode": "POP0000601A",
        "itemDesc": "51081-0G010 STAY SUB-ASSY, SIDE STEP, NO.1 RH (PLATING; OUTSIDE)",
        "qty": 360,
        "uom": "Piece",
        "unitPrice": 8,
        "lineAmount": 2880,
        "qtyBilled": 360,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40117199",
          "ITEM_CODE": "POP0000601A",
          "SHIPMENT_NUM": "ED6909/0452",
          "PACKING_SLIP": "ED6909/0452",
          "QTY_BILLED": "360"
        }
      },
      {
        "poNumber": "40118686",
        "receiptNum": "510521950",
        "lineNo": 6,
        "rcvLineId": "510521950-6",
        "itemCode": "POP0000672A",
        "itemDesc": "51082-0K190 STAY SUB-ASSY, SIDE STEP, NO.1 LH (PLATING; OUTSIDE)",
        "qty": 15,
        "uom": "Piece",
        "unitPrice": 7.67,
        "lineAmount": 115.05,
        "qtyBilled": 900,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40118686",
          "ITEM_CODE": "POP0000672A",
          "SHIPMENT_NUM": "ED6909/0452",
          "PACKING_SLIP": "ED6909/0452",
          "QTY_BILLED": "900"
        }
      },
      {
        "poNumber": "40118686",
        "receiptNum": "510521950",
        "lineNo": 7,
        "rcvLineId": "510521950-7",
        "itemCode": "POP0000672A",
        "itemDesc": "51082-0K190 STAY SUB-ASSY, SIDE STEP, NO.1 LH (PLATING; OUTSIDE)",
        "qty": 735,
        "uom": "Piece",
        "unitPrice": 7.67,
        "lineAmount": 5637.45,
        "qtyBilled": 750,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40118686",
          "ITEM_CODE": "POP0000672A",
          "SHIPMENT_NUM": "ED6909/0452",
          "PACKING_SLIP": "ED6909/0452",
          "QTY_BILLED": "750"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:07:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-85",
    "company": "AH",
    "vendor": "บริษัท อาปิโก ฮิโคเทค จำกัด",
    "stax": "0145556001111",
    "inv": "112603974",
    "dt": "2026-09-11",
    "total": 2288,
    "sub": 2288,
    "vat": 160.16,
    "po": "40121195",
    "rcv": "510521951",
    "org": 101,
    "oname": "AAPICO HITECH PUBLIC CO.,LTD.",
    "sig": [
      0,
      0
    ],
    "rtotal": 2288,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E03"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "Total Mismatch",
        "status": "FAIL",
        "result": "fail",
        "detail": "ยอดรวมภายในใบแจ้งหนี้ไม่สอดคล้อง {'lines_vs_sub_total': '0.00', 'vat_7pct': '0.00', 'sub_plus_vat_vs_grand': '160.16'}",
        "exception_code": "E03",
        "severity": "High",
        "actual": "2288.00",
        "expected": "2288.00",
        "page": 1,
        "bbox": {
          "x": 0.895,
          "y": 0.84,
          "w": 0.041,
          "h": 0.011,
          "page": 1
        }
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 510521951 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "WARN",
        "result": "manual_review",
        "detail": "ความมั่นใจต่ำ: ['receiver', 'deliverer']"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 2,288.00 = receipt 2,288"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "PPR0001860B 44593-0D100 BRACKET BRAKE ACTUATOR, NO.3 40121195-34",
        "qty": 320,
        "unit": "PCS",
        "price": 7.15,
        "amount": 2288,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 320,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "40121195",
        "receiptNum": "510521951",
        "lineNo": 1,
        "rcvLineId": "510521951-1",
        "itemCode": "PPR0001860B",
        "itemDesc": "44593-0D100 BRACKET BRAKE ACTUATOR, NO.3 (PRESS;SF-B)",
        "qty": 320,
        "uom": "Piece",
        "unitPrice": 7.15,
        "lineAmount": 2288,
        "qtyBilled": 320,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40121195",
          "ITEM_CODE": "PPR0001860B",
          "SHIPMENT_NUM": "112603974",
          "PACKING_SLIP": "112603974",
          "QTY_BILLED": "320"
        }
      }
    ],
    "pages": 2,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:04:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด High",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-86",
    "company": "AH",
    "vendor": "บริษัท เจ เอส ออโตเวิล์ด จำกัด J S AUTOWORK CO.,LTD.",
    "stax": "0135546004966",
    "inv": "JSA69/05363",
    "dt": "2026-09-11",
    "total": 2842.78,
    "sub": 2656.8,
    "vat": 185.98,
    "po": "40121156",
    "rcv": "510521959",
    "org": 101,
    "oname": "บริษัท อาปิโก ไฮเทค จำกัด (มหาชน)",
    "sig": [
      1,
      1
    ],
    "rtotal": 2656.8,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 510521959 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 2,656.80 = receipt 2,656.8"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "8980621890 SHIELD; DUST DISC BRAKE LH (3 HOLE) (PLATING)",
        "qty": 120,
        "unit": "PCS",
        "price": 22.14,
        "amount": 2656.8,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 120,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "40121156",
        "receiptNum": "510521959",
        "lineNo": 1,
        "rcvLineId": "510521959-1",
        "itemCode": "PPL0000292A",
        "itemDesc": "8980621890 SHIELD; DUST DISC BRAKE LH [3 HOLE] (PLATING)",
        "qty": 120,
        "uom": "Piece",
        "unitPrice": 22.14,
        "lineAmount": 2656.8,
        "qtyBilled": 120,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40121156",
          "ITEM_CODE": "PPL0000292A",
          "SHIPMENT_NUM": "JSA69/05363",
          "PACKING_SLIP": "JSA69/05363",
          "QTY_BILLED": "120"
        }
      }
    ],
    "pages": 4,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:05:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-87",
    "company": "AH",
    "vendor": "บริษัท เจริญรุ่งเรือง คริตทัพร ออโต้เพรสซิ่ง จำกัด",
    "stax": "0135547003769",
    "inv": "IV2609026",
    "dt": "2026-09-14",
    "total": 11994.7,
    "sub": 11210,
    "vat": 784.7,
    "po": "40121154",
    "rcv": "510522083",
    "org": 101,
    "oname": "AH-P-001",
    "sig": [
      1,
      1
    ],
    "rtotal": 11210,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 510522083 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "WARN",
        "result": "manual_review",
        "detail": "AI ไม่มั่นใจเรื่องที่อยู่"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 11,210.00 = receipt 11,210"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "73751-0A010-A BRACKET,CRS ANCHOR,RH",
        "qty": 1000,
        "unit": "PCS",
        "price": 11.21,
        "amount": 11210,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1000,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "40121154",
        "receiptNum": "510522083",
        "lineNo": 1,
        "rcvLineId": "510522083-1",
        "itemCode": "PPR0002287MSF",
        "itemDesc": "73751-0A010-A BRACKET,CRS ANCHOR, RH (PRESS; SF-M)",
        "qty": 1000,
        "uom": "Piece",
        "unitPrice": 11.21,
        "lineAmount": 11210,
        "qtyBilled": 1000,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40121154",
          "ITEM_CODE": "PPR0002287MSF",
          "SHIPMENT_NUM": "IV2609026",
          "PACKING_SLIP": "IV2609026",
          "QTY_BILLED": "1000"
        }
      }
    ],
    "pages": 4,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:06:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-88",
    "company": "AH",
    "vendor": "B.K.J. ADVANCED PROCESS CO.,LTD. (HEAD OFFICE)",
    "stax": "0765540000025",
    "inv": "IV6908923",
    "dt": "2026-09-15",
    "total": 4119.5,
    "sub": 3850,
    "vat": 269.5,
    "po": "40081498",
    "rcv": "510522201",
    "org": 101,
    "oname": "บริษัท อาปิโก ไฮเทค จำกัด (มหาชน)",
    "sig": [
      1,
      1
    ],
    "rtotal": 3850,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 510522201 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 3,850.00 = receipt 3,850"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "000-008- สำเนาบริการชนแผ่นเหล็ก 10 BOX 72613-0A010 STRIKER RR SEAT BACK LOCK RH WORK ORDER NO. OSP-260908091035 PO NO.40081498-501",
        "qty": 1000,
        "unit": "PCS",
        "price": 3.85,
        "amount": 3850,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1000,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "40081498",
        "receiptNum": "510522201",
        "lineNo": 1,
        "rcvLineId": "510522201-1",
        "itemCode": "POP0000494A",
        "itemDesc": "72613-0A010 STRIKER , RR SEAT BACK LOCK. RH (PLATING; OUTSIDE)",
        "qty": 1000,
        "uom": "Piece",
        "unitPrice": 3.85,
        "lineAmount": 3850,
        "qtyBilled": 1000,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "Oracle, Concurrent",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40081498",
          "ITEM_CODE": "POP0000494A",
          "SHIPMENT_NUM": "IV6908923",
          "PACKING_SLIP": "IV6908923",
          "QTY_BILLED": "1000"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:07:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "Oracle, Concurrent"
  },
  {
    "doc": "DMS-89",
    "company": "AH",
    "vendor": "บริษัท อาปิโก ไฮเทค จำกัด (มหาชน) AAPICO HITECH PUBLIC COMPANY LIMITED",
    "stax": "0105517000907",
    "inv": "694055726",
    "dt": "2026-09-09",
    "total": 2407.5,
    "sub": 2250,
    "vat": 157.5,
    "po": "40116654",
    "rcv": "510522147",
    "org": 101,
    "oname": "บริษัทอาปี้โก ไฮเทค จำกัด (มหาชน)",
    "sig": [
      1,
      1
    ],
    "rtotal": 2250,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E01",
      "E07"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: L1.qty(NOT_PRESENT), L1.unit_price(NOT_PRESENT)",
        "exception_code": "E01",
        "severity": "Medium"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ไม่มีบรรทัดที่อ่านค่าครบ",
        "halted_by": "V-01"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 510522147 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "Customer Mismatch",
        "status": "FAIL",
        "result": "fail",
        "detail": "ที่อยู่ลูกค้า (เลขที่ 64, รหัสไปรษณีย์ 13160) ไม่ตรงกับที่อยู่ของ ORG_ID 101",
        "exception_code": "E07",
        "severity": "Medium",
        "actual": "64 M.2, ASIA-NAKHONSAWAN ROAD KM 59-60, BAN PO BANG PA-IN AYUTTHAYA 13160 TH",
        "page": 3,
        "bbox": {
          "x": 0.1,
          "y": 0.199,
          "w": 0.548,
          "h": 0.009,
          "page": 3
        }
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "WARN",
        "result": "manual_review",
        "detail": "AI/facts ไม่สอดคล้อง หรือเทียบจำนวนไม่ได้"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 2,250.00 = receipt 2,250"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "SERVICE GENERAL\\SERVICE CHARGE FOR PM 3/4 CRANE 16 TONS D8 (MAY 2026) OF PRESS LINE 2 AH Q/N. 1-1AYTOFHP/1 (Job:MN-007092 , Operation:20) (1 JOB) REFER TO YOUR ORDER NO.40116654 PVT.3 FOR Jul 2026",
        "qty": 0,
        "unit": "JOB",
        "price": 0,
        "amount": 2250,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M3"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "40116654",
        "receiptNum": "510522147",
        "lineNo": 1,
        "rcvLineId": "510522147-1",
        "itemCode": "MOP0000001A",
        "itemDesc": "SERVICE GENERAL\\SERVICE CHARGE FOR PM 3/4 CRANE 16 TONS  D8 (MAY 2026) OF  PRESS  LINE 2 AH Q/N. 1-1AYTOFHP/1",
        "qty": 1,
        "uom": "Job",
        "unitPrice": 2250,
        "lineAmount": 2250,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AH Maintenance 03, K.Janya D.",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40116654",
          "ITEM_CODE": "MOP0000001A",
          "SHIPMENT_NUM": "694055726",
          "PACKING_SLIP": "694055726",
          "QTY_BILLED": "1"
        }
      }
    ],
    "pages": 4,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:08:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AH Maintenance 03, K.Janya D."
  },
  {
    "doc": "DMS-90",
    "company": "AH",
    "vendor": "บริษัท แมกน่า อินเตอร์เทรด จำกัด (สำนักงานใหญ่) MAGNA INTERTRADE CO., LTD. (HEAD OFFICE)",
    "stax": "0105547040664",
    "inv": "IV2609037",
    "dt": "2026-09-11",
    "total": 30281,
    "sub": 28300,
    "vat": 1981,
    "po": "40122081",
    "rcv": "510522160",
    "org": 101,
    "oname": "บริษัท อาปิโก ไฮเทค จำกัด (มหาชน)",
    "sig": [
      1,
      1
    ],
    "rtotal": 28300,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 510522160 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 28,300.00 = receipt 28,300"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "10-1000-042 HYDRAULIC OIL NO. 100 (200 L./ DRUM)",
        "qty": 2,
        "unit": "DRUM",
        "price": 14150,
        "amount": 28300,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 2,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "40122081",
        "receiptNum": "510522160",
        "lineNo": 1,
        "rcvLineId": "510522160-1",
        "itemCode": "MSP0010935A",
        "itemDesc": "HYDRAULIC OIL  100 \\200L 1 DRUM\\ MAGNA",
        "qty": 2,
        "uom": "Drum",
        "unitPrice": 14150,
        "lineAmount": 28300,
        "qtyBilled": 2,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AH Maintenance 03, K.Janya D.",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40122081",
          "ITEM_CODE": "MSP0010935A",
          "SHIPMENT_NUM": "IV2609037",
          "PACKING_SLIP": "IV2609037",
          "QTY_BILLED": "2"
        }
      }
    ],
    "pages": 4,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:07:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AH Maintenance 03, K.Janya D."
  },
  {
    "doc": "DMS-91",
    "company": "AH",
    "vendor": "NEE TRADING CO., LTD.",
    "stax": "0107545000179",
    "inv": "IV69090306",
    "dt": "2026-09-11",
    "total": 3103,
    "sub": 2900,
    "vat": 203,
    "po": "40121974",
    "rcv": "510522166",
    "org": 101,
    "oname": "บริษัท อาปิโก ไฮเทค จำกัด (มหาชน)",
    "sig": [
      1,
      1
    ],
    "rtotal": 2900,
    "status": "Review",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: customer_name(LOW_CONFIDENCE), customer_tax_id(CONFLICT_BETWEEN_SOURCES)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.4516,
          "y": 0.1653,
          "w": 0.1452,
          "h": 0.0143,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 510522166 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "Tax ID ลูกค้าอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 2,900.00 = receipt 2,900"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "\"PANASONIC\" WNG15923-7+WNG6803+OSAWA 2\"x4\"",
        "qty": 20,
        "unit": "SET",
        "price": 145,
        "amount": 2900,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 20,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "40121974",
        "receiptNum": "510522166",
        "lineNo": 1,
        "rcvLineId": "510522166-1",
        "itemCode": "MSP0001184A",
        "itemDesc": "PLUGE WNG15923-7 + COVER + BOX",
        "qty": 20,
        "uom": "Set",
        "unitPrice": 145,
        "lineAmount": 2900,
        "qtyBilled": 20,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AH Maintenance 03, K.Janya D.",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40121974",
          "ITEM_CODE": "MSP0001184A",
          "SHIPMENT_NUM": "IV69090306",
          "PACKING_SLIP": "IV69090306",
          "QTY_BILLED": "20"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:09:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AH Maintenance 03, K.Janya D."
  },
  {
    "doc": "DMS-92",
    "company": "AH",
    "vendor": "BKS ENTERPRISE CO., LTD.",
    "stax": "0105562195321",
    "inv": "IV6909239",
    "dt": "2026-09-14",
    "total": 1639.24,
    "sub": 1532,
    "vat": 107.24,
    "po": "40122087",
    "rcv": "510522171",
    "org": 101,
    "oname": "APCH",
    "sig": [
      1,
      1
    ],
    "rtotal": 1532,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 510522171 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 1,532.00 = receipt 1,532"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "IKEDA ไทล์ซอเจาะ STL 22.0MM.",
        "qty": 1,
        "unit": "PCS",
        "price": 657,
        "amount": 657,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "IKEDA ไทล์ซอเจาะ STL 30.0MM.",
        "qty": 1,
        "unit": "PCS",
        "price": 875,
        "amount": 875,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 1,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "40122087",
        "receiptNum": "510522171",
        "lineNo": 1,
        "rcvLineId": "510522171-1",
        "itemCode": "MSP0007074A",
        "itemDesc": "HSS HOLE SAW:SIZE 22 MM ( FOR STEEL DRILLING)\\IKEDA",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 657,
        "lineAmount": 657,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AH Maintenance 03, K.Janya D.",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40122087",
          "ITEM_CODE": "MSP0007074A",
          "SHIPMENT_NUM": "IV6909239",
          "PACKING_SLIP": "IV6909239",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "40122087",
        "receiptNum": "510522171",
        "lineNo": 2,
        "rcvLineId": "510522171-2",
        "itemCode": "MSP0007075A",
        "itemDesc": "HSS HOLE SAW\\SIZE 30 MM ( FOR STEEL DRILLING)\\IKEDA",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 875,
        "lineAmount": 875,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AH Maintenance 03, K.Janya D.",
        "ouName": "AH - Aapico Hitech",
        "extra": {
          "PO_NUM": "40122087",
          "ITEM_CODE": "MSP0007075A",
          "SHIPMENT_NUM": "IV6909239",
          "PACKING_SLIP": "IV6909239",
          "QTY_BILLED": "1"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:08:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AH Maintenance 03, K.Janya D."
  },
  {
    "doc": "DMS-93",
    "company": "?",
    "vendor": "จุทาวรรณ จำกัด",
    "stax": "0105521010334",
    "inv": "42052764",
    "dt": "—",
    "total": 390.55,
    "sub": 365,
    "vat": 25.55,
    "po": "42052764",
    "rcv": "—",
    "org": null,
    "oname": "บริษัท อาปิโก ไฮเทค (ชลบุรี) จำกัด (สำนักงานใหญ่)",
    "sig": [
      0,
      1
    ],
    "rtotal": null,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: invoice_num(INVALID_FORMAT:NOT_A_LOOKUP_KEY), po_number(CONFLICT_BETWEEN_SOURCES), customer_name(LOW_CONFIDENCE), customer_address(LOW_CONFIDENCE), customer_tax_id(NOT_PRESENT)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.2258,
          "y": 0.2349,
          "w": 0.4435,
          "h": 0.0228,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "เลข Invoice ที่อ่านได้ใช้ค้นใบรับไม่ได้ (รูปแบบไม่ปลอดภัยสำหรับ SQL)",
        "halted_by": "V-01"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ไม่มีใบรับ จึงไม่มี ORG_ID",
        "halted_by": "V-04"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "WARN",
        "result": "manual_review",
        "detail": "ความมั่นใจต่ำ: ['deliverer']"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ข้ามตาม gate",
        "halted_by": "V-01"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ข้ามตาม gate",
        "halted_by": "V-01"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ข้ามตาม gate",
        "halted_by": "V-01"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "MILLING SS400 F 40X110X180 มม.",
        "qty": 1,
        "unit": "PCS",
        "price": 365,
        "amount": 365,
        "diff": false
      }
    ],
    "oracleReceiptLines": [],
    "pages": 2,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:08:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": true,
    "up": "2026-10-09"
  },
  {
    "doc": "DMS-94",
    "company": "AHT",
    "vendor": "บริษัท มิซูมิ (ไทยแลนด์) จำกัด MISUMI (THAILAND) CO., LTD.",
    "stax": "0105540008838",
    "inv": "LN6059804300H2",
    "dt": "—",
    "total": 2354,
    "sub": 2200,
    "vat": 154,
    "po": "42052812",
    "rcv": "50220043269",
    "org": 195,
    "oname": "AAPICO HITECH TOOLING CO., LTD. (HEAD OFFICE)",
    "sig": [
      1,
      1
    ],
    "rtotal": 2200,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E10"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043269 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "Line Arithmetic Inconsistency",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 1 (Invoice: 42052812 AFS0000456A(8157378) GCTG-700 GCTG-700 COTTON GLOVE 700G 1 DOZEN): หน่วยนับต่างกลุ่มหลังแปลง (Inv: PK→PACK, Rcv: Dozen→DOZEN)",
        "exception_code": "E10",
        "severity": "Medium",
        "actual": "PACK",
        "expected": "DOZEN",
        "page": 1,
        "bbox": {
          "x": 0.13,
          "y": 0.435,
          "w": 0.845,
          "h": 0.06,
          "page": 1
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "WARN",
        "result": "manual_review",
        "detail": "AI/facts ไม่สอดคล้อง หรือเทียบจำนวนไม่ได้"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 2,200.00 = receipt 2,200"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "42052812 AFS0000456A(8157378) GCTG-700 GCTG-700 COTTON GLOVE 700G 1 DOZEN",
        "qty": 50,
        "unit": "PACK",
        "price": 44,
        "amount": 2200,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 50,
        "match_level": "M3"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052812",
        "receiptNum": "50220043269",
        "lineNo": 1,
        "rcvLineId": "50220043269-1",
        "itemCode": "AFS0000456A",
        "itemDesc": "COTTON GLOVE\\YELLOW (0.7 KG/DOZ) (8157378)",
        "qty": 50,
        "uom": "Dozen",
        "unitPrice": 44,
        "lineAmount": 2200,
        "qtyBilled": 50,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052812",
          "ITEM_CODE": "AFS0000456A",
          "SHIPMENT_NUM": "LN6059804300H2",
          "PACKING_SLIP": "LN6059804300H2",
          "QTY_BILLED": "50"
        }
      }
    ],
    "pages": 7,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:14:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-95",
    "company": "AHT",
    "vendor": "MISUMI (THAILAND) CO., LTD.",
    "stax": "0105540008838",
    "inv": "LN6058823900H2",
    "dt": "—",
    "total": 0,
    "sub": 0,
    "vat": 0,
    "po": "42052733",
    "rcv": "50220043272",
    "org": 195,
    "oname": "AAPICO HITECH TOOLING CO., LTD. (HEAD OFFICE)",
    "sig": [
      1,
      1
    ],
    "rtotal": 31267.920000000002,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E13",
      "E01",
      "E10"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: sub_total(NOT_PRESENT), vat(NOT_PRESENT), grand_total(NOT_PRESENT), L7.qty(NOT_PRESENT), L7.uom(NOT_PRESENT), L7.unit_price(NOT_PRESENT), L7.amount(NOT_PRESENT), L8.qty(NOT_PRESENT), L8.uom(NOT_PRESENT), L8.unit_price(NOT_PRESENT), L8.amount(NOT_PRESENT), L9.qty(NOT_PRESENT), L9.uom(NOT_PRESENT), L9.unit_price(NOT_PRESENT), L9.amount(NOT_PRESENT), L10.qty(NOT_PRESENT), L10.uom(NOT_PRESENT), L10.unit_price(NOT_PRESENT), L10.amount(NOT_PRESENT), L11.qty(NOT_PRESENT), L11.uom(NOT_PRESENT), L11.unit_price(NOT_PRESENT), L11.amount(NOT_PRESENT), L12.qty(NOT_PRESENT), L12.uom(NOT_PRESENT), L12.unit_price(NOT_PRESENT), L12.amount(NOT_PRESENT), L13.qty(NOT_PRESENT), L13.uom(NOT_PRESENT), L13.unit_price(NOT_PRESENT), L13.amount(NOT_PRESENT), L14.qty(NOT_PRESENT), L14.uom(NOT_PRESENT), L14.unit_price(NOT_PRESENT), L14.amount(NOT_PRESENT), L15.qty(NOT_PRESENT), L15.uom(NOT_PRESENT), L15.unit_price(NOT_PRESENT), L15.amount(NOT_PRESENT), L16.qty(NOT_PRESENT), L16.uom(NOT_PRESENT), L16.unit_price(NOT_PRESENT), L16.amount(NOT_PRESENT), L17.qty(NOT_PRESENT), L17.uom(NOT_PRESENT), L17.unit_price(NOT_PRESENT), L17.amount(NOT_PRESENT), L18.qty(NOT_PRESENT), L18.uom(NOT_PRESENT), L18.unit_price(NOT_PRESENT), L18.amount(NOT_PRESENT), pages_complete(false)",
        "exception_code": "E01",
        "severity": "Medium"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 6 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ยอดรวมหรือราคารวมต่อรายการอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043272 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "สแกนไม่ครบหน้า (E01 ไม่ใช่ E08)",
        "halted_by": "V-01"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "Line Arithmetic Inconsistency",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 6 (Invoice: 42052733 DCM0033366A LPS4-30-WM30 LIFTER PIN SET): หน่วยนับต่างกลุ่มหลังแปลง (Inv: SET→SET, Rcv: Piece→PCS)",
        "exception_code": "E10",
        "severity": "Medium",
        "actual": "SET",
        "expected": "PCS",
        "page": 7,
        "bbox": {
          "x": 0.115,
          "y": 0.578,
          "w": 0.845,
          "h": 0.067,
          "page": 7
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "WARN",
        "result": "manual_review",
        "detail": "AI/facts ไม่สอดคล้อง หรือเทียบจำนวนไม่ได้"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ยอดก่อนภาษีอ่านไม่ได้",
        "halted_by": "V-01"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "42052733 DCM0001497A MSB16-70 STRIPPER BOLT",
        "qty": 12,
        "unit": "PCS",
        "price": 57.54,
        "amount": 690.48,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 12,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "42052733 DCM0015376A GSV1000-63 GAS SPRING",
        "qty": 4,
        "unit": "PCS",
        "price": 1642,
        "amount": 6568,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 4,
        "match_level": "M1"
      },
      {
        "no": 3,
        "desc": "42052733 DCM0018852A GSV500-25 GAS SPRING",
        "qty": 12,
        "unit": "PCS",
        "price": 1178.8,
        "amount": 14145.6,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 12,
        "match_level": "M1"
      },
      {
        "no": 4,
        "desc": "42052733 DCM0033354A FCQ50 GAS SPRING VERTICAL PLATE FCQ",
        "qty": 4,
        "unit": "PCS",
        "price": 1833.96,
        "amount": 7335.84,
        "diff": false,
        "gr_line": 4,
        "gr_qty": 4,
        "match_level": "M1"
      },
      {
        "no": 5,
        "desc": "42052733 DCM0033360A OKJS16-WF MISFEED SENSOR UNITS",
        "qty": 1,
        "unit": "PCS",
        "price": 646,
        "amount": 646,
        "diff": false,
        "gr_line": 5,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 6,
        "desc": "42052733 DCM0033366A LPS4-30-WM30 LIFTER PIN SET",
        "qty": 4,
        "unit": "SET",
        "price": 50,
        "amount": 200,
        "diff": true,
        "gr_line": 6,
        "gr_qty": 4,
        "match_level": "M4"
      },
      {
        "no": 7,
        "desc": "4 42052733 DCM0033354A FCQ50 FCQ50 GAS SPRING VERTICAL PLATE FCQ 7 Sep 2026 4 PCS FB118GD4DC 1,833.96 7,335.84 015978 STOCK",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 8,
        "desc": "5 42052733 DCM0033360A OKJS16-WF MISFEED SENSOR UNITS 7 Sep 2026 1 PCS FB118GD4DC 646.00 646.00 015980 STOCK",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 9,
        "desc": "6 42052733 DCM0033366A LPS4-30-WM30 LIFTER PIN SET 7 Sep 2026 4 SET FB118GD4DC 50.00 200.00 015982 STOCK",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 10,
        "desc": "4 42052733 DCM0033354A FCQ50 FCQ50 GAS SPRING VERTICAL PLATE FCQ 7 Sep 2026 4 PCS FB118GD4DC 1,833.96 7,335.84 015978 STOCK",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 11,
        "desc": "5 42052733 DCM0033360A OKJS16-WF MISFEED SENSOR UNITS 7 Sep 2026 1 PCS FB118GD4DC 646.00 646.00 015980 STOCK",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 12,
        "desc": "6 42052733 DCM0033366A LPS4-30-WM30 LIFTER PIN SET 7 Sep 2026 4 SET FB118GD4DC 50.00 200.00 015982 STOCK",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 13,
        "desc": "4 42052733 DGM003354A FCQ50 FCQ50 GAS SPRING VERTICAL PLATE FCQ 7 Sep 2026 4 PCS FB118GD4DC 1,833.96 7,335.84 015978 STOCK",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 14,
        "desc": "5 42052733 DGM003360A OKJS16-WF MISFEED SENSOR UNITS 7 Sep 2026 1 PCS FB118GD4DC 646.00 646.00 015980 STOCK",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 15,
        "desc": "6 42052733 DGM003366A LPS4-30-WM30 LIFTER PIN SET 7 Sep 2026 4 SET FB118GD4DC 50.00 200.00 015962 STOCK",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 16,
        "desc": "4 42052733 DGM0033354A FCQ50 FCQ50 GAS SPRING VERTICAL PLATE FCQ 7 Sep 2026 4 PCS FB118GD4DC 1,833.96 7,335.84 015978 STOCK",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 17,
        "desc": "5 42052733 DGM0033360A OKJS16-WF MISFEED SENSOR UNITS 7 Sep 2026 1 PCS FB118GD4DC 646.00 646.00 015980 STOCK",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 18,
        "desc": "6 42052733 DGM0033366A LPS4-30-WM30 LIFTER PIN SET 7 Sep 2026 4 SET FB118GD4DC 50.00 200.00 015982 STOCK",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052733",
        "receiptNum": "50220043272",
        "lineNo": 1,
        "rcvLineId": "50220043272-1",
        "itemCode": "DCM0001497A",
        "itemDesc": "STRIPPER BOLT\\MSB 16-70\\MISUMI",
        "qty": 12,
        "uom": "Piece",
        "unitPrice": 57.54,
        "lineAmount": 690.48,
        "qtyBilled": 12,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052733",
          "ITEM_CODE": "DCM0001497A",
          "SHIPMENT_NUM": "LN6058823900H2",
          "PACKING_SLIP": "LN6058823900H2",
          "QTY_BILLED": "12"
        }
      },
      {
        "poNumber": "42052733",
        "receiptNum": "50220043272",
        "lineNo": 2,
        "rcvLineId": "50220043272-2",
        "itemCode": "DCM0015376A",
        "itemDesc": "GAS SPRING\\GSV 1000-63\\MISUMI",
        "qty": 4,
        "uom": "Piece",
        "unitPrice": 1642,
        "lineAmount": 6568,
        "qtyBilled": 4,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052733",
          "ITEM_CODE": "DCM0015376A",
          "SHIPMENT_NUM": "LN6058823900H2",
          "PACKING_SLIP": "LN6058823900H2",
          "QTY_BILLED": "4"
        }
      },
      {
        "poNumber": "42052733",
        "receiptNum": "50220043272",
        "lineNo": 3,
        "rcvLineId": "50220043272-3",
        "itemCode": "DCM0018852A",
        "itemDesc": "GAS SPRING\\GSV 500-25\\MISUMI",
        "qty": 12,
        "uom": "Piece",
        "unitPrice": 1178.8,
        "lineAmount": 14145.6,
        "qtyBilled": 12,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052733",
          "ITEM_CODE": "DCM0018852A",
          "SHIPMENT_NUM": "LN6058823900H2",
          "PACKING_SLIP": "LN6058823900H2",
          "QTY_BILLED": "12"
        }
      },
      {
        "poNumber": "42052733",
        "receiptNum": "50220043272",
        "lineNo": 4,
        "rcvLineId": "50220043272-4",
        "itemCode": "DCM0033354A",
        "itemDesc": "PLATE FORE GAS SPRING\\FCQ50\\MISUMI",
        "qty": 4,
        "uom": "Piece",
        "unitPrice": 1833.96,
        "lineAmount": 7335.84,
        "qtyBilled": 4,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052733",
          "ITEM_CODE": "DCM0033354A",
          "SHIPMENT_NUM": "LN6058823900H2",
          "PACKING_SLIP": "LN6058823900H2",
          "QTY_BILLED": "4"
        }
      },
      {
        "poNumber": "42052733",
        "receiptNum": "50220043272",
        "lineNo": 5,
        "rcvLineId": "50220043272-5",
        "itemCode": "DCM0033360A",
        "itemDesc": "MISSENSOE FEED UNIT\\OKJS16-WF\\MISUMI",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 646,
        "lineAmount": 646,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052733",
          "ITEM_CODE": "DCM0033360A",
          "SHIPMENT_NUM": "LN6058823900H2",
          "PACKING_SLIP": "LN6058823900H2",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42052733",
        "receiptNum": "50220043272",
        "lineNo": 6,
        "rcvLineId": "50220043272-6",
        "itemCode": "DCM0033366A",
        "itemDesc": "LIFTER PIN SETS\\LPS4-30-WM30\\MISUMI",
        "qty": 4,
        "uom": "Piece",
        "unitPrice": 50,
        "lineAmount": 200,
        "qtyBilled": 4,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052733",
          "ITEM_CODE": "DCM0033366A",
          "SHIPMENT_NUM": "LN6058823900H2",
          "PACKING_SLIP": "LN6058823900H2",
          "QTY_BILLED": "4"
        }
      },
      {
        "poNumber": "42052733",
        "receiptNum": "50220043272",
        "lineNo": 7,
        "rcvLineId": "50220043272-7",
        "itemCode": "DCM0033367A",
        "itemDesc": "LIFTER PIN SETS\\LPS4-25-WL20\\MISUMI",
        "qty": 4,
        "uom": "Piece",
        "unitPrice": 50,
        "lineAmount": 200,
        "qtyBilled": 4,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052733",
          "ITEM_CODE": "DCM0033367A",
          "SHIPMENT_NUM": "LN6058823900H2",
          "PACKING_SLIP": "LN6058823900H2",
          "QTY_BILLED": "4"
        }
      },
      {
        "poNumber": "42052733",
        "receiptNum": "50220043272",
        "lineNo": 8,
        "rcvLineId": "50220043272-8",
        "itemCode": "DCM0033369A",
        "itemDesc": "LIFTER PIN SETS\\LPS6-20-WM20\\MISUMI",
        "qty": 7,
        "uom": "Piece",
        "unitPrice": 78,
        "lineAmount": 546,
        "qtyBilled": 7,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052733",
          "ITEM_CODE": "DCM0033369A",
          "SHIPMENT_NUM": "LN6058823900H2",
          "PACKING_SLIP": "LN6058823900H2",
          "QTY_BILLED": "7"
        }
      },
      {
        "poNumber": "42052733",
        "receiptNum": "50220043272",
        "lineNo": 9,
        "rcvLineId": "50220043272-9",
        "itemCode": "DCM0033370A",
        "itemDesc": "LIFTER PIN SETS\\LPS6-15-WL20\\MISUMI",
        "qty": 12,
        "uom": "Piece",
        "unitPrice": 78,
        "lineAmount": 936,
        "qtyBilled": 12,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052733",
          "ITEM_CODE": "DCM0033370A",
          "SHIPMENT_NUM": "LN6058823900H2",
          "PACKING_SLIP": "LN6058823900H2",
          "QTY_BILLED": "12"
        }
      }
    ],
    "pages": 12,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:19:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด High",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-96",
    "company": "AHT",
    "vendor": "บริษัท แทยูเทค (ไทยแลนด์) จำกัด (สำนักงานใหญ่)",
    "stax": "0115549004428",
    "inv": "157446",
    "dt": "—",
    "total": 15408,
    "sub": 14400,
    "vat": 1008,
    "po": "42052827",
    "rcv": "50220043285",
    "org": 195,
    "oname": "AAPI CO HITECH TOOLING COMPANY LIMITED",
    "sig": [
      1,
      1
    ],
    "rtotal": 14400,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043285 (TAX-INV-SUFFIX)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 14,400.00 = receipt 14,400"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "Milling Inserts XNHU 0906 ANT N-ML TT6080",
        "qty": 30,
        "unit": "PCS",
        "price": 480,
        "amount": 14400,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 30,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052827",
        "receiptNum": "50220043285",
        "lineNo": 1,
        "rcvLineId": "50220043285-1",
        "itemCode": "AFS0007105A",
        "itemDesc": "INSERT FACE MILLING CUTTER\\XNHU0906 ANTN-ML TT6080\\TAEGUTEC",
        "qty": 30,
        "uom": "Piece",
        "unitPrice": 480,
        "lineAmount": 14400,
        "qtyBilled": 30,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052827",
          "ITEM_CODE": "AFS0007105A",
          "SHIPMENT_NUM": "1819/157446",
          "PACKING_SLIP": "1819/157446",
          "QTY_BILLED": "30"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:14:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-98",
    "company": "AHT",
    "vendor": "บริษัท บีเคเอส เอ็นเตอร์ไพรส์ จำกัด BKS ENTERPRISE CO., LTD.",
    "stax": "0105562195321",
    "inv": "IV6909245",
    "dt": "2026-09-14",
    "total": 3113.7,
    "sub": 2910,
    "vat": 203.7,
    "po": "42052823",
    "rcv": "50220043286",
    "org": 195,
    "oname": "บจก. อาปิโก ไฮเทค บุรีรัมย์",
    "sig": [
      1,
      1
    ],
    "rtotal": 2910,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 3 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043286 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 2,910.00 = receipt 2,910"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "BRISTOL BS-4 ดอกเจาะน้ำเกลือ",
        "qty": 3,
        "unit": "PCS",
        "price": 130,
        "amount": 390,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 3,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "NASA สว่าร์เทรนแบบตาย 3\"",
        "qty": 4,
        "unit": "PCS",
        "price": 310,
        "amount": 1240,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 4,
        "match_level": "M1"
      },
      {
        "no": 3,
        "desc": "NASA สว่านลอนแบบเป็น 3\"",
        "qty": 4,
        "unit": "PCS",
        "price": 320,
        "amount": 1280,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 4,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052823",
        "receiptNum": "50220043286",
        "lineNo": 1,
        "rcvLineId": "50220043286-1",
        "itemCode": "AFS0000673A",
        "itemDesc": "HSS CENTRE DRILL \\A225 BS4 : 5/16 INCH\\E.I",
        "qty": 3,
        "uom": "Piece",
        "unitPrice": 130,
        "lineAmount": 390,
        "qtyBilled": 3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052823",
          "ITEM_CODE": "AFS0000673A",
          "SHIPMENT_NUM": "IV6909245",
          "PACKING_SLIP": "IV6909245",
          "QTY_BILLED": "3"
        }
      },
      {
        "poNumber": "42052823",
        "receiptNum": "50220043286",
        "lineNo": 2,
        "rcvLineId": "50220043286-2",
        "itemCode": "JCM0002755A",
        "itemDesc": "CASTER WHEEL\\URETHANE-3\"(FIXED)\\NASA",
        "qty": 4,
        "uom": "Piece",
        "unitPrice": 310,
        "lineAmount": 1240,
        "qtyBilled": 4,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052823",
          "ITEM_CODE": "JCM0002755A",
          "SHIPMENT_NUM": "IV6909245",
          "PACKING_SLIP": "IV6909245",
          "QTY_BILLED": "4"
        }
      },
      {
        "poNumber": "42052823",
        "receiptNum": "50220043286",
        "lineNo": 3,
        "rcvLineId": "50220043286-3",
        "itemCode": "JCM0002758A",
        "itemDesc": "CASTER WHEEL\\URETHANE-3\"(SWIVEL)\\NASA",
        "qty": 4,
        "uom": "Piece",
        "unitPrice": 320,
        "lineAmount": 1280,
        "qtyBilled": 4,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052823",
          "ITEM_CODE": "JCM0002758A",
          "SHIPMENT_NUM": "IV6909245",
          "PACKING_SLIP": "IV6909245",
          "QTY_BILLED": "4"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:10:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-99",
    "company": "AHT",
    "vendor": "TOP LASER PROCESSING CO., LTD.",
    "stax": "0205549020741",
    "inv": "TLP-IV-69-09-0025",
    "dt": "2026-09-15",
    "total": 25005.9,
    "sub": 23370,
    "vat": 1635.9,
    "po": "42052835",
    "rcv": "50220043287",
    "org": 195,
    "oname": "บริษัท อาโต ไชเทค ทูลลิ่ง จำกัด",
    "sig": [
      0,
      1
    ],
    "rtotal": 23370,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 4 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043287 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "WARN",
        "result": "manual_review",
        "detail": "ความมั่นใจต่ำ: ['deliverer']"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 23,370.00 = receipt 23,370"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "DOP0000019A RMA (KING) TRANSPORTATION FOR SEND PART SPK 50011 TOP LASER TO AHT (Job : INHOUSE - MY25 - 7935176 , Operation : 2.0 ) ( Project : AHD RMA ( MY25 ) , Task : 02.2 - LINE TRY OUT)",
        "qty": 1,
        "unit": "TRIP",
        "price": 2500,
        "amount": 2500,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M4"
      },
      {
        "no": 2,
        "desc": "DOP0000019A RMA (KING) TRANSPORTATION FOR SEND PART SPK 50011 AHT TO TOP LASER (Job : INHOUSE - MY25 - 7935176 , Operation : 2.0 ) ( Project : AHD RMA ( MY25 ) , Task : 02.2 - LINE TRY OUT)",
        "qty": 1,
        "unit": "TRIP",
        "price": 2500,
        "amount": 2500,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 1,
        "match_level": "M4"
      },
      {
        "no": 3,
        "desc": "DOP0000004A RMA (KING ) SETTING PART SPK50011 (Job : INHOUSE - MY25 - 7935176 , Operation : 2.0 ) ( Project : AHD RMA ( MY25 ) , Task : 02.2 - LINE TRY OUT)",
        "qty": 1,
        "unit": "JOB",
        "price": 1200,
        "amount": 1200,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 4,
        "desc": "DOP0000004A RMA (KING ) LASER CUT PART SPK50011 (3D V22) (Job : TRADING - RMA - 8125238 , Operation : 1.0 ) ( Project : AHD RMA ( DIE MAINT ) 2026, Task : 01.1 - Spare part )",
        "qty": 202,
        "unit": "PCS",
        "price": 85,
        "amount": 17170,
        "diff": false,
        "gr_line": 4,
        "gr_qty": 202,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052835",
        "receiptNum": "50220043287",
        "lineNo": 1,
        "rcvLineId": "50220043287-1",
        "itemCode": "DOP0000019A",
        "itemDesc": "RMA (KING)\\TRANSPORTATION FOR SEND PART SPK50011 TOP LASER TO AHT",
        "qty": 1,
        "uom": "Trip",
        "unitPrice": 2500,
        "lineAmount": 2500,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052835",
          "ITEM_CODE": "DOP0000019A",
          "SHIPMENT_NUM": "TLP-IV-69-09-0025",
          "PACKING_SLIP": "TLP-IV-69-09-0025",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42052835",
        "receiptNum": "50220043287",
        "lineNo": 2,
        "rcvLineId": "50220043287-2",
        "itemCode": "DOP0000019A",
        "itemDesc": "RMA (KING)\\TRANSPORTATION FOR SEND PART SPK50011 AHT TO TOP LASER",
        "qty": 1,
        "uom": "Trip",
        "unitPrice": 2500,
        "lineAmount": 2500,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052835",
          "ITEM_CODE": "DOP0000019A",
          "SHIPMENT_NUM": "TLP-IV-69-09-0025",
          "PACKING_SLIP": "TLP-IV-69-09-0025",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42052835",
        "receiptNum": "50220043287",
        "lineNo": 3,
        "rcvLineId": "50220043287-3",
        "itemCode": "DOP0000004A",
        "itemDesc": "RMA (KING)\\SETTING PART SPK50011",
        "qty": 1,
        "uom": "Job",
        "unitPrice": 1200,
        "lineAmount": 1200,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052835",
          "ITEM_CODE": "DOP0000004A",
          "SHIPMENT_NUM": "TLP-IV-69-09-0025",
          "PACKING_SLIP": "TLP-IV-69-09-0025",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42052835",
        "receiptNum": "50220043287",
        "lineNo": 4,
        "rcvLineId": "50220043287-4",
        "itemCode": "DOP0000004A",
        "itemDesc": "RMA (KING)\\LASER CUT PART SPK50011 (3D VZ2)",
        "qty": 202,
        "uom": "Piece",
        "unitPrice": 85,
        "lineAmount": 17170,
        "qtyBilled": 202,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052835",
          "ITEM_CODE": "DOP0000004A",
          "SHIPMENT_NUM": "TLP-IV-69-09-0025",
          "PACKING_SLIP": "TLP-IV-69-09-0025",
          "QTY_BILLED": "202"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:12:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-100",
    "company": "AHT",
    "vendor": "Konecranes Material Handling (Thailand) Ltd. (Head office)",
    "stax": "0105517000907",
    "inv": "694055679",
    "dt": "2026-09-10",
    "total": 34989,
    "sub": 32700,
    "vat": 2289,
    "po": "42051905",
    "rcv": "50220043288",
    "org": 195,
    "oname": "บริษัทอาปิโก ไฮเทค ทูลลิ่ง จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 32700,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E10"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043288 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "Line Arithmetic Inconsistency",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 2 (Invoice: SERVICE CHARGE FOR REPLACEMENT DRIVE SHAFT PART OF CRANE D3 AHT Q/N.1-1BPFDWWI/1 (1 JOB)): หน่วยนับต่างกลุ่มหลังแปลง (Inv: EA→PCS, Rcv: Job→JOB)",
        "exception_code": "E10",
        "severity": "Medium",
        "actual": "PCS",
        "expected": "JOB",
        "page": 1,
        "bbox": {
          "x": 0.117,
          "y": 0.78,
          "w": 0.756,
          "h": 0.037,
          "page": 1
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "WARN",
        "result": "manual_review",
        "detail": "AI/facts ไม่สอดคล้อง หรือเทียบจำนวนไม่ได้"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 32,700.00 = receipt 32,700"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "CRANE PART : DRIVE SHAFT N50/65 AF08/RS315 MAT NO.81811544 'DEMAG (1 PCS)",
        "qty": 1,
        "unit": "PCS",
        "price": 23100,
        "amount": 23100,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "SERVICE CHARGE FOR REPLACEMENT DRIVE SHAFT PART OF CRANE D3 AHT Q/N.1-1BPFDWWI/1 (1 JOB)",
        "qty": 1,
        "unit": "PCS",
        "price": 9600,
        "amount": 9600,
        "diff": true,
        "gr_line": 2,
        "gr_qty": 1,
        "match_level": "M3"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42051905",
        "receiptNum": "50220043288",
        "lineNo": 1,
        "rcvLineId": "50220043288-1",
        "itemCode": "MSP0001337A",
        "itemDesc": "CRANE PART : DRIVE SHAFT N50/65 AF08/RS315 MAT NO.81811544 \\DEMAG",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 23100,
        "lineAmount": 23100,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42051905",
          "ITEM_CODE": "MSP0001337A",
          "SHIPMENT_NUM": "694055679",
          "PACKING_SLIP": "694055679",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42051905",
        "receiptNum": "50220043288",
        "lineNo": 2,
        "rcvLineId": "50220043288-2",
        "itemCode": null,
        "itemDesc": "SERVICE CHARGE FOR REPLACEMENT DRIVE SHAFT PART OF CRANE D3 AHT Q/N.1-1BPFDWWI/1",
        "qty": 1,
        "uom": "Job",
        "unitPrice": 9600,
        "lineAmount": 9600,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42051905",
          "SHIPMENT_NUM": "694055679",
          "PACKING_SLIP": "694055679",
          "QTY_BILLED": "1"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:14:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-101",
    "company": "AHT",
    "vendor": "บริษัท อาปิโก ไฮเทค ทูลลิ่ง จำกัด AAPICO HITECH TOOLING COMPANY LIMITED",
    "stax": "0105517000907",
    "inv": "694055722",
    "dt": "2026-09-09",
    "total": 2407.5,
    "sub": 2250,
    "vat": 157.5,
    "po": "42050536",
    "rcv": "50220043292",
    "org": 195,
    "oname": "บริษัทอาปิโก ไฮเทค ทูลลิ่ง จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 2250,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: L1.qty(NOT_PRESENT), L1.unit_price(NOT_PRESENT)",
        "exception_code": "E01",
        "severity": "Medium"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ไม่มีบรรทัดที่อ่านค่าครบ",
        "halted_by": "V-01"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043292 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "WARN",
        "result": "manual_review",
        "detail": "AI/facts ไม่สอดคล้อง หรือเทียบจำนวนไม่ได้"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 2,250.00 = receipt 2,250"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "SERVICE GENERAL\\SERVICE CHARGE FOR PM 3/4 CRANE 16 TONS D2 (MAY 2026) OF DIE MAINTENANCE AHT Q/N. 1-1AYTOFJH/1 (1 JOB) REFER TO YOUR ORDER NO.42050536 PVT.3 FOR Jul 2026",
        "qty": 0,
        "unit": "JOB",
        "price": 0,
        "amount": 2250,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M3"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42050536",
        "receiptNum": "50220043292",
        "lineNo": 1,
        "rcvLineId": "50220043292-1",
        "itemCode": null,
        "itemDesc": "SERVICE GENERAL\\SERVICE CHARGE FOR PM 3/4 CRANE 16 TONS  D2 (MAY 2026) OF DIE  MAINTENANCE  AHT  Q/N. 1-1AYTOFJH/1",
        "qty": 1,
        "uom": "Job",
        "unitPrice": 2250,
        "lineAmount": 2250,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42050536",
          "SHIPMENT_NUM": "694055722",
          "PACKING_SLIP": "694055722",
          "QTY_BILLED": "1"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:11:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-102",
    "company": "AHT",
    "vendor": "SIAM MACHINERY AND EQUIPMENT CO.,LT",
    "stax": "0105516000750",
    "inv": "K07289",
    "dt": "2026-09-11",
    "total": 11190.06,
    "sub": 10458,
    "vat": 732.06,
    "po": "42052799",
    "rcv": "50220043294",
    "org": 195,
    "oname": "บริษัท อาปิโก ไฮเทค ชลบุรี จำกัด (สำนักงานใหญ่)",
    "sig": [
      0,
      1
    ],
    "rtotal": 10458,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 3 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043294 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 10,458.00 = receipt 10,458"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "LOWER DIE (DFG0011020A) FC 300",
        "qty": 38,
        "unit": "KG",
        "price": 47,
        "amount": 1786,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 38,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "UPPER DIE (DFG0011020A) FC 300",
        "qty": 136,
        "unit": "KG",
        "price": 47,
        "amount": 6392,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 136,
        "match_level": "M1"
      },
      {
        "no": 3,
        "desc": "UPPER PAD (DFG0011020A) FCD 550 (Project : AHD_AS (P703 BUNDEL 1.6), Task:05.2-DFG0011020A)",
        "qty": 40,
        "unit": "KG",
        "price": 57,
        "amount": 2280,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 40,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052799",
        "receiptNum": "50220043294",
        "lineNo": 1,
        "rcvLineId": "50220043294-1",
        "itemCode": "DRM0028591A",
        "itemDesc": "FC300/CASTING/260X285X165 LOWER INSERT (DFG0011020A)",
        "qty": 38,
        "uom": "Kilogram",
        "unitPrice": 47,
        "lineAmount": 1786,
        "qtyBilled": 38,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052799",
          "ITEM_CODE": "DRM0028591A",
          "SHIPMENT_NUM": "K07289",
          "PACKING_SLIP": "K07289",
          "QTY_BILLED": "38"
        }
      },
      {
        "poNumber": "42052799",
        "receiptNum": "50220043294",
        "lineNo": 2,
        "rcvLineId": "50220043294-2",
        "itemCode": "DRM0028591A",
        "itemDesc": "FC300/CASTING/405X610X205 UPPER DIE (DFG0011020A)",
        "qty": 136,
        "uom": "Kilogram",
        "unitPrice": 47,
        "lineAmount": 6392,
        "qtyBilled": 136,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052799",
          "ITEM_CODE": "DRM0028591A",
          "SHIPMENT_NUM": "K07289",
          "PACKING_SLIP": "K07289",
          "QTY_BILLED": "136"
        }
      },
      {
        "poNumber": "42052799",
        "receiptNum": "50220043294",
        "lineNo": 3,
        "rcvLineId": "50220043294-3",
        "itemCode": "DRM0028592A",
        "itemDesc": "FCD550/CASTING/150X340X147 UPPER PAD (DFG0011020A)",
        "qty": 40,
        "uom": "Kilogram",
        "unitPrice": 57,
        "lineAmount": 2280,
        "qtyBilled": 40,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052799",
          "ITEM_CODE": "DRM0028592A",
          "SHIPMENT_NUM": "K07289",
          "PACKING_SLIP": "K07289",
          "QTY_BILLED": "40"
        }
      }
    ],
    "pages": 4,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:16:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-103",
    "company": "AHT",
    "vendor": "ซีอาร์วี แพคเกจจิ้ง จำกัด",
    "stax": "0105545105637",
    "inv": "IV2601524",
    "dt": "2026-09-11",
    "total": 5350,
    "sub": 5000,
    "vat": 350,
    "po": "42052753",
    "rcv": "50220043295",
    "org": 195,
    "oname": "AAPICO HITECH TOOLING COMPANY LIMITED",
    "sig": [
      1,
      1
    ],
    "rtotal": 5000,
    "status": "Review",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: customer_name(LOW_CONFIDENCE), customer_address(LOW_CONFIDENCE), customer_tax_id(INVALID_FORMAT:TAX_ID_CHECKSUM)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.0605,
          "y": 0.1767,
          "w": 0.2863,
          "h": 0.0086,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043295 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "Tax ID ลูกค้าอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 5,000.00 = receipt 5,000"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "20-PBB1037GR Part Bin Box Model:1037/137/9037/Green",
        "qty": 100,
        "unit": "PCS",
        "price": 50,
        "amount": 5000,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 100,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052753",
        "receiptNum": "50220043295",
        "lineNo": 1,
        "rcvLineId": "50220043295-1",
        "itemCode": "AFS0005789A",
        "itemDesc": "PLASTIC BOX NO. 1037",
        "qty": 100,
        "uom": "Piece",
        "unitPrice": 50,
        "lineAmount": 5000,
        "qtyBilled": 100,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052753",
          "ITEM_CODE": "AFS0005789A",
          "SHIPMENT_NUM": "IV2601524",
          "PACKING_SLIP": "IV2601524",
          "QTY_BILLED": "100"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:16:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-104",
    "company": "AHT",
    "vendor": "บริษัท เทคูโร (ประเทศไทย) จำกัด สำนักงานใหญ่ TEIKURO (THAILAND) CO.,LTD. HEAD OFFICE",
    "stax": "0105533003052",
    "inv": "IV-112750",
    "dt": "2026-09-11",
    "total": 849.15,
    "sub": 793.6,
    "vat": 55.55,
    "po": "42052820",
    "rcv": "50220043296",
    "org": 195,
    "oname": "บริษัท อาปิโก ไฮเทค บุสลัง จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 793.6,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043296 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 793.60 = receipt 793.6"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "บริการชุบโครเมียมอุตสาหกรรม FORD T6 Refurbished/AB39-21618B40/41-A (DFG0010486A)/FOR HARDCHROME INSERT B/H JOB:TRADING-T6-8181274,Operation:10 Project:AHD_FORD T6 Refurbished Task:43.2-DFG0010486A TCMT-2314/2026 4/9/2026",
        "qty": 1,
        "unit": "PCS",
        "price": 793.6,
        "amount": 793.6,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052820",
        "receiptNum": "50220043296",
        "lineNo": 1,
        "rcvLineId": "50220043296-1",
        "itemCode": "DOP0000005A",
        "itemDesc": "FORD T6 Refurbished\\AB39-21618B40/41-A (DFG0010486A)\\FOR HARD CHROME INSERT B/H",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 793.6,
        "lineAmount": 793.6,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052820",
          "ITEM_CODE": "DOP0000005A",
          "SHIPMENT_NUM": "IV-112750",
          "PACKING_SLIP": "IV-112750",
          "QTY_BILLED": "1"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:16:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-105",
    "company": "AHT",
    "vendor": "บริษัท ไดโด ดีเอ็มเอส (ไทยแลนด์) จำกัด DAIDO DMS (THAILAND) CO., LTD.",
    "stax": "0145548001557",
    "inv": "TD012901",
    "dt": "2026-09-10",
    "total": 321,
    "sub": 300,
    "vat": 21,
    "po": "42052727",
    "rcv": "—",
    "org": null,
    "oname": "บริษัท อาปิโก ไฮเทค บุรีรัมย์ จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": null,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: customer_name(LOW_CONFIDENCE)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.162,
          "y": 0.145,
          "w": 0.252,
          "h": 0.017,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "WARN",
        "result": "manual_review",
        "detail": "ไม่พบใบรับของผู้ขาย - ด้วยเลข Invoice TD012901, T268-0122 — ตรวจเลข Invoice / Tax ID ที่อ่านได้ หรือยังไม่รับของ (ไม่ทราบ Tax ID ผู้ขาย)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ไม่มีใบรับ จึงไม่มี ORG_ID",
        "halted_by": "V-04"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ข้ามตาม gate",
        "halted_by": "V-04"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ข้ามตาม gate",
        "halted_by": "V-04"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ข้ามตาม gate",
        "halted_by": "V-04"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "SERVICE CHARGE DOP0000014A AMATA(5K45) /DFG0009803A/REMOVE INSERT (JOB:OUTSOURCE-5K45-7641140,OPERATION: 10) (PROJECT: AHD_AMATA (5K45),TASK: 104.2-DFG0009803A)",
        "qty": 1,
        "unit": "LOT",
        "price": 300,
        "amount": 300,
        "diff": false
      }
    ],
    "oracleReceiptLines": [],
    "pages": 4,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:16:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": true,
    "up": "2026-10-09"
  },
  {
    "doc": "DMS-106",
    "company": "AHT",
    "vendor": "สำนักงานใหญ่",
    "stax": "0115533001629",
    "inv": "69A/18522",
    "dt": "2026-09-09",
    "total": 6119.22,
    "sub": 5718.9,
    "vat": 400.32,
    "po": "42052675",
    "rcv": "50220043300",
    "org": 195,
    "oname": "บริษัท อาปิโก ไฮเทค ชลบุรี จำกัด สำนักงานใหญ่",
    "sig": [
      1,
      1
    ],
    "rtotal": 5718.9,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043300 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 5,718.90 = receipt 5,718.9"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "พั้นช์เทคเลอร์ JPLD-C13-80-P12.05-W7.05",
        "qty": 3,
        "unit": "PCS",
        "price": 343.7,
        "amount": 1031.1,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 3,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "พั้นช์งานหนักรูกลม ทูบ TICN C-APLA-C25-090-P22.30",
        "qty": 3,
        "unit": "PCS",
        "price": 1562.6,
        "amount": 4687.8,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 3,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052675",
        "receiptNum": "50220043300",
        "lineNo": 1,
        "rcvLineId": "50220043300-1",
        "itemCode": "DCM0032635A",
        "itemDesc": "PUNCH\\JPLD-C13-80-P12.05-W7.05\\INTERTOOL",
        "qty": 3,
        "uom": "Piece",
        "unitPrice": 343.7,
        "lineAmount": 1031.1,
        "qtyBilled": 3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052675",
          "ITEM_CODE": "DCM0032635A",
          "SHIPMENT_NUM": "69A/18522",
          "PACKING_SLIP": "69A/18522",
          "QTY_BILLED": "3"
        }
      },
      {
        "poNumber": "42052675",
        "receiptNum": "50220043300",
        "lineNo": 2,
        "rcvLineId": "50220043300-2",
        "itemCode": "DCM0033304A",
        "itemDesc": "PUNCHES WITH DOWEL FOR HEAVY LOAD\\C-APLA-C25-90-P22.30\\INTERTOOL",
        "qty": 3,
        "uom": "Piece",
        "unitPrice": 1562.6,
        "lineAmount": 4687.8,
        "qtyBilled": 3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052675",
          "ITEM_CODE": "DCM0033304A",
          "SHIPMENT_NUM": "69A/18522",
          "PACKING_SLIP": "69A/18522",
          "QTY_BILLED": "3"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:19:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-107",
    "company": "AHT",
    "vendor": "3D DESIGN TOOL AND DIE ENGINEERING CO.,LTD(Head office)",
    "stax": "0145566001938",
    "inv": "IV2026-09002",
    "dt": "2026-09-23",
    "total": 190995,
    "sub": 178500,
    "vat": 12495,
    "po": "42052569",
    "rcv": "50220043380",
    "org": 195,
    "oname": "บริษัท อาปิโก ไฮเทค อยุธยา จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 178500,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043380 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "WARN",
        "result": "manual_review",
        "detail": "วางบิลเป็นงวด 1 บรรทัด (ยอดเงินตรงใบรับ แต่ราคา/จำนวนเป็นสัดส่วนงวด) — รอมาตรฐานกำหนด ให้คนตรวจ"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "WARN",
        "result": "manual_review",
        "detail": "AI/facts ไม่สอดคล้อง หรือเทียบจำนวนไม่ได้"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 178,500.00 = receipt 178,500"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "1 DFG0011013A 7553065060/7553065070-1 \\ PROGRESSIVE (D26-06-3743) (Project:AHD_IMCT (R500), Task:258.2-DFG0011013A)",
        "qty": 1,
        "unit": "SET",
        "price": 178500,
        "amount": 178500,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 0.3,
        "match_level": "M4"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052569",
        "receiptNum": "50220043380",
        "lineNo": 1,
        "rcvLineId": "50220043380-1",
        "itemCode": "DFG0011013A",
        "itemDesc": "7553065060/7553065070-1 \\ PROGRESSIVE   [D26-06-3743]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 595000,
        "lineAmount": 178500,
        "qtyBilled": 0.3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052569",
          "ITEM_CODE": "DFG0011013A",
          "SHIPMENT_NUM": "IV2026-09002",
          "PACKING_SLIP": "IV2026-09002",
          "QTY_BILLED": "0.3"
        }
      }
    ],
    "pages": 6,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:21:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-108",
    "company": "AHT",
    "vendor": "3D DESIGN TOOL AND DIE ENGINEERING CO.,LTD(Head office)",
    "stax": "0145566001938",
    "inv": "IV2026-09003",
    "dt": "2026-09-23",
    "total": 43335,
    "sub": 40500,
    "vat": 2835,
    "po": "42052570",
    "rcv": "50220043381",
    "org": 195,
    "oname": "บริษัท อาปิโก ไฮเทค พลลึง จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 40500,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043381 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "WARN",
        "result": "manual_review",
        "detail": "วางบิลเป็นงวด 1 บรรทัด (ยอดเงินตรงใบรับ แต่ราคา/จำนวนเป็นสัดส่วนงวด) — รอมาตรฐานกำหนด ให้คนตรวจ"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "WARN",
        "result": "manual_review",
        "detail": "AI/facts ไม่สอดคล้อง หรือเทียบจำนวนไม่ได้"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 40,500.00 = receipt 40,500"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "DFG0011016A 7553065060/7553065070-2 \\ PROGRESSIVE (D26-06-3746) (Project:AHD_IMCT (RS00), Task:261.2-DFG0011016A)",
        "qty": 1,
        "unit": "SET",
        "price": 40500,
        "amount": 40500,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 0.3,
        "match_level": "M4"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052570",
        "receiptNum": "50220043381",
        "lineNo": 1,
        "rcvLineId": "50220043381-1",
        "itemCode": "DFG0011016A",
        "itemDesc": "7553065060/7553065070-2 \\ PROGRESSIVE   [D26-06-3746]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 135000,
        "lineAmount": 40500,
        "qtyBilled": 0.3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052570",
          "ITEM_CODE": "DFG0011016A",
          "SHIPMENT_NUM": "IV2026-09003",
          "PACKING_SLIP": "IV2026-09003",
          "QTY_BILLED": "0.3"
        }
      }
    ],
    "pages": 6,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:24:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-109",
    "company": "AHT",
    "vendor": "FINE COMPONENTS (THAILAND) CO.,LTD.",
    "stax": "0215544000113",
    "inv": "INVM-2026/09/008",
    "dt": "—",
    "total": 690150,
    "sub": 645000,
    "vat": 45150,
    "po": "42047066",
    "rcv": "50220043382",
    "org": 195,
    "oname": "AAPICO HITECH TOOLING COMPANY LIMITED",
    "sig": [
      1,
      1
    ],
    "rtotal": 645000,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 4 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043382 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "WARN",
        "result": "manual_review",
        "detail": "วางบิลเป็นงวด 4 บรรทัด (ยอดเงินตรงใบรับ แต่ราคา/จำนวนเป็นสัดส่วนงวด) — รอมาตรฐานกำหนด ให้คนตรวจ"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "WARN",
        "result": "manual_review",
        "detail": "AI/facts ไม่สอดคล้อง หรือเทียบจำนวนไม่ได้"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 645,000.00 = receipt 645,000"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "90146 2LS0A \\ FL-REST [D24-09-2944] ( Project:AHD_NISSAN (P02H), Task:28.2 - DFG0010213A )",
        "qty": 1,
        "unit": "SET",
        "price": 156000,
        "amount": 156000,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 0.3,
        "match_level": "M4"
      },
      {
        "no": 2,
        "desc": "90146 2LS0A \\ PI-CUT [D24-09-2945] ( Project:AHD_NISSAN (P02H), Task:29.2 - DFG0010214A )",
        "qty": 1,
        "unit": "SET",
        "price": 135000,
        "amount": 135000,
        "diff": true,
        "gr_line": 2,
        "gr_qty": 0.3,
        "match_level": "M4"
      },
      {
        "no": 3,
        "desc": "90146 2LS0A \\ DR [D24-09-2942] ( Project:AHD_NISSAN (P02H), Task:26.2 - DFG0010211A )",
        "qty": 1,
        "unit": "SET",
        "price": 192000,
        "amount": 192000,
        "diff": true,
        "gr_line": 3,
        "gr_qty": 0.3,
        "match_level": "M4"
      },
      {
        "no": 4,
        "desc": "90146 2LS0A \\ TR-PI [D24-09-2943] ( Project:AHD_NISSAN (P02H), Task:27.2 - DFG0010212A )",
        "qty": 1,
        "unit": "SET",
        "price": 162000,
        "amount": 162000,
        "diff": true,
        "gr_line": 4,
        "gr_qty": 0.3,
        "match_level": "M4"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42047066",
        "receiptNum": "50220043382",
        "lineNo": 1,
        "rcvLineId": "50220043382-1",
        "itemCode": "DFG0010213A",
        "itemDesc": "90146 2LS0A \\ FL-REST [D24-09-2944]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 520000,
        "lineAmount": 156000,
        "qtyBilled": 0.9,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42047066",
          "ITEM_CODE": "DFG0010213A",
          "SHIPMENT_NUM": "INVM-2026/09/008",
          "PACKING_SLIP": "INVM-2026/09/008",
          "QTY_BILLED": "0.9"
        }
      },
      {
        "poNumber": "42047066",
        "receiptNum": "50220043382",
        "lineNo": 2,
        "rcvLineId": "50220043382-2",
        "itemCode": "DFG0010214A",
        "itemDesc": "90146 2LS0A \\ PI-CUT [D24-09-2945]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 450000,
        "lineAmount": 135000,
        "qtyBilled": 0.9,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42047066",
          "ITEM_CODE": "DFG0010214A",
          "SHIPMENT_NUM": "INVM-2026/09/008",
          "PACKING_SLIP": "INVM-2026/09/008",
          "QTY_BILLED": "0.9"
        }
      },
      {
        "poNumber": "42047066",
        "receiptNum": "50220043382",
        "lineNo": 3,
        "rcvLineId": "50220043382-3",
        "itemCode": "DFG0010211A",
        "itemDesc": "90146 2LS0A \\ DR [D24-09-2942]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 640000,
        "lineAmount": 192000,
        "qtyBilled": 0.9,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42047066",
          "ITEM_CODE": "DFG0010211A",
          "SHIPMENT_NUM": "INVM-2026/09/008",
          "PACKING_SLIP": "INVM-2026/09/008",
          "QTY_BILLED": "0.9"
        }
      },
      {
        "poNumber": "42047066",
        "receiptNum": "50220043382",
        "lineNo": 4,
        "rcvLineId": "50220043382-4",
        "itemCode": "DFG0010212A",
        "itemDesc": "90146 2LS0A \\ TR-PI [D24-09-2943]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 540000,
        "lineAmount": 162000,
        "qtyBilled": 0.9,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42047066",
          "ITEM_CODE": "DFG0010212A",
          "SHIPMENT_NUM": "INVM-2026/09/008",
          "PACKING_SLIP": "INVM-2026/09/008",
          "QTY_BILLED": "0.9"
        }
      }
    ],
    "pages": 7,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:23:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-110",
    "company": "AHT",
    "vendor": "FUJIGIKEN ( THAILAND ) CO.,LTD.",
    "stax": "0115554012018",
    "inv": "IV.26/0144",
    "dt": "2026-09-23",
    "total": 89880,
    "sub": 84000,
    "vat": 5880,
    "po": "42051575",
    "rcv": "50220043383",
    "org": 195,
    "oname": "AAPICO HITECH TOOLING COMPANY LIMITED",
    "sig": [
      1,
      1
    ],
    "rtotal": 84000,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043383 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "WARN",
        "result": "manual_review",
        "detail": "วางบิลเป็นงวด 2 บรรทัด (ยอดเงินตรงใบรับ แต่ราคา/จำนวนเป็นสัดส่วนงวด) — รอมาตรฐานกำหนด ให้คนตรวจ"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "WARN",
        "result": "manual_review",
        "detail": "AI/facts ไม่สอดคล้อง หรือเทียบจำนวนไม่ได้"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 84,000.00 = receipt 84,000"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "7553058780-1\\C/F RH [D26-04-3613] ( 60,000 X 70% = 42,000 )",
        "qty": 1,
        "unit": "SET",
        "price": 42000,
        "amount": 42000,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 0.7,
        "match_level": "M5"
      },
      {
        "no": 2,
        "desc": "7553058790-1\\C/F LH [D26-04-3614] ( 60,000 X 70% = 42,000 )",
        "qty": 1,
        "unit": "SET",
        "price": 42000,
        "amount": 42000,
        "diff": true,
        "gr_line": 2,
        "gr_qty": 0.7,
        "match_level": "M5"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42051575",
        "receiptNum": "50220043383",
        "lineNo": 1,
        "rcvLineId": "50220043383-1",
        "itemCode": "DFG0010883A",
        "itemDesc": "7553058780-1 \\ C/F RH [D26-04-3613]",
        "qty": 0.7,
        "uom": "Set",
        "unitPrice": 60000,
        "lineAmount": 42000,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42051575",
          "ITEM_CODE": "DFG0010883A",
          "SHIPMENT_NUM": "IV.26/0144",
          "PACKING_SLIP": "IV.26/0144",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42051575",
        "receiptNum": "50220043383",
        "lineNo": 2,
        "rcvLineId": "50220043383-2",
        "itemCode": "DFG0010884A",
        "itemDesc": "7553058790-1 \\ C/F LH [D26-04-3614]",
        "qty": 0.7,
        "uom": "Set",
        "unitPrice": 60000,
        "lineAmount": 42000,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42051575",
          "ITEM_CODE": "DFG0010884A",
          "SHIPMENT_NUM": "IV.26/0144",
          "PACKING_SLIP": "IV.26/0144",
          "QTY_BILLED": "1"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:21:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-111",
    "company": "AHT",
    "vendor": "บริษัท อิมเพล เจเนอเรชั่น จำกัด (สำนักงานใหญ่) IMPEL GENERATION CO., LTD.",
    "stax": "0115543006682",
    "inv": "IM3031",
    "dt": "2026-09-25",
    "total": 22470,
    "sub": 21000,
    "vat": 1470,
    "po": "42050842",
    "rcv": "50220043390",
    "org": 195,
    "oname": "บริษัท อาปิโก ไฮเทค จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 21000,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043390 (INV-BY-PO-VENDOR)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "WARN",
        "result": "manual_review",
        "detail": "วางบิลเป็นงวด 2 บรรทัด (ยอดเงินตรงใบรับ แต่ราคา/จำนวนเป็นสัดส่วนงวด) — รอมาตรฐานกำหนด ให้คนตรวจ"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "WARN",
        "result": "manual_review",
        "detail": "AI/facts ไม่สอดคล้อง หรือเทียบจำนวนไม่ได้"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 21,000.00 = receipt 21,000"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "DFG0010754A 7552910510 / C/F ASSY (D26-01-3484) ( Project;AHD_IMCT (RS00) , Task;132.2-DFG0010754A)",
        "qty": 1,
        "unit": "SET",
        "price": 10500,
        "amount": 10500,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 0.3,
        "match_level": "M5"
      },
      {
        "no": 2,
        "desc": "DFG0010749A 7552910430 / C/F ASSY (D26-01-3479) ( Project;AHD_IMCT (RS00) , Task;127.2-DFG0010749A)",
        "qty": 1,
        "unit": "SET",
        "price": 10500,
        "amount": 10500,
        "diff": true,
        "gr_line": 2,
        "gr_qty": 0.3,
        "match_level": "M5"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42050842",
        "receiptNum": "50220043390",
        "lineNo": 1,
        "rcvLineId": "50220043390-1",
        "itemCode": "DFG0010754A",
        "itemDesc": "7552910510 \\ C/F ASSY [D26-01-3484]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 35000,
        "lineAmount": 10500,
        "qtyBilled": 0.3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42050842",
          "ITEM_CODE": "DFG0010754A",
          "SHIPMENT_NUM": "IM 3031",
          "PACKING_SLIP": "IM 3031",
          "QTY_BILLED": "0.3"
        }
      },
      {
        "poNumber": "42050842",
        "receiptNum": "50220043390",
        "lineNo": 2,
        "rcvLineId": "50220043390-2",
        "itemCode": "DFG0010749A",
        "itemDesc": "7552910430 \\ C/F ASSY [D26-01-3479]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 35000,
        "lineAmount": 10500,
        "qtyBilled": 0.3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42050842",
          "ITEM_CODE": "DFG0010749A",
          "SHIPMENT_NUM": "IM 3031",
          "PACKING_SLIP": "IM 3031",
          "QTY_BILLED": "0.3"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:24:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-112",
    "company": "AHT",
    "vendor": "ATM PRECISION PART ENGINEERING CO., LTD.",
    "stax": "0135556007950",
    "inv": "69/213",
    "dt": "2026-09-25",
    "total": 10914,
    "sub": 10200,
    "vat": 714,
    "po": "42038471",
    "rcv": "50220043391",
    "org": 195,
    "oname": "AAPICO HITECH TOOLING COMPANY LIMITED",
    "sig": [
      1,
      1
    ],
    "rtotal": 10200,
    "status": "Hold",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E03",
      "E14",
      "E11"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "Total Mismatch",
        "status": "FAIL",
        "result": "fail",
        "detail": "ยอดรวมภายในใบแจ้งหนี้ไม่สอดคล้อง {'lines_vs_sub_total': '23800.00', 'vat_7pct': '0.00', 'sub_plus_vat_vs_grand': '0.00'}",
        "exception_code": "E03",
        "severity": "High",
        "actual": "10200.00",
        "expected": "34000.00",
        "page": 1,
        "bbox": {
          "x": 0.876,
          "y": 0.727,
          "w": 0.046,
          "h": 0.011,
          "page": 1
        }
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043391 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "Duplicate Item",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 1 (Invoice: 44591-BZ390 #2\\C/F): จับคู่ด้วยคำบรรยาย (ITEM #2 matches inv #2, UOM SET, price 17000; qty 0.3 vs 1 not decisive)",
        "exception_code": "E11",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.056,
          "y": 0.354,
          "w": 0.876,
          "h": 0.018,
          "page": 1
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "Tax Calculation Mismatch",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 1 (Invoice: 44591-BZ390 #2\\C/F): จำนวนวางบิลเกินใบรับ (Inv: 1, Rcv: 0.3)",
        "exception_code": "E14",
        "severity": "High",
        "actual": "1",
        "expected": "0.3",
        "page": 1,
        "bbox": {
          "x": 0.056,
          "y": 0.354,
          "w": 0.876,
          "h": 0.018,
          "page": 1
        }
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 10,200.00 = receipt 10,200"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "44591-BZ390 #2\\C/F",
        "qty": 1,
        "unit": "SET",
        "price": 17000,
        "amount": 17000,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 0.3,
        "match_level": "M4"
      },
      {
        "no": 2,
        "desc": "44591-BZ390 #3 \\ C/F",
        "qty": 1,
        "unit": "SET",
        "price": 17000,
        "amount": 17000,
        "diff": true,
        "gr_line": 2,
        "gr_qty": 0.3,
        "match_level": "M4"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42038471",
        "receiptNum": "50220043391",
        "lineNo": 1,
        "rcvLineId": "50220043391-1",
        "itemCode": "DFG0008717A",
        "itemDesc": "44591-BZ390#2 \\ C/F [D21-11-1807]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 17000,
        "lineAmount": 5100,
        "qtyBilled": 0.3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42038471",
          "ITEM_CODE": "DFG0008717A",
          "SHIPMENT_NUM": "69/213",
          "PACKING_SLIP": "69/213",
          "QTY_BILLED": "0.3"
        }
      },
      {
        "poNumber": "42038471",
        "receiptNum": "50220043391",
        "lineNo": 2,
        "rcvLineId": "50220043391-2",
        "itemCode": "DFG0008722A",
        "itemDesc": "44591-BZ390#3 \\ C/F [D21-11-1812]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 17000,
        "lineAmount": 5100,
        "qtyBilled": 0.3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42038471",
          "ITEM_CODE": "DFG0008722A",
          "SHIPMENT_NUM": "69/213",
          "PACKING_SLIP": "69/213",
          "QTY_BILLED": "0.3"
        }
      }
    ],
    "pages": 4,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:20:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Hold · ความรุนแรงสูงสุด High",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-113",
    "company": "AHT",
    "vendor": "บริษัท เอ ที เอ็ม พรีซิชั่น พาร์ท เอ็นจิเนียริ่ง จำกัด ATM PRECISION PART ENGINEERING CO., LTD.",
    "stax": "0135556007950",
    "inv": "69/214",
    "dt": "2026-09-25",
    "total": 6420,
    "sub": 6000,
    "vat": 420,
    "po": "42038689",
    "rcv": "50220043392",
    "org": 195,
    "oname": "AAPICO HITECH TOOLING COMPANY LIMITED",
    "sig": [
      1,
      1
    ],
    "rtotal": 6000,
    "status": "Hold",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E13",
      "E14",
      "E01",
      "E11"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: L3.qty(NOT_PRESENT), L3.uom(NOT_PRESENT), L3.unit_price(NOT_PRESENT), L3.amount(CONFLICT_BETWEEN_SOURCES)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 2,
        "bbox": {
          "x": 0.042,
          "y": 0.348,
          "w": 0.9,
          "h": 0.34,
          "page": 2
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ยอดรวมหรือราคารวมต่อรายการอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043392 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "Duplicate Item",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 1 (Invoice: 44591-BZ390 #1\\C/F): จับคู่ด้วยคำบรรยาย (ITEM/desc 44591-BZ390#1 C/F ตรง, unit price 20000, qty 0.3 ไม่ชี้ขาด รวม 2 บรรทัด)",
        "exception_code": "E11",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.035,
          "y": 0.338,
          "w": 0.897,
          "h": 0.35,
          "page": 1
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "Tax Calculation Mismatch",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 1 (Invoice: 44591-BZ390 #1\\C/F): จำนวนวางบิลเกินใบรับ (Inv: 1, Rcv: 0.3)",
        "exception_code": "E14",
        "severity": "High",
        "actual": "1",
        "page": 1,
        "bbox": {
          "x": 0.035,
          "y": 0.338,
          "w": 0.897,
          "h": 0.35,
          "page": 1
        }
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 6,000.00 = receipt 6,000"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "44591-BZ390 #1\\C/F",
        "qty": 1,
        "unit": "SET",
        "price": 20000,
        "amount": 20000,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 0.3,
        "match_level": "M4"
      },
      {
        "no": 2,
        "desc": "44591-BZ390 #1\\C/F",
        "qty": 1,
        "unit": "SET",
        "price": 20000,
        "amount": 20000,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 0.3,
        "match_level": "M4"
      },
      {
        "no": 3,
        "desc": "REMARK : 30% AFTER PO APPROVAL",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42038689",
        "receiptNum": "50220043392",
        "lineNo": 1,
        "rcvLineId": "50220043392-1",
        "itemCode": "DFG0008712A",
        "itemDesc": "44591-BZ390#1 \\ C/F [D21-11-1802]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 20000,
        "lineAmount": 6000,
        "qtyBilled": 0.3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42038689",
          "ITEM_CODE": "DFG0008712A",
          "SHIPMENT_NUM": "69/214",
          "PACKING_SLIP": "69/214",
          "QTY_BILLED": "0.3"
        }
      }
    ],
    "pages": 4,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:24:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Hold · ความรุนแรงสูงสุด High",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-114",
    "company": "AHT",
    "vendor": "SON AUTO ENGINEERING CO., LTD (HEAD OFFICE) บริษัท ซัน ออโต้ เอ็นจิเนียริ่ง จำกัด (สำนักงานใหญ่)",
    "stax": "0205553019816",
    "inv": "SON-2609017",
    "dt": "2026-09-23",
    "total": 57138,
    "sub": 53400,
    "vat": 3738,
    "po": "42050734",
    "rcv": "50220043393",
    "org": 195,
    "oname": "บริษัท อาปิโก ไฮเทค มูลลิ่ง จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 53400,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 7 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043393 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 53,400.00 = receipt 53,400"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "1 DFG0010600A CCN50386\\C/F [D25-12-3330] (Project:AHD_AMATA (RS00), Task:111.2 - DFG0010600A)",
        "qty": 0.3,
        "unit": "SET",
        "price": 33000,
        "amount": 9900,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 0.3,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "2 DFG0010601A CCN50385\\C/F [D25-12-3331] (Project:AHD_AMATA (RS00), Task:112.2 - DFG0010601A)",
        "qty": 0.3,
        "unit": "SET",
        "price": 33000,
        "amount": 9900,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 0.3,
        "match_level": "M1"
      },
      {
        "no": 3,
        "desc": "3 DFG0010609A CCN50278\\C/F [D25-12-3339] (Project:AHD_AMATA (RS00), Task:120.2 - DFG0010609A)",
        "qty": 0.3,
        "unit": "SET",
        "price": 13000,
        "amount": 3900,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 0.3,
        "match_level": "M1"
      },
      {
        "no": 4,
        "desc": "4 DFG0010493A CCN42138\\C/F [D25-12-3223] (Project:AHD_AMATA (RS00), Task:04.2 - DFG0010493A)",
        "qty": 0.3,
        "unit": "SET",
        "price": 28000,
        "amount": 8400,
        "diff": false,
        "gr_line": 4,
        "gr_qty": 0.3,
        "match_level": "M1"
      },
      {
        "no": 5,
        "desc": "5 DFG0010494A CCN42132\\C/F [D25-12-3224] (Project:AHD_AMATA (RS00), Task:05.2 - DFG0010494A)",
        "qty": 0.3,
        "unit": "SET",
        "price": 28000,
        "amount": 8400,
        "diff": false,
        "gr_line": 5,
        "gr_qty": 0.3,
        "match_level": "M1"
      },
      {
        "no": 6,
        "desc": "6 DFG0010499A CCN41625\\C/F [D25-12-3229] (Project:AHD_AMATA (RS00), Task:10.2 - DFG0010499A)",
        "qty": 0.3,
        "unit": "SET",
        "price": 20000,
        "amount": 6000,
        "diff": false,
        "gr_line": 6,
        "gr_qty": 0.3,
        "match_level": "M1"
      },
      {
        "no": 7,
        "desc": "7 DFG0010515A CCN48050\\C/F [D25-12-3245] (Project:AHD_AMATA (RS00), Task:26.2 - DFG0010515A)",
        "qty": 0.3,
        "unit": "SET",
        "price": 23000,
        "amount": 6900,
        "diff": false,
        "gr_line": 7,
        "gr_qty": 0.3,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42050734",
        "receiptNum": "50220043393",
        "lineNo": 1,
        "rcvLineId": "50220043393-1",
        "itemCode": "DFG0010600A",
        "itemDesc": "CCN50386 \\ C/F [D25-12-3330]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 33000,
        "lineAmount": 9900,
        "qtyBilled": 0.3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42050734",
          "ITEM_CODE": "DFG0010600A",
          "SHIPMENT_NUM": "SON-2609017",
          "PACKING_SLIP": "SON-2609017",
          "QTY_BILLED": "0.3"
        }
      },
      {
        "poNumber": "42050734",
        "receiptNum": "50220043393",
        "lineNo": 2,
        "rcvLineId": "50220043393-2",
        "itemCode": "DFG0010601A",
        "itemDesc": "CCN50385 \\ C/F [D25-12-3331]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 33000,
        "lineAmount": 9900,
        "qtyBilled": 0.3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42050734",
          "ITEM_CODE": "DFG0010601A",
          "SHIPMENT_NUM": "SON-2609017",
          "PACKING_SLIP": "SON-2609017",
          "QTY_BILLED": "0.3"
        }
      },
      {
        "poNumber": "42050734",
        "receiptNum": "50220043393",
        "lineNo": 3,
        "rcvLineId": "50220043393-3",
        "itemCode": "DFG0010609A",
        "itemDesc": "CCN50278 \\ C/F [D25-12-3339]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 13000,
        "lineAmount": 3900,
        "qtyBilled": 0.3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42050734",
          "ITEM_CODE": "DFG0010609A",
          "SHIPMENT_NUM": "SON-2609017",
          "PACKING_SLIP": "SON-2609017",
          "QTY_BILLED": "0.3"
        }
      },
      {
        "poNumber": "42050734",
        "receiptNum": "50220043393",
        "lineNo": 4,
        "rcvLineId": "50220043393-4",
        "itemCode": "DFG0010493A",
        "itemDesc": "CCN42138 \\ C/F [D25-12-3223]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 28000,
        "lineAmount": 8400,
        "qtyBilled": 0.3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42050734",
          "ITEM_CODE": "DFG0010493A",
          "SHIPMENT_NUM": "SON-2609017",
          "PACKING_SLIP": "SON-2609017",
          "QTY_BILLED": "0.3"
        }
      },
      {
        "poNumber": "42050734",
        "receiptNum": "50220043393",
        "lineNo": 5,
        "rcvLineId": "50220043393-5",
        "itemCode": "DFG0010494A",
        "itemDesc": "CCN42132 \\ C/F [D25-12-3224]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 28000,
        "lineAmount": 8400,
        "qtyBilled": 0.3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42050734",
          "ITEM_CODE": "DFG0010494A",
          "SHIPMENT_NUM": "SON-2609017",
          "PACKING_SLIP": "SON-2609017",
          "QTY_BILLED": "0.3"
        }
      },
      {
        "poNumber": "42050734",
        "receiptNum": "50220043393",
        "lineNo": 6,
        "rcvLineId": "50220043393-6",
        "itemCode": "DFG0010499A",
        "itemDesc": "CCN41625 \\ C/F [D25-12-3229]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 20000,
        "lineAmount": 6000,
        "qtyBilled": 0.3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42050734",
          "ITEM_CODE": "DFG0010499A",
          "SHIPMENT_NUM": "SON-2609017",
          "PACKING_SLIP": "SON-2609017",
          "QTY_BILLED": "0.3"
        }
      },
      {
        "poNumber": "42050734",
        "receiptNum": "50220043393",
        "lineNo": 7,
        "rcvLineId": "50220043393-7",
        "itemCode": "DFG0010515A",
        "itemDesc": "CCN48050 \\ C/F [D25-12-3245]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 23000,
        "lineAmount": 6900,
        "qtyBilled": 0.3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42050734",
          "ITEM_CODE": "DFG0010515A",
          "SHIPMENT_NUM": "SON-2609017",
          "PACKING_SLIP": "SON-2609017",
          "QTY_BILLED": "0.3"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:26:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-115",
    "company": "AHT",
    "vendor": "บริษัท ธนบูรณ์ วิศวกรรมซัคเซส จำกัด TANABOON ENGINEERINGSUCCESS CO., LTD.",
    "stax": "0125558007183",
    "inv": "INV.69-09-007",
    "dt": "—",
    "total": 25500,
    "sub": 25500,
    "vat": 1785,
    "po": "42052516",
    "rcv": "50220043394",
    "org": 195,
    "oname": "บริษัท อาปิโก ไฮเทค อยุธยา จำกัด ( สำนักงานใหญ่ )",
    "sig": [
      1,
      1
    ],
    "rtotal": 25500,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E03"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 5 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "Total Mismatch",
        "status": "FAIL",
        "result": "fail",
        "detail": "ยอดรวมภายในใบแจ้งหนี้ไม่สอดคล้อง {'lines_vs_sub_total': '0.00', 'vat_7pct': '0.00', 'sub_plus_vat_vs_grand': '1785.00'}",
        "exception_code": "E03",
        "severity": "High",
        "actual": "25500.00",
        "expected": "25500.00",
        "page": 1,
        "bbox": {
          "x": 0.898,
          "y": 0.726,
          "w": 0.058,
          "h": 0.012,
          "page": 1
        }
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043394 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "WARN",
        "result": "manual_review",
        "detail": "วางบิลเป็นงวด 5 บรรทัด (ยอดเงินตรงใบรับ แต่ราคา/จำนวนเป็นสัดส่วนงวด) — รอมาตรฐานกำหนด ให้คนตรวจ"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "WARN",
        "result": "manual_review",
        "detail": "AI/facts ไม่สอดคล้อง หรือเทียบจำนวนไม่ได้"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 25,500.00 = receipt 25,500"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "DFG0011017A 7553065060-2 / 7553065070-2 \\ C/F [D26-06-3747] ( Project:AHD_IMCT (RS00), Task:262.2 - DFG0011017A ) Total Amount Baht. 9,000.- x 30% = 2,700.-",
        "qty": 1,
        "unit": "SET",
        "price": 2700,
        "amount": 2700,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 0.3,
        "match_level": "M4"
      },
      {
        "no": 2,
        "desc": "DFG0011015A 7553065070-1 \\ C/F RH [D26-06-3745] ( Project:AHD_IMCT (RS00), Task:260.2 - DFG0011015A ) Total Amount Baht. 19,000.- x 30% = 5,700.-",
        "qty": 1,
        "unit": "SET",
        "price": 5700,
        "amount": 5700,
        "diff": true,
        "gr_line": 2,
        "gr_qty": 0.3,
        "match_level": "M4"
      },
      {
        "no": 3,
        "desc": "DFG0011014A 7553065060-1 \\ C/F LH [D26-06-3744] ( Project:AHD_IMCT (RS00), Task:259.2 - DFG0011014A ) Total Amount Baht. 19,000.- x 30% = 5,700.-",
        "qty": 1,
        "unit": "SET",
        "price": 5700,
        "amount": 5700,
        "diff": true,
        "gr_line": 3,
        "gr_qty": 0.3,
        "match_level": "M4"
      },
      {
        "no": 4,
        "desc": "DFG0011012A 7553065070 \\ C/F ASSY RH [D26-06-3742] ( Project:AHD_IMCT (RS00), Task:257.2 - DFG0011012A ) Total Amount Baht. 19,000.- x 30% = 5,700.-",
        "qty": 1,
        "unit": "SET",
        "price": 5700,
        "amount": 5700,
        "diff": true,
        "gr_line": 4,
        "gr_qty": 0.3,
        "match_level": "M4"
      },
      {
        "no": 5,
        "desc": "DFG0011011A 7553065060 \\ C/F ASSY LH [D26-06-3741] ( Project:AHD_IMCT (RS00), Task:256.2 - DFG0011011A ) Total Amount Baht. 19,000.- x 30% = 5,700.-",
        "qty": 1,
        "unit": "SET",
        "price": 5700,
        "amount": 5700,
        "diff": true,
        "gr_line": 5,
        "gr_qty": 0.3,
        "match_level": "M4"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052516",
        "receiptNum": "50220043394",
        "lineNo": 1,
        "rcvLineId": "50220043394-1",
        "itemCode": "DFG0011017A",
        "itemDesc": "7553065060/7553065070-2 \\ C/F [D26-06-3747]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 9000,
        "lineAmount": 2700,
        "qtyBilled": 0.3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052516",
          "ITEM_CODE": "DFG0011017A",
          "SHIPMENT_NUM": "INV.69-09-007",
          "PACKING_SLIP": "INV.69-09-007",
          "QTY_BILLED": "0.3"
        }
      },
      {
        "poNumber": "42052516",
        "receiptNum": "50220043394",
        "lineNo": 2,
        "rcvLineId": "50220043394-2",
        "itemCode": "DFG0011015A",
        "itemDesc": "7553065070-1 \\ C/F RH [D26-06-3745]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 19000,
        "lineAmount": 5700,
        "qtyBilled": 0.3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052516",
          "ITEM_CODE": "DFG0011015A",
          "SHIPMENT_NUM": "INV.69-09-007",
          "PACKING_SLIP": "INV.69-09-007",
          "QTY_BILLED": "0.3"
        }
      },
      {
        "poNumber": "42052516",
        "receiptNum": "50220043394",
        "lineNo": 3,
        "rcvLineId": "50220043394-3",
        "itemCode": "DFG0011014A",
        "itemDesc": "7553065060-1 \\ C/F LH [D26-06-3744]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 19000,
        "lineAmount": 5700,
        "qtyBilled": 0.3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052516",
          "ITEM_CODE": "DFG0011014A",
          "SHIPMENT_NUM": "INV.69-09-007",
          "PACKING_SLIP": "INV.69-09-007",
          "QTY_BILLED": "0.3"
        }
      },
      {
        "poNumber": "42052516",
        "receiptNum": "50220043394",
        "lineNo": 4,
        "rcvLineId": "50220043394-4",
        "itemCode": "DFG0011012A",
        "itemDesc": "7553065070 \\ C/F ASSY RH [D26-06-3742]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 19000,
        "lineAmount": 5700,
        "qtyBilled": 0.3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052516",
          "ITEM_CODE": "DFG0011012A",
          "SHIPMENT_NUM": "INV.69-09-007",
          "PACKING_SLIP": "INV.69-09-007",
          "QTY_BILLED": "0.3"
        }
      },
      {
        "poNumber": "42052516",
        "receiptNum": "50220043394",
        "lineNo": 5,
        "rcvLineId": "50220043394-5",
        "itemCode": "DFG0011011A",
        "itemDesc": "7553065060 \\ C/F ASSY LH [D26-06-3741]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 19000,
        "lineAmount": 5700,
        "qtyBilled": 0.3,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052516",
          "ITEM_CODE": "DFG0011011A",
          "SHIPMENT_NUM": "INV.69-09-007",
          "PACKING_SLIP": "INV.69-09-007",
          "QTY_BILLED": "0.3"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:29:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด High",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-116",
    "company": "AHT",
    "vendor": "บริษัท เวสเทิร์น โมลด์ จำกัด WESTERN MOULD CO., LTD.",
    "stax": "0105531079531",
    "inv": "69A/00083",
    "dt": "—",
    "total": 80250,
    "sub": 75000,
    "vat": 5250,
    "po": "42050819",
    "rcv": "50220043395",
    "org": 195,
    "oname": "AAPICO HITECH TOOLING COMPANY LIMITED",
    "sig": [
      0,
      1
    ],
    "rtotal": 75000,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043395 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 75,000.00 = receipt 75,000"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "A2257 DFG0010500A NEW STAMPING DIE MAKING CCN54137 \\ PROGRESSIVE [D25-12-3230] (Project:AHD_AMATA (RS00), Task:11.2 - DFG0010500A) (PAYMENT 2/4) 30% After quality 90% Off 250,000.-",
        "qty": 0.3,
        "unit": "SET",
        "price": 250000,
        "amount": 75000,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 0.3,
        "match_level": "M5"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42050819",
        "receiptNum": "50220043395",
        "lineNo": 1,
        "rcvLineId": "50220043395-1",
        "itemCode": "DFG0010500A",
        "itemDesc": "CCN54137 \\ PROGRESSIVE [D25-12-3230]",
        "qty": 0.3,
        "uom": "Set",
        "unitPrice": 250000,
        "lineAmount": 75000,
        "qtyBilled": 0.6,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "OPEN",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42050819",
          "ITEM_CODE": "DFG0010500A",
          "SHIPMENT_NUM": "69A/00083",
          "PACKING_SLIP": "69A/00083",
          "QTY_BILLED": "0.6"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:26:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-117",
    "company": "AHT",
    "vendor": "บริษัท เวสเทิร์น โมลด์ จำกัด WESTERN MOULD CO., LTD.",
    "stax": "0105531079531",
    "inv": "69A/00082",
    "dt": "—",
    "total": 90950,
    "sub": 85000,
    "vat": 5950,
    "po": "42045321",
    "rcv": "50220043396",
    "org": 195,
    "oname": "ลูกค้าที่อยู่ CUSTOMER/ADDRESS AAPICO HITECH TOOLING COMPANY LIMITED",
    "sig": [
      0,
      1
    ],
    "rtotal": 85000,
    "status": "Hold",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E13",
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: L1.qty(NOT_PRESENT), L1.uom(NOT_PRESENT), L1.unit_price(NOT_PRESENT), L1.amount(NOT_PRESENT), L7.qty(NOT_PRESENT), L7.uom(NOT_PRESENT), L7.unit_price(NOT_PRESENT), L7.amount(NOT_PRESENT)",
        "exception_code": "E01",
        "severity": "Medium"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 5 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ยอดรวมหรือราคารวมต่อรายการอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043396 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "GR Quantity Exceeded",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 1 (Invoice: A2176 NEW STAMPING DIE MAKING): ระบุบรรทัดในใบรับไม่ได้",
        "exception_code": "E13",
        "severity": "High",
        "page": 1,
        "bbox": {
          "x": 0.012,
          "y": 0.5,
          "w": 0.943,
          "h": 0.015,
          "page": 1
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 85,000.00 = receipt 85,000"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "A2176 NEW STAMPING DIE MAKING",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      },
      {
        "no": 2,
        "desc": "DFG0009973A 44593-0K030 \\ BLANK & PIERCE [D24-05-2713] (Project : AHD_TMT (581D), Task:39.2-DFG0009973A)",
        "qty": 0.1,
        "unit": "SET",
        "price": 200000,
        "amount": 20000,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 0.1,
        "match_level": "M5"
      },
      {
        "no": 3,
        "desc": "DFG0009974A 44593-0K030 \\ FROM_1 [D24-05-2714] (Project : AHD_TMT (581D), Task:40.2-DFG0009974A)",
        "qty": 0.1,
        "unit": "SET",
        "price": 210000,
        "amount": 21000,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 0.1,
        "match_level": "M5"
      },
      {
        "no": 4,
        "desc": "DFG0009975A 44593-0K030 \\ FORM_2 & RESTRIKE (D24-05-2715) (Project : AHD_TMT (581D), Task:41.2-DFG0009975A)",
        "qty": 0.1,
        "unit": "SET",
        "price": 200000,
        "amount": 20000,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 0.1,
        "match_level": "M5"
      },
      {
        "no": 5,
        "desc": "DFG0009976A 44593-0K030 \\ PIRCE [D24-05-2716] (Project : AHD_TMT (581D), Task:42.2-DFG0009976A)",
        "qty": 0.1,
        "unit": "SET",
        "price": 120000,
        "amount": 12000,
        "diff": false,
        "gr_line": 4,
        "gr_qty": 0.1,
        "match_level": "M5"
      },
      {
        "no": 6,
        "desc": "DFG0009977A 44593-0K030 \\ TRIM & PIRCE [D24-05-2717] (Project : AHD_TMT (581D), Task:43.2-DFG0009977A)",
        "qty": 0.1,
        "unit": "SET",
        "price": 120000,
        "amount": 12000,
        "diff": false,
        "gr_line": 5,
        "gr_qty": 0.1,
        "match_level": "M5"
      },
      {
        "no": 7,
        "desc": "(PAYMENT 4/4) 10% After Mass production 3 Month Off 850,000.-",
        "qty": 0,
        "unit": "",
        "price": 0,
        "amount": 0,
        "diff": true,
        "match_level": "NONE"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42045321",
        "receiptNum": "50220043396",
        "lineNo": 1,
        "rcvLineId": "50220043396-1",
        "itemCode": "DFG0009973A",
        "itemDesc": "44593-0K030 \\ BLANK & PIERCE [D24-05-2713]",
        "qty": 0.1,
        "uom": "Set",
        "unitPrice": 200000,
        "lineAmount": 20000,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42045321",
          "ITEM_CODE": "DFG0009973A",
          "SHIPMENT_NUM": "69A/00082",
          "PACKING_SLIP": "69A/00082",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42045321",
        "receiptNum": "50220043396",
        "lineNo": 2,
        "rcvLineId": "50220043396-2",
        "itemCode": "DFG0009974A",
        "itemDesc": "44593-0K030 \\ FORM_1 [D24-05-2714]",
        "qty": 0.1,
        "uom": "Set",
        "unitPrice": 210000,
        "lineAmount": 21000,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42045321",
          "ITEM_CODE": "DFG0009974A",
          "SHIPMENT_NUM": "69A/00082",
          "PACKING_SLIP": "69A/00082",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42045321",
        "receiptNum": "50220043396",
        "lineNo": 3,
        "rcvLineId": "50220043396-3",
        "itemCode": "DFG0009975A",
        "itemDesc": "44593-0K030 \\ FORM_2 & RESTRIKE [D24-05-2715]",
        "qty": 0.1,
        "uom": "Set",
        "unitPrice": 200000,
        "lineAmount": 20000,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42045321",
          "ITEM_CODE": "DFG0009975A",
          "SHIPMENT_NUM": "69A/00082",
          "PACKING_SLIP": "69A/00082",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42045321",
        "receiptNum": "50220043396",
        "lineNo": 4,
        "rcvLineId": "50220043396-4",
        "itemCode": "DFG0009976A",
        "itemDesc": "44593-0K030 \\ PIERCE [D24-05-2716]",
        "qty": 0.1,
        "uom": "Set",
        "unitPrice": 120000,
        "lineAmount": 12000,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42045321",
          "ITEM_CODE": "DFG0009976A",
          "SHIPMENT_NUM": "69A/00082",
          "PACKING_SLIP": "69A/00082",
          "QTY_BILLED": "1"
        }
      },
      {
        "poNumber": "42045321",
        "receiptNum": "50220043396",
        "lineNo": 5,
        "rcvLineId": "50220043396-5",
        "itemCode": "DFG0009977A",
        "itemDesc": "44593-0K030 \\ TRIM & PIERCE [D24-05-2717]",
        "qty": 0.1,
        "uom": "Set",
        "unitPrice": 120000,
        "lineAmount": 12000,
        "qtyBilled": 1,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42045321",
          "ITEM_CODE": "DFG0009977A",
          "SHIPMENT_NUM": "69A/00082",
          "PACKING_SLIP": "69A/00082",
          "QTY_BILLED": "1"
        }
      }
    ],
    "pages": 6,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:30:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Hold · ความรุนแรงสูงสุด High",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-118",
    "company": "AHT",
    "vendor": "บริษัท จัถวากร จำกัด JUTHA WAN METAL LTD.",
    "stax": "0105521010334",
    "inv": "ITAM26400021",
    "dt": "2026-10-01",
    "total": 19281.4,
    "sub": 18020,
    "vat": 1261.4,
    "po": "42052897",
    "rcv": "—",
    "org": null,
    "oname": "บริษัท อาบีโน่ ไทเทค อุตสาหกรรม จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": null,
    "status": "Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: invoice_num(CONFLICT_BETWEEN_SOURCES), customer_name(LOW_CONFIDENCE), customer_address(LOW_CONFIDENCE)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.908,
          "y": 0.778,
          "w": 0.01,
          "h": 0.09,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 6 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ค้นใบรับด้วยเลขที่อ่านไม่ยืนยันแล้วไม่พบ จึงไม่สรุปเป็น E05",
        "halted_by": "V-01"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ไม่มีใบรับ จึงไม่มี ORG_ID",
        "halted_by": "V-04"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ข้ามตาม gate",
        "halted_by": "V-01"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ข้ามตาม gate",
        "halted_by": "V-01"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ข้ามตาม gate",
        "halted_by": "V-01"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "MILLING SKD11 F 80X130X320 มม.",
        "qty": 1,
        "unit": "PCS",
        "price": 3580,
        "amount": 3580,
        "diff": false
      },
      {
        "no": 2,
        "desc": "MILLING SKD11 F 80X160X320 มม.",
        "qty": 1,
        "unit": "PCS",
        "price": 4350,
        "amount": 4350,
        "diff": false
      },
      {
        "no": 3,
        "desc": "MILLING SKD11 F 80X160X300 มม.",
        "qty": 1,
        "unit": "PCS",
        "price": 4085,
        "amount": 4085,
        "diff": false
      },
      {
        "no": 4,
        "desc": "MILLING SKD11 F 55X102X315 มม.",
        "qty": 1,
        "unit": "PCS",
        "price": 2030,
        "amount": 2030,
        "diff": false
      },
      {
        "no": 5,
        "desc": "MILLING SKD11 F 50X102X295 มม.",
        "qty": 1,
        "unit": "PCS",
        "price": 1730,
        "amount": 1730,
        "diff": false
      },
      {
        "no": 6,
        "desc": "MILLING SKD11 F 55X105X340 มม.",
        "qty": 1,
        "unit": "PCS",
        "price": 2245,
        "amount": 2245,
        "diff": false
      }
    ],
    "oracleReceiptLines": [],
    "pages": 2,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:25:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": true,
    "up": "2026-10-09"
  },
  {
    "doc": "DMS-119",
    "company": "AHT",
    "vendor": "JUTHA WAN METAL LTD.",
    "stax": "0145548001557",
    "inv": "ITAM26A00022",
    "dt": "2026-10-01",
    "total": 7318.8,
    "sub": 6840,
    "vat": 478.8,
    "po": "42052911",
    "rcv": "50220043443",
    "org": 195,
    "oname": "บริษัท อากีโน่ เมทัล ไทยแลนด์ จำกัด (สำนักงานใหญ่)",
    "sig": [
      1,
      1
    ],
    "rtotal": 6840,
    "status": "Review",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: customer_name(LOW_CONFIDENCE), customer_address(LOW_CONFIDENCE), customer_tax_id(NOT_PRESENT)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.852,
          "y": 0.335,
          "w": 0.01,
          "h": 0.215,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043443 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "Tax ID ลูกค้าอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 6,840.00 = receipt 6,840"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "MILLING SKD11 F 95X100X215 มม.",
        "qty": 2,
        "unit": "PCS",
        "price": 2230,
        "amount": 4460,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 2,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "MILLING SKD11 F 95X95X115 มม.",
        "qty": 2,
        "unit": "PCS",
        "price": 1190,
        "amount": 2380,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 2,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052911",
        "receiptNum": "50220043443",
        "lineNo": 1,
        "rcvLineId": "50220043443-1",
        "itemCode": "DRM0032816A",
        "itemDesc": "FINISHED PLATE SKD11\\95X100X215",
        "qty": 2,
        "uom": "Piece",
        "unitPrice": 2230,
        "lineAmount": 4460,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052911",
          "ITEM_CODE": "DRM0032816A",
          "SHIPMENT_NUM": "ITAM26A00022",
          "PACKING_SLIP": "ITAM26A00022",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "42052911",
        "receiptNum": "50220043443",
        "lineNo": 2,
        "rcvLineId": "50220043443-2",
        "itemCode": "DRM0033137A",
        "itemDesc": "FINISHED PLATE SKD11\\95X95X115",
        "qty": 2,
        "uom": "Piece",
        "unitPrice": 1190,
        "lineAmount": 2380,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052911",
          "ITEM_CODE": "DRM0033137A",
          "SHIPMENT_NUM": "ITAM26A00022",
          "PACKING_SLIP": "ITAM26A00022",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 2,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:27:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-120",
    "company": "AHT",
    "vendor": "บริษัท ไทย-เจแปน แก๊ส จำกัด Thai-Japan Gas Co., Ltd.",
    "stax": "0105532071666",
    "inv": "126100004",
    "dt": "2026-10-01",
    "total": 3317,
    "sub": 3100,
    "vat": 217,
    "po": "42052890",
    "rcv": "—",
    "org": null,
    "oname": "AAPICO HITECH TOOLING COMPANY LIMITED",
    "sig": [
      1,
      1
    ],
    "rtotal": null,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: po_number(CONFLICT_BETWEEN_SOURCES), L1.uom(LOW_CONFIDENCE)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.492,
          "y": 0.38,
          "w": 0.05,
          "h": 0.012,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "WARN",
        "result": "manual_review",
        "detail": "ไม่พบใบรับของผู้ขาย 0105532071666 ด้วยเลข Invoice 126100004, 326100043 หรือเลขใบรับ 50210043444 — ตรวจเลข Invoice / Tax ID ที่อ่านได้ หรือยังไม่รับของ"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ไม่มีใบรับ จึงไม่มี ORG_ID",
        "halted_by": "V-04"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ข้ามตาม gate",
        "halted_by": "V-04"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ข้ามตาม gate",
        "halted_by": "V-04"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ข้ามตาม gate",
        "halted_by": "V-04"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "Oxygen IND Pack (47L x 15)",
        "qty": 1,
        "unit": "",
        "price": 3100,
        "amount": 3100,
        "diff": false
      }
    ],
    "oracleReceiptLines": [],
    "pages": 2,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:27:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": true,
    "up": "2026-10-09"
  },
  {
    "doc": "DMS-121",
    "company": "AHT",
    "vendor": "บริษัท โออิชี แมชชีน (ประเทศไทย) จำกัด OISHI MACHINE (THAILAND) CO., LTD.",
    "stax": "0115545009425",
    "inv": "IV2610-0012",
    "dt": "—",
    "total": 57352,
    "sub": 53600,
    "vat": 3752,
    "po": "42052722",
    "rcv": "50220043445",
    "org": 195,
    "oname": "AAPICO HITECH TOOLING COMPANY LIMITED",
    "sig": [
      1,
      1
    ],
    "rtotal": 53600,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043445 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 53,600.00 = receipt 53,600"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "Tanker Cylinder T3-1000 x 50 (Project : AHD_AH (Die Maint.) 2026, Task : 01.1 - Spare Part)",
        "qty": 10,
        "unit": "PCS",
        "price": 2480,
        "amount": 24800,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 10,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "Tanker Cylinder T3-1500 x 19 (Project : AHD_AHP (Die Maint.) 2026, Task : 01.1 - Spare Part)",
        "qty": 10,
        "unit": "PCS",
        "price": 2880,
        "amount": 28800,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 10,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052722",
        "receiptNum": "50220043445",
        "lineNo": 1,
        "rcvLineId": "50220043445-1",
        "itemCode": "DCM0008394A",
        "itemDesc": "GAS SPRING\\T3-1000*50M\\OISHI/HYSON",
        "qty": 10,
        "uom": "Piece",
        "unitPrice": 2480,
        "lineAmount": 24800,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052722",
          "ITEM_CODE": "DCM0008394A",
          "SHIPMENT_NUM": "IV2610-0012",
          "PACKING_SLIP": "IV2610-0012",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "42052722",
        "receiptNum": "50220043445",
        "lineNo": 2,
        "rcvLineId": "50220043445-2",
        "itemCode": "DCM0018605A",
        "itemDesc": "TANKER\\T3-1500*19M\\OISHI",
        "qty": 10,
        "uom": "Piece",
        "unitPrice": 2880,
        "lineAmount": 28800,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052722",
          "ITEM_CODE": "DCM0018605A",
          "SHIPMENT_NUM": "IV2610-0012",
          "PACKING_SLIP": "IV2610-0012",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 2,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:27:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-122",
    "company": "AHT",
    "vendor": "บริษัท โออิชิ แมชชีน (ประเทศไทย) จำกัด OISHI MACHINE (THAILAND) CO., LTD.",
    "stax": "0115545009425",
    "inv": "IV2610-0012",
    "dt": "—",
    "total": 57352,
    "sub": 53600,
    "vat": 3752,
    "po": "42052722",
    "rcv": "50220043445",
    "org": 195,
    "oname": "AAPICO HITECH TOOLING COMPANY LIMITED",
    "sig": [
      1,
      1
    ],
    "rtotal": 53600,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043445 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 53,600.00 = receipt 53,600"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "Tanker Cylinder T3-1000 x 50 (Project : AHD_AH (Die Maint.) 2026, Task : 01.1 - Spare Part)",
        "qty": 10,
        "unit": "PCS",
        "price": 2480,
        "amount": 24800,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 10,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "Tanker Cylinder T3-1500 x 19 (Project : AHD_AHP (Die Maint.) 2026, Task : 01.1 - Spare Part)",
        "qty": 10,
        "unit": "PCS",
        "price": 2880,
        "amount": 28800,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 10,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052722",
        "receiptNum": "50220043445",
        "lineNo": 1,
        "rcvLineId": "50220043445-1",
        "itemCode": "DCM0008394A",
        "itemDesc": "GAS SPRING\\T3-1000*50M\\OISHI/HYSON",
        "qty": 10,
        "uom": "Piece",
        "unitPrice": 2480,
        "lineAmount": 24800,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052722",
          "ITEM_CODE": "DCM0008394A",
          "SHIPMENT_NUM": "IV2610-0012",
          "PACKING_SLIP": "IV2610-0012",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "42052722",
        "receiptNum": "50220043445",
        "lineNo": 2,
        "rcvLineId": "50220043445-2",
        "itemCode": "DCM0018605A",
        "itemDesc": "TANKER\\T3-1500*19M\\OISHI",
        "qty": 10,
        "uom": "Piece",
        "unitPrice": 2880,
        "lineAmount": 28800,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052722",
          "ITEM_CODE": "DCM0018605A",
          "SHIPMENT_NUM": "IV2610-0012",
          "PACKING_SLIP": "IV2610-0012",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 2,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:27:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-123",
    "company": "AHT",
    "vendor": "JUTHA WAN METAL LTD.",
    "stax": "0105521010334",
    "inv": "ITAM26A00021",
    "dt": "2026-10-01",
    "total": 19281.4,
    "sub": 18020,
    "vat": 1261.4,
    "po": "42052897",
    "rcv": "50220043442",
    "org": 195,
    "oname": "บริษัท อาโปໂໂเทค ทูลลิ่ง จำกัด (สำนักงานใหญ่)",
    "sig": [
      1,
      1
    ],
    "rtotal": 18020,
    "status": "Review",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: customer_tax_id(NOT_PRESENT)",
        "exception_code": "E01",
        "severity": "Medium"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 6 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043442 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "Tax ID ลูกค้าอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 18,020.00 = receipt 18,020"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "LING SKD11 F 80X130X320 MM.",
        "qty": 1,
        "unit": "PCS",
        "price": 3580,
        "amount": 3580,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "LING SKD11 F 80X160X320 MM.",
        "qty": 1,
        "unit": "PCS",
        "price": 4350,
        "amount": 4350,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 3,
        "desc": "LING SKD11 F 80X160X300 MM.",
        "qty": 1,
        "unit": "PCS",
        "price": 4085,
        "amount": 4085,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 4,
        "desc": "LING SKD11 F 55X102X315 MM.",
        "qty": 1,
        "unit": "PCS",
        "price": 2030,
        "amount": 2030,
        "diff": false,
        "gr_line": 4,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 5,
        "desc": "LING SKD11 F 50X102X295 MM.",
        "qty": 1,
        "unit": "PCS",
        "price": 1730,
        "amount": 1730,
        "diff": false,
        "gr_line": 5,
        "gr_qty": 1,
        "match_level": "M1"
      },
      {
        "no": 6,
        "desc": "LING SKD11 F 55X105X340 MM.",
        "qty": 1,
        "unit": "PCS",
        "price": 2245,
        "amount": 2245,
        "diff": false,
        "gr_line": 6,
        "gr_qty": 1,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052897",
        "receiptNum": "50220043442",
        "lineNo": 1,
        "rcvLineId": "50220043442-1",
        "itemCode": "DRM0034978A",
        "itemDesc": "FINISHED PLATE SKD11\\80X130X320",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 3580,
        "lineAmount": 3580,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052897",
          "ITEM_CODE": "DRM0034978A",
          "SHIPMENT_NUM": "ITAM26A00021",
          "PACKING_SLIP": "ITAM26A00021",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "42052897",
        "receiptNum": "50220043442",
        "lineNo": 2,
        "rcvLineId": "50220043442-2",
        "itemCode": "DRM0034977A",
        "itemDesc": "FINISHED PLATE SKD11\\80X160X320",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 4350,
        "lineAmount": 4350,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052897",
          "ITEM_CODE": "DRM0034977A",
          "SHIPMENT_NUM": "ITAM26A00021",
          "PACKING_SLIP": "ITAM26A00021",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "42052897",
        "receiptNum": "50220043442",
        "lineNo": 3,
        "rcvLineId": "50220043442-3",
        "itemCode": "DRM0034976A",
        "itemDesc": "FINISHED PLATE SKD11\\80X160X300",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 4085,
        "lineAmount": 4085,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052897",
          "ITEM_CODE": "DRM0034976A",
          "SHIPMENT_NUM": "ITAM26A00021",
          "PACKING_SLIP": "ITAM26A00021",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "42052897",
        "receiptNum": "50220043442",
        "lineNo": 4,
        "rcvLineId": "50220043442-4",
        "itemCode": "DRM0034975A",
        "itemDesc": "FINISHED PLATE SKD11\\55X102X315",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 2030,
        "lineAmount": 2030,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052897",
          "ITEM_CODE": "DRM0034975A",
          "SHIPMENT_NUM": "ITAM26A00021",
          "PACKING_SLIP": "ITAM26A00021",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "42052897",
        "receiptNum": "50220043442",
        "lineNo": 5,
        "rcvLineId": "50220043442-5",
        "itemCode": "DRM0034974A",
        "itemDesc": "FINISHED PLATE SKD11\\50X102X295",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 1730,
        "lineAmount": 1730,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052897",
          "ITEM_CODE": "DRM0034974A",
          "SHIPMENT_NUM": "ITAM26A00021",
          "PACKING_SLIP": "ITAM26A00021",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "42052897",
        "receiptNum": "50220043442",
        "lineNo": 6,
        "rcvLineId": "50220043442-6",
        "itemCode": "DRM0034973A",
        "itemDesc": "FINISHED PLATE SKD11\\55X105X340",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 2245,
        "lineAmount": 2245,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052897",
          "ITEM_CODE": "DRM0034973A",
          "SHIPMENT_NUM": "ITAM26A00021",
          "PACKING_SLIP": "ITAM26A00021",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 2,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:28:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-124",
    "company": "AHT",
    "vendor": "JUTHAWAN METAL LTD.",
    "stax": "0105521010334",
    "inv": "ITAM26A00022",
    "dt": "2026-10-01",
    "total": 7318.8,
    "sub": 6840,
    "vat": 478.8,
    "po": "42052911",
    "rcv": "50220043443",
    "org": 195,
    "oname": "บริษัท อาปิโก ไฮเทค พูลลิ่ง จำกัด (สำนักงานใหญ่)",
    "sig": [
      1,
      1
    ],
    "rtotal": 6840,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 50220043443 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "WARN",
        "result": "manual_review",
        "detail": "AI ไม่มั่นใจเรื่องที่อยู่"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 6,840.00 = receipt 6,840"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "LLING SKD11 F 95X100X215 มม.",
        "qty": 2,
        "unit": "PCS",
        "price": 2230,
        "amount": 4460,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 2,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "LLING SKD11 F 95X95X115 มม.",
        "qty": 2,
        "unit": "PCS",
        "price": 1190,
        "amount": 2380,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 2,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "42052911",
        "receiptNum": "50220043443",
        "lineNo": 1,
        "rcvLineId": "50220043443-1",
        "itemCode": "DRM0032816A",
        "itemDesc": "FINISHED PLATE SKD11\\95X100X215",
        "qty": 2,
        "uom": "Piece",
        "unitPrice": 2230,
        "lineAmount": 4460,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052911",
          "ITEM_CODE": "DRM0032816A",
          "SHIPMENT_NUM": "ITAM26A00022",
          "PACKING_SLIP": "ITAM26A00022",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "42052911",
        "receiptNum": "50220043443",
        "lineNo": 2,
        "rcvLineId": "50220043443-2",
        "itemCode": "DRM0033137A",
        "itemDesc": "FINISHED PLATE SKD11\\95X95X115",
        "qty": 2,
        "uom": "Piece",
        "unitPrice": 1190,
        "lineAmount": 2380,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHT Die Making 03, K.Vinitda Jitpilai",
        "ouName": "Aapico Hitech Tooling Legal",
        "extra": {
          "PO_NUM": "42052911",
          "ITEM_CODE": "DRM0033137A",
          "SHIPMENT_NUM": "ITAM26A00022",
          "PACKING_SLIP": "ITAM26A00022",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 2,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:28:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHT Die Making 03, K.Vinitda Jitpilai"
  },
  {
    "doc": "DMS-125",
    "company": "AHA",
    "vendor": "BKS ENTERPRISE CO., LTD.",
    "stax": "0105562195321",
    "inv": "IV6910002",
    "dt": "2026-10-01",
    "total": 1016.5,
    "sub": 950,
    "vat": 66.5,
    "po": "446012530",
    "rcv": "54610013205",
    "org": 413,
    "oname": "APCHA",
    "sig": [
      1,
      1
    ],
    "rtotal": 950,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 54610013205 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 950.00 = receipt 950"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "STANLEY STHT37191 ดลับมีดTR TYLON4.0 5ม.",
        "qty": 5,
        "unit": "PCS",
        "price": 190,
        "amount": 950,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 5,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "446012530",
        "receiptNum": "54610013205",
        "lineNo": 1,
        "rcvLineId": "54610013205-1",
        "itemCode": "AFS0001290A",
        "itemDesc": "TAPE MEASURE 5M/16' (STANLEY) Model 30-696N",
        "qty": 5,
        "uom": "Piece",
        "unitPrice": 190,
        "lineAmount": 950,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012530",
          "ITEM_CODE": "AFS0001290A",
          "SHIPMENT_NUM": "IV6910002",
          "PACKING_SLIP": "IV6910002",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:29:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHA Jig Making 02, K.Unchalee K."
  },
  {
    "doc": "DMS-126",
    "company": "AHA",
    "vendor": "บริษัท มิชูมิ (ไทยแลนด์) จำกัด MISUMI (THAILAND) CO., LTD.",
    "stax": "0105540008838",
    "inv": "LN6063698700H2",
    "dt": "—",
    "total": 49785.79,
    "sub": 46528.78,
    "vat": 3257.01,
    "po": "446012520",
    "rcv": "54610013206",
    "org": 413,
    "oname": "บริษัท อาปิโก ไฮเทค ออโตโมชั่น จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 46528.78,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 4 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 54610013206 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 46,528.78 = receipt 46,528.78"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "446012520 JCM0012174A IKK100-100 ANGLE PLATE",
        "qty": 12,
        "unit": "PCS",
        "price": 1320.27,
        "amount": 15843.24,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 12,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "446012520 JCM0012175A IKK150-100 ANGLEPLATE",
        "qty": 10,
        "unit": "PCS",
        "price": 1674.79,
        "amount": 16747.9,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 10,
        "match_level": "M1"
      },
      {
        "no": 3,
        "desc": "446012520 JCM0012176A IKK200-120 ANGLE PLATE",
        "qty": 6,
        "unit": "PCS",
        "price": 2155.64,
        "amount": 12933.84,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 6,
        "match_level": "M1"
      },
      {
        "no": 4,
        "desc": "446012520 DCM0001493A MSB16-40 STRIPPER BOLT",
        "qty": 20,
        "unit": "PCS",
        "price": 50.19,
        "amount": 1003.8,
        "diff": false,
        "gr_line": 4,
        "gr_qty": 20,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "446012520",
        "receiptNum": "54610013206",
        "lineNo": 1,
        "rcvLineId": "54610013206-1",
        "itemCode": "JCM0012174A",
        "itemDesc": "ANGLE PLATE CAST IRON\\IKK100-100\\MISUMI",
        "qty": 12,
        "uom": "Piece",
        "unitPrice": 1320.27,
        "lineAmount": 15843.24,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012520",
          "ITEM_CODE": "JCM0012174A",
          "SHIPMENT_NUM": "LN6063698700H2",
          "PACKING_SLIP": "LN6063698700H2",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "446012520",
        "receiptNum": "54610013206",
        "lineNo": 2,
        "rcvLineId": "54610013206-2",
        "itemCode": "JCM0012175A",
        "itemDesc": "ANGLE PLATE CAST IRON\\IKK150-100\\MISUMI",
        "qty": 10,
        "uom": "Piece",
        "unitPrice": 1674.79,
        "lineAmount": 16747.9,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012520",
          "ITEM_CODE": "JCM0012175A",
          "SHIPMENT_NUM": "LN6063698700H2",
          "PACKING_SLIP": "LN6063698700H2",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "446012520",
        "receiptNum": "54610013206",
        "lineNo": 3,
        "rcvLineId": "54610013206-3",
        "itemCode": "JCM0012176A",
        "itemDesc": "ANGLE PLATE CAST IRON\\IKK200-120\\MISUMI",
        "qty": 6,
        "uom": "Piece",
        "unitPrice": 2155.64,
        "lineAmount": 12933.84,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012520",
          "ITEM_CODE": "JCM0012176A",
          "SHIPMENT_NUM": "LN6063698700H2",
          "PACKING_SLIP": "LN6063698700H2",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "446012520",
        "receiptNum": "54610013206",
        "lineNo": 4,
        "rcvLineId": "54610013206-4",
        "itemCode": "DCM0001493A",
        "itemDesc": "STRIPPER BOLT\\MSB 16-40\\MISUMI",
        "qty": 20,
        "uom": "Piece",
        "unitPrice": 50.19,
        "lineAmount": 1003.8,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012520",
          "ITEM_CODE": "DCM0001493A",
          "SHIPMENT_NUM": "LN6063698700H2",
          "PACKING_SLIP": "LN6063698700H2",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 6,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:31:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHA Jig Making 02, K.Unchalee K."
  },
  {
    "doc": "DMS-127",
    "company": "AHA",
    "vendor": "บริษัท ป.สุณี เทรดดิ้ง จำกัด P.SUNEE TRADING CO., LTD.",
    "stax": "0105546047223",
    "inv": "IV69100046",
    "dt": "2026-10-01",
    "total": 481.5,
    "sub": 450,
    "vat": 31.5,
    "po": "446012532",
    "rcv": "54610013207",
    "org": 413,
    "oname": "บริษัท อาปิโก ไฮเทค ออโตโมทีฟ จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 450,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 54610013207 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 450.00 = receipt 450"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "ผ้าวน(1ถุง:25Kg)",
        "qty": 25,
        "unit": "KG",
        "price": 18,
        "amount": 450,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 25,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "446012532",
        "receiptNum": "54610013207",
        "lineNo": 1,
        "rcvLineId": "54610013207-1",
        "itemCode": "AFS0000276A",
        "itemDesc": "CLOTH (SCRAP)",
        "qty": 25,
        "uom": "Kilogram",
        "unitPrice": 18,
        "lineAmount": 450,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012532",
          "ITEM_CODE": "AFS0000276A",
          "SHIPMENT_NUM": "IV69100046",
          "PACKING_SLIP": "IV69100046",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:32:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHA Jig Making 02, K.Unchalee K."
  },
  {
    "doc": "DMS-128",
    "company": "AHA",
    "vendor": "บริษัท ป.สุณี เทรดดิ้ง จำกัด P.SUNEE TRADING CO., LTD.",
    "stax": "0105546047223",
    "inv": "IV69100092",
    "dt": "2026-10-01",
    "total": 1284,
    "sub": 1200,
    "vat": 84,
    "po": "446012560",
    "rcv": "54610013208",
    "org": 413,
    "oname": "บริษัท อาปิโก ไฮเทค ออโตโมทีฟ จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 1200,
    "status": "Review",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: po_number(CONFLICT_BETWEEN_SOURCES)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.11,
          "y": 0.24,
          "w": 0.065,
          "h": 0.015,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 54610013208 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 1,200.00 = receipt 1,200"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "\"SENO\" ลูกกลิ้งสี #222 4\"x16\"",
        "qty": 24,
        "unit": "PCS",
        "price": 50,
        "amount": 1200,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 24,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "446012560",
        "receiptNum": "54610013208",
        "lineNo": 1,
        "rcvLineId": "54610013208-1",
        "itemCode": "MSP0005994A",
        "itemDesc": "ROLLER PAINT BRUSH\\L=4”\\ONLY",
        "qty": 24,
        "uom": "Piece",
        "unitPrice": 50,
        "lineAmount": 1200,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012560",
          "ITEM_CODE": "MSP0005994A",
          "SHIPMENT_NUM": "IV69100092",
          "PACKING_SLIP": "IV69100092",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:31:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHA Jig Making 02, K.Unchalee K."
  },
  {
    "doc": "DMS-129",
    "company": "AHA",
    "vendor": "บริษัท แมคกราฟฟิค จำกัด MAC GRAPHIC CO.,LTD.",
    "stax": "0115535004102",
    "inv": "IV25690373",
    "dt": "—",
    "total": 42800,
    "sub": 40000,
    "vat": 2800,
    "po": "446012405",
    "rcv": "54610013209",
    "org": 413,
    "oname": "บริษัท อาปิโก ไฮเทค ออโตโมชั่น จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 40000,
    "status": "Hold",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E13",
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: po_number(CONFLICT_BETWEEN_SOURCES)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.254,
          "y": 0.3603,
          "w": 0.0968,
          "h": 0.0188,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 54610013209 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "GR Quantity Exceeded",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 1 (Invoice: MACHINING PART_JIG ASSY RR SEAT BACK ST#1_U101-1,2 ,U04-1,U05-1): ระบุบรรทัดในใบรับไม่ได้",
        "exception_code": "E13",
        "severity": "High",
        "page": 1,
        "bbox": {
          "x": 0.148,
          "y": 0.322,
          "w": 0.797,
          "h": 0.038,
          "page": 1
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "ทุกบรรทัดระบุคู่ในใบรับไม่ได้",
        "halted_by": "V-07"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 40,000.00 = receipt 40,000"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "MACHINING PART_JIG ASSY RR SEAT BACK ST#1_U101-1,2 ,U04-1,U05-1",
        "qty": 1,
        "unit": "PCS",
        "price": 40000,
        "amount": 40000,
        "diff": false,
        "match_level": "NONE"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "446012405",
        "receiptNum": "54610013209",
        "lineNo": 1,
        "rcvLineId": "54610013209-1",
        "itemCode": "JOP4600007A",
        "itemDesc": "MACHINING PART_JIG ASSY RR SEAT BACK ST#1_U101-1,2 ,U04-1,U05-1",
        "qty": 1,
        "uom": "Set",
        "unitPrice": 40000,
        "lineAmount": 40000,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012405",
          "ITEM_CODE": "JOP4600007A",
          "SHIPMENT_NUM": "IV 25690373",
          "PACKING_SLIP": "IV 25690373",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 4,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:33:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Hold · ความรุนแรงสูงสุด High",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHA Jig Making 02, K.Unchalee K."
  },
  {
    "doc": "DMS-130",
    "company": "AHA",
    "vendor": "บริษัท เวอร์เท็กซ์ เทรดดิ้ง จำกัด Vertex Trading Co., Ltd.",
    "stax": "0135537001917",
    "inv": "IV9130116",
    "dt": "2026-10-01",
    "total": 353.1,
    "sub": 330,
    "vat": 23.1,
    "po": "446012555",
    "rcv": "54610013210",
    "org": 413,
    "oname": "บริษัท อาปิโก ไฮเทค อโตเมชั่น จำกัด (สำนักงานใหญ่)",
    "sig": [
      1,
      1
    ],
    "rtotal": 330,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 54610013210 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 330.00 = receipt 330"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "03-3341 กระดาษถ่ายA4(70G./500PCS)ฟอกขาว(แพค",
        "qty": 5,
        "unit": "REAM",
        "price": 66,
        "amount": 330,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 5,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "446012555",
        "receiptNum": "54610013210",
        "lineNo": 1,
        "rcvLineId": "54610013210-1",
        "itemCode": "AOS0000089A",
        "itemDesc": "PAPER A4 (70 GRAM) (12.256.265)",
        "qty": 5,
        "uom": "Ream",
        "unitPrice": 66,
        "lineAmount": 330,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012555",
          "ITEM_CODE": "AOS0000089A",
          "SHIPMENT_NUM": "IV9130116",
          "PACKING_SLIP": "IV9130116",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:32:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHA Jig Making 02, K.Unchalee K."
  },
  {
    "doc": "DMS-131",
    "company": "AHA",
    "vendor": "บริษัท วีร่า ออโตเมชั่น (2000) จำกัด",
    "stax": "0105543056531",
    "inv": "INV/00378104",
    "dt": "2026-10-01",
    "total": 3610.18,
    "sub": 3374,
    "vat": 236.18,
    "po": "446012413",
    "rcv": "54610013211",
    "org": 413,
    "oname": "AAPICO HITECH AUTOMATION CO.,LTD.",
    "sig": [
      1,
      1
    ],
    "rtotal": 3374,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 3 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 54610013211 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 3,374.00 = receipt 3,374"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "PLASTIC ARTICLE #KR-08C-X1807",
        "qty": 210,
        "unit": "PCS",
        "price": 15,
        "amount": 3150,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 100,
        "match_level": "M3"
      },
      {
        "no": 2,
        "desc": "FITTING #KQ2R06-08A (10PCS/PACK)",
        "qty": 4,
        "unit": "PCS",
        "price": 16,
        "amount": 64,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 4,
        "match_level": "M1"
      },
      {
        "no": 3,
        "desc": "PLASTIC FITTINGS #N-289-2008",
        "qty": 10,
        "unit": "PCS",
        "price": 16,
        "amount": 160,
        "diff": false,
        "gr_line": 4,
        "gr_qty": 10,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "446012413",
        "receiptNum": "54610013211",
        "lineNo": 1,
        "rcvLineId": "54610013211-1",
        "itemCode": "JCM0011170A",
        "itemDesc": "FITTING\\KR-08C-X1807(Mininum Of 10-999,999 PCS./LOT)\\SMC",
        "qty": 100,
        "uom": "Piece",
        "unitPrice": 15,
        "lineAmount": 1500,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012413",
          "ITEM_CODE": "JCM0011170A",
          "SHIPMENT_NUM": "INV/00378104",
          "PACKING_SLIP": "INV/00378104",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "446012413",
        "receiptNum": "54610013211",
        "lineNo": 2,
        "rcvLineId": "54610013211-2",
        "itemCode": "JCM0011170A",
        "itemDesc": "FITTING\\KR-08C-X1807(Mininum Of 10-999,999 PCS./LOT)\\SMC",
        "qty": 110,
        "uom": "Piece",
        "unitPrice": 15,
        "lineAmount": 1650,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012413",
          "ITEM_CODE": "JCM0011170A",
          "SHIPMENT_NUM": "INV/00378104",
          "PACKING_SLIP": "INV/00378104",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "446012413",
        "receiptNum": "54610013211",
        "lineNo": 3,
        "rcvLineId": "54610013211-3",
        "itemCode": "JCM0000396A",
        "itemDesc": "REDUCER\\KQ2R06-08A\\SMC",
        "qty": 4,
        "uom": "Piece",
        "unitPrice": 16,
        "lineAmount": 64,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012413",
          "ITEM_CODE": "JCM0000396A",
          "SHIPMENT_NUM": "INV/00378104",
          "PACKING_SLIP": "INV/00378104",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "446012413",
        "receiptNum": "54610013211",
        "lineNo": 4,
        "rcvLineId": "54610013211-4",
        "itemCode": "JCM0004627A",
        "itemDesc": "FITTING \\IN-289-2008(Mininum Of 10-99 PCS)\\SMC",
        "qty": 10,
        "uom": "Piece",
        "unitPrice": 16,
        "lineAmount": 160,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012413",
          "ITEM_CODE": "JCM0004627A",
          "SHIPMENT_NUM": "INV/00378104",
          "PACKING_SLIP": "INV/00378104",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:31:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHA Jig Making 02, K.Unchalee K."
  },
  {
    "doc": "DMS-132",
    "company": "AHA",
    "vendor": "I.D. SUPPLYS CO., LTD. (HEAD OFFICE)",
    "stax": "0105540040286",
    "inv": "IV6910015",
    "dt": "2026-10-01",
    "total": 363.8,
    "sub": 340,
    "vat": 23.8,
    "po": "446012543",
    "rcv": "54610013212",
    "org": 413,
    "oname": "บริษัท อาชากี ไอที เอ็นเตอร์เม้นท์ จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 340,
    "status": "Review",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: po_number(CONFLICT_BETWEEN_SOURCES)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.6008,
          "y": 0.1511,
          "w": 0.0726,
          "h": 0.0097,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 2 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 54610013212 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 340.00 = receipt 340"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "RJ-45 CAT 5E JACK \"AMP\" AM-3001",
        "qty": 20,
        "unit": "PCS",
        "price": 8,
        "amount": 160,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 10,
        "match_level": "M3"
      },
      {
        "no": 2,
        "desc": "COVER BOX \"LINK\" US-6004 (10PCS/PACK)",
        "qty": 4,
        "unit": "PACK",
        "price": 45,
        "amount": 180,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 2,
        "match_level": "M3"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "446012543",
        "receiptNum": "54610013212",
        "lineNo": 1,
        "rcvLineId": "54610013212-1",
        "itemCode": "AOS0000539A",
        "itemDesc": "RJ45 MODULAR PLUG AMP AM-3001 CAT5E MALE",
        "qty": 10,
        "uom": "Piece",
        "unitPrice": 8,
        "lineAmount": 80,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012543",
          "ITEM_CODE": "AOS0000539A",
          "SHIPMENT_NUM": "IV6910015",
          "PACKING_SLIP": "IV6910015",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "446012543",
        "receiptNum": "54610013212",
        "lineNo": 2,
        "rcvLineId": "54610013212-2",
        "itemCode": "AOS0000539A",
        "itemDesc": "RJ45 MODULAR PLUG AMP AM-3001 CAT5E MALE",
        "qty": 10,
        "uom": "Piece",
        "unitPrice": 8,
        "lineAmount": 80,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012543",
          "ITEM_CODE": "AOS0000539A",
          "SHIPMENT_NUM": "IV6910015",
          "PACKING_SLIP": "IV6910015",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "446012543",
        "receiptNum": "54610013212",
        "lineNo": 3,
        "rcvLineId": "54610013212-3",
        "itemCode": "MSP0015139A",
        "itemDesc": "LINK LAN PLUG BOOT MODEL:US-6004 (10PCS/PACK)",
        "qty": 2,
        "uom": "Pack",
        "unitPrice": 45,
        "lineAmount": 90,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012543",
          "ITEM_CODE": "MSP0015139A",
          "SHIPMENT_NUM": "IV6910015",
          "PACKING_SLIP": "IV6910015",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "446012543",
        "receiptNum": "54610013212",
        "lineNo": 4,
        "rcvLineId": "54610013212-4",
        "itemCode": "MSP0015139A",
        "itemDesc": "LINK LAN PLUG BOOT MODEL:US-6004 (10PCS/PACK)",
        "qty": 2,
        "uom": "Pack",
        "unitPrice": 45,
        "lineAmount": 90,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012543",
          "ITEM_CODE": "MSP0015139A",
          "SHIPMENT_NUM": "IV6910015",
          "PACKING_SLIP": "IV6910015",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:33:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHA Jig Making 02, K.Unchalee K."
  },
  {
    "doc": "DMS-133",
    "company": "AHA",
    "vendor": "ASIAN ADVANCED TECHNICA CO.,LTD. HEAD OFFICE",
    "stax": "0105546003064",
    "inv": "169100028",
    "dt": "2026-10-01",
    "total": 192.6,
    "sub": 180,
    "vat": 12.6,
    "po": "446012547",
    "rcv": "54610013213",
    "org": 413,
    "oname": "CS100868",
    "sig": [
      1,
      1
    ],
    "rtotal": 180,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [
      "E07"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 54610013213 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "Customer Mismatch",
        "status": "WARN",
        "result": "manual_review",
        "detail": "ที่อยู่ลูกค้า (เลขที่ 13160, รหัสไปรษณีย์ 13160) ไม่ตรงกับที่อยู่ของ ORG_ID 413",
        "exception_code": "E07",
        "severity": "Medium",
        "actual": "13160",
        "page": 1,
        "bbox": {
          "x": 0.035,
          "y": 0.175,
          "w": 0.037,
          "h": 0.012,
          "page": 1
        }
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 180.00 = receipt 180"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "LIFTING EYE BOLT : B-CHIC 12 ( Project:JT_SCOUT VFF2(ST)_155-26, Task:001.1 - JFG4600901A )",
        "qty": 4,
        "unit": "PCS",
        "price": 45,
        "amount": 180,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 4,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "446012547",
        "receiptNum": "54610013213",
        "lineNo": 1,
        "rcvLineId": "54610013213-1",
        "itemCode": "JCM0012181A",
        "itemDesc": "LIFTING EYE BOLT\\B-CHIC 12\\AAT",
        "qty": 4,
        "uom": "Piece",
        "unitPrice": 45,
        "lineAmount": 180,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012547",
          "ITEM_CODE": "JCM0012181A",
          "SHIPMENT_NUM": "169100028",
          "PACKING_SLIP": "169100028",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 7,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:35:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHA Jig Making 02, K.Unchalee K."
  },
  {
    "doc": "DMS-134",
    "company": "AHA",
    "vendor": "บริษัท ลิเรโค (ประเทศไทย) จำกัด สำนักงานใหญ่",
    "stax": "0105544109337",
    "inv": "2213664477",
    "dt": "2026-10-01",
    "total": 247.17,
    "sub": 231,
    "vat": 16.17,
    "po": "446012558",
    "rcv": "54610013214",
    "org": 413,
    "oname": "บจ. อาปิโก ไฮเทค ออโตเมชั่น 99 หมู่ที่ 1 ซ.นิคมอุตสาหกรรมไฮเทค ต.บ้านเลน อ.บางปะอิน พระนครศรีอยุธยา 13160",
    "sig": [
      1,
      1
    ],
    "rtotal": 231,
    "status": "Hold",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E09",
      "E01",
      "E11",
      "E15"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: customer_name(LOW_CONFIDENCE), customer_tax_id(INVALID_FORMAT:TAX_ID_NOT_13_DIGITS)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.3952,
          "y": 0.1739,
          "w": 0.2661,
          "h": 0.0097,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 54610013214 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "Tax ID ลูกค้าอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "Price Variance",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 1 (Invoice: ENERGIZER ถ่านอัลคาไลน์ MAX-E91 AA 4ก้อน): ราคาต่างเกินกรอบ (Inv: 77.00, Rcv: 19.25)",
        "exception_code": "E09",
        "severity": "High",
        "actual": "77.00",
        "expected": "19.25",
        "page": 1,
        "bbox": {
          "x": 0.733,
          "y": 0.458,
          "w": 0.03,
          "h": 0.012,
          "page": 1
        }
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "Currency Mismatch",
        "status": "FAIL",
        "result": "fail",
        "detail": "บรรทัดที่ 1 (Invoice: ENERGIZER ถ่านอัลคาไลน์ MAX-E91 AA 4ก้อน): จำนวนวางบิลน้อยกว่าใบรับ (Inv: 3, Rcv: 12)",
        "exception_code": "E15",
        "severity": "Medium",
        "actual": "3",
        "page": 1,
        "bbox": {
          "x": 0.203,
          "y": 0.458,
          "w": 0.007,
          "h": 0.012,
          "page": 1
        }
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 231.00 = receipt 231"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "ENERGIZER ถ่านอัลคาไลน์ MAX-E91 AA 4ก้อน",
        "qty": 3,
        "unit": "PCS",
        "price": 77,
        "amount": 231,
        "diff": true,
        "gr_line": 1,
        "gr_qty": 12,
        "match_level": "M4"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "446012558",
        "receiptNum": "54610013214",
        "lineNo": 1,
        "rcvLineId": "54610013214-1",
        "itemCode": "AOS0000161A",
        "itemDesc": "BATTERY 1.5 V SIZE AA \"ALKALINE\" (1889826)",
        "qty": 12,
        "uom": "Piece",
        "unitPrice": 19.25,
        "lineAmount": 231,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012558",
          "ITEM_CODE": "AOS0000161A",
          "SHIPMENT_NUM": "2213664477",
          "PACKING_SLIP": "2213664477",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:37:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Hold · ความรุนแรงสูงสุด High",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHA Jig Making 02, K.Unchalee K."
  },
  {
    "doc": "DMS-135",
    "company": "AHA",
    "vendor": "บริษัท ทริปเปิ้ล อี เทรดดิ้ง จำกัด (สำนักงานใหญ่) TRIPLE E TRADING CO., LTD. (HEAD OFFICE)",
    "stax": "0105547065721",
    "inv": "46910-00197",
    "dt": "2026-10-01",
    "total": 10807,
    "sub": 10100,
    "vat": 707,
    "po": "446012474",
    "rcv": "54610013215",
    "org": 413,
    "oname": "บริษัท อาปิโก ไฮเทค ออโตโมชั่น จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 10100,
    "status": "Review",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: po_number(CONFLICT_BETWEEN_SOURCES)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.152,
          "y": 0.292,
          "w": 0.07,
          "h": 0.012,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 54610013215 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 10,100.00 = receipt 10,100"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "53-00001 CC-LINK IE TSN MANAGER/LOCAL STATION RJ71GN11-T2 MITSUBISHI",
        "qty": 1,
        "unit": "PCS",
        "price": 10100,
        "amount": 10100,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "446012474",
        "receiptNum": "54610013215",
        "lineNo": 1,
        "rcvLineId": "54610013215-1",
        "itemCode": "JCM0012161A",
        "itemDesc": "CC-LINK IE TSN MANAGER/LOCAL STATION\\RJ71GN11-T2\\MITSUBISHI",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 10100,
        "lineAmount": 10100,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012474",
          "ITEM_CODE": "JCM0012161A",
          "SHIPMENT_NUM": "46910-00197",
          "PACKING_SLIP": "46910-00197",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:36:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHA Jig Making 02, K.Unchalee K."
  },
  {
    "doc": "DMS-136",
    "company": "AHA",
    "vendor": "บริษัท ทริปเปิ้ล อี เทรดดิ้ง จำกัด (สำนักงานใหญ่) TRIPLE E TRADING CO., LTD. (HEAD OFFICE)",
    "stax": "0105547065721",
    "inv": "46910-00375",
    "dt": "2026-10-01",
    "total": 17162.8,
    "sub": 16040,
    "vat": 1122.8,
    "po": "446012448",
    "rcv": "54610013216",
    "org": 413,
    "oname": "บริษัท อาปิโก ไฮเทค ออโตโมทีฟ จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 16040,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 54610013216 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 16,040.00 = receipt 16,040"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "53-00001 AGV MITSUBISHI PLC MODULE FX5-ENET/IP",
        "qty": 2,
        "unit": "PCS",
        "price": 8020,
        "amount": 16040,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M3"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "446012448",
        "receiptNum": "54610013216",
        "lineNo": 1,
        "rcvLineId": "54610013216-1",
        "itemCode": "MSP0022540A",
        "itemDesc": "AGV \\ MITSUBISHI \\ PLC MODULE \\ FX5-ENET/IP",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 8020,
        "lineAmount": 8020,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012448",
          "ITEM_CODE": "MSP0022540A",
          "SHIPMENT_NUM": "46910-00375",
          "PACKING_SLIP": "46910-00375",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "446012448",
        "receiptNum": "54610013216",
        "lineNo": 2,
        "rcvLineId": "54610013216-2",
        "itemCode": "MSP0022540A",
        "itemDesc": "AGV \\ MITSUBISHI \\ PLC MODULE \\ FX5-ENET/IP",
        "qty": 1,
        "uom": "Piece",
        "unitPrice": 8020,
        "lineAmount": 8020,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012448",
          "ITEM_CODE": "MSP0022540A",
          "SHIPMENT_NUM": "46910-00375",
          "PACKING_SLIP": "46910-00375",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:35:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHA Jig Making 02, K.Unchalee K."
  },
  {
    "doc": "DMS-137",
    "company": "AHA",
    "vendor": "บริษัท สหมิตรเครื่องกล จำกัด (มหาชน)",
    "stax": "0107537002664",
    "inv": "IN26-006591",
    "dt": "2026-10-02",
    "total": 17120,
    "sub": 16000,
    "vat": 1120,
    "po": "446012437",
    "rcv": "54610013217",
    "org": 413,
    "oname": "บริษัท อาปิโก ไฮเทค ออโตโมชั่น จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 16000,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 3 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 54610013217 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 16,000.00 = receipt 16,000"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "NEW TYPE SINGLE NOZZLE 1.8",
        "qty": 3,
        "unit": "PCS",
        "price": 1000,
        "amount": 3000,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 3,
        "match_level": "M4"
      },
      {
        "no": 2,
        "desc": "1.6 NEW TYPE SINGLE NOZZLE 1.6",
        "qty": 3,
        "unit": "PCS",
        "price": 1000,
        "amount": 3000,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 3,
        "match_level": "M4"
      },
      {
        "no": 3,
        "desc": "NEW TYPE COMPOSITE NOZZLE 1.2",
        "qty": 10,
        "unit": "PCS",
        "price": 1000,
        "amount": 10000,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 10,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "446012437",
        "receiptNum": "54610013217",
        "lineNo": 1,
        "rcvLineId": "54610013217-1",
        "itemCode": "AFS0019572A",
        "itemDesc": "NEW TYPE SINGLE NOZZLE DIA.1.8",
        "qty": 3,
        "uom": "Piece",
        "unitPrice": 1000,
        "lineAmount": 3000,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012437",
          "ITEM_CODE": "AFS0019572A",
          "SHIPMENT_NUM": "IN26-006591",
          "PACKING_SLIP": "IN26-006591",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "446012437",
        "receiptNum": "54610013217",
        "lineNo": 2,
        "rcvLineId": "54610013217-2",
        "itemCode": "AFS0019573A",
        "itemDesc": "NEW TYPE SINGLE NOZZLE DIA.1.6",
        "qty": 3,
        "uom": "Piece",
        "unitPrice": 1000,
        "lineAmount": 3000,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012437",
          "ITEM_CODE": "AFS0019573A",
          "SHIPMENT_NUM": "IN26-006591",
          "PACKING_SLIP": "IN26-006591",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "446012437",
        "receiptNum": "54610013217",
        "lineNo": 3,
        "rcvLineId": "54610013217-3",
        "itemCode": "AFS0019574A",
        "itemDesc": "NEW TYPE COMPOSITE NOZZLE DIA.1.2",
        "qty": 10,
        "uom": "Piece",
        "unitPrice": 1000,
        "lineAmount": 10000,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012437",
          "ITEM_CODE": "AFS0019574A",
          "SHIPMENT_NUM": "IN26-006591",
          "PACKING_SLIP": "IN26-006591",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:36:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHA Jig Making 02, K.Unchalee K."
  },
  {
    "doc": "DMS-138",
    "company": "AHA",
    "vendor": "บริษัท บางปู พี เอส เทค จำกัด สำนักงานใหญ่",
    "stax": "0115537005891",
    "inv": "IV6910-006",
    "dt": "2026-10-02",
    "total": 1861.8,
    "sub": 1740,
    "vat": 121.8,
    "po": "446012533",
    "rcv": "54610013218",
    "org": 413,
    "oname": "บริษัท อาปิโก ไฮเทค ออโตโมชั่น จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 1740,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 54610013218 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 1,740.00 = receipt 1,740"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "Part Filter หน้่ากากAuto 350S 90x35 mm",
        "qty": 3,
        "unit": "SET",
        "price": 580,
        "amount": 1740,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 3,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "446012533",
        "receiptNum": "54610013218",
        "lineNo": 1,
        "rcvLineId": "54610013218-1",
        "itemCode": "AFS0018356A",
        "itemDesc": "PART FILTER MASK AUTO 350S 90X35 MM.",
        "qty": 3,
        "uom": "Set",
        "unitPrice": 580,
        "lineAmount": 1740,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012533",
          "ITEM_CODE": "AFS0018356A",
          "SHIPMENT_NUM": "IV6910-006",
          "PACKING_SLIP": "IV6910-006",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:35:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHA Jig Making 02, K.Unchalee K."
  },
  {
    "doc": "DMS-139",
    "company": "AHA",
    "vendor": "บริษัท บางปู พี เอส เทค จำกัด สำนักงานใหญ่",
    "stax": "0115537005891",
    "inv": "IV6910-007",
    "dt": "2026-10-02",
    "total": 667.68,
    "sub": 624,
    "vat": 43.68,
    "po": "446012556",
    "rcv": "54610013219",
    "org": 413,
    "oname": "บริษัท อาปิโก ไฮเทค ออโตโมชั่น จำกัด",
    "sig": [
      0,
      1
    ],
    "rtotal": 624,
    "status": "Manual Review",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 54610013219 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "WARN",
        "result": "manual_review",
        "detail": "ความมั่นใจต่ำ: ['deliverer']"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 624.00 = receipt 624"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "ถุงมือช่างเชื่อมขาว",
        "qty": 12,
        "unit": "PAIR",
        "price": 52,
        "amount": 624,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 12,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "446012556",
        "receiptNum": "54610013219",
        "lineNo": 1,
        "rcvLineId": "54610013219-1",
        "itemCode": "AFS0000440A",
        "itemDesc": "LEATHER GLOVES FLS\\AO\\LONG SIZE",
        "qty": 12,
        "uom": "Pair",
        "unitPrice": 52,
        "lineAmount": 624,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012556",
          "ITEM_CODE": "AFS0000440A",
          "SHIPMENT_NUM": "IV6910-007",
          "PACKING_SLIP": "IV6910-007",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:35:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Manual Review · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHA Jig Making 02, K.Unchalee K."
  },
  {
    "doc": "DMS-140",
    "company": "AHA",
    "vendor": "MA CO.,LTD.",
    "stax": "0105555135806",
    "inv": "SAI01/69-025857",
    "dt": "—",
    "total": 8346,
    "sub": 7800,
    "vat": 546,
    "po": "446012293",
    "rcv": "54610013220",
    "org": 413,
    "oname": "บริษัท อาปิโก ไฮเทค อุตเมชั่น จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 7800,
    "status": "Review",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: po_number(CONFLICT_BETWEEN_SOURCES)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.0887,
          "y": 0.3934,
          "w": 0.1129,
          "h": 0.0143,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 54610013220 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 7,800.00 = receipt 7,800"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "IFR204 \\ evector 100 \\ Inductive sensors \\ IFB2004BARKG/AM/SC/3,0M/2LED \\ DE \\: ifm",
        "qty": 4,
        "unit": "PCS",
        "price": 1950,
        "amount": 7800,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 4,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "446012293",
        "receiptNum": "54610013220",
        "lineNo": 1,
        "rcvLineId": "54610013220-1",
        "itemCode": "JCM0003906A",
        "itemDesc": "PROXIMITY SWITCH\\IFR204\\IFB2004BARKG\\AM\\SC\\3,0M(M12)",
        "qty": 4,
        "uom": "Piece",
        "unitPrice": 1950,
        "lineAmount": 7800,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012293",
          "ITEM_CODE": "JCM0003906A",
          "SHIPMENT_NUM": "SAI01/69-025857",
          "PACKING_SLIP": "SAI01/69-025857",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:36:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHA Jig Making 02, K.Unchalee K."
  },
  {
    "doc": "DMS-141",
    "company": "AHA",
    "vendor": "บริษัท เอสซีเอ็มเอ จำกัด SCMA CO.,LTD.",
    "stax": "0105555135806",
    "inv": "SAI01/69-025858",
    "dt": "2026-10-02",
    "total": 34240,
    "sub": 32000,
    "vat": 2240,
    "po": "446012332",
    "rcv": "54610013221",
    "org": 413,
    "oname": "บริษัท อาปิโก ไฮเทค ออโตโมชั่น จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 32000,
    "status": "Review",
    "receiverActive": true,
    "assigned": "eu",
    "codes": [
      "E01"
    ],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "Missing Field",
        "status": "FAIL",
        "result": "fail",
        "detail": "ฟิลด์บังคับอ่านไม่ได้หรือไม่ครบ: customer_tax_id(INVALID_FORMAT:TAX_ID_NOT_13_DIGITS)",
        "exception_code": "E01",
        "severity": "Medium",
        "page": 1,
        "bbox": {
          "x": 0.095,
          "y": 0.14,
          "w": 0.045,
          "h": 0.012,
          "page": 1
        }
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 54610013221 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "SKIP",
        "result": "not_evaluated",
        "detail": "Tax ID ลูกค้าอ่านไม่ได้",
        "halted_by": "V-01"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 32,000.00 = receipt 32,000"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "IFR205 \\ efectoor 100 \\ Inductive sensors \\ IFB2004BARKG/AM/SC/5,0M/2LED \\ DE \\ : ifm",
        "qty": 20,
        "unit": "PCS",
        "price": 1600,
        "amount": 32000,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 5,
        "match_level": "M3"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "446012332",
        "receiptNum": "54610013221",
        "lineNo": 1,
        "rcvLineId": "54610013221-1",
        "itemCode": "JCM0005642A",
        "itemDesc": "PROXIMITY SWITCH WITH CONNECTOR\\IFR205\\IFM(Range 4 mm Cable 5 M)M12",
        "qty": 5,
        "uom": "Piece",
        "unitPrice": 1600,
        "lineAmount": 8000,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012332",
          "ITEM_CODE": "JCM0005642A",
          "SHIPMENT_NUM": "SAI01/69-025858",
          "PACKING_SLIP": "SAI01/69-025858",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "446012332",
        "receiptNum": "54610013221",
        "lineNo": 2,
        "rcvLineId": "54610013221-2",
        "itemCode": "JCM0005642A",
        "itemDesc": "PROXIMITY SWITCH WITH CONNECTOR\\IFR205\\IFM(Range 4 mm Cable 5 M)M12",
        "qty": 5,
        "uom": "Piece",
        "unitPrice": 1600,
        "lineAmount": 8000,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012332",
          "ITEM_CODE": "JCM0005642A",
          "SHIPMENT_NUM": "SAI01/69-025858",
          "PACKING_SLIP": "SAI01/69-025858",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "446012332",
        "receiptNum": "54610013221",
        "lineNo": 3,
        "rcvLineId": "54610013221-3",
        "itemCode": "JCM0005642A",
        "itemDesc": "PROXIMITY SWITCH WITH CONNECTOR\\IFR205\\IFM(Range 4 mm Cable 5 M)M12",
        "qty": 5,
        "uom": "Piece",
        "unitPrice": 1600,
        "lineAmount": 8000,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012332",
          "ITEM_CODE": "JCM0005642A",
          "SHIPMENT_NUM": "SAI01/69-025858",
          "PACKING_SLIP": "SAI01/69-025858",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "446012332",
        "receiptNum": "54610013221",
        "lineNo": 4,
        "rcvLineId": "54610013221-4",
        "itemCode": "JCM0005642A",
        "itemDesc": "PROXIMITY SWITCH WITH CONNECTOR\\IFR205\\IFM(Range 4 mm Cable 5 M)M12",
        "qty": 5,
        "uom": "Piece",
        "unitPrice": 1600,
        "lineAmount": 8000,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012332",
          "ITEM_CODE": "JCM0005642A",
          "SHIPMENT_NUM": "SAI01/69-025858",
          "PACKING_SLIP": "SAI01/69-025858",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 5,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:38:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Review · ความรุนแรงสูงสุด Medium",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHA Jig Making 02, K.Unchalee K."
  },
  {
    "doc": "DMS-142",
    "company": "AHA",
    "vendor": "บริษัท มิซูมิ (ไทยแลนด์) จำกัด MISUMI (THAILAND) CO., LTD.",
    "stax": "0105540008838",
    "inv": "LN6064482000H2",
    "dt": "—",
    "total": 2694.39,
    "sub": 2518.12,
    "vat": 176.27,
    "po": "446012537",
    "rcv": "54610013222",
    "org": 413,
    "oname": "บริษัท อามิโก้ ไชเทค ออโตเมชั่น จำกัด",
    "sig": [
      1,
      1
    ],
    "rtotal": 2518.12,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 54610013222 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 2,518.12 = receipt 2,518.12"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "C-LD-431 ECONOMY TOGGLE CLAMPS",
        "qty": 22,
        "unit": "PCS",
        "price": 114.46,
        "amount": 2518.12,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 22,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "446012537",
        "receiptNum": "54610013222",
        "lineNo": 1,
        "rcvLineId": "54610013222-1",
        "itemCode": "JCM0012173A",
        "itemDesc": "ECONOMY TOGGLE CLAMPS\\C-LD-431\\MISUMI",
        "qty": 22,
        "uom": "Piece",
        "unitPrice": 114.46,
        "lineAmount": 2518.12,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012537",
          "ITEM_CODE": "JCM0012173A",
          "SHIPMENT_NUM": "LN6064482000H2",
          "PACKING_SLIP": "LN6064482000H2",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 4,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:38:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHA Jig Making 02, K.Unchalee K."
  },
  {
    "doc": "DMS-143",
    "company": "AHA",
    "vendor": "บริษัท ไทย-เจแปน แก๊ส จำกัด Thai-Japan Gas Co., Ltd.",
    "stax": "0105532071666",
    "inv": "126100111",
    "dt": "2026-10-03",
    "total": 3317,
    "sub": 3100,
    "vat": 217,
    "po": "446012341",
    "rcv": "54610013223",
    "org": 413,
    "oname": "AAPICO HITECH AUTOMATION CO.,LTD",
    "sig": [
      1,
      1
    ],
    "rtotal": 3100,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 1 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 54610013223 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 3,100.00 = receipt 3,100"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "Oxygen IND Pack (47L x 15)",
        "qty": 1,
        "unit": "PACK",
        "price": 3100,
        "amount": 3100,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 1,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "446012341",
        "receiptNum": "54610013223",
        "lineNo": 1,
        "rcvLineId": "54610013223-1",
        "itemCode": "AFS0004590A",
        "itemDesc": "GAS OXYGEN\\T1091-000 OXYGEN IND. PACK 105 M3\\FOR LASER CUT \"1 PACK=15 CYLINDER\"",
        "qty": 1,
        "uom": "Pack",
        "unitPrice": 3100,
        "lineAmount": 3100,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012341",
          "ITEM_CODE": "AFS0004590A",
          "SHIPMENT_NUM": "126100111",
          "PACKING_SLIP": "126100111",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 3,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:37:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHA Jig Making 02, K.Unchalee K."
  },
  {
    "doc": "DMS-144",
    "company": "AHA",
    "vendor": "บริษัท ไทย ออโตเมชั่น จำกัด THAI AUTOMATION CO., LTD.",
    "stax": "0115547002622",
    "inv": "IV6900562",
    "dt": "2026-10-03",
    "total": 37252.05,
    "sub": 34815,
    "vat": 2437.05,
    "po": "446012501",
    "rcv": "54610013224",
    "org": 413,
    "oname": "บริษัท อาปิโก ไฮเทค ออโตเมชั่น จำกัด สำนักงานใหญ่",
    "sig": [
      1,
      1
    ],
    "rtotal": 34815,
    "status": "Auto-pass",
    "receiverActive": true,
    "assigned": "acc",
    "codes": [],
    "rules": [
      {
        "id": "V-01",
        "rule": "V-01",
        "name": "V-01",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-02",
        "rule": "V-02",
        "name": "V-02",
        "status": "PASS",
        "result": "pass",
        "detail": "ตรวจ 7 บรรทัด"
      },
      {
        "id": "V-03",
        "rule": "V-03",
        "name": "V-03",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-04",
        "rule": "V-04",
        "name": "V-04",
        "status": "PASS",
        "result": "pass",
        "detail": "ใบรับ 54610013224 (TAX-INV)"
      },
      {
        "id": "V-05",
        "rule": "V-05",
        "name": "V-05",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-06",
        "rule": "V-06",
        "name": "V-06",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-07",
        "rule": "V-07",
        "name": "V-07",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-08",
        "rule": "V-08",
        "name": "V-08",
        "status": "PASS",
        "result": "pass"
      },
      {
        "id": "V-09",
        "rule": "V-09",
        "name": "V-09",
        "status": "PASS",
        "result": "pass",
        "detail": "invoice 34,815.00 = receipt 34,815.0"
      }
    ],
    "lines": [
      {
        "no": 1,
        "desc": "TC-300 : ฝาครอบตรง W300 L3M.",
        "qty": 6,
        "unit": "PCS",
        "price": 1264,
        "amount": 7584,
        "diff": false,
        "gr_line": 1,
        "gr_qty": 6,
        "match_level": "M1"
      },
      {
        "no": 2,
        "desc": "TSR-300 : ครอบตรง W300 H100 L3M.",
        "qty": 6,
        "unit": "PCS",
        "price": 1813,
        "amount": 10878,
        "diff": false,
        "gr_line": 2,
        "gr_qty": 6,
        "match_level": "M1"
      },
      {
        "no": 3,
        "desc": "TSRLA-300 : ช่องออก W300 H100",
        "qty": 2,
        "unit": "PCS",
        "price": 908.5,
        "amount": 1817,
        "diff": false,
        "gr_line": 3,
        "gr_qty": 2,
        "match_level": "M1"
      },
      {
        "no": 4,
        "desc": "TLAC-300 : ฝาช่องออก W300",
        "qty": 2,
        "unit": "PCS",
        "price": 750.5,
        "amount": 1501,
        "diff": false,
        "gr_line": 4,
        "gr_qty": 2,
        "match_level": "M1"
      },
      {
        "no": 5,
        "desc": "TSRT-300 : ช่องอ 3 ทาง W300 H100",
        "qty": 5,
        "unit": "PCS",
        "price": 1224.5,
        "amount": 6122.5,
        "diff": false,
        "gr_line": 5,
        "gr_qty": 5,
        "match_level": "M1"
      },
      {
        "no": 6,
        "desc": "TTC-300 : ฝาช่องอ 3 ทาง W300",
        "qty": 5,
        "unit": "PCS",
        "price": 1264,
        "amount": 6320,
        "diff": false,
        "gr_line": 6,
        "gr_qty": 5,
        "match_level": "M1"
      },
      {
        "no": 7,
        "desc": "BE-300 : แผนปิดท้าย W300",
        "qty": 5,
        "unit": "PCS",
        "price": 118.5,
        "amount": 592.5,
        "diff": false,
        "gr_line": 7,
        "gr_qty": 5,
        "match_level": "M1"
      }
    ],
    "oracleReceiptLines": [
      {
        "poNumber": "446012501",
        "receiptNum": "54610013224",
        "lineNo": 1,
        "rcvLineId": "54610013224-1",
        "itemCode": "JCM0010241A",
        "itemDesc": "COVER FOR TQR (PAINT RAL7032)\\TC-300\\TAMCO",
        "qty": 6,
        "uom": "Piece",
        "unitPrice": 1264,
        "lineAmount": 7584,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012501",
          "ITEM_CODE": "JCM0010241A",
          "SHIPMENT_NUM": "IV6900562",
          "PACKING_SLIP": "IV6900562",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "446012501",
        "receiptNum": "54610013224",
        "lineNo": 2,
        "rcvLineId": "54610013224-2",
        "itemCode": "JCM0011422A",
        "itemDesc": "CABLE TRAY (PAINT RAL7032)\\TSR-300\\TAMCO",
        "qty": 6,
        "uom": "Piece",
        "unitPrice": 1813,
        "lineAmount": 10878,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012501",
          "ITEM_CODE": "JCM0011422A",
          "SHIPMENT_NUM": "IV6900562",
          "PACKING_SLIP": "IV6900562",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "446012501",
        "receiptNum": "54610013224",
        "lineNo": 3,
        "rcvLineId": "54610013224-3",
        "itemCode": "JCM0011429A",
        "itemDesc": "HORIZONTAL 90 DEGREE ELBOW (PAINT RAL7032)\\TSRLA-300\\TAMCO",
        "qty": 2,
        "uom": "Piece",
        "unitPrice": 908.5,
        "lineAmount": 1817,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012501",
          "ITEM_CODE": "JCM0011429A",
          "SHIPMENT_NUM": "IV6900562",
          "PACKING_SLIP": "IV6900562",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "446012501",
        "receiptNum": "54610013224",
        "lineNo": 4,
        "rcvLineId": "54610013224-4",
        "itemCode": "JCM0011430A",
        "itemDesc": "COVER FOR TSRLA 300 PAINT RAL7032\\TLAC-300\\TAMCO",
        "qty": 2,
        "uom": "Piece",
        "unitPrice": 750.5,
        "lineAmount": 1501,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012501",
          "ITEM_CODE": "JCM0011430A",
          "SHIPMENT_NUM": "IV6900562",
          "PACKING_SLIP": "IV6900562",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "446012501",
        "receiptNum": "54610013224",
        "lineNo": 5,
        "rcvLineId": "54610013224-5",
        "itemCode": "JCM0011431A",
        "itemDesc": "CABLE TRAY HORIZONTAL TEES\\TSRT-300\\TAMCO",
        "qty": 5,
        "uom": "Piece",
        "unitPrice": 1224.5,
        "lineAmount": 6122.5,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012501",
          "ITEM_CODE": "JCM0011431A",
          "SHIPMENT_NUM": "IV6900562",
          "PACKING_SLIP": "IV6900562",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "446012501",
        "receiptNum": "54610013224",
        "lineNo": 6,
        "rcvLineId": "54610013224-6",
        "itemCode": "JCM0011432A",
        "itemDesc": "COVER FOR TSRT 300 PAINT RAL7032\\TTC-300\\TAMCO",
        "qty": 5,
        "uom": "Piece",
        "unitPrice": 1264,
        "lineAmount": 6320,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012501",
          "ITEM_CODE": "JCM0011432A",
          "SHIPMENT_NUM": "IV6900562",
          "PACKING_SLIP": "IV6900562",
          "QTY_BILLED": "0"
        }
      },
      {
        "poNumber": "446012501",
        "receiptNum": "54610013224",
        "lineNo": 7,
        "rcvLineId": "54610013224-7",
        "itemCode": "JCM0011436A",
        "itemDesc": "BLIND END (PAINT RAL7032)\\BE-300\\TAMCO",
        "qty": 5,
        "uom": "Piece",
        "unitPrice": 118.5,
        "lineAmount": 592.5,
        "qtyBilled": 0,
        "lineStatus": "FULLY RECEIVED",
        "poLineStatus": "CLOSED FOR RECEIVING",
        "receiver": "AHA Jig Making 02, K.Unchalee K.",
        "ouName": "Aapico Hitech Automation Legal",
        "extra": {
          "PO_NUM": "446012501",
          "ITEM_CODE": "JCM0011436A",
          "SHIPMENT_NUM": "IV6900562",
          "PACKING_SLIP": "IV6900562",
          "QTY_BILLED": "0"
        }
      }
    ],
    "pages": 4,
    "history": [
      {
        "dt": "2026-10-09",
        "t": "03:39:00",
        "who": "ระบบตรวจสอบอัตโนมัติ (System A)",
        "role": "Engine",
        "act": "ตรวจเอกสารเสร็จสิ้น",
        "d": "ผลตรวจ Auto-pass · ความรุนแรงสูงสุด None",
        "k": "s"
      }
    ],
    "unres": false,
    "up": "2026-10-09",
    "receiver": "AHA Jig Making 02, K.Unchalee K."
  }
];

export default REAL_125_INVOICES;
