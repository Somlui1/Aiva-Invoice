/** ป้ายสถานะเอกสาร · ใช้ทั้งข้อความและไอคอนจุด (ไม่พึ่งสีอย่างเดียว) */
export function Badge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={["badge", `st-${status.split(" ")[0]}`, className].filter(Boolean).join(" ")}>
      <i />
      {status}
    </span>
  );
}
