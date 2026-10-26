/**
 * เนื้อหาของแผง “ระบบทำงานอย่างไร” (5 แท็บ) · ย้ายมาจาก mockup v4.20 ตรงตัว
 * ข้อความทั้งหมดอยู่ที่นี่ที่เดียว แก้เนื้อหาได้โดยไม่ต้องแตะ component
 */
import type { IconName } from "../ui/icons";
import { RULES, type Role } from "./demo";

/** ชิปที่แสดงใต้รายการ: กฎ (V-xx) · รหัสข้อยกเว้น (Exx) · ป้ายสถานะ */
export type Chip =
  | { k: "rule"; id: string }
  | { k: "exc"; code: string }
  | { k: "status"; status: string };

const V = (id: string): Chip => ({ k: "rule", id });
const E = (code: string): Chip => ({ k: "exc", code });
const S = (status: string): Chip => ({ k: "status", status });

/* ------------------------------------------------------------------ แท็บ ---- */
export type TabKey = "flow" | "rules" | "state" | "role" | "queue";

export const TABS: { key: TabKey; label: string; icon: IconName }[] = [
  { key: "flow", label: "กระบวนการทั้งหมด", icon: "git" },
  { key: "rules", label: "9 กฎการตรวจ", icon: "shield" },
  { key: "state", label: "สถานะเอกสาร", icon: "layers" },
  { key: "role", label: "สิทธิ์และบทบาท", icon: "users" },
  { key: "queue", label: "หน้าคิวตรวจสอบ", icon: "table" },
];

/** เวลาที่อยู่ในแต่ละแท็บก่อนเลื่อนไปแท็บถัดไป (ms) - เร่งความเร็ว ~2x */
export const DWELL: Record<TabKey, number> = { flow: 10000, rules: 12000, state: 9000, role: 8000, queue: 5000 };
/** เวลาต่อ 1 ขั้นภายในแท็บ (ms) · แท็บ rules/queue เล่นเองจึงไม่มี - เร่งความเร็ว ~2x */
export const STEP_MS: Partial<Record<TabKey, number>> = { flow: 1650, state: 1450, role: 1750 };

/* ------------------------------------------------------- แท็บ 1 · กระบวนการ ---- */
export interface WfStep {
  t: string;
  who: string;
  do: string[];
  inp: string;
  out: string;
  chips: Chip[];
  note: string;
  fin?: boolean;
}

