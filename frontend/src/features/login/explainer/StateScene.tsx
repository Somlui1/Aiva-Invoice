import { Fragment, useEffect, useRef } from "react";
import { JR, STATE_LANES } from "../data/explainer";
import { Badge } from "../ui/Badge";
import { Icon } from "../ui/Icon";

interface Props {
  jr: number;
  js: number;
  onJourney: (i: number) => void;
}

/** แท็บ 3 · เส้นทางของเอกสารระหว่างสถานะ (เลือกเส้นทางได้ 4 แบบ) */
export function StateScene({ jr, js, onJourney }: Props) {
  const j = JR[jr];
  const strip = useRef<HTMLDivElement>(null);

  // เลื่อนแถบให้โหนดที่กำลังเล่นอยู่ในมุมมอง (ปิดเมื่อผู้ใช้ลดการเคลื่อนไหว)
  useEffect(() => {
    const on = strip.current?.querySelector<HTMLElement>(".st-n.on");
    if (!on || !strip.current) return;
    if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    strip.current.scrollTo({ left: on.offsetLeft - 60, behavior: "smooth" });
  }, [jr, js]);

  return (
    <>
      <div className="st-jr">
        <span className="lab">เส้นทาง</span>
        {JR.map((x, i) => (
          <button key={x.l} type="button" className={`chip ${i === jr ? "on" : ""}`} aria-pressed={i === jr} onClick={() => onJourney(i)}>
            {x.l}
          </button>
        ))}
      </div>

      <div className="st-strip" ref={strip}>
        {j.n.map((s, i) => (
          <Fragment key={`${jr}-${i}`}>
            {i > 0 && <span className={`st-c ${i === js ? "on" : ""} ${i < js ? "done" : ""}`} />}
            <div className={`st-n ${i === js ? "on" : ""} ${i < js ? "done" : ""}`}>
              <span className="who">{s[0]}</span>
              {s[1] === "s" ? <Badge status={s[2]} /> : <span className="act">{s[2]}</span>}
              <span className="sub">{s[3]}</span>
            </div>
          </Fragment>
        ))}
      </div>

      <div className="st-cap sw" key={`${jr}-${js}`}>
        <span className="n">{js + 1}</span>
        <div>
          <b>
            {j.n[js][0]} · {j.n[js][2]}
          </b>
          <p>{j.n[js][4]}</p>
        </div>
      </div>

      <div className="st-lane">
        {STATE_LANES.map((l) => (
          <div key={l.h}>
            <h6>{l.h}</h6>
            <div className="bs">
              {l.items.map((s) => (
                <Badge key={s} status={s} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="st-rk">
        <Icon name="info" size="sm" />
        ลำดับเทียบเมื่อพบเอกสารซ้ำ: Auto-pass &gt; Review &gt; Hold &gt; Manual Review · สถานะเดียวกัน = เท่าเดิม
      </div>
    </>
  );
}
