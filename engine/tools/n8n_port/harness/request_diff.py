"""What does the engine actually send to the LLM, and what does the n8n flow send?

  python harness/request_diff.py            # table + exit 1 when any field differs

Why this exists: before porting a single rule we have to know whether the two sides even ask the same
question.  A different `max_tokens`, an extra `response_format`, thinking on/off or "one image per request"
all change the extraction, and then the rules cannot match no matter how faithful the port is.

Nothing here is copied by hand: the engine side is produced by calling the engine's own
``SinglePassPipeline._ask`` / ``LiteLLMLineMatcher.propose`` with a recording client, built from the real
production ``Settings`` (so ``.env`` decides thinking/json_mode/dpi).  The flow side is read out of a saved
execution (``live/exec449_llm_bodies.json``) — the bytes n8n really put on the wire.
"""
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ENGINE = os.path.dirname(os.path.dirname(ROOT))
sys.path.insert(0, os.path.join(ENGINE, "src"))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Settings() reads os.environ in its field defaults, so .env must be in the environment BEFORE the
# container module is imported - otherwise the table shows library defaults (e.g. model "qwen-vl") and
# reports differences that do not exist in production.
from system_a.envfile import read_env_file                                                             # noqa: E402
for _k, _v in read_env_file().items():
    os.environ.setdefault(_k, _v)

from system_a.adapters.llm.ai_services import LiteLLMEntityJudge, LiteLLMLineMatcher, LiteLLMQtyJudge   # noqa: E402
from system_a.adapters.llm.litellm_client import LiteLLMClient                                          # noqa: E402
from system_a.container import Settings                                                                # noqa: E402
from system_a.domain.standard import load_prompt                                                       # noqa: E402
from system_a.perception.single_pass import SinglePassPipeline                                         # noqa: E402

IMAGES = ["data:image/jpeg;base64,AAAA", "data:image/jpeg;base64,BBBB", "data:image/jpeg;base64,CCCC",
          "data:image/jpeg;base64,DDDD"]                     # 4 pages: the shape is what we compare
FIELDS = ("model", "temperature", "max_tokens", "response_format", "chat_template_kwargs")


class Recorder(LiteLLMClient):
    """Same client, but _post returns a canned answer and records the body instead of calling the gateway."""

    def __init__(self):
        super().__init__("http://recorder.invalid/v1", "x")
        self.bodies = []

    def _post(self, body):
        self.bodies.append(json.loads(json.dumps(body)))
        return '{"ok": true}'


def _pipeline(settings, rec):
    p = SinglePassPipeline.__new__(SinglePassPipeline)          # only _ask is exercised
    p.client, p.model, p.max_tokens = rec, settings.model_vision, settings_max_tokens(settings)
    p.coord, p.json_mode, p.thinking = settings.single_pass_coord, settings.json_mode, False
    p.calls = []
    thinking = {"0": False, "1": True}.get(settings.single_pass_thinking)
    p.thinking = thinking
    return p


def settings_max_tokens(settings):
    return int(getattr(settings, "vlm_max_tokens", 8000) or 8000)


def norm(body):
    """Comparable view of a request body: prompt text is folded to its length + hash so a whitespace
    change shows up without dumping a 10 KB prompt into the terminal."""
    msgs = body.get("messages") or []
    out = {f: body.get(f) for f in FIELDS}
    out["roles"] = [m.get("role") for m in msgs]
    parts, text_len, text_hash, images = [], 0, "", 0
    for m in msgs:
        c = m.get("content")
        if isinstance(c, str):
            parts.append("text")
            text_len, text_hash = len(c), _h(c)
        else:
            for part in c or []:
                if part.get("type") == "image_url":
                    parts.append("image")
                    images += 1
                else:
                    t = part.get("text") or ""
                    parts.append("text")
                    text_len, text_hash = len(t), _h(t)
    out["content"] = parts
    out["images"] = images
    out["prompt_len"] = text_len
    out["prompt_md5"] = text_hash
    return out


def _h(s):
    import hashlib
    return hashlib.md5(s.encode("utf-8")).hexdigest()[:12]


