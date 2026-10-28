"""One secret scrubber/scanner for every artifact this folder writes.

Why this exists (measured, not theoretical): the first version of `export_workflow.py` redacted by DICT KEY
name. n8n stores node 00's config as `{name: "paperless_token", value: "09cbb3…"}` — the key is `value`, so
the paperless token and the LLM key went out in `workflow_…_v5.9_draft.json` and the check printed
"leak hits: NONE" because its own list came from port_config, which never held those two. A self-consistent
check against a too-small list is how a leak gets certified clean.

So the rule here is:

  * scrub by SECRET-LOOKING NAME  (assignment `name`/`label`, not the dict key),
  * scrub by VALUE SHAPE          (`sk-…`, `eyJ…` JWTs, `n8n_…`, 40-hex, bearer tokens, the oracle URL),
  * scrub by KNOWN VALUE          (every long string in n8n_nodes/port_config*.json),
  * and SCAN with the same rules, so "no secrets" is decided by shape + names, not by one config file.

Use:  from secret_guard import scrub, scan
"""
import io
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NAME_HINTS = ('token', 'key', 'secret', 'password', 'api_key', 'apikey', 'authorization', 'credential',
              'url', 'passwd', 'bearer')
NAME_KEYS = ('name', 'label', 'id', 'parameterName', 'key')

VALUE_PATTERNS = [
    re.compile(r'\bsk-[A-Za-z0-9_-]{8,}'),                       # LLM keys
    re.compile(r'\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}'),   # JWTs (Keycloak/ORDS bearer)
    re.compile(r'\bn8n_[A-Za-z0-9]{10,}'),                       # n8n api keys
    re.compile(r'\b[0-9a-f]{40}\b'),                             # paperless api tokens
    re.compile(r'(?i)\bBearer\s+[A-Za-z0-9._\-]{10,}'),
    re.compile(r'https?://[^\s"\']*(?:ords|8080/mcp|/mcp)\b[^\s"\']*'),
]
PLACEHOLDER = re.compile(r'<<[A-Z0-9_]+>>')


def known_values():
    vals = set()
    for name in ('port_config.json', 'port_config.local.json', 'port_config.example.json'):
        fp = os.path.join(ROOT, 'n8n_nodes', name)
        if os.path.exists(fp):
            for v in json.load(io.open(fp, encoding='utf-8')).values():
                if isinstance(v, str) and len(v) >= 8 and not PLACEHOLDER.fullmatch(v.strip()):
                    vals.add(v)      # a template placeholder is not a secret; keeping it in the list makes
                                     # every honest artifact look leaking (and trains people to ignore the scan)
    return vals


KNOWN = known_values()
PLACEHOLDER_TEXT = '<<REDACTED>>'


def _looks_secret_text(s):
    return any(p.search(s) for p in VALUE_PATTERNS)


def _scrub_text(s):
    for v in KNOWN:
        if v in s:
            s = s.replace(v, PLACEHOLDER_TEXT)
    for p in VALUE_PATTERNS:
        s = p.sub(PLACEHOLDER_TEXT, s)
    return s


def scrub(obj, key_hint=None):
    """Redact by name (assignment names included) and by value shape, anywhere in the tree."""
    if isinstance(obj, dict):
        hint = key_hint
        for k in NAME_KEYS:                                  # {"name": "paperless_token", "value": "…"}
            v = obj.get(k)
            if isinstance(v, str) and any(h in v.lower() for h in NAME_HINTS):
                hint = v
                break
        out = {}
        for k, v in obj.items():
            named = (k in NAME_HINTS) or any(h in str(k).lower() for h in NAME_HINTS)
            hint_secret = bool(hint) and any(h in hint.lower() for h in NAME_HINTS)
            if isinstance(v, str):
                if named or hint_secret:
                    out[k] = PLACEHOLDER_TEXT if len(v) >= 8 else v      # the field ITSELF is a credential
                elif v in KNOWN:
                    out[k] = PLACEHOLDER_TEXT
                elif _looks_secret_text(v):
                    out[k] = _scrub_text(v)   # a credential INSIDE code/text: drop the credential, keep the code.
                    # Replacing the whole string looked safer and was wrong: node 21's jsCode contains the ORDS
                    # bearer token, and blanking 314 KB of code made the "verified" rollback artifact useless.
                else:
                    out[k] = v
            elif isinstance(v, (dict, list)):
                out[k] = scrub(v, key_hint=(v.get('name') if isinstance(v, dict) else key_hint))
            else:
                out[k] = v
        return out
    if isinstance(obj, list):
        return [scrub(v, key_hint if isinstance(v, (dict, list)) else None) for v in obj]
    if isinstance(obj, str):
        if obj in KNOWN:
            return PLACEHOLDER_TEXT
        return _scrub_text(obj) if _looks_secret_text(obj) else obj
    return obj


def scan(text):
    """Everything that still looks like a credential, plus the config-file values, in one honest list."""
    hits = []
    for v in KNOWN:
        if v in text:
            hits.append('known-value:' + v[:10] + '…')
    for p in VALUE_PATTERNS:
        for mm in p.findall(text)[:3]:
            s = mm if isinstance(mm, str) else str(mm)
            if not PLACEHOLDER.search(s):
                hits.append(p.pattern[:18] + ':' + s[:14] + '…')
    return sorted(set(hits))


def scrub_file(path, write=True):
    data = json.load(io.open(path, encoding='utf-8'))
    clean = scrub(data)
    if write:
        io.open(path, 'w', encoding='utf-8', newline='\n').write(json.dumps(clean, indent=1))
    return clean