export const WF: WfStep[] = [
  {
    t: "สแกนเข้า DMS",
    who: "ผู้สแกน (End User)",
    do: [
      "ผู้สแกนอัปโหลดใบแจ้งหนี้ (ไฟล์สแกนหรือ PDF) เข้า DMS",
      "DMS เก็บรหัสเอกสาร จำนวนหน้า ผู้อัปโหลด และเวลาเข้าระบบ",
      "เอกสารเข้าคิวให้ AIVA ตรวจโดยอัตโนมัติ",
    ],
    inp: "ไฟล์ใบแจ้งหนี้ (ต้นฉบับ + สำเนา)",
    out: "dms_doc_id · uploaded_by · uploaded_at",
    chips: [],
    note: "",
  },
  {
    t: "AIVA อ่านและตรวจเอกสาร",
    who: "AIVA Engine · STEP 1",
    do: [
      "อ่านฟิลด์จากเอกสาร เช่น เลขที่ใบแจ้งหนี้ Tax ID ผู้ขาย/ลูกค้า PO และยอดรวม",
      "ตรวจกฎที่ไม่ต้องใช้ Oracle: ฟิลด์บังคับ · เลขคณิตรายบรรทัด · ยอดรวมในใบแจ้งหนี้ · ลายเซ็น",
      "ถ้าเลขคณิตผิด (E02, High) → หยุดทันที ไม่เรียก Oracle",
    ],
    inp: "ภาพ / PDF จาก DMS",
    out: "ค่าที่อ่านได้ + ผลกฎ STEP 1",
    chips: [V("V-01"), V("V-02"), V("V-03"), V("V-06"), E("E01"), E("E02"), E("E08")],
    note: "อ่านเลขที่ใบแจ้งหนี้ไม่ได้ → ค้น Oracle ไม่ได้ → Manual Review (ไม่ทราบเจ้าของ)",
  },
  {
    t: "ค้นใบรับใน Oracle",
    who: "AIVA + Oracle · STEP 2",
    do: [
      "ค้นใบรับด้วย Tax ID ผู้ขาย + เลขที่ใบแจ้งหนี้ (PO / Release แสดงผลเท่านั้น ไม่ใช้ตัดสิน)",
      "ได้ receive_id (เลขใบรับ) · Receiver (เจ้าของรายการ) · ORG_ID → บริษัท",
      "ตรวจว่าลูกค้าบนใบแจ้งหนี้ตรงกับตารางบริษัท (Tax ID / ชื่อ / ที่อยู่)",
    ],
    inp: "Tax ID ผู้ขาย + เลขที่ใบแจ้งหนี้",
    out: "receive_id · Receiver · ORG_ID",
    chips: [V("V-04"), V("V-05"), E("E05"), E("E06"), E("E07")],
    note: "ไม่พบใบรับ (E05) → Hold ไม่มี Receiver · ฝ่ายบัญชีทำได้เฉพาะ Reject",
  },
  {
    t: "เทียบกับใบรับ",
    who: "AIVA · STEP 3",
    do: [
      "จับคู่รายบรรทัดกับใบรับและเทียบราคา",
      "เทียบจำนวนรายบรรทัด และยอดรวมทั้งใบกับใบรับ",
      "ผลต่างในกรอบ → Medium / Low · ผลต่างเกินกรอบ → High",
    ],
    inp: "รายการในใบแจ้งหนี้ + บรรทัดใบรับ",
    out: "ผลกฎ V-07…V-09 + รหัสข้อยกเว้น",
    chips: [V("V-07"), V("V-08"), V("V-09"), E("E03"), E("E09"), E("E10"), E("E14"), E("E15")],
    note: "ไม่มีการตรวจซ้ำ (Rerun) · ผลใหม่ได้จากการอัปโหลดเอกสารฉบับใหม่เท่านั้น",
  },
  {
    t: "ตัดสินผลและแจกงาน",
    who: "AIVA + Portal",
    do: [
      "AIVA เสนอผล: Auto-pass · Review · Hold · Manual Review",
      "Portal ตรวจเอกสารซ้ำและกำหนดสถานะ (Duplicate / Superseded ตามกติกา DR-01…07)",
      "รหัสของผู้ใช้งานขึ้นคิว “รอฉันแก้ไข” · รหัสของฝ่ายบัญชีให้ฝ่ายบัญชีตัดสิน",
    ],
    inp: "ผลกฎ 9 ข้อ + รหัสข้อยกเว้น",
    out: "สถานะ + ผู้รับผิดชอบ",
    chips: [S("Auto-pass"), S("Review"), S("Hold"), S("Manual Review")],
    note: "ไม่มีการแจ้งเตือนผู้ใช้งาน · ผู้ใช้งานต้องเข้ามาตรวจสถานะเองในหน้า “งานของฉัน”",
  },
  {
    t: "ส่งเข้า AP Interface",
    who: "ฝ่ายบัญชี + Oracle",
    fin: true,
    do: [
      "ฝ่ายบัญชี Confirm → Confirmed (ไม่ส่งจากหน้ารายละเอียด)",
      "หัวหน้าฝ่ายบัญชีส่งเป็น Batch: ตรวจซ้ำ → ผู้ยืนยัน ≠ ผู้ส่ง → วงเงิน → PIN",
      "Oracle Import → Posted หรือ Import Failed (ส่งกลับ Review ได้)",
    ],
    inp: "รายการ Confirmed",
    out: "Batch ID · Oracle Invoice ID",
    chips: [S("Confirmed"), S("Sent"), S("Posted"), S("Import Failed")],
    note: "ทุกการเข้าถึง การตัดสิน และการส่ง ถูกบันทึกใน Audit ที่แก้ไขไม่ได้",
  },
];

