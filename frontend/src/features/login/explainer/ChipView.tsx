import { SEV } from "../data/demo";
import type { Chip } from "../data/explainer";
import { Badge } from "../ui/Badge";

export function ChipView({ chip }: { chip: Chip }) {
  if (chip.k === "rule") return <span className="rchip">{chip.id}</span>;
  if (chip.k === "exc") return <span className={`code ${SEV[chip.code] ?? "Medium"}`}>{chip.code}</span>;
  return <Badge status={chip.status} />;
}
