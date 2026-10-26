import { ICONS, type IconName } from "./icons";
import { PRISM_ICONS } from "../../../components/common/prismIcons";

interface Props {
  name: IconName;
  /** sm = 14px · lg = 18px · ไม่ใส่ = 16px */
  size?: "sm" | "lg";
  className?: string;
}

/** ไอคอนเส้น 24×24 (Lucide-style) · path เดียวกับ mockup */
export function Icon({ name, size, className }: Props) {
  return (
    <svg
      className={["ico", size, className].filter(Boolean).join(" ")}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {PRISM_ICONS[name] ? (
        <>
          {PRISM_ICONS[name][1] ? <path className="f" d={PRISM_ICONS[name][1]} /> : null}
          <path d={PRISM_ICONS[name][0]} />
          {PRISM_ICONS[name][2] ? <path className="a" d={PRISM_ICONS[name][2]} /> : null}
        </>
      ) : (
        <path d={ICONS[name]} />
      )}
    </svg>
  );
}
