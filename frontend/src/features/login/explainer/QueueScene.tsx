import { useEffect, useState } from "react";
import { DEMO_COUNTS, SEV } from "../data/demo";
import { KPIS, QUEUE_FEATURES, SAMPLE_ROWS } from "../data/explainer";
import { Badge } from "../ui/Badge";
import { Icon } from "../ui/Icon";

/** ตัวเลขที่นับขึ้นจาก 0 (ease-out 900ms) · ลดการเคลื่อนไหว = แสดงค่าสุดท้ายทันที */
function CountUp({ to }: { to: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(to);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const f = (t: number) => {
      const p = Math.min(1, (t - t0) / 900);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(f);
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{v}</>;
}

/** แท็บ 5 · ตัวอย่างหน้าคิวตรวจสอบ (ภาพนิ่งพร้อมแอนิเมชันเข้า) */
export function QueueScene() {
  return (
    <>
      <div className="rq">
        <div className="tb">
          <i />
          <i />
          <i />
          <b>AIVA Portal · คิวตรวจสอบ</b>
          <span className="grow" />
          <span className="pill">ตัวอย่าง</span>
        </div>
        <div className="kp">
          {KPIS.map((k) => (
            <div className="kpi" key={k[0]}>
              <span className="k-l">{k[0]}</span>
              <span className="k-v">
                <CountUp to={k[1] ? DEMO_COUNTS[k[1]] ?? 0 : DEMO_COUNTS.total} />
              </span>
              <span className="k-i" style={{ background: k[4], color: k[3] }}>
                <Icon name={k[2]} />
              </span>
            </div>
          ))}
        </div>
        <div className="tbl-wrap">
          <table className="t">
            <thead>
              <tr>
                <th>เลขที่ใบแจ้งหนี้</th>
                <th>บริษัท</th>
                <th>ผู้ขาย</th>
                <th className="num">ยอดรวม</th>
                <th>สถานะ</th>
                <th>รหัส</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_ROWS.map((r, i) => (
                <tr key={r[0]} style={{ animationDelay: `${0.15 + i * 0.12}s` }}>
                  <td><b>{r[0]}</b></td>
                  <td><span className="co" style={{ margin: 0 }}>{r[5]}</span></td>
                  <td>{r[1]}</td>
                  <td className="num">{r[4]}</td>
                  <td><Badge status={r[2]} /></td>
                  <td>
                    {r[3].length ? (
                      r[3].map((c) => (
                        <span key={c} className={`code ${SEV[c] ?? "Medium"}`}>
                          {c}{" "}
                        </span>
                      ))
                    ) : (
                      <span className="nac">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rq-ft">
        {QUEUE_FEATURES.map((f) => (
          <div key={f.title}>
            <Icon name={f.icon} size="lg" />
            <span>
              <b>{f.title}</b>
              {f.text}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
