#!/usr/bin/env python3
"""Clean corrupted or poisoned Perception Cache files.

Scans ``.cache/perception/*.json`` and removes entries that:
1. Failed to parse.
2. Contain transport/network errors (ConnectError, getaddrinfo failed, timeout).
3. Emitted zero valid fields or incomplete page extractions (violates ``is_cacheable``).

Usage:
    python scripts/clean_perception_cache.py
    python scripts/clean_perception_cache.py --dry-run
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Add src to python path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

from system_a.domain.contracts import ExtractionResult
from system_a.perception.cache import is_cacheable


def clean_perception_cache(cache_dir: Path, dry_run: bool = False) -> tuple[int, int, int]:
    if not cache_dir.exists():
        print(f"Cache directory does not exist: {cache_dir}")
        return 0, 0, 0

    files = list(cache_dir.glob("*.json"))
    total = len(files)
    removed = 0
    kept = 0
    errors = 0

    print(f"Scanning {total} cache files in {cache_dir} (dry_run={dry_run})...")

    for p in files:
        is_bad = False
        reason = ""
        try:
            content = p.read_text(encoding="utf-8")
            ext = ExtractionResult.model_validate_json(content)
            if not is_cacheable(ext):
                is_bad = True
                reason = "is_cacheable=False (transport error or empty fields)"
        except Exception as e:
            is_bad = True
            reason = f"Corrupted JSON: {e}"

        if is_bad:
            removed += 1
            if not dry_run:
                try:
                    p.unlink(missing_ok=True)
                except Exception as del_err:
                    print(f"  [ERROR] Failed to delete {p.name}: {del_err}")
                    errors += 1
            if removed <= 10 or removed % 20 == 0:
                action = "[WOULD REMOVE]" if dry_run else "[REMOVED]"
                print(f"  {action} {p.name}: {reason}")
        else:
            kept += 1

    print("\n--- Cache Cleanup Summary ---")
    print(f"Total scanned: {total}")
    print(f"Removed (poisoned): {removed}")
    print(f"Kept (healthy):     {kept}")
    if errors:
        print(f"Errors:             {errors}")

    return total, removed, kept


def main() -> None:
    parser = argparse.ArgumentParser(description="Purge poisoned perception cache files.")
    parser.add_argument("--cache-dir", type=Path, default=ROOT / ".cache" / "perception",
                        help="Path to perception cache directory.")
    parser.add_argument("--dry-run", action="store_true", help="Scan without deleting.")
    args = parser.parse_args()

    clean_perception_cache(args.cache_dir, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
