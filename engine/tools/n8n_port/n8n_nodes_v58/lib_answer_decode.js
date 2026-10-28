// >>> BEGIN ANSWER-DECODE (verbatim copy of adapters/llm/litellm_client.py::extract_json_object +
// >>> salvage_json_object, the PURE half of LiteLLMClient.chat_json's decode chain).
// A n8n Code node has no require()/import, so this block is inlined into every node that parses a VLM
// answer (05 classify, 10 extract).  harness/test_answer_decode.py checks byte-for-byte that the copy in
// each node file still equals this file, and that decoding the recorded real answers gives the same
// object (and the same salvaged flag) as python.
//
// Why the flow needs it at all: the engine accepts an answer through extract_json_object first and only
// then salvage_json_object.  The flow used to do `text.slice(indexOf('{'), lastIndexOf('}')+1)` +
// JSON.parse, which throws on any answer whose closing brace never arrived (finish_reason=length).  The
// engine keeps every complete member of that same answer.  Losing it is what turned pages_complete false
// and produced E01 on readable invoices (measured 21 of 99 baseline documents).
//
// What the flow still cannot do: the two network recoveries in front of the salvage (REPAIR re-ask and
// enable_thinking=false re-ask).  They are reported as 'decode_recoveries_unavailable' in the node output.
const ANSWER_DECODE_VERSION = 'litellm_client.decode/1.0';
const SALVAGE_CUTS = 60;
const _FENCE = /^\s*```(?:json)?\s*|\s*```\s*$/gi;
const _THINK = /<(think|thinking|reasoning)>[\s\S]*?<\/\1>/gi;

function _stripFence(text) {
  return String(text === null || text === undefined ? '' : text).replace(_THINK, '').replace(_FENCE, '').trim();
}

// python: json.loads(re.sub(r",\s*([}\]])", r"\1", s[start:i + 1]))
function _fixTrailingCommas(s) { return s.replace(/,(\s*[}\]])/g, '$1'); }

function extractJsonObject(text) {
  if (text !== null && typeof text === 'object' && !Array.isArray(text)) return text;
  const s = _stripFence(text);
  const start = s.indexOf('{');
  if (start < 0) throw new Error('no JSON object');
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) { esc = false; } else if (ch === '\\') { esc = true; } else if (ch === '"') { inStr = false; }
      continue;
    }
    if (ch === '"') { inStr = true; } else if (ch === '{') { depth += 1; } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return JSON.parse(_fixTrailingCommas(s.slice(start, i + 1)));
    }
  }
  throw new Error('truncated JSON object');
}

function salvageJsonObject(text) {
  const s = _stripFence(text);
  const start = s.indexOf('{');
  if (start < 0) return null;
  const fragment = s.slice(start);
  let cut = fragment.length;
  const closers = { '{': '}', '[': ']' };
  for (let attempt = 0; attempt < SALVAGE_CUTS; attempt++) {
    let pos = -1;
    for (let i = Math.min(cut, fragment.length) - 1; i >= 0; i--) { if (fragment[i] === '}') { pos = i; break; } }
    if (pos < 0) return null;
    const cand = fragment.slice(0, pos + 1);
    const stack = [];
    let inStr = false, esc = false;
    for (const ch of cand) {
      if (inStr) {
        if (esc) { esc = false; } else if (ch === '\\') { esc = true; } else if (ch === '"') { inStr = false; }
      } else if (ch === '"') { inStr = true; } else if (closers[ch]) { stack.push(closers[ch]); }
      else if (ch === '}' || ch === ']') { if (stack.length && stack[stack.length - 1] === ch) { stack.pop(); } }
    }
    if (!inStr) {
      // python: cand = re.sub(r",\s*$", "", cand.rstrip().rstrip(",")); json.loads(cand + "".join(reversed(stack)))
      const closed = cand.replace(/\s+$/, '').replace(/,+$/, '').replace(/,\s*$/, '') + stack.slice().reverse().join('');
      try { return JSON.parse(_fixTrailingCommas(closed)); } catch (e) { /* try the next cut */ }
    }
    cut = pos;
  }
  return null;
}

// The pair the engine runs when it is not allowed to spend another request: strict first, salvage second.
function decodeAnswer(text) {
  try { return { obj: extractJsonObject(text), salvaged: false, error: null }; }
  catch (e) {
    const first = String(e && e.message ? e.message : e);
    const got = salvageJsonObject(text);
    if (got) return { obj: got, salvaged: true, error: first };
    return { obj: {}, salvaged: false, error: first + ' | salvage: nothing recoverable' };
  }
}
