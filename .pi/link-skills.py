#!/usr/bin/env python3
"""
Create the Pi -> .agent skill junction(s) in this repo.

Pi never reads `.agent/` (Antigravity's folder). Its project skill roots are
`<cwd>/.pi/skills/` and `<cwd>/.agents/skills/` (the latter walked up to the git
repo root). Rather than copying the skill files a second or third time, we make
`<project>/.pi/skills` a directory *link* straight into `<project>/.agent/skills`.
Pi and Antigravity then read the same bytes — no drift is possible.

    python .pi/link-skills.py            # link every <dir>/.agent/skills found
    python .pi/link-skills.py --check     # report status, write nothing

The link is gitignored (`.gitignore` -> `.pi/skills/`) because git on Windows
follows junctions and would stage a duplicate copy of every skill file.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent  # repo root (this file is <repo>/.pi/)


def find_agents_skills(root: Path) -> list[Path]:
    """Every <dir>/.agent/skills under the repo, skipping heavy/ignored trees."""
    prune = {".git", "node_modules", ".venv", "venv", "__pycache__", ".cache",
             "results", "temp", "dist", "build", ".next", ".pi", ".agents"}
    found: list[Path] = []
    for dirpath, dirnames, _ in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in prune and not d.startswith(".venv")]
        here = Path(dirpath)
        if here.name == ".agent" and (here / "skills").is_dir():
            found.append(here / "skills")
            dirnames[:] = []
    return sorted(found)


def make_link(agents_skills: Path, check: bool) -> tuple[str, str]:
    project = agents_skills.parent.parent          # e.g. <repo>/engine
    link = project / ".pi" / "skills"
    target = agents_skills.resolve()

    if link.is_symlink() or link.exists():
        try:
            same = link.resolve() == target
        except OSError:
            same = False
        if same:
            return ("ok", f"{link.relative_to(REPO).as_posix()} -> .agent/skills")
        return ("conflict", f"{link.relative_to(REPO).as_posix()} exists but points elsewhere")

    if check:
        return ("missing", f"{link.relative_to(REPO).as_posix()} not linked")

    link.parent.mkdir(parents=True, exist_ok=True)
    created = False
    try:
        if os.name == "nt":
            # A directory *junction* needs no privilege and no dev mode; a real
            # symlink would raise WinError 1314 for unprivileged users.
            try:
                import _winapi  # CPython internal: CreateJunction(src, dst)

                _winapi.CreateJunction(str(target), str(link))
            except (ImportError, OSError):
                subprocess.run(
                    f'cmd /c mklink /J "{link}" "{target}"',
                    shell=True, check=True, capture_output=True,
                )
        else:
            link.symlink_to(os.path.relpath(target, link.parent), target_is_directory=True)
        created = link.resolve() == target
    except (OSError, subprocess.CalledProcessError) as exc:
        detail = getattr(exc, "stderr", b"").decode(errors="ignore").strip() or str(exc)
        if created is False and link.parent.is_dir() and not any(link.parent.iterdir()):
            link.parent.rmdir()  # undo the empty .pi/ we just made
        return ("error", f"{link.relative_to(REPO).as_posix()}: {detail}")
    if not created:
        return ("error", f"{link.relative_to(REPO).as_posix()}: link created but does not resolve to target")
    return ("created", f"{link.relative_to(REPO).as_posix()} -> {agents_skills.relative_to(REPO).as_posix()}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="report status, create nothing")
    args = ap.parse_args()

    sources = find_agents_skills(REPO)
    if not sources:
        print(f"no .agent/skills found under {REPO}", file=sys.stderr)
        return 2

    counts: dict[str, int] = {}
    for src in sources:
        status, msg = make_link(src, args.check)
        counts[status] = counts.get(status, 0) + 1
        print(f"  [{status:>8}] {msg}")

    print(f"\n{len(sources)} Antigravity skill folder(s) -> Pi project skill root")
    if counts.get("conflict") or counts.get("error"):
        print("resolve the conflicts above; nothing was overwritten.", file=sys.stderr)
        return 1
    if counts.get("missing"):
        print("run without --check to create the links")
        return 1
    print("reload Pi with /reload")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