/** ตำแหน่ง [แถว, คอลัมน์] ของแต่ละขั้นบน grid (วนเป็นรูปตัว U) */
export const WF_POS: [number, number][] = [[1, 1], [1, 3], [1, 5], [3, 5], [3, 3], [3, 1]];
/** เส้นเชื่อม [แถว, คอลัมน์, ทิศ, ตัวแปร] */
export const WF_EDGES: [number, number, string, string][] = [
  [1, 2, "h", ""],
  [1, 4, "h", ""],
  [2, 5, "v", ""],
  [3, 4, "h rev", ""],
  [3, 2, "h rev", "f"],
];

/* ----------------------------------------------------------- แท็บ 2 · 9 กฎ ---- */
export const RSEQ = ["V-01", "V-02", "V-03", "V-06", "V-04", "V-05", "V-07", "V-08", "V-09"] as const;

/** ชื่อกฎ: "V-01 ฟิลด์บังคับ" → { "V-01": "ฟิลด์บังคับ" } */
export const RNAME: Record<string, string> = Object.fromEntries(RULES.map((r) => [r.slice(0, 4), r.slice(5)]));

export type RuleOutcome = ["pass"] | ["med" | "high" | "mr", string] | ["skip", string];

export interface RuleScenario {
  l: string;
  rs: Partial<Record<(typeof RSEQ)[number], RuleOutcome>>;
  st: string;
  ow: string[];
  tx: string;
}

const SK = (by: string): RuleOutcome => ["skip", by];

export const RSCN: RuleScenario[] = [
  {
    l: "ผ่านทั้งหมด",
    rs: {},
    st: "Auto-pass",
    ow: ["ฝ่ายบัญชี"],
    tx: "AIVA ไม่พบรหัสข้อผิดพลาด (หรือมีเฉพาะ E04 Low) → Auto-pass · ฝ่ายบัญชี Confirm ได้ทันที",
  },
  {
    l: "พบ Medium · หน่วยนับไม่ตรง",
    rs: { "V-07": ["med", "E10"] },
    st: "Review",
    ow: ["ผู้ใช้งานแก้"],
    tx: "รหัส E10 เป็นของผู้ใช้งาน → เอกสารขึ้นคิว “รอฉันแก้ไข” ของ Receiver · ฝ่ายบัญชี Confirm ไม่ได้จนกว่าผู้ใช้งานจะอัปโหลดเอกสารฉบับแก้ไข",
  },
  {
    l: "พบ High · เลขคณิตผิด",
    rs: { "V-02": ["high", "E02"], "V-04": SK("V-02"), "V-05": SK("V-02"), "V-07": SK("V-02"), "V-08": SK("V-02"), "V-09": SK("V-02") },
    st: "Hold",
    ow: ["ไม่มี Receiver", "Reject เท่านั้น"],
    tx: "V-02 พบ High → หยุดทันที ไม่เรียก Oracle จึงไม่มีใบรับและไม่มี Receiver · ผู้ใช้งานมองไม่เห็น · ฝ่ายบัญชีเห็นตาม Tax ID ลูกค้า ทำได้เฉพาะ Reject แล้วติดต่อผู้สแกนนอกระบบ",
  },
  {
    l: "อ่านเลขที่ใบแจ้งหนี้ไม่ได้",
    rs: { "V-01": ["mr", "MR"], "V-04": SK("IDENTITY"), "V-05": SK("IDENTITY"), "V-07": SK("IDENTITY"), "V-08": SK("IDENTITY"), "V-09": SK("IDENTITY") },
    st: "Manual Review",
    ow: ["ไม่ทราบเจ้าของ", "Reject ได้ · Confirm ไม่ได้"],
    tx: "OCR อ่านเลขที่ใบแจ้งหนี้ไม่ได้ → ค้น Oracle ไม่ได้ จึงไม่มี receive_id และ Receiver · ขึ้น Manual Review (ไม่ทราบเจ้าของ) · ฝ่ายบัญชี Reject แล้วให้ผู้สแกนอัปโหลดใหม่",
  },
];

export const RULE_COLS: { step: number; title: string; ids: string[] }[] = [
  { step: 1, title: "สกัดและตรวจเอกสาร", ids: ["V-01", "V-02", "V-03", "V-06"] },
  { step: 2, title: "ค้นใบรับและลูกค้า", ids: ["V-04", "V-05"] },
  { step: 3, title: "เทียบกับใบรับ", ids: ["V-07", "V-08", "V-09"] },
];

