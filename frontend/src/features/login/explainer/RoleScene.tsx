import { useMemo } from "react";
import { scopeCheck, whyShort, fmtBaht } from "../data/access";
import { APR_POST_MAX, DEMO_DOCS, PERM, ROLES, USERS } from "../data/demo";
import { RO_NOTE, RO_USERS } from "../data/explainer";
import { Badge } from "../ui/Badge";
import { Icon } from "../ui/Icon";

interface Props {
  ri: number;
  onRole: (i: number) => void;
}

/** แท็บ 4 · เลือกบทบาท → เห็นเอกสารที่ “เห็นได้” และสิทธิ์ที่ทำได้ */
export function RoleScene({ ri, onRole }: Props) {
  const [uid, role] = RO_USERS[ri];
  const user = USERS.find((u) => u.id === uid)!;
  const rows = useMemo(() => DEMO_DOCS.map((d) => ({ d, r: scopeCheck(d, user) })), [user]);
  const visible = rows.filter((x) => x.r.ok).length;
  const perms = Object.keys(PERM);
  const have = perms.filter((k) => ROLES[role].p.includes(k)).length;

  return (
    <>
      <div className="ro-sel">
        {RO_USERS.map(([id, r], i) => {
          const u = USERS.find((x) => x.id === id)!;
          return (
            <button key={id} type="button" className={`ro-b ${i === ri ? "on" : ""}`} aria-pressed={i === ri} onClick={() => onRole(i)}>
              <b>{ROLES[r].n}</b>
              <span>
                {u.n} · {u.co.join(", ") || "—"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="ro-grid">
        <div>
          <div className="ro-h">
            <h5>เอกสารที่ “เห็น” ในคิว</h5>
            <span>
              เห็น <b>{visible}</b> / {rows.length}
            </span>
          </div>
          <div>
            {rows.map(({ d, r }) => (
              <div className={`ro-r ${r.ok ? "show" : "hid"}`} key={d.doc}>
                <b>{d.inv}</b>
                <span className="co">{d.company}</span>
                <div className="rw">
                  <span className="rcv">
                    {d.receiver ?? <i style={{ color: "var(--org)", fontStyle: "normal", fontWeight: 700 }}>ไม่มี Receiver</i>}
                  </span>
                  <span className="why">{r.ok ? "" : whyShort(r.why)}</span>
                </div>
                <Badge status={d.status} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="ro-h">
            <h5>สิทธิ์ที่ทำได้</h5>
            <span>
              {have} / {perms.length} สิทธิ์
            </span>
          </div>
          <div className="ro-perm">
            {perms.map((k) => (
              <span className={`ro-p ${ROLES[role].p.includes(k) ? "on" : ""}`} key={k}>
                {PERM[k]}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="ro-nt sw" key={ri}>
        <Icon name={role === "ADM" ? "lock" : "shield"} />
        <span>
          {RO_NOTE[role]}
          {role === "APR" ? ` · ปัจจุบัน ≤ ${fmtBaht(APR_POST_MAX)} ฿` : ""}
        </span>
      </div>
    </>
  );
}