def flow_bodies(path):
    e = json.load(io.open(path, encoding="utf-8"))
    out = {}
    for node, item in e["data"]["resultData"]["runData"].items():
        j = item[0]["data"]["main"][0][0]["json"]
        if not isinstance(j, dict) or "llmBody" not in j:
            continue
        body = j["llmBody"]
        out[node] = json.loads(body) if isinstance(body, str) else body
    return out


def main():
    settings = Settings()                                    # production knobs straight from .env
    rec = Recorder()
    p = _pipeline(settings, rec)

    # ---- engine side (real code paths) -----------------------------------------------------------------
    n = len(IMAGES)
    p._ask("classify", None, load_prompt("single_pass_classify"), IMAGES, 160 * n + 400)
    p._ask("extract", 1, load_prompt("single_pass_extract").replace("{page_no}", "1"), IMAGES[:1], p.max_tokens)
    p._ask("adjudicate", 1, load_prompt("single_pass_adjudicate"), IMAGES[:1], 400)
    engine = {"classify": rec.bodies[0], "extract": rec.bodies[1], "adjudicate": rec.bodies[2]}

    matcher = LiteLLMLineMatcher(rec, settings.model_reasoning)
    matcher.propose([{"invoice_line_no": 1, "description": "TEST", "amount": "100.00"}],
                    [{"rcv_line_id": "1-1", "line_amount": "100.00"}])
    judge = LiteLLMQtyJudge(rec, settings.model_reasoning)
    judge.judge({"INVOICE_LINE": {}, "RCV_LINES": []})
    ent = LiteLLMEntityJudge(rec, settings.model_reasoning)
    ent.name_equivalent("AAPICO", {"R1": "AAPICO HITECH"})
    engine.update({"v07_match": rec.bodies[3], "v08_qty": rec.bodies[4], "v05_entity": rec.bodies[5]})

    # ---- flow side (what n8n really sent) ---------------------------------------------------------------
    flows = flow_bodies(os.path.join(ROOT, "live", "exec449_llm_bodies.json"))
    flow_map = {"classify": flows.get("03 Build classify request"),
                "extract": flows.get("08 Build extract request")}
    for k in ("adjudicate", "v07_match", "v08_qty", "v05_entity"):
        flow_map[k] = None                                    # no such call exists in the flow yet

    print("engine knobs: model=%s thinking=%s json_mode=%s coord=%s extract_dpi=%s classify_dpi=%s max_pages=%s"
          % (settings.model_vision, {"0": False, "1": True}.get(settings.single_pass_thinking),
             settings.json_mode, settings.single_pass_coord, settings.extract_dpi,
             settings.classify_dpi, getattr(settings, "max_pages", "?")))
    print("flow  knobs: model=%s thinking=False json_mode=False coord=norm1000 dpi=80/150 (from 00 CONFIG)\n"
          % flow_map["classify"]["model"])

    bad = 0
    for kind, eng_body in engine.items():
        e, f = norm(eng_body), norm(flow_map[kind]) if flow_map.get(kind) else None
        print("=== %s" % kind)
        if f is None:
            print("    flow: NO SUCH CALL  ->  must be added (Phase C/D)")
            bad += 1
            continue
        for key in ("model", "temperature", "max_tokens", "response_format", "chat_template_kwargs",
                    "roles", "content", "prompt_len", "prompt_md5"):
            same = e[key] == f[key]
            bad += 0 if same else 1
            print("    %-20s %s  engine=%s  flow=%s" % (key, "same" if same else "DIFFERENT",
                                                        e[key], f[key]))
        if e["images"] != f["images"]:
            print("    %-20s DIFFERENT  engine=%d images in ONE request  flow=%d" %
                  ("images", e["images"], f["images"]))
            bad += 1
    print("\n%s (%d difference(s))" % ("REQUESTS ALREADY MATCH" if not bad else "REQUESTS DIFFER", bad))
    print("note: prompt_md5 compares the whole prompt text; a difference there means the flow is asking a\n"
          "      different question and no rule port can fix it.")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