/* ------------------------------------------------------ แท็บ 3 · สถานะเอกสาร ---- */
/** [ใคร, ประเภท s=สถานะ a=การกระทำ, ป้าย, คำย่อ, คำอธิบาย] */
export type JourneyNode = [string, "s" | "a", string, string, string];

export interface Journey {
  l: string;
  n: JourneyNode[];
}

export const JR: Journey[] = [
  {
    l: "ผ่านปกติ → ตั้งหนี้",
    n: [
      ["AIVA", "s", "Auto-pass", "ไม่มีรหัส High / Medium", "AIVA ตรวจครบ 9 กฎแล้วไม่พบรหัสข้อผิดพลาด (หรือมีเฉพาะ E04 Low) → Portal รับเป็น Auto-pass"],
      ["ฝ่ายบัญชี", "a", "Confirm", "ACC / APR", "เจ้าหน้าที่หรือหัวหน้าฝ่ายบัญชีกด Confirm · เอกสารย้ายไปหน้า AP Interface (ไม่ส่งจากหน้ารายละเอียด)"],
      ["Portal", "s", "Confirmed", "รอส่ง Batch", "สถานะ Confirmed รอหัวหน้าฝ่ายบัญชีส่ง · Unconfirm กลับเป็น Review ได้ก่อนส่ง"],
      ["หัวหน้าฝ่ายบัญชี", "a", "ส่ง Batch", "PIN + ตรวจก่อนส่ง", "Portal ตรวจซ้ำ (เอกสารซ้ำ) → ผู้ยืนยัน ≠ ผู้ส่ง → วงเงินต่อฉบับ → ยืนยัน PIN พร้อมรับรองความรับผิดชอบ"],
      ["Portal", "s", "Sent", "รอผล Import", "บันทึก Batch ID ผู้ส่ง เวลา และรายการที่ส่ง · รอผลจาก Oracle AP Interface"],
      ["Oracle", "s", "Posted", "Invoice ID AP-…", "Oracle Import สำเร็จ → Posted เป็นสถานะปิด"],
    ],
  },
  {
    l: "ผู้ใช้งานต้องแก้ไข",
    n: [
      ["AIVA", "s", "Review", "E10 หน่วยนับไม่ตรง", "รหัส E10 เป็นของผู้ใช้งาน → เอกสารขึ้นคิว “รอฉันแก้ไข” ของ Receiver พร้อมอายุเอกสาร (ไม่มีการแจ้งเตือน)"],
      ["ฝ่ายบัญชี", "a", "Confirm ถูกล็อก", "รอผู้ใช้งาน", "ฝ่ายบัญชี Confirm ไม่ได้จนกว่ารหัสของผู้ใช้งานจะหมด · ไม่มีปุ่มส่งกลับ ไม่มีสั่งตรวจซ้ำ"],
      ["End User", "a", "อัปโหลดเอกสารใหม่", "แก้ที่ต้นทางแล้วสแกนใหม่", "ผู้ใช้งานแก้ที่ต้นทาง (เช่น แก้ใบรับใน Oracle) แล้วอัปโหลดฉบับใหม่ · AIVA ตรวจเป็นเอกสารใหม่"],
      ["Portal", "s", "Superseded", "ฉบับเดิม · DR-01", "ฉบับใหม่ดีกว่าหรือเท่าเดิม → ฉบับเดิมเป็น Superseded (DR-01 / DR-02) และบันทึกลิงก์ทั้งสองฉบับ"],
      ["AIVA", "s", "Auto-pass", "ฉบับใหม่", "ฉบับใหม่ได้สถานะตามผลตรวจ — ตัวอย่างนี้ผ่านทุกกฎ"],
      ["ฝ่ายบัญชี", "s", "Confirmed", "→ AP Interface", "ฝ่ายบัญชี Confirm แล้วไปต่อที่หน้า AP Interface เหมือนเส้นทางปกติ"],
    ],
  },
  {
    l: "เอกสารซ้ำ",
    n: [
      ["Portal", "s", "Confirmed", "ฉบับเดิม", "ฉบับเดิมถูก Confirm ไปแล้ว"],
      ["ผู้สแกน", "a", "สแกนซ้ำ", "เลขที่ใบแจ้งหนี้เดิม", "มีการสแกนใบแจ้งหนี้ใบเดิมเข้ามาอีกครั้ง"],
      ["Portal", "s", "Duplicate", "ฉบับใหม่ · DR-04", "ฉบับเดิมเป็น Confirmed / Sent / Posted / Import Failed → ฉบับใหม่เป็น Duplicate ทันที ฉบับเดิมคงสถานะ"],
      ["ฝ่ายบัญชี", "a", "ตรวจและตัดสิน", "เปิดดูทั้งสองฉบับ", "ห้ามส่งเข้า AP Interface จนกว่าฝ่ายบัญชีจะตัดสิน"],
      ["หัวหน้าฝ่ายบัญชี", "s", "Confirmed", "ไม่ซ้ำ · บันทึก override", "เฉพาะหัวหน้าฝ่ายบัญชียืนยันว่าไม่ซ้ำได้ พร้อมเหตุผลและบันทึก override"],
      ["ฝ่ายบัญชี", "s", "Rejected", "หากซ้ำจริง", "อีกทางเลือก: ถ้าซ้ำจริง ACC / APR Reject ได้ → Rejected เป็นสถานะปิด"],
    ],
  },
  {
    l: "Import ไม่ผ่าน",
    n: [
      ["Portal", "s", "Sent", "ส่ง Batch แล้ว", "ส่ง Batch เข้า AP Interface แล้ว รอผลนำเข้า"],
      ["Oracle", "s", "Import Failed", "เช่น Supplier site ถูกปิด", "Oracle ปฏิเสธการนำเข้า พร้อมข้อความผิดพลาดจาก AP_INVOICES_INTERFACE"],
      ["หัวหน้าฝ่ายบัญชี", "a", "Return → Review", "ต้องมีเหตุผลและหมายเหตุ", "หัวหน้าฝ่ายบัญชีส่งกลับคิวตรวจสอบ พร้อมเหตุผลและหมายเหตุที่จำเป็น"],
      ["Portal", "s", "Review", "แก้ข้อมูลผู้ขายใน Oracle", "เอกสารกลับมาอยู่ในคิวตรวจสอบ เพื่อแก้ข้อมูลต้นทางแล้วดำเนินการต่อ"],
      ["ฝ่ายบัญชี", "s", "Confirmed", "ยืนยันใหม่", "ฝ่ายบัญชี Confirm อีกครั้ง"],
      ["Oracle", "s", "Posted", "Import สำเร็จ", "ส่ง Batch ใหม่และนำเข้าสำเร็จ → Posted"],
    ],
  },
];

