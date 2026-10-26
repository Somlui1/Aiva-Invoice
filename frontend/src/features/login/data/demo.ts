/**
 * ข้อมูลตัวอย่าง (DEMO) ที่แผง “ระบบทำงานอย่างไร” และ mock auth ใช้
 * ------------------------------------------------------------------
 * คัดลอกมาจาก AIVA-Web-Portal-Mockup-v4.20 (ค่าสมมติทั้งหมด)
 * ถ้า project จริงมี USERS / ROLES / PERM / EXC อยู่แล้ว ให้ลบไฟล์นี้แล้วชี้ import ไปที่ของจริงได้
 * (แผงอธิบายระบบต้องการเฉพาะ: ROLES, PERM, USERS, MAPS, DEMO_DOCS, DEMO_COUNTS, SEV, EXC_NAME, RULES)
 */

export type Role = "EU" | "ACC" | "APR" | "ADM" | "SA";
export type Severity = "High" | "Medium" | "Low";

export interface DemoUser {
  id: string;
  n: string;
  email: string;
  role: Role;
  emp: number | null;
  co: string[];
  unit: string;
}

export interface RoleDef {
  n: string;
  c: string;
  bg: string;
  p: string[];
  scope: "receiver" | "company" | "none";
}

export interface DemoDoc {
  doc: string;
  inv: string;
  company: string;
  receiver: string | null;
  status: string;
}

export const USERS: DemoUser[] = [
  {
    id: "wajeepradit.p",
    n: "Wajeepradit Prompan (AH)",
    email: "wajeepradit.p@aapico.com",
    role: "SA",
    emp: null,
    co: ["AH", "AHA", "AHT", "AHP", "AM"],
    unit: "IT Support",
  },
  {
    id: "itsupport",
    n: "IT Support (AH)",
    email: "itsupport@aapico.com",
    role: "SA",
    emp: null,
    co: ["AH", "AHA", "AHT", "AHP", "AM"],
    unit: "IT Support",
  },
];

export const ROLES: Record<Role, RoleDef> = {
  "EU": {
    "n": "ผู้ใช้งาน (Receiver)",
    "c": "var(--t-org)",
    "bg": "var(--t-org-bg)",
    "p": [
      "VIEW_OWN",
      "DMS",
      "UPLOAD_NEW"
    ],
    "scope": "receiver"
  },
  "ACC": {
    "n": "เจ้าหน้าที่บัญชี",
    "c": "var(--t-ok)",
    "bg": "var(--t-ok-bg)",
    "p": [
      "VIEW_CO",
      "DMS",
      "CONFIRM",
      "REVIEW",
      "HOLD",
      "REJECT",
      "VIEW_AP"
    ],
    "scope": "company"
  },
  "APR": {
    "n": "หัวหน้าฝ่ายบัญชี",
    "c": "var(--t-blue)",
    "bg": "var(--t-blue-bg)",
    "p": [
      "VIEW_CO",
      "DMS",
      "CONFIRM",
      "REVIEW",
      "HOLD",
      "REJECT",
      "VIEW_AP",
      "MANUAL_REVIEW",
      "DUP_OVERRIDE",
      "UNCONFIRM",
      "POST",
      "RETURN_FAILED",
      "AUDIT"
    ],
    "scope": "company"
  },
  "ADM": {
    "n": "ผู้ดูแลระบบ (IT)",
    "c": "var(--t-adm)",
    "bg": "var(--t-adm-bg)",
    "p": [
      "MAP",
      "AUDIT"
    ],
    "scope": "none"
  },
  "SA": {
    "n": "ผู้ดูแลระบบระดับสูง (Super Admin)",
    "c": "var(--t-teal)",
    "bg": "var(--t-teal-bg)",
    "p": [
      "VIEW_CO",
      "VIEW_OWN",
      "DMS",
      "UPLOAD_NEW",
      "CONFIRM",
      "REVIEW",
      "HOLD",
      "REJECT",
      "MANUAL_REVIEW",
      "DUP_OVERRIDE",
      "UNCONFIRM",
      "POST",
      "RETURN_FAILED",
      "VIEW_AP",
      "MAP",
      "AUDIT"
    ],
    "scope": "company"
  }
};

/** วงเงินตั้งหนี้ต่อฉบับของ APR (ค่าตั้งต้น · แก้ได้ที่เมนูตั้งค่าของ portal) */
export const APR_POST_MAX = 1000000;

export const PERM: Record<string, string> = {
  "VIEW_OWN": "ดูเอกสารที่ตนเป็น Receiver",
  "VIEW_CO": "ดูเอกสารทั้งบริษัทที่ได้รับมอบหมาย",
  "DMS": "เปิดเอกสารจาก DMS",
  "UPLOAD_NEW": "อัปโหลดเอกสารใหม่",
  "CONFIRM": "Confirm",
  "REVIEW": "ย้ายเป็น Review",
  "HOLD": "Hold",
  "REJECT": "Reject",
  "MANUAL_REVIEW": "ตัดสิน Manual Review",
  "DUP_OVERRIDE": "ยืนยันว่าไม่ซ้ำ (Duplicate)",
  "UNCONFIRM": "ยกเลิกการยืนยัน",
  "POST": "ส่งเข้า AP Interface (Batch)",
  "RETURN_FAILED": "Return Import Failed",
  "VIEW_AP": "ดูหน้าส่งเข้า AP Interface",
  "MAP": "จัดการการเชื่อมบัญชีและสิทธิ์",
  "AUDIT": "ดูบันทึกการเข้าถึง"
};

