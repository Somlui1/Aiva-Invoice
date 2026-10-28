// =================================================================================================
// src_ai.js — adapters/llm/litellm_client.py + adapters/llm/ai_services.py
//
// The AI layer the decision layer calls: one JSON-resilient client plus the three services the rules
// use (V-07 line matcher, V-08 quantity judge, V-05 entity judge).  Ported line for line because a
// "simpler" client changes verdicts: the engine's answer to a truncated body is to retry without
// reasoning and then salvage the complete members, and every one of those paths has been observed on
// real invoices (litellm_client.py:145-168).
//
// The HTTP call itself is injected (opts.call), so the same client runs against the tape in tests and
// against the LiteLLM gateway inside n8n.
// =================================================================================================

const SALVAGE_CUTS = 60;              // litellm_client.py:15
const CALL_MS_SAMPLES = 20000;
const REPAIR = 'ข้อความก่อนหน้าไม่ใช่ JSON ที่ถูกต้อง โปรดตอบใหม่เป็น JSON Object ล้วน เริ่มที่ { และจบที่ } ' +
  'ห้ามมี markdown หรือข้อความอื่น';

class AiServiceError extends Error {
  constructor(msg) { super(msg); this.name = 'AIServiceError'; this.aiError = true; }
}

// python json.dumps(obj, ensure_ascii=False): separators are ", " and ": ", and JSON.stringify's are ","
// and ":".  A decision the model saw is tied to the exact bytes it was sent, so serialize the python way.
function pyJson(v) {
  if (v === null || v === undefined) return 'null';
  const t = typeof v;
  if (t === 'number') return Number.isInteger(v) ? String(v) : JSON.stringify(v);
  if (t === 'boolean') return v ? 'true' : 'false';
  if (t === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(pyJson).join(', ') + ']';
  if (t === 'object') {
    const parts = [];
    for (const k of Object.keys(v)) parts.push(JSON.stringify(k) + ': ' + pyJson(v[k]));
    return '{' + parts.join(', ') + '}';
  }
  throw new Error('pyJson: cannot serialize ' + t);
}

const FENCE_RE = /^\s*```(?:json)?\s*|\s*```\s*$/gi;
const THINK_RE = /<(think|thinking|reasoning)>[\s\S]*?<\/\1>/gi;

function clean(text) {
  return String(text === null || text === undefined ? '' : text).replace(THINK_RE, '')
    .replace(FENCE_RE, '').trim();
}

// litellm_client.extract_json_object
function extractJsonObject(text) {
  if (text !== null && typeof text === 'object' && !Array.isArray(text)) return text;
  const s = clean(text);
  const start = s.indexOf('{');
  if (start < 0) throw new Error('no JSON object');
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return JSON.parse(s.slice(start, i + 1).replace(/,(\s*)([}\]])/g, '$2'));
    }
  }
  throw new Error('truncated JSON object');
}

// litellm_client.salvage_json_object — keep the members that finished before the body was cut.
function salvageJsonObject(text) {
  const s = clean(text);
  const start = s.indexOf('{');
  if (start < 0) return null;
  const fragment = s.slice(start);
  let cut = fragment.length;
  const closers = { '{': '}', '[': ']' };
  for (let attempt = 0; attempt < SALVAGE_CUTS; attempt++) {
    const pos = fragment.lastIndexOf('}', cut);
    if (pos < 0) return null;
    const cand0 = fragment.slice(0, pos + 1);
    let inStr = false, esc = false;
    const stack = [];
    for (const ch of cand0) {
      if (inStr) {
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === '"') inStr = false;
      } else if (ch === '"') inStr = true;
      else if (closers[ch]) stack.push(closers[ch]);
      else if (ch === '}' || ch === ']') {
        if (stack.length && stack[stack.length - 1] === ch) stack.pop();
      }
    }
    if (!inStr) {
      const cand = cand0.replace(/\s+$/, '').replace(/,+$/, '').replace(/,\s*$/, '');
      try { return JSON.parse(cand + stack.slice().reverse().join('')); } catch (e) { /* keep cutting */ }
    }
    cut = pos;
  }
  return null;
}

