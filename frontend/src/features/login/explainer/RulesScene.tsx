import { useEffect, useState, type MutableRefObject } from "react";
import { RNAME, RSCN, RSEQ, RULE_COLS } from "../data/explainer";
import { Badge } from "../ui/Badge";
import { Icon } from "../ui/Icon";
import type { IconName } from "../ui/icons";

interface Props {
  scn: number;
  /** เปลี่ยนค่าเพื่อเล่นฉากเดิมซ้ำ (เช่น เปิดเล่นอัตโนมัติ) */
  nonce: number;
  autoRef: MutableRefObject<boolean>;
  holdRef: MutableRefObject<boolean>;
  onPick: (i: number) => void;
  onNext: () => void;
}

type RowState = { cls: string; icon?: IconName; em?: string; title?: string };

const T = 240; // ms ต่อกฎ (~2x faster)

/** แท็บ 2 · ตรวจกฎทีละข้อ (V-01…V-09) ตามตัวอย่างที่เลือก */
export function RulesScene({ scn, nonce, autoRef, holdRef, onPick, onNext }: Props) {
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [done, setDone] = useState(false);
  const sc = RSCN[scn];

  useEffect(() => {
    setRows({});
    setDone(false);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (f: () => void, ms: number) => timers.push(setTimeout(f, ms));

    RSEQ.forEach((id, i) => {
      const r = sc.rs[id] ?? (["pass"] as const);
      later(() => setRows((p) => ({ ...p, [id]: { cls: "run" } })), i * T);
      later(() => {
        const k = r[0];
        const icon: IconName = k === "pass" ? "check" : k === "skip" ? "minus" : k === "mr" ? "alert" : k === "high" ? "x" : "alert";
        const em = k === "pass" ? "ผ่าน" : k === "skip" ? "ข้าม" : (r as [string, string])[1];
        setRows((p) => ({
          ...p,
          [id]: {
            cls: k + (k === "med" || k === "high" ? " hit" : ""),
            icon,
            em,
            title: k === "skip" ? `ไม่ได้ประเมิน · หยุดที่ ${(r as [string, string])[1]}` : undefined,
          },
        }));
      }, i * T + 170);
    });

    later(() => {
      setDone(true);
      if (!autoRef.current) return;
      const wait = () => {
        if (!autoRef.current) return;
        if (holdRef.current || document.hidden) {
          timers.push(setTimeout(wait, 400));
          return;
        }
        onNext();
      };
      timers.push(setTimeout(wait, 1800));
    }, RSEQ.length * T + 100);

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scn, nonce]);

  return (
    <>
      <div className="rl-scn">
        <span className="lab">ลองดูผลจาก</span>
        {RSCN.map((s, i) => (
          <button key={s.l} type="button" className={`chip ${i === scn ? "on" : ""}`} aria-pressed={i === scn} onClick={() => onPick(i)}>
            {s.l}
          </button>
        ))}
      </div>

      <div className="rl-cols">
        {RULE_COLS.map((c) => (
          <div className="rl-col" key={c.step}>
            <h5>
              STEP {c.step}
              <span>{c.title}</span>
            </h5>
            {c.ids.map((id) => {
              const r = rows[id];
              return (
                <div className={`rrow ${r?.cls ?? ""}`} key={id} title={r?.title}>
                  <span className="d">{r?.icon && <Icon name={r.icon} />}</span>
                  <div>
                    <b>{id}</b>
                    <span className="n">{RNAME[id]}</span>
                  </div>
                  <em>{r?.em ?? ""}</em>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {done ? (
        <div className="rl-res sw" key={`done-${scn}-${nonce}`}>
          <div>
            <div className="k">ผลตัดสิน</div>
            <Badge status={sc.st} />
          </div>
          <div>
            <div className="tx">{sc.tx}</div>
            <div className="ow">
              {sc.ow.map((o) => (
                <span className="pill" key={o}>
                  <Icon name="user" size="sm" />
                  {o}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rl-res">
          <div>
            <div className="k">ผลตัดสิน</div>
            <span className="badge st-Manual" style={{ opacity: 0.35 }}>
              <i />
              กำลังตรวจ…
            </span>
          </div>
          <div className="tx" style={{ color: "var(--s-400)" }}>
            AIVA กำลังตรวจทีละกฎ…
          </div>
        </div>
      )}
    </>
  );
}