export const STATE_LANES: { h: string; items: string[] }[] = [
  { h: "ผลตรวจ (Validation)", items: ["Auto-pass", "Review", "Hold", "Manual Review", "Rejected"] },
  { h: "Portal Control", items: ["Duplicate", "Superseded"] },
  { h: "AP Interface", items: ["Confirmed", "Sent", "Posted", "Import Failed"] },
];

/* ------------------------------------------------- แท็บ 4 · สิทธิ์และบทบาท ---- */
export interface RoleArchetype {
  role: Role;
  scopeDesc: string;
}

export const RO_ROLES: RoleArchetype[] = [
  { role: "EU", scopeDesc: "ขอบเขต: ตรวจรับเฉพาะรายการที่ตนเป็น Receiver" },
  { role: "ACC", scopeDesc: "ขอบเขต: ดูแลเอกสารบริษัทที่ได้รับมอบหมาย" },
  { role: "APR", scopeDesc: "ขอบเขต: อนุมัติ ตัดสิน Manual Review และส่ง AP" },
  { role: "ADM", scopeDesc: "ขอบเขต: จัดการการผูกบัญชีและสิทธิ์ในระบบ" },
  { role: "SA", scopeDesc: "ขอบเขต: ผู้ดูแลระบบสูงสุด (Super Admin)" },
];

