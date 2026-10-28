"""Every Thai message the engine can emit must exist verbatim in the JS port.

  python harness/test_rule_text_parity.py        # exit 0 = no message is missing from the port

Why this exists: the parity fixtures can only prove the branches they reach, so a Thai literal in a rule
branch that no fixture exercises is invisible to the hash.  That is exactly how the v5.7 port could have
shipped a hand-typed review message with one wrong vowel ("ถิงเพดาน" instead of "ถึงเพดาน") — the hash
would have stayed green because no document in the corpus hits that branch.

Method: tokenize the engine sources, keep every string literal that (a) contains Thai, (b) is not a raw
string (regex) and (c) is not a docstring, split it on f-string placeholders, and require each remaining
fragment to appear somewhere in the port.  Add a KNOWN_OK entry, with a reason, only when the port really
cannot reach that text.
"""
import io
import os
import sys
import tokenize

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ENGINE = os.path.dirname(os.path.dirname(ROOT))

PY = ["src/system_a/domain/rules.py", "src/system_a/domain/v08.py", "src/system_a/domain/matching.py",
      "src/system_a/domain/normalize.py", "src/system_a/domain/evidence.py",
      "src/system_a/application/assembler.py", "src/system_a/application/orchestrator.py",
      "src/system_a/application/invoice_keys.py", "src/system_a/application/oracle_lookup.py"]
JS = ["src_core.js", "src_normalize.js", "src_extract.js", "src_oracle_sql.js", "src_oracle_lookup.js",
      "src_invoice_keys.js", "src_evidence.js", "src_matching.js", "src_rules.js", "src_rules3.js",
      "src_assemble.js", "src_orchestrate.js"]

# Escaped on purpose: retyping Thai here is how a wrong vowel would sneak into the test itself.
V05_AI = "AI \u0e44\u0e21\u0e48\u0e21\u0e31\u0e48\u0e19\u0e43\u0e08\u0e40\u0e23\u0e37\u0e48\u0e2d\u0e07"   # "AI not confident about"
KNOWN_OK = {
    V05_AI: "V-05 entity-AI judge is unported: src_rules.js throws PortPending before that branch",
}
# matched as a prefix, because these literals are f-strings split around {expr}
KNOWN_PREFIX = dict(KNOWN_OK)


def has_thai(s):
    return any(u"\u0e00" <= c <= u"\u0e7f" for c in s)


def split_fstring(body):
    """The literal pieces of an f-string, i.e. the text with {expr} placeholders removed."""
    parts, piece, depth, i = [], "", 0, 0
    while i < len(body):
        ch = body[i]
        if depth == 0 and ch == "{":
            if body[i:i + 2] == "{{":                                  # escaped brace
                piece += "{"
                i += 2
                continue
            depth = 1
            if has_thai(piece):
                parts.append(piece)
            piece = ""
        elif depth and ch == "{":
            depth += 1
        elif depth and ch == "}":
            depth -= 1
            if depth == 0:
                piece = ""
        elif depth == 0:
            piece += ch
        i += 1
    if has_thai(piece):
        parts.append(piece)
    return parts


def literals(path):
    """Message literals of one Python file (no regexes, no docstrings)."""
    out, prev = [], None
    with tokenize.open(path) as fh:
        for tok in tokenize.generate_tokens(fh.readline):
            starts_statement = (prev is None or prev.type in
                                (tokenize.NEWLINE, tokenize.NL, tokenize.INDENT, tokenize.DEDENT,
                                 tokenize.ENCODING)
                                or (prev.type == tokenize.OP and prev.string == ":"))
            if tok.type != tokenize.STRING:
                if tok.type not in (tokenize.NL, tokenize.NEWLINE, tokenize.INDENT, tokenize.DEDENT,
                                    tokenize.COMMENT, tokenize.ENCODING):
                    prev = tok
                continue
            is_docstring = starts_statement
            prev = tok
            if is_docstring:
                continue
            raw, prefix = tok.string, ""
            while raw and raw[0] not in ("'", '"'):
                prefix += raw[0]
                raw = raw[1:]
            if "r" in prefix.lower() or "\n" in raw:      # raw = regex, multi-line = docstring/comment block
                continue
            body = raw
            for q in ('"""', "'''", '"', "'"):
                if body.startswith(q) and body.endswith(q) and len(body) >= 2 * len(q):
                    body = body[len(q):-len(q)]
                    break
            if has_thai(body):
                out.append(body)
    return out


def main():
    port = "".join(io.open(os.path.join(ROOT, f), encoding="utf-8").read() for f in JS)
    missing, checked = [], 0
    for rel in PY:
        path = os.path.join(ENGINE, rel)
        if not os.path.exists(path):
            print("skip (engine file gone): %s" % rel)
            continue
        for body in literals(path):
            for frag in split_fstring(body):
                checked += 1
                if frag in port:
                    continue
                if any(frag.startswith(p) for p in KNOWN_PREFIX):
                    continue
                missing.append((rel, frag))
    for rel, frag in missing:
        print("MISSING in port  %s: %r" % (rel, frag[:120]))
    print("%d Thai message fragments checked, %d missing" % (checked, len(missing)))
    if missing:
        print("\nEither port the message, or — only if the port genuinely cannot reach that text — add it to\n"
              "KNOWN_OK above with the reason (a fixture or a hand review of the rendered text).")
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