// ------------------------------------------------------------------ adapters/llm/litellm_client.py
class AiClient {
  // opts.call(body) -> Promise<gateway JSON>  (engine's _post: {choices:[{message:{content}}], usage})
  constructor(opts) {
    this.call = opts.call;
    this.transportRetries = opts.transportRetries === undefined ? 2 : opts.transportRetries;
    this.stats = { calls: 0, prompt_tokens: 0, completion_tokens: 0, reasoning_tokens: 0, ms: 0,
      call_ms: [], transport_errors: 0, decode_errors: 0, decode_salvaged: 0, no_thinking_retries: 0 };
    this.lastUsage = {};
    this.lastSalvaged = false;
  }

  // chat_json: build the body the same way, then walk the engine's four-step decode chain.
  async chatJson(model, system, user, opts) {
    const o = opts || {};
    const temperature = o.temperature === undefined ? 0.0 : o.temperature;
    const enableThinking = o.enableThinking === undefined ? null : o.enableThinking;
    const images = o.images || null;
    const maxTokens = o.maxTokens === undefined ? null : o.maxTokens;
    const jsonMode = o.jsonMode === undefined ? true : o.jsonMode;
    const layout = o.layout || 'system';
    let messages;
    if (images && images.length && layout === 'v3') {
      const text = [system, user].filter((t) => !!t).join('\n\n');
      messages = [{ role: 'user', content: images.map((u) => ({ type: 'image_url', image_url: { url: u } }))
        .concat([{ type: 'text', text }]) }];
    } else {
      const content = (!images || !images.length) ? user
        : [{ type: 'text', text: user }].concat(images.map((u) => ({ type: 'image_url', image_url: { url: u } })));
      messages = [{ role: 'system', content: system }, { role: 'user', content }];
    }
    this.lastSalvaged = false;
    const body = { model, messages, temperature };
    if (jsonMode) body.response_format = { type: 'json_object' };
    if (maxTokens) body.max_tokens = maxTokens;
    if (enableThinking !== null && enableThinking !== undefined) body.chat_template_kwargs = { enable_thinking: enableThinking };

    const text = await this.post(body);
    try {
      return extractJsonObject(text);
    } catch (e) {
      this.stats.decode_errors += 1;
      body.messages = messages.concat([{ role: 'assistant', content: String(text).slice(0, 4000) },
        { role: 'user', content: REPAIR }]);
      let firstError = e;
      try {
        return extractJsonObject(await this.post(body));
      } catch (e2) { firstError = e2; }
      this.stats.no_thinking_retries += 1;
      body.chat_template_kwargs = { enable_thinking: false };
      const bodies = [text];
      try {
        const retry = await this.post(body);
        bodies.push(retry);
        return extractJsonObject(retry);
      } catch (e3) { /* AIServiceError or unparsable: fall through to salvage */ }
      for (const candidate of bodies) {
        const salvaged = salvageJsonObject(candidate);
        if (salvaged !== null) {
          this.stats.decode_salvaged += 1;
          this.lastSalvaged = true;          // caller keeps the page flagged as not fully read
          return salvaged;
        }
      }
      throw new AiServiceError('AIResponseError: ' + firstError.message);
    }
  }

  // _post: transport retries with backoff; a 4xx is never retried (it is a request bug, and the injected
  // call throws it with aiError=true).  call(body) returns the gateway's parsed JSON, as httpx did.
  async post(body) {
    let last = null;
    for (let attempt = 0; attempt <= this.transportRetries; attempt++) {
      const t0 = Date.now();
      try {
        const payload = await this.call(body);
        const elapsed = Date.now() - t0;
        this.stats.calls += 1;
        this.stats.ms += elapsed;
        if (this.stats.call_ms.length < CALL_MS_SAMPLES) this.stats.call_ms.push(elapsed);
        const usage = (payload && payload.usage) || {};
        const details = usage.output_tokens_details || {};
        this.stats.prompt_tokens += Number(usage.prompt_tokens || 0);
        this.stats.completion_tokens += Number(usage.completion_tokens || 0);
        this.stats.reasoning_tokens += Number(details.reasoning_tokens || 0);
        this.lastUsage = usage;
        const choice = (((payload || {}).choices || [])[0] || {});
        const msg = choice.message || {};
        if (typeof msg.content !== 'string') throw new AiServiceError('AIResponseError: no message content');
        return msg.content;
      } catch (e) {
        if (e && e.aiError) throw e;                    // AIBadRequestError / AIResponseError: never retried
        last = (e && e.message) ? e.message : 'no detail';
        this.stats.transport_errors += 1;
        if (attempt < this.transportRetries) await sleep(Math.min(8000, Math.pow(2, attempt) * 1000));
      }
    }
    throw new AiServiceError('AITransportError: ' + last);
  }
}

