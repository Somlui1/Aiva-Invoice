#!/usr/bin/env python3
"""Push ผลรันของ System A (test result) เข้า AIVA Portal ผ่าน `POST /api/engine/ingest`.

ค่าเริ่มต้นคือผลรัน **v5.7** — `engine/results/run_20261026_144747_v5.7/`
(200 ไฟล์ `DMS-*_result.json`; `summary.json` เป็นดัชนีของ Engine จึงถูกข้ามอยู่แล้ว)

Features:
- ปลายทางแก้ได้ 3 ทาง (ลำดับ: `--url` → env `AIVA_BASE_URL` → `DEFAULT_TARGET`)
- ส่ง `ENGINE_INGEST_KEY` เป็น `Authorization: Bearer` + `X-AIVA-Key` (Portal รับทั้งคู่)
  ลำดับการหา key: `--key` → env `ENGINE_INGEST_KEY` → ไฟล์ `frontend/.env`
- preflight เช็ค `/api/health` ก่อนยิงทั้งชุด — URL/port ผิดจะหยุดตั้งแต่แรก ไม่ใช่พัง 200 ครั้ง
- หยุดทันทีเมื่อเจอ 401/403/404 และเก็บผลที่ทำเสร็จแล้วไว้ (ไม่ทิ้งของที่ดีไปแล้ว)
- แยกผลตามตอบกลับของ Portal: CREATED / ALREADY_PROCESSED (replay) / 409 / failed
  พร้อมสรุป สถานะ-identity-DR rule ที่ Portal บันทึก และวางเทียบกับ `summary.json` ฝั่ง Engine
- `--dry-run` ตรวจ payload กับ JSON Schema ของ Engine (`schemas/result-3.{0,1}.schema.json`)
  + ตรวจ Portal-owned key ต้องไม่อยู่ใน payload — ไม่ยิงเน็ต ไม่แตะฐานข้อมูล
- `--bump-round` / `--fresh-ids` สำหรับกรณี Portal ปฏิเสธด้วย 409 (เอกสารเดิมปิดรับการตรวจซ้ำ)
- ไม่ใช้ dependency นอก stdlib (requests ก็ไม่ต้องมี) และไม่พิมพ์ key ที่ส่ง

Usage:
    python scripts/push_results_to_portal.py                          # localhost:3000 ทั้ง 200 ฉบับ
    python scripts/push_results_to_portal.py --url http://10.0.0.21:3001
    python scripts/push_results_to_portal.py --limit 5 --concurrency 2
    python scripts/push_results_to_portal.py --only DMS-100,DMS-114
    python scripts/push_results_to_portal.py --dry-run                # ตรวจ contract อย่างเดียว
    python scripts/push_results_to_portal.py --dir results/run_20261021_122424_v5.6
    python scripts/push_results_to_portal.py --report results/push_v57.json

Exit code: 0 = ผ่านหมด · 1 = มี 409/failed หรือหยุดกลางชุด · 2 = Config/preflight ผิด (ยังไม่ได้ยิง)
"""
from __future__ import annotations

import argparse
import concurrent.futures as cf
import json
import os
import re
import ssl
import sys
import threading
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Ensure stdout uses UTF-8 on Windows (ข้อความไทยในคอนโซล cp1252 ต้องไม่ทำให้ crash)
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)
    except Exception:
        pass

ENGINE_ROOT = Path(__file__).resolve().parents[1]
FRONTEND_ENV = ENGINE_ROOT.parent / "frontend" / ".env"
SCHEMA_DIR = ENGINE_ROOT / "schemas"

# ==== แก้สองค่านี้เป็นค่าเริ่มต้นถาวรได้ ====
DEFAULT_TARGET = "http://localhost:3000"
DEFAULT_DIR = ENGINE_ROOT / "results" / "run_20261026_144747_v5.7"
# ============================================ */

INGEST_PATH = "/api/engine/ingest"
HEALTH_PATH = "/api/health"
RESULT_RE = re.compile(r"^DMS-.*_result\.json$")
#: Portal ปฏิเสธ payload ที่มีคีย์งานของมันเอง (engineResultV3Schema → FORBIDDEN_ENGINE_KEYS)
FORBIDDEN_ENGINE_KEYS = (
    "workflow", "allowed_actions", "assigned_to", "approved",
    "ap_status", "duplicate_status", "history",
)
TAG = {"created": "CREATED", "replayed": "REPLAY", "conflict": "409",
       "failed": "FAIL", "valid": "OK", "invalid": "BAD"}


