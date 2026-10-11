import type { AlertState } from "./useLogin";
import { Icon } from "./ui/Icon";

/** กล่องแจ้งผล: ไอคอน + หัวข้อ + คำอธิบาย + ทางไปต่อ (ไม่พึ่งสีอย่างเดียว · NFR-007) */
export function LoginAlert({ alert }: { alert: AlertState | null }) {
  if (!alert) return <div className="lg-alert" id="lgAlert" role="alert" aria-live="assertive" hidden />;
  return (
    <div
      key={alert.shake}
      className={`lg-alert ${alert.kind} ${alert.shake ? "shake" : ""}`}
      id="lgAlert"
      role="alert"
      aria-live="assertive"
    >
      <Icon name={alert.kind === "ok" ? "checkc" : alert.kind === "info" ? "info" : "alert"} size="lg" />
      <div>
        <b>{alert.title}</b>
        {alert.message}
        {alert.actions.length > 0 && (
          <div className="acts">
            {alert.actions.map((a) => (
              <button key={a.label} type="button" onClick={a.run}>
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
