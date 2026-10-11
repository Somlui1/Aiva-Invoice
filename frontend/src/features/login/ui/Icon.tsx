import { ICONS, type IconName } from "./icons";

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
      <path d={ICONS[name]} />
    </svg>
  );
}