# --------------------------------------------------------------------- helpers

def load_env_file(path: Path) -> Dict[str, str]:
    """อ่านไฟล์ `.env` แบบง่าย (KEY=VALUE, ข้าม comment, ปลด quote ครอบ)"""
    out: Dict[str, str] = {}
    try:
        for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            out[k.strip()] = v.strip().strip('"').strip("'")
    except OSError:
        pass
    return out


def resolve_key(cli_key: Optional[str]) -> Tuple[Optional[str], str]:
    """คืน (key, ที่มา) — env ใน shell ชนะไฟล์ frontend/.env"""
    if cli_key:
        return cli_key, "--key"
    from_env = os.environ.get("ENGINE_INGEST_KEY", "").strip()
    if from_env:
        return from_env, "env ENGINE_INGEST_KEY"
    if FRONTEND_ENV.exists():
        k = load_env_file(FRONTEND_ENV).get("ENGINE_INGEST_KEY", "").strip()
        if k:
            return k, str(FRONTEND_ENV)
    return None, "(ไม่พบ key)"


def resolve_dir(raw: str) -> Optional[Path]:
    """รับทั้ง path สัมพัทธ์ (cwd) และสัมพัทธ์กับ engine root"""
    p = Path(raw).expanduser()
    for cand in ([p] if p.is_absolute() else [Path.cwd() / p, ENGINE_ROOT / p]):
        if cand.is_dir():
            return cand.resolve()
    return None


def list_results(dir_path: Path, only: Optional[List[str]], limit: Optional[int]) -> List[str]:
    files = [f.name for f in dir_path.iterdir() if RESULT_RE.match(f.name)]

    def doc_no(name: str) -> int:
        m = re.search(r"(\d+)", name)
        return int(m.group(1)) if m else 0

    files.sort(key=lambda n: (doc_no(n), n))
    if only:
        want = {o.replace("_result.json", "").strip() for o in only if o.strip()}
        files = [f for f in files if f.replace("_result.json", "") in want]
    return files[:limit] if limit and limit > 0 else files


def prepare_payload(path: Path, bump_round: Optional[int], fresh_ids: bool) -> Tuple[str, Dict[str, Any]]:
    """อ่านไฟล์แล้วแก้เฉพาะ `request.validation_*` เมื่อสั่ง

    Portal ไม่ตรวจ `integrity.payload_sha256` จึงแก้ได้โดยไม่พัง contract
    """
    raw = path.read_text(encoding="utf-8")
    data: Dict[str, Any] = json.loads(raw)
    if bump_round is None and not fresh_ids:
        return raw, data
    req = data.setdefault("request", {})
    if bump_round is not None:
        req["validation_round"] = bump_round
    if fresh_ids:
        base = str(req.get("validation_id") or f"VAL-{path.name.replace('_result.json', '')}")
        req["validation_id"] = f"{base}-R{int(datetime.now(timezone.utc).timestamp())}"
    return json.dumps(data, ensure_ascii=False), data


# ------------------------------------------------------------------- transport

def _opener(insecure: bool):
    ctx = ssl._create_unverified_context() if insecure else ssl.create_default_context()
    return urllib.request.build_opener(urllib.request.HTTPSHandler(context=ctx))


