"""Flag port helper calls that pass more top-level arguments than the helper takes.

  python harness/check_calls.py

The helpers here take an options object last (F(c, code, rule, msg, opts), RV(msg, ids, opts),
FAIL(rule, findings, detail, data)).  A second object literal after the first is silently dropped by
JS - exactly how the V-07 installment finding lost its element_ids and the Portal got no bbox button.
"""
import glob
import io
import os
import sys

ARITY = {"F": 5, "RV": 3, "SKIP": 4, "FAIL": 4, "OK": 3, "REVIEW": 4}
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def split_top(call):
    parts, depth, cur, instr, esc = [], 0, "", None, False
    for ch in call[1:-1]:
        if instr:
            cur += ch
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == instr:
                instr = None
            continue
        if ch in "\"'":
            instr = ch
            cur += ch
            continue
        if ch in "([{":
            depth += 1
        elif ch in ")]}":
            depth -= 1
        elif ch == "," and depth == 0:
            parts.append(cur.strip())
            cur = ""
            continue
        cur += ch
    parts.append(cur.strip())
    return parts


def main():
    bad = 0
    for f in sorted(glob.glob(os.path.join(ROOT, "src_*.js"))):
        src = io.open(f, encoding="utf-8").read()
        lines = src.split("\n")
        for name, maxargs in sorted(ARITY.items()):
            pos = 0
            needle = name + "("
            while True:
                i = src.find(needle, pos)
                if i < 0:
                    break
                pos = i + 1
                if i and (src[i - 1].isalnum() or src[i - 1] in "_$."):
                    continue                      # part of a longer identifier, or obj.F(...)
                depth, k, instr, esc = 0, i + len(name), None, False
                while k < len(src):
                    ch = src[k]
                    if instr:
                        if esc:
                            esc = False
                        elif ch == "\\":
                            esc = True
                        elif ch == instr:
                            instr = None
                    elif ch in "\"'":
                        instr = ch
                    elif ch == "(":
                        depth += 1
                    elif ch == ")":
                        depth -= 1
                        if depth == 0:
                            break
                    k += 1
                parts = split_top(src[i + len(name):k + 1])
                if len(parts) > maxargs:
                    line = src[:i].count("\n") + 1
                    print("  %-18s line %-5d %s( takes %d args, got %d: %s"
                          % (os.path.basename(f), line, name, maxargs, len(parts),
                             " ".join(src[i:k + 1].split())[:120]))
                    bad += 1
    print("%d over-long call(s)" % bad)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
