"""Dump config/standards/v6.6 into the exact shape src_core.js::Std() reads (standard.json).

  python harness/dump_standard.py            # write standard.json + report the semantic diff vs the old file
  python harness/dump_standard.py --check     # report only, touch nothing (exit 1 when it drifted)

The JS port has no YAML parser, so the standard is inlined as JSON.  This is the ONLY sanctioned way to
refresh it: hand-editing standard.json is how a rules.yaml bump silently fails to reach n8n.
"""
import json
import os
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENGINE = os.path.dirname(os.path.dirname(ROOT))
VERSION = "v6.6"


def build(version: str = VERSION) -> dict:
    base = os.path.join(ENGINE, "config", "standards", version)
    rd = lambda n: yaml.safe_load(open(os.path.join(base, n), encoding="utf-8"))     # noqa: E731
    # Std() reads: raw.policy / raw.codes.codes + raw.codes.standard_version /
    # raw.rules.rules + raw.rules.ruleset_version / raw.uom_groups / raw.buyer_entity.entities
    return {
        "policy": rd("policy.yaml"),
        "codes": rd("codes.yaml"),
        "rules": rd("rules.yaml"),
        "uom_groups": rd("uom_groups.yaml"),
        # YAML gives int keys for ORG_ID; json.dump would stringify them, so normalise here that the
        # in-memory compare and the written file agree.
        "buyer_entity": {"entities": {str(k): v for k, v in rd("buyer_entity.yaml")["entities"].items()}},
        # The three decision-layer prompts, byte for byte as load_prompt() reads them.  The n8n flow has no
        # filesystem, so they ride inside standard.json; a tape replay compares them against what the engine
        # actually sent, so a stale copy fails the build instead of changing an AI answer.
        "prompts": {n: open(os.path.join(ENGINE, "config", "prompts", n + ".md"), encoding="utf-8").read()
                    for n in ("v07_match", "v05_entity", "v08_qty")},
    }


def walk(a, b, path="", out=None):
    out = [] if out is None else out
    if isinstance(a, dict) or isinstance(b, dict):
        if not (isinstance(a, dict) and isinstance(b, dict)):
            out.append((path, a, b))
            return out
        # buyer_entity.yaml keys are ints (ORG_ID) while everything else is str -> sort by text
        for k in sorted(set(a) | set(b), key=str):
            walk(a.get(k, "<absent>"), b.get(k, "<absent>"), f"{path}/{k}", out)
    elif isinstance(a, list) or isinstance(b, list):
        if not (isinstance(a, list) and isinstance(b, list) and len(a) == len(b)):
            out.append((path + "/len", len(a) if isinstance(a, list) else a,
                        len(b) if isinstance(b, list) else b))
        else:
            for i, (x, y) in enumerate(zip(a, b)):
                walk(x, y, f"{path}/{i}", out)
    elif a != b:
        out.append((path, a, b))
    return out


def main() -> int:
    check = "--check" in sys.argv
    new = build()
    path = os.path.join(ROOT, "standard.json")
    old = json.load(open(path, encoding="utf-8")) if os.path.exists(path) else None
    diffs = [] if old is None else walk(old, new)
    print("standard.json: standard_version=%s ruleset_version=%s  (%d config drift vs the file in git-untracked build)"
          % (new["codes"]["standard_version"], new["rules"]["ruleset_version"], len(diffs)))
    for p, a, b in diffs:
        print("  %-52s old=%s new=%s" % (p, json.dumps(a, ensure_ascii=False)[:70],
                                         json.dumps(b, ensure_ascii=False)[:70]))
    if check:
        print("--check: %s" % ("IN SYNC" if not diffs else "DRIFTED (run without --check)"))
        return 1 if diffs else 0
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(new, fh, ensure_ascii=False, indent=1, sort_keys=True)
        fh.write("\n")
    print("wrote %s (%d bytes)" % (path, os.path.getsize(path)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