def http_call(url: str, *, method: str = "GET", body: Optional[bytes] = None,
              headers: Optional[Dict[str, str]] = None, timeout: float = 30.0,
              insecure: bool = False) -> Tuple[Optional[int], str]:
    """คืน (status, body_text) — error ระดับ network ได้ (None, ข้อความ) ไม่ใช่ exception"""
    req = urllib.request.Request(url, data=body, method=method,
                                 headers={"User-Agent": "aiva-push/1.0", **(headers or {})})
    try:
        with _opener(insecure).open(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:               # 4xx/5xx ที่ server ตอบกลับมาจริง
        return e.code, e.read().decode("utf-8", "replace")
    except Exception as e:                             # DNS / refused / timeout / TLS
        return None, f"{type(e).__name__}: {e}"


def parse_json(text: str) -> Optional[Dict[str, Any]]:
    try:
        got = json.loads(text)
        return got if isinstance(got, dict) else None
    except (ValueError, TypeError):
        return None


def snip(text: str, limit: int = 180) -> str:
    one = " ".join((text or "").split())
    return one[:limit] + "…" if len(one) > limit else one


def preflight(base: str, timeout: float, insecure: bool) -> Optional[str]:
    """ก่อนยิงทั้งชุด: URL ผิด / server ไม่ขึ้น / ไม่ใช่ adapter service ต้องรู้ตั้งแต่แรก"""
    url = base + HEALTH_PATH
    status, text = http_call(url, timeout=timeout, insecure=insecure)
    if status is None:
        return (f"เข้าถึง {url} ไม่ได้: {text}\n"
                "  ตรวจว่า server รันอยู่ (npm run dev:server หรือ docker compose up -d) และ --url ถูกต้อง")
    payload = parse_json(text)
    if status == 404:
        return f"{url} → 404: ที่อยู่นี้ไม่ใช่ adapter service (PORT ผิด หรือเผลอชี้ไป port ของ vite?)"
    if payload is None:
        return f"{url} → HTTP {status} ไม่ใช่ JSON: {snip(text)}"
    if payload.get("ok") is False:
        return f"{url} → HTTP {status}: {snip(str(payload.get('error', '')))}"
    return None


# --------------------------------------------------------------------- pushing

def push_one(dir_path: Path, name: str, opts: argparse.Namespace,
             key: Optional[str]) -> Dict[str, Any]:
    doc_id = name.replace("_result.json", "")
    try:
        body, _ = prepare_payload(dir_path / name, opts.bump_round, opts.fresh_ids)
    except Exception as e:
        return {"file": name, "docId": doc_id, "outcome": "failed", "ms": 0,
                "error": f"อ่าน/แปลงไฟล์ไม่ได้: {type(e).__name__}: {e}"}

    headers = {"Content-Type": "application/json"}
    if key:
        # server รับทั้ง Authorization: Bearer และ X-AIVA-Key — ส่งทั้งคู่ไว้กัน proxy ตัด header
        headers["Authorization"] = f"Bearer {key}"
        headers["X-AIVA-Key"] = key

    started = datetime.now()
    status, text = http_call(opts.url + INGEST_PATH, method="POST",
                             body=body.encode("utf-8"), headers=headers,
                             timeout=opts.timeout / 1000.0, insecure=opts.insecure)
    ms = int((datetime.now() - started).total_seconds() * 1000)
    if status is None:
        return {"file": name, "docId": doc_id, "outcome": "failed", "ms": ms,
                "error": f"ยิงไม่สำเร็จ: {text} (timeout {opts.timeout:.0f}ms?)"}

    payload = parse_json(text)
    if payload is None:
        return {"file": name, "docId": doc_id, "outcome": "failed", "http": status, "ms": ms,
                "error": f"HTTP {status} ไม่ใช่ JSON: {snip(text)}"}

    if status == 200 and payload.get("ok"):
        replayed = bool(payload.get("idempotent_replay"))
        return {"file": name, "docId": doc_id, "outcome": "replayed" if replayed else "created",
                "http": status, "ms": ms, "status": payload.get("status"),
                "identity": payload.get("identity_status"), "rule": payload.get("applied_rule")}
    if status == 409:
        return {"file": name, "docId": doc_id, "outcome": "conflict", "http": status, "ms": ms,
                "error": f"{payload.get('code') or 'CONFLICT'}: {snip(str(payload.get('error', '')))}"}
    if status in (401, 403):
        return {"file": name, "docId": doc_id, "outcome": "failed", "http": status, "ms": ms,
                "error": f"{payload.get('code') or status}: {snip(str(payload.get('error', '')))}"
                         " → แก้ด้วย --key <ENGINE_INGEST_KEY>"}
    detail = "; ".join(payload.get("errors") or []) or payload.get("error") or snip(text)
    return {"file": name, "docId": doc_id, "outcome": "failed", "http": status, "ms": ms,
            "error": f"HTTP {status}: {snip(str(detail))}"}


def push_all(dir_path: Path, files: List[str], opts: argparse.Namespace,
             key: Optional[str], log) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    """ยิงทีละ `--concurrency` ไฟล์; เจอ 401/403/404 เมื่อไรก็หยุดดึงงานใหม่แต่เก็บผลที่ทำเสร็จ"""
    results: Dict[int, Dict[str, Any]] = {}
    halted: List[str] = []
    lock = threading.Lock()
    done = 0

    def task(idx: int, name: str) -> Optional[Tuple[int, Dict[str, Any]]]:
        nonlocal done
        if halted:
            return None
        r = push_one(dir_path, name, opts, key)
        if r.get("http") in (401, 403, 404):
            halted.append(f"HTTP {r['http']} จาก {r['file']}: {r.get('error', '')}")
        with lock:
            done += 1
            log(f"  [{done:3d}/{len(files)}] {r['docId']:<9} {str(r.get('http', '—')):<4} "
                f"{TAG[r['outcome']]:<8}{r.get('status') or ''}"
                f"{' ' + r['rule'] if r.get('rule') else ''}"
                f"{' — ' + r['error'] if r.get('error') else ''}")
        return idx, r

    workers = max(1, min(4, opts.concurrency))
    with cf.ThreadPoolExecutor(max_workers=workers) as pool:
        futures = [pool.submit(task, i, f) for i, f in enumerate(files)]
        for fut in cf.as_completed(futures):
            got = fut.result()
            if got:
                results[got[0]] = got[1]
    return [results[i] for i in sorted(results)], (halted[0] if halted else None)


# --------------------------------------------------------------------- dry run

def validate_local(dir_path: Path, files: List[str], opts: argparse.Namespace,
                   log) -> List[Dict[str, Any]]:
    try:
        import jsonschema
    except ImportError:
        jsonschema = None
        log("  ⚠ ไม่มี jsonschema → ตรวจแบบโครงสร้างพื้นฐานแทน "
            "(pip install jsonschema ถึงจะเทียบ schemas/ เต็มรูปแบบ)")

    cache: Dict[str, Any] = {}

    def schema_for(version: str):
        fname = f"result-{version}.schema.json" if version in ("3.0", "3.1") else "result-3.1.schema.json"
        path = SCHEMA_DIR / fname
        if not path.exists():
            return None
        if fname not in cache:
            cache[fname] = json.loads(path.read_text(encoding="utf-8"))
        return cache[fname]

    out: List[Dict[str, Any]] = []
    for name in files:
        doc_id = name.replace("_result.json", "")
        try:
            _, data = prepare_payload(dir_path / name, opts.bump_round, opts.fresh_ids)
        except Exception as e:
            out.append({"file": name, "docId": doc_id, "outcome": "invalid",
                        "error": f"JSON พัง: {e}", "ms": 0})
            log(f"  ✗ {doc_id}  JSON พัง: {e}")
            continue

        problems = [f"Portal-owned key ต้องไม่อยู่ใน payload: {k}"
                    for k in FORBIDDEN_ENGINE_KEYS if k in data]
        if data.get("contract") != "aiva.system_a.result/3.0":
            problems.append(f"contract = {data.get('contract')!r} ต้องเป็น 'aiva.system_a.result/3.0'")
        if not isinstance(data.get("rule_results"), list) or len(data.get("rule_results") or []) != 9:
            problems.append("rule_results ต้องมี 9 ข้อ (V-01..V-09)")

        if jsonschema is not None:
            schema = schema_for(str(data.get("versions", {}).get("schema", "")))
            if schema is not None:
                errs = sorted(jsonschema.Draft202012Validator(schema).iter_errors(data),
                              key=lambda e: list(e.absolute_path))[:3]
                problems += [f"{'/'.join(str(p) for p in e.absolute_path) or '(root)'}: {e.message}"
                             for e in errs]

        if problems:
            out.append({"file": name, "docId": doc_id, "outcome": "invalid",
                        "error": " | ".join(problems[:3]), "ms": 0})
            log(f"  ✗ {doc_id}  ไม่ผ่าน → {problems[0]}")
            continue

        reco = str(((data.get("recommendation") or {}) if isinstance(data.get("recommendation"), dict)
                    else {}).get("value") or "")
        out.append({"file": name, "docId": doc_id, "outcome": "valid", "status": reco, "ms": 0})
        log(f"  ✓ {doc_id}  ผ่าน (schema {data.get('versions', {}).get('schema')}) · {reco}")
    return out


# ---------------------------------------------------------------------- report

def engine_summary_counts(dir_path: Path) -> Optional[Dict[str, int]]:
    try:
        counts = json.loads((dir_path / "summary.json").read_text(encoding="utf-8")) \
            .get("statistics", {}).get("counts")
        return counts if isinstance(counts, dict) else None
    except Exception:
        return None


def build_report(opts, dir_path: Path, total: int, results: List[Dict[str, Any]],
                 started_ms: float, aborted: Optional[str], key_source: str) -> Dict[str, Any]:
    counts: Dict[str, int] = {}
    by_status: Dict[str, int] = {}
    by_identity: Dict[str, int] = {}
    by_rule: Dict[str, int] = {}

    def tally(table: Dict[str, int], value: Optional[str]) -> None:
        if value:
            table[value] = table.get(value, 0) + 1

    for r in results:
        counts[r["outcome"]] = counts.get(r["outcome"], 0) + 1
        tally(by_status, r.get("status"))
        if r["outcome"] == "created":
            tally(by_identity, r.get("identity"))
            tally(by_rule, r.get("rule"))

    elapsed = (datetime.now() - datetime.fromtimestamp(started_ms)).total_seconds()
    report = {
        "target": f"{opts.url} (dry-run — ไม่ยิงเน็ต)" if opts.dry_run else opts.url + INGEST_PATH,
        "dir": str(dir_path),
        "mode": "dry-run" if opts.dry_run else "http",
        "startedAt": datetime.now(timezone.utc).isoformat(),
        "durationMs": int(elapsed * 1000),
        "total": total,
        "counts": counts,
        "byStatus": by_status,
        "byIdentity": by_identity,
        "byRule": by_rule,
        "keySource": key_source if not opts.dry_run else None,
        "results": results,
    }
    eng = engine_summary_counts(dir_path)
    if eng:
        report["engineCounts"] = eng
    if aborted:
        report["aborted"] = aborted
    return report


def format_report(r: Dict[str, Any]) -> str:
    dry = r["mode"] == "dry-run"

    def line(k: str, v) -> str:
        return f"  {k:<26}{v}"

    def table(t: Dict[str, int], order: List[str]) -> str:
        keys = [k for k in order if t.get(k)] + [k for k in t if t[k] and k not in order]
        return "\n".join(f"      {k:<18}{t[k]}" for k in keys) if keys else "      (ไม่มี)"

    def fmt(m: Dict[str, int]) -> str:
        return " · ".join(f"{k}={v}" for k, v in m.items() if v) or "(ไม่มี)"

    out = [
        "",
        "════════ ผลตรวจ contract (dry-run) ════════" if dry else "════════ ผลการส่งเข้า Portal ════════",
        line("ปลายทาง", r["target"]),
        line("folder", r["dir"]),
        line("จำนวนไฟล์", r["total"]),
    ]
    if not dry:
        out.append(line("key ที่ใช้", r.get("keySource")))
    out += ["", "สรุปผลรายฉบับ"]
    if dry:
        out += [line("contract ผ่าน", r["counts"].get("valid", 0)),
                line("contract ไม่ผ่าน", r["counts"].get("invalid", 0))]
    else:
        out += [line("CREATED (สร้าง/ตรวจซ้ำ)", r["counts"].get("created", 0)),
                line("ALREADY_PROCESSED", r["counts"].get("replayed", 0)),
                line("409 conflict", r["counts"].get("conflict", 0)),
                line("failed", r["counts"].get("failed", 0))]
    out += ["", "recommendation ที่อ่านจาก payload" if dry else "สถานะที่ Portal บันทึก",
            table(r["byStatus"],
                  ["AUTO_PASS", "REVIEW", "HOLD", "MANUAL_REVIEW", "SYSTEM_ERROR"] if dry
                  else ["Auto-pass", "Review", "Hold", "Manual Review", "Duplicate", "Superseded"]),
            ""]
    if r["byIdentity"]:
        out += ["identity (business key)", table(r["byIdentity"], ["RESOLVED", "NOT_FOUND", "UNRESOLVED"]), ""]
    if r["byRule"]:
        out += ["DR rule", table(r["byRule"], ["DR-01", "DR-02", "DR-03", "DR-04", "DR-06", "DR-07"]), ""]
    if r.get("engineCounts"):
        out += ["วางเทียบ engine summary — informational (DR/Superseded ทำให้ต่างกันได้ตามปกติ)",
                f"      {'engine'.ljust(7)}: {fmt(r['engineCounts'])}",
                f"      {('payload' if dry else 'portal').ljust(7)}: {fmt(r['byStatus'])}", ""]
    out.append(line("เวลา", f"{r['durationMs'] / 1000:.2f}s"))
    if r.get("aborted"):
        out += ["", f"✗ หยุดก่อนจบชุด: {r['aborted']}"]
    bad = [x for x in r["results"] if x["outcome"] in ("failed", "conflict", "invalid")]
    if bad:
        out += ["", f"ฉบับที่มีปัญหา (แสดง 8 จาก {len(bad)}):",
                *[f"  {x['file']}: {x.get('error') or x['outcome']}" for x in bad[:8]]]
    return "\n".join(out)


# ------------------------------------------------------------------------ main

def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        prog="push_results_to_portal.py",
        description=f"ส่งผลรัน Engine เข้า Portal ({INGEST_PATH})",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "ตัวอย่าง:\n"
            "  python scripts/push_results_to_portal.py --url http://10.0.0.21:3001\n"
            "  python scripts/push_results_to_portal.py --limit 5 --only DMS-100,DMS-114\n"
            "  python scripts/push_results_to_portal.py --dry-run\n"
            "\nลำดับค่าที่ใช้: --url → env AIVA_BASE_URL → DEFAULT_TARGET ในไฟล์นี้\n"
            "ลำดับหา key : --key → env ENGINE_INGEST_KEY → frontend/.env\n"
        ),
    )
    p.add_argument("--url", "--base-url", "-u", default=os.environ.get("AIVA_BASE_URL") or DEFAULT_TARGET,
                   help=f"ปลายทาง เช่น http://localhost:3000 (env AIVA_BASE_URL · default {DEFAULT_TARGET})")
    p.add_argument("--key", "-k", default=None, help="ENGINE_INGEST_KEY")
    p.add_argument("--dir", "--results", "-d",
                   default=os.environ.get("ENGINE_RESULTS_DIR") or str(DEFAULT_DIR),
                   help="folder ที่เก็บ DMS-*_result.json (env ENGINE_RESULTS_DIR ใช้ได้)")
    p.add_argument("--only", default=None, help="เฉพาะ DMS id หรือชื่อไฟล์ คั่นด้วย , เช่น DMS-100,DMS-114")
    p.add_argument("--limit", type=int, default=None, help="ส่งแค่ n ไฟล์แรก (เรียงตามเลขเอกสาร)")
    p.add_argument("--concurrency", type=int, default=1, help="จำนวนคำขอขนาน 1-4 (default 1)")
    p.add_argument("--timeout", type=float, default=30000, help="per-request timeout ms (default 30000)")
    p.add_argument("--dry-run", action="store_true", help="ตรวจ contract อย่างเดียว ไม่ยิงเน็ต ไม่แตะ DB")
    p.add_argument("--bump-round", type=int, default=None, help="ตั้ง request.validation_round = n ทุกไฟล์")
    p.add_argument("--fresh-ids", action="store_true",
                   help="ต่อท้าย validation_id (ยิงซ้ำแล้วได้ CREATED ไม่ใช่ replay)")
    p.add_argument("--skip-preflight", action="store_true", help=f"ข้ามการเช็ค {HEALTH_PATH} ก่อนยิง")
    p.add_argument("--insecure", action="store_true",
                   help="ไม่ตรวจใบรับรอง TLS (ใช้กับ https ใน LAN ที่มี self-signed cert เท่านั้น)")
    p.add_argument("--report", default=None, help="เขียนผลรายฉบับเป็น JSON")
    p.add_argument("--quiet", "-q", action="store_true", help="พิมพ์เฉพาะสรุป")
    opts = p.parse_args(argv)
    opts.url = opts.url.rstrip("/")
    opts.only = [s.strip() for s in opts.only.split(",") if s.strip()] if opts.only else None
    opts.concurrency = max(1, min(4, opts.concurrency))
    opts.timeout = max(1000.0, opts.timeout)
    return opts


