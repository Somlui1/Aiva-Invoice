import type { ProgressState } from "./useLogin";

/** แถบความคืบหน้าบนสุดของหน้าจอ (ความรู้สึกเหมือนเบราว์เซอร์โหลดหน้า) · แดงเมื่อล้มเหลว */
export function ProgressBar({ p }: { p: ProgressState }) {
  return (
    <div
      className={`lg-bar ${p.error ? "err" : ""}`}
      aria-hidden="true"
      style={{
        width: `${p.width}%`,
        opacity: p.visible ? 1 : 0,
        transition: `width ${p.ms}ms cubic-bezier(.2,.8,.2,1),opacity .3s`,
      }}
    />
  );
}
