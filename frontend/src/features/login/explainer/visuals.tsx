import { useEffect, useState } from "react";
import { Badge } from "../ui/Badge";

/** เครื่องหมายถูก (ใช้ในภาพประกอบ) */
const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/** ขั้น 1 · สแกนเข้า DMS */
export const Vis1 = () => (
  <div className="vis v1">
    <div className="pp p1">
      <span>ใบแจ้งหนี้</span>
      <i className="l" />
      <i className="s" />
      <i className="m" />
      <i className="l" />
    </div>
    <div className="pp p2 b">
      <span>ใบส่งของ</span>
      <i className="m" />
      <i className="l" />
      <i className="s" />
      <i className="m" />
    </div>
    <div className="pp p3 c">
      <span>เงื่อนไข</span>
      <i className="s" />
      <i className="l" />
      <i className="m" />
    </div>
    <span className="fmt" style={{ left: 52 }}>สแกน</span>
    <span className="fmt" style={{ left: 118 }}>PDF</span>
  </div>
);

/** ขั้น 2 · AIVA อ่านและตรวจเอกสาร */
export const Vis2 = () => (
  <div className="vis v2">
    <div className="doc">
      <i className="hot" />
      <i />
      <i />
      <i className="hot" />
      <i />
      <i className="hot" />
      <b className="laser" />
    </div>
    <span className="tgp t1">เลขที่ใบแจ้งหนี้</span>
    <span className="tgp t2">Tax ID ผู้ขาย</span>
    <span className="tgp t3">ยอดรวม · VAT</span>
  </div>
);

/** ขั้น 3 · ค้นใบรับใน Oracle */
export const Vis3 = () => (
  <div className="vis v3">
    <span className="ring" />
    <svg className="cy" viewBox="0 0 44 58" aria-hidden="true">
      <path d="M1 9V49A21 7 0 0 0 43 49V9Z" fill="#295F98" />
      <path d="M1 22A21 7 0 0 0 43 22M1 35A21 7 0 0 0 43 35" fill="none" stroke="rgba(255,255,255,.32)" />
      <ellipse cx="22" cy="9" rx="21" ry="7" fill="#3E78B5" />
    </svg>
    <span className="key">ค้นด้วย Tax ID + Invoice</span>
    <div className="rec">
      <b>RCV530340001</b>
      <span>Receiver · ORG_ID → บริษัท</span>
    </div>
  </div>
);

/** ขั้น 4 · เทียบกับใบรับ */
export const Vis4 = () => (
  <div className="vis v4">
    <div className="cd a">
      <h6>ใบแจ้งหนี้</h6>
      <p><span>จำนวน</span><span>3</span></p>
      <p><span>ราคา</span><span>130.00</span></p>
      <p><span>ยอด</span><span>390.00</span></p>
    </div>
    <div className="mk">
      <i><Check /></i>
      <i><Check /></i>
      <i><Check /></i>
    </div>
    <div className="cd b">
      <h6>ใบรับ (Oracle)</h6>
      <p><span>จำนวน</span><span>3</span></p>
      <p><span>ราคา</span><span>130.00</span></p>
      <p><span>ยอด</span><span>390.00</span></p>
    </div>
    <div className="sum">บรรทัดตรง · ยอดรวมเท่ากัน</div>
  </div>
);

/** ขั้น 5 · ตัดสินผลและแจกงาน · active = ขั้นนี้ถูกเลือก → ป้ายสถานะไล่ไฮไลต์ทีละอัน */
export function Vis5({ active }: { active: boolean }) {
  const [k, setK] = useState(0);
  useEffect(() => {
    if (!active) return;
    setK(0);
    const t = setInterval(() => setK((x) => x + 1), 650);
    return () => clearInterval(t);
  }, [active]);
  const h = (i: number) => (active && k % 4 === i ? "h" : "");
  return (
    <div className="vis v5">
      <div className="bg" style={{ left: 6, top: 6, gap: 6 }}>
        <Badge status="Auto-pass" className={h(0)} />
        <Badge status="Review" className={h(1)} />
      </div>
      <div className="bg" style={{ left: 6, top: 34, gap: 6 }}>
        <Badge status="Hold" className={h(2)} />
        <Badge status="Manual Review" className={h(3)} />
      </div>
      <span className="ro e">→ ผู้ใช้งานแก้</span>
      <span className="ro a">→ ฝ่ายบัญชีตัดสิน</span>
      <div className="dr">Portal ตรวจซ้ำ · DR-01…07</div>
    </div>
  );
}

/** ขั้น 6 · ส่งเข้า AP Interface */
export const Vis6 = () => (
  <div className="vis v6">
    <div className="fd" />
    <div className="ck"><Check /></div>
    <div className="st s1"><Badge status="Confirmed" /></div>
    <div className="st s2"><Badge status="Sent" /></div>
    <div className="st s3"><Badge status="Posted" /></div>
  </div>
);