def main(argv: Optional[List[str]] = None) -> int:
    opts = parse_args(argv)
    log = (lambda *a, **k: None) if opts.quiet else print

    dir_path = resolve_dir(opts.dir)
    if dir_path is None:
        print(f"ไม่เจอ folder ผลรัน: {opts.dir}\n  (cwd = {Path.cwd()} · หรือส่ง --dir <path>)", file=sys.stderr)
        return 2
    files = list_results(dir_path, opts.only, opts.limit)
    if not files:
        extra = f" (filter: {','.join(opts.only)})" if opts.only else ""
        print(f"ไม่เจอไฟล์ DMS-*_result.json ใน {dir_path}{extra}", file=sys.stderr)
        return 2

    started_ms = datetime.now().timestamp()
    print(f"ผลรัน {len(files)} ฉบับ จาก {dir_path}")

    if opts.dry_run:
        print("โหมด --dry-run: ตรวจ contract อย่างเดียว ไม่ยิงเน็ต ไม่แตะฐานข้อมูล")
        report = build_report(opts, dir_path, len(files),
                              validate_local(dir_path, files, opts, log), started_ms, None, "-")
        print(format_report(report))
        if opts.report:
            write_report(report, opts.report)
        return 1 if report["counts"].get("invalid") else 0

    key, key_source = resolve_key(opts.key)
    if not key:
        print("⚠ ไม่มี key จาก --key / ENGINE_INGEST_KEY / frontend/.env — "
              "ถ้า server ตั้ง ENGINE_INGEST_KEY ไว้ทุกคำขอจะ 401", file=sys.stderr)
    print(f"ปลายทาง {opts.url}{INGEST_PATH} · key จาก {key_source} · concurrency {opts.concurrency}"
          + (f" · validation_round = {opts.bump_round}" if opts.bump_round is not None else "")
          + (" · validation_id ใหม่ทุกไฟล์" if opts.fresh_ids else ""))

    if not opts.skip_preflight:
        problem = preflight(opts.url, opts.timeout, opts.insecure)
        if problem:
            print(f"\n✗ preflight ไม่ผ่าน:\n  {problem}\n  (ข้ามได้ด้วย --skip-preflight)", file=sys.stderr)
            return 2
        log("  preflight ผ่าน — /api/health ตอบปกติ")

    results, aborted = push_all(dir_path, files, opts, key, log)
    report = build_report(opts, dir_path, len(files), results, started_ms, aborted, key_source)
    print(format_report(report))
    if opts.report:
        write_report(report, opts.report)

    counts = report["counts"]
    bad = counts.get("failed", 0) + counts.get("conflict", 0)
    ok = "✓" if bad == 0 and not aborted else "✗"
    print(f"\n{ok} สรุป: CREATED {counts.get('created', 0)} · REPLAY {counts.get('replayed', 0)} · "
          f"409 {counts.get('conflict', 0)} · FAIL {counts.get('failed', 0)} · "
          f"ส่งไปแล้ว {len(results)}/{len(files)}")
    if counts.get("conflict"):
        print("  409 = เอกสารใน Portal ปิดรับการตรวจซ้ำ → ล้างเอกสาร (ฝั่ง Portal: npm run db:clear-docs) "
              "หรือ --bump-round <n> (ดูเหตุผลรายฉบับในรายงานด้านบน)")
    return 1 if (bad or aborted) else 0


def write_report(report: Dict[str, Any], name: str) -> None:
    path = Path(name)
    if not path.is_absolute():
        path = Path.cwd() / path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  เขียนรายงานที่ {path}")


if __name__ == "__main__":
    sys.exit(main())
