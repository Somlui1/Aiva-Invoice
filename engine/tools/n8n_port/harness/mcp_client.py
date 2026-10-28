"""Minimal MCP (streamable HTTP) client so a script can call the same MCP server the agent uses.

Why this exists: node 21 of the blackbox workflow holds ~276 KB of jsCode.  Asking a model to retype that
into a tool argument is how you ship one wrong character into a production flow.  The n8n MCP server
exposes update_workflow (setNodeParameter by JSON Pointer), so we call that endpoint from python and read
the bytes straight off disk — same auth and same tool the agent would use, but byte-exact.

  from mcp_client import Mcp
  mcp = Mcp()                                   # reads url + bearer from ~/.pi/agent/mcp.json
  print(mcp.tools())                            # names only
  r = mcp.call("get_workflow_details", {"workflowId": "..."})
"""
import io
import json
import os
import time
import urllib.error
import urllib.request

CONFIG = os.path.expanduser("~/.pi/agent/mcp.json")


def server_config(name="aiva-n8n"):
    cfg = json.load(io.open(CONFIG, encoding="utf-8"))
    srv = cfg.get("mcpServers", cfg)[name]
    return srv["url"], srv.get("headers", {})


class McpError(Exception):
    pass


class Mcp:
    def __init__(self, name="aiva-n8n", url=None, headers=None, timeout=300):
        self.url, self.headers = (url, dict(headers or {})) if url else server_config(name)
        self.timeout = timeout
        self.session = None

    # ---------------------------------------------------------------- transport
    def _post(self, payload, want_answer=True):
        hdr = dict(self.headers)
        hdr.update({"Content-Type": "application/json",
                    "Accept": "application/json, text/event-stream"})
        if self.session:
            hdr["Mcp-Session-Id"] = self.session
        req = urllib.request.Request(self.url, data=json.dumps(payload).encode(), headers=hdr)
        # The n8n MCP gateway answers 429 quickly if you poll an execution every few seconds, so a
        # caller must not treat it as "the workflow is broken": back off and retry a few times.
        for attempt in range(6):
            try:
                resp = urllib.request.urlopen(req, timeout=self.timeout)
                break
            except urllib.error.HTTPError as e:
                wait = int(e.headers.get("retry-after") or 0) if e.headers else 0
                if e.code != 429 or attempt == 5:
                    raise McpError("HTTP %s %s" % (e.code, e.read().decode("utf-8", "replace")[:400]))
                time.sleep(wait or min(120, 15 * (2 ** attempt)))
        with resp:
            sid = resp.headers.get("mcp-session-id")
            if sid:
                self.session = sid
            body = resp.read().decode("utf-8", "replace")
            ctype = resp.headers.get("content-type", "")
        if not want_answer or not body.strip():
            return None
        if "text/event-stream" not in ctype:
            return json.loads(body)
        out = None                                    # SSE: keep the last data: that carries an id
        for line in body.splitlines():
            if line.startswith("data:"):
                try:
                    msg = json.loads(line[5:].strip())
                except ValueError:
                    continue
                if isinstance(msg, dict) and ("result" in msg or "error" in msg):
                    out = msg
        return out

    def _rpc(self, method, params=None, want_answer=True):
        payload = {"jsonrpc": "2.0", "method": method}
        if params is not None:
            payload["params"] = params
        if want_answer:
            payload["id"] = getattr(self, "_n", 0) + 1
            self._n = payload["id"]
        ans = self._post(payload, want_answer)
        if ans and "error" in ans:
            raise McpError("%s -> %s" % (method, json.dumps(ans["error"])[:400]))
        return ans.get("result") if ans else None

    # ---------------------------------------------------------------- api
    def connect(self):
        if self.session:
            return self.session
        r = self._rpc("initialize", {"protocolVersion": "2024-11-05", "capabilities": {},
                                    "clientInfo": {"name": "n8n-port-sync", "version": "1"}})
        self._rpc("notifications/initialized", {}, want_answer=False)
        self.server = r.get("serverInfo", {})
        return self.session

    def tools(self):
        self.connect()
        return [t["name"] for t in self._rpc("tools/list", {}).get("tools", [])]

    def call(self, tool, args):
        """Returns the tool's text content (parsed as JSON when the server sends JSON)."""
        self.connect()
        r = self._rpc("tools/call", {"name": tool, "arguments": args})
        if r.get("isError"):
            raise McpError("%s -> %s" % (tool, self.text(r)[:600]))
        txt = self.text(r)
        try:
            return json.loads(txt)
        except ValueError:
            return txt

    @staticmethod
    def text(result):
        return "\n".join(c.get("text", "") for c in result.get("content", []) if c.get("type") == "text")
