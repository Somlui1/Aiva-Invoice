import type { KeyboardEvent, ReactNode } from "react";
import { WF, WF_EDGES, WF_POS } from "../data/explainer";
import { Icon } from "../ui/Icon";
import { ChipView } from "./ChipView";
import { Vis1, Vis2, Vis3, Vis4, Vis5, Vis6 } from "./visuals";

interface Props {
  step: number;
  onNode: (i: number) => void;
}

const VIS = (i: number, active: boolean): ReactNode =>
  [<Vis1 key={0} />, <Vis2 key={1} />, <Vis3 key={2} />, <Vis4 key={3} />, <Vis5 key={4} active={active} />, <Vis6 key={5} />][i];

/** แท็บ 1 · กระบวนการทั้งหมด (6 ขั้น เรียงเป็นตัว U) + รายละเอียดขั้นที่เลือก */
export function FlowScene({ step, onNode }: Props) {
  const s = WF[step];
  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onNode(i);
    }
  };
  return (
    <>
      <div className="wf">
        {WF.map((w, i) => (
          <div
            key={w.t}
            className={`wf-step ${w.fin ? "fin" : ""} ${i === step ? "on" : ""} ${i < step ? "done" : ""}`}
            style={{ gridRow: WF_POS[i][0], gridColumn: WF_POS[i][1] }}
            tabIndex={0}
            role="button"
            aria-label={`ขั้นที่ ${i + 1} ${w.t}`}
            onClick={() => onNode(i)}
            onKeyDown={(e) => onKey(e, i)}
          >
            <div className="wf-lbl" title={w.t}>
              <b>{i + 1}.</b>
              {w.t}
            </div>
            <div className="wf-node">{VIS(i, i === step && i === 4)}</div>
          </div>
        ))}
        {WF_EDGES.map((e, k) => (
          <div
            key={k}
            className={`wf-e ${e[2]} ${e[3]} ${k + 1 === step ? "on" : ""} ${k + 1 < step ? "done" : ""}`}
            style={{ gridRow: e[0], gridColumn: e[1] }}
            aria-hidden="true"
          >
            <div className="ln">
              <i />
              <i />
              <i />
            </div>
          </div>
        ))}
      </div>

      <div className="wf-det sw" key={step}>
        <div className="dhd">
          <span className="rchip" style={{ fontSize: 11 }}>ขั้นที่ {step + 1}/{WF.length}</span>
          <h3>{s.t}</h3>
          <span className="who">
            <Icon name="user" size="sm" />
            {s.who}
          </span>
        </div>
        <div className="gr">
          <div>
            <ul>
              {s.do.map((x) => (
                <li key={x}>
                  <Icon name="checkc" size="sm" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
            {s.chips.length > 0 && (
              <div className="chips">
                {s.chips.map((c, i) => (
                  <ChipView key={i} chip={c} />
                ))}
              </div>
            )}
          </div>
          <div className="io">
            <div>
              <b>ข้อมูลเข้า</b>
              {s.inp}
            </div>
            <div>
              <b>ข้อมูลออก</b>
              {s.out}
            </div>
          </div>
        </div>
        <div className="nt">
          <Icon name="info" size="sm" />
          <span>{s.note}</span>
        </div>
      </div>
    </>
  );
}