/** [id ตัวแทนบทบาท, บทบาท] */
export const RO_USERS: [string, Role][] = RO_ROLES.map(r => [r.role.toLowerCase(), r.role]);

export const RO_NOTE: Record<Role, string> = {
  EU: "เห็นเฉพาะใบรับที่ Receiver ตรงกับ Oracle account ของคุณ และอยู่ในบริษัทที่ได้รับมอบหมาย · ไม่เห็นเอกสารที่ไม่มี Receiver · ตรวจสถานะเองและอัปโหลดเอกสารใหม่ได้เท่านั้น",
  ACC: "เห็นทุกเอกสารของบริษัทที่ได้รับมอบหมาย (ไม่มีใบรับ: ใช้บริษัทจาก Tax ID ลูกค้า) · Confirm / Review / Hold / Reject · ดู AP Interface ได้อย่างเดียว · ตัดสิน Manual Review และ Duplicate ไม่ได้",
  APR: "สิทธิ์ของเจ้าหน้าที่บัญชี + ตัดสิน Manual Review · ยืนยันว่าไม่ซ้ำ · Unconfirm · ส่ง Batch เข้า AP (ผู้ยืนยัน ≠ ผู้ส่ง · วงเงินต่อฉบับ) · ดู Audit",
  ADM: "จัดการการผูกบัญชีและสิทธิ์ · ดู Audit · ไม่เห็นเนื้อหาเอกสาร (บันทึกทุกความพยายามที่ถูกปฏิเสธ)",
  SA: "Super Admin — ดูแลระบบ จัดการสิทธิ์การใช้งาน ผูกบัญชี และเข้าถึงเครื่องมือระบบทั้งหมด",
};

/* ------------------------------------------------------- แท็บ 5 · หน้าคิว ---- */
/** [เลขที่, ผู้ขาย, สถานะ, รหัส[], ยอด, บริษัท] */
export const SAMPLE_ROWS: [string, string, string, string[], string, string][] = [
  ["IV6909245", "ABC Supply Co., Ltd.", "Auto-pass", [], "3,113.70", "AH"],
  ["TP-2610-0045", "Thai Packaging Co., Ltd.", "Hold", ["E03"], "11,235.00", "AH"],
  ["PT-2610-0071", "Precision Tools (Thailand)", "Review", ["E08"], "8,346.00", "AHT"],
  ["MR-2610-0230", "Mega Rubber Co., Ltd.", "Hold", ["E06"], "9,630.00", "AH"],
  ["SA-2610-0502", "Siam Auto Parts Co., Ltd.", "Review", ["E07"], "7,704.00", "AM"],
  ["AT-2610-0004", "Asia Tech Service Co., Ltd.", "Manual Review", [], "19,795.00", "?"],
];

/** [ป้าย, สถานะที่นับ (null = ทั้งหมด), ไอคอน, สีไอคอน, สีพื้นไอคอน] */
export const KPIS: [string, string | null, IconName, string, string][] = [
  ["ทั้งหมด", null, "layers", "var(--t-blue)", "var(--t-blue-bg)"],
  ["Auto-pass", "Auto-pass", "checkc", "var(--t-ok)", "var(--t-ok-bg)"],
  ["Review", "Review", "clock", "var(--t-warn)", "var(--t-warn-bg)"],
  ["Hold", "Hold", "pause", "var(--t-err)", "var(--t-err-bg)"],
  ["Manual Review", "Manual Review", "alert", "var(--t-vio)", "var(--t-vio-bg)"],
  ["ซ้ำ (Portal)", "Duplicate", "copy", "var(--t-org)", "var(--t-org-bg)"],
];

export const QUEUE_FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: "checkc", title: "ทุกสถานะมีป้ายและข้อความ", text: "ไม่ต้องเดาจากสี" },
  { icon: "target", title: "เปิด PDF พร้อมไฮไลต์หลักฐาน", text: "กดครั้งเดียวไปตรงจุดที่ผิด" },
  { icon: "shield", title: "เห็นเฉพาะตามสิทธิ์", text: "ตามบทบาท บริษัท และ Oracle account" },
];
