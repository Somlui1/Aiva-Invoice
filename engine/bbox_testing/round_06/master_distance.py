"""How far is a checksum-rejected customer tax id from a real one?

If the delivered value differs from a master id by exactly one digit, the checksum rule is catching an OCR
mis-read of a buyer the system already knows.  If it is far from every master id, the value is a fabrication or
a mis-read of something else on the page, which is a different problem worth separating.
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "src"))
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):
    pass

from system_a.domain.normalize import Invalid, tax_id
from system_a.domain.standard import load_standard

std = load_standard()
master = sorted({(e.get("tax_id") or "").replace("-", "").replace(" ", "")
                 for e in std.entities.values() if e.get("tax_id")})

broken = []
for m in master:
    try:
        tax_id(m)
    except Invalid as e:
        broken.append((m, str(e)))
print(f"master ids in the standard: {len(master)} | master ids that fail the checksum themselves: {len(broken)} {broken[:3]}")


def distance(a, b):
    return sum(1 for x, y in zip(a, b) if x != y) if len(a) == len(b) else 99


rows = json.loads((HERE / "v05_coverage.json").read_text(encoding="utf-8"))
seen: dict[int, list] = {}
for r in rows:
    for field, (value, why) in r["delivered"].items():
        if field != "customer_tax_id" or why != "TAX_ID_CHECKSUM":
            continue
        clean = (value or "").replace("-", "").replace(" ", "")
        seen.setdefault(r["doc"], []).append((clean, [m for m in master if distance(clean, m) == 1]))

near = far = 0
for did, items in sorted(seen.items()):
    for clean, hits in items:
        tag = f"one digit away from master {hits[0]}" if hits else "no master id at distance 1"
        near += 1 if hits else 0
        far += 0 if hits else 1
        print(f"  DMS-{did:<4} delivered {clean}  ->  {tag}")
print(f"\nchecksum-rejected customer ids: {near} sit one digit from a real master id, {far} do not")
