#!/usr/bin/env python3
"""Entrypoint to run the AIVA Flow Server & Worker directly.

Usage:
    python flow_server.py
    python flow_server.py --port 8080 --host 0.0.0.0
"""
import argparse
import sys
from pathlib import Path

# Ensure 'src' is in python search path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "src"))

import uvicorn
from system_a.envfile import load_env

load_env()


def main():
    parser = argparse.ArgumentParser(description="AIVA System A — Flow Engine Server & Daemon")
    parser.add_argument("--host", default=os.getenv("ENGINE_HOST", "0.0.0.0"), help="Host to bind")
    parser.add_argument("--port", type=int, default=int(os.getenv("ENGINE_PORT", "8080")), help="Port to listen")
    parser.add_argument("--reload", action="store_true", help="Enable reload for development")
    args = parser.parse_args()

    uvicorn.run("system_a.flow_server:create_flow_server", factory=True, host=args.host, port=args.port, reload=args.reload)


if __name__ == "__main__":
    import os
    main()