function sleep(ms) { return new Promise((res) => setTimeout(res, ms)); }

// ------------------------------------------------------------- adapters/llm/ai_services.py
class AiLineMatcher {
  constructor(client, model, system) { this.c = client; this.model = model; this.system = system; }
  async propose(invoiceLines, receiptLines) {
    return this.c.chatJson(this.model, this.system,
      pyJson({ INVOICE_LINES: invoiceLines, RECEIPT_LINES: receiptLines }), { enableThinking: true });
  }
}

class AiQtyJudge {
  constructor(client, model, system) { this.c = client; this.model = model; this.system = system; }
  async judge(payload) {
    return this.c.chatJson(this.model, this.system, pyJson(payload), { temperature: 0.0, enableThinking: true });
  }
}

class AiEntityJudge {
  constructor(client, model, system) { this.c = client; this.model = model; this.system = system; }
  async nameEquivalent(invoiceName, candidates) {
    const r = await this.c.chatJson(this.model, this.system,
      pyJson({ task: 'name', INVOICE_NAME: invoiceName, CANDIDATES: candidates }));
    return (r && r.name !== undefined) ? r.name : r;
  }
  async parseAddress(address) {
    const r = await this.c.chatJson(this.model, this.system,
      pyJson({ task: 'address', INVOICE_ADDRESS: address }));
    return (r && r.address !== undefined) ? r.address : r;
  }
}

// Key that identifies one request on a recorded tape (harness/tape_key.py computes the same string in
// python).  Deliberately hash-free - only values both languages format identically - because the node runs
// this too when it replays a recorded document.  Numbers go through %g / Number() so python's 0.0 and
// JSON's 0 agree.
function aiRequestKey(body) {
  const roles = [];
  let textLen = 0, imgs = 0, pid = '';
  for (const m of (body || {}).messages || []) {
    roles.push(m.role || '');
    let blob = '';
    if (typeof m.content === 'string') blob = m.content;
    else for (const part of m.content || []) {
      if (part && part.type === 'image_url') imgs += 1;
      else blob += (part && typeof part === 'object' ? (part.text === undefined || part.text === null ? '' : part.text) : String(part));
    }
    textLen += blob.length;
    if (!pid && blob.indexOf('prompt_id') >= 0) {
      pid = blob.split('prompt_id:')[1].split('-->')[0].trim().split('\n')[0].slice(0, 40);
    }
  }
  const k = body.chat_template_kwargs || {};
  const thinking = ('enable_thinking' in k) ? (k.enable_thinking ? 'true' : 'false') : 'none';
  const num = (v) => (v === null || v === undefined) ? 'none' : String(Number(v));
  return [pid || roles.join('+'), 'len:' + textLen, String(imgs), String(body.model),
    num(body.temperature), num(body.max_tokens), body.response_format ? 'json' : 'none', thinking].join('|');
}

// Build the three services from one transport, exactly as container.build_services does.
function buildAiServices(std, opts) {
  const client = new AiClient({ call: opts.call, transportRetries: opts.transportRetries });
  const model = opts.model;
  const prompts = std.prompts || {};
  return {
    client,
    lineAi: new AiLineMatcher(client, model, prompts.v07_match),
    qtyAi: new AiQtyJudge(client, model, prompts.v08_qty),
    entityAi: new AiEntityJudge(client, model, prompts.v05_entity),
    models: opts.models || {},
  };
}
