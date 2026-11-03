"""v5.15 — logging for `docker compose logs -f engine`.

Before this module nothing configured the root logger, so every `log.info(...)` from
`system_a.*` was dropped (Python default level = WARNING) and only uvicorn lines were visible.

Env:
  LOG_LEVEL          INFO (default) | DEBUG | WARNING
  LOG_FORMAT         text (default, human readable) | json (one JSON object per line)
  LOG_HEALTH_ACCESS  false (default) — hide uvicorn access lines for /health* and /status
"""
from __future__ import annotations

import json
import logging
import os
import sys
from datetime import datetime

_CONFIGURED = False


class _TextFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        ts = datetime.fromtimestamp(record.created).strftime("%Y-%m-%d %H:%M:%S")
        name = record.name.replace("system_a.", "")
        msg = record.getMessage()
        line = f"{ts} {record.levelname:<5} [{name}] {msg}"
        if record.exc_info:
            line += "\n" + self.formatException(record.exc_info)
        return line


class _JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        obj = {
            "ts": datetime.fromtimestamp(record.created).isoformat(timespec="milliseconds"),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        for k in ("doc_id", "stage", "event"):
            v = getattr(record, k, None)
            if v is not None:
                obj[k] = v
        if record.exc_info:
            obj["exc"] = self.formatException(record.exc_info)
        return json.dumps(obj, ensure_ascii=False)


class _QuietProbes(logging.Filter):
    """Drop uvicorn access lines produced by the Docker healthcheck every 30 s."""

    def filter(self, record: logging.LogRecord) -> bool:
        msg = record.getMessage()
        return not any(p in msg for p in ('"GET /health', '"GET /status'))


def configure_logging() -> None:
    global _CONFIGURED
    if _CONFIGURED:
        return
    _CONFIGURED = True

    level = getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO)
    fmt = _JsonFormatter() if os.getenv("LOG_FORMAT", "text").lower() == "json" else _TextFormatter()

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(fmt)

    sa = logging.getLogger("system_a")
    sa.setLevel(level)
    sa.handlers[:] = [handler]
    sa.propagate = False

    # noisy third-party clients stay at WARNING
    for noisy in ("httpx", "httpcore", "urllib3", "openai", "litellm"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    if os.getenv("LOG_HEALTH_ACCESS", "false").lower() not in ("1", "true", "yes"):
        logging.getLogger("uvicorn.access").addFilter(_QuietProbes())