/** การผูก AD user ↔ Oracle account (RECEIVER) · เอกสารเป็นของ Oracle account */
export const MAPS: { user: string; acct: string }[] = [];

export const COMPANY_NAME: Record<string, string> = {
  "AH": "อาปิโก ไฮเทค (มหาชน)",
  "AHT": "อาปิโก ไฮเทค ทูลลิ่ง",
  "AHP": "อาปิโก ไฮเทค พาร์ทส์",
  "AM": "เอเบิล มอเตอร์ส",
  "?": "ไม่ระบุบริษัท (ORG_ID ยังไม่ทราบ / ยกเลิก)"
};

export const EXC_NAME: Record<string, { name: string; owner: "eu" | "acc" }> = {
  "E01": {
    "name": "Missing Field",
    "owner": "eu"
  },
  "E02": {
    "name": "Arithmetic Inconsistency",
    "owner": "acc"
  },
  "E03": {
    "name": "Total Mismatch",
    "owner": "acc"
  },
  "E04": {
    "name": "Rounding",
    "owner": "acc"
  },
  "E05": {
    "name": "Receipt Not Found",
    "owner": "eu"
  },
  "E06": {
    "name": "Multiple Receipts",
    "owner": "eu"
  },
  "E07": {
    "name": "Customer Mismatch",
    "owner": "acc"
  },
  "E08": {
    "name": "Signature Missing",
    "owner": "eu"
  },
  "E09": {
    "name": "Price Variance",
    "owner": "acc"
  },
  "E10": {
    "name": "UOM Mismatch",
    "owner": "eu"
  },
  "E11": {
    "name": "Line Resolved by Description",
    "owner": "acc"
  },
  "E12": {
    "name": "Price Variance Within Tolerance",
    "owner": "acc"
  },
  "E13": {
    "name": "Line Not Identified",
    "owner": "acc"
  },
  "E14": {
    "name": "Over Quantity",
    "owner": "eu"
  },
  "E15": {
    "name": "Quantity Below Receipt",
    "owner": "eu"
  }
};

export const SEV: Record<string, Severity> = {
  "E01": "Medium",
  "E02": "High",
  "E03": "High",
  "E04": "Low",
  "E05": "High",
  "E06": "High",
  "E07": "High",
  "E08": "High",
  "E09": "High",
  "E10": "Medium",
  "E11": "Medium",
  "E12": "Medium",
  "E13": "High",
  "E14": "High",
  "E15": "Medium"
};

export const RULES: string[] = [
  "V-01 ฟิลด์บังคับ",
  "V-02 เลขคณิตรายบรรทัด",
  "V-03 ยอดรวมในใบแจ้งหนี้",
  "V-04 พบใบรับ",
  "V-05 ลูกค้าตรงกับตารางที่ 4",
  "V-06 ลายเซ็น",
  "V-07 จับคู่รายบรรทัดและราคา",
  "V-08 จำนวนเท่ากับใบรับ",
  "V-09 ยอดรวมเท่ากับใบรับ"
];

/** เอกสารตัวอย่าง 7 ฉบับที่แท็บ “สิทธิ์และบทบาท” ใช้แสดงว่าใครเห็นอะไร */
export const DEMO_DOCS: DemoDoc[] = [
  {
    "doc": "DMS-2026-000123",
    "inv": "IV6909245",
    "company": "AH",
    "receiver": "SOMSAK JAIDEE",
    "status": "Auto-pass"
  },
  {
    "doc": "DMS-2026-000203",
    "inv": "TP-2610-0045",
    "company": "AH",
    "receiver": "SOMSAK JAIDEE",
    "status": "Hold"
  },
  {
    "doc": "DMS-2026-000207",
    "inv": "PT-2610-0071",
    "company": "AHT",
    "receiver": "WILAIWAN SRISUK",
    "status": "Review"
  },
  {
    "doc": "DMS-2026-000206",
    "inv": "SA-2610-0502",
    "company": "AM",
    "receiver": "THANAKORN MANKONG",
    "status": "Review"
  },
  {
    "doc": "DMS-2026-000204",
    "inv": "MR-2610-0230",
    "company": "AH",
    "receiver": "SOMSAK JAIDEE",
    "status": "Hold"
  },
  {
    "doc": "DMS-2026-000152",
    "inv": "SR6909-1142",
    "company": "AH",
    "receiver": null,
    "status": "Hold"
  },
  {
    "doc": "DMS-2026-000213",
    "inv": "AT-2610-0004",
    "company": "?",
    "receiver": "ANAN THONGDEE",
    "status": "Manual Review"
  }
];

/** ตัวเลข KPI บนแท็บ “หน้าคิวตรวจสอบ” (นับจากชุดเอกสารทดสอบของ mockup) */
export const DEMO_COUNTS: Record<string, number> = {
  "total": 48,
  "Auto-pass": 4,
  "Review": 10,
  "Hold": 13,
  "Manual Review": 5,
  "Duplicate": 3
};
