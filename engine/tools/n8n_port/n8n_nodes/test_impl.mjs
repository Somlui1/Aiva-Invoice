// Local dry-run of the n8n node "21 Validate (port)": same code path as the node, with
// helpers.httpRequest stubbed to serve the local files / the Oracle replay tape.
//   node n8n_nodes/test_impl.mjs            -> expects sha256:0a9446bd6ecf199316519545daaa21b70eb56f18c57deccddf29822aa2005103
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const cfg = JSON.parse(fs.readFileSync(path.join(HERE, 'port_config.json'), 'utf8'));
const tape = JSON.parse(fs.readFileSync(path.join(ROOT, 'fixtures', 'oracle_rows.json'), 'utf8'));
let qi = 0;

const helpers = {
  async httpRequest(o) {
    if (o.method === 'POST') {                                   // ORDS MCP sql_run -> tape
      const e = tape[qi++];
      if (!e) throw new Error('tape exhausted');
      const body = JSON.stringify({ result: { content: [{ type: 'text', text: e.csv || 'No rows selected' }] } });
      return o.returnFullResponse ? { statusCode: 200, headers: { 'content-type': 'application/json' }, body } : body;
    }
    const f = { 'bundle.js': 'dist/bundle.js', 'standard.json': 'standard.json', 'extraction.json': 'fixtures/extraction.json' }[path.basename(String(o.url).split('?')[0])];
    if (!f) throw new Error('stub: unknown url ' + o.url);
    const raw = fs.readFileSync(path.join(ROOT, f), 'utf8');
    return f.endsWith('.js') ? raw : JSON.parse(raw);            // httpRequest: JS = text, JSON = object
  }
};
const implSrc = fs.readFileSync(path.join(ROOT, 'n8n_nodes', '21_impl.js'), 'utf8');
const mod = { exports: {} };
new Function('module', 'exports', implSrc)(mod, mod.exports);

const out = await mod.exports.run({
  PORT: Object.assign({}, cfg, { fixtureCase: 'exec357' }),
  helpers, cfg: { doc_id: 23, model: 'nvidia/Qwen3.8-Flash-Next-NVFP4' },
  n12: { steps: [], images: {} }, n05: null, n08: null, n10: null, binary: {}
});
const item = out[0];
console.log('port block :', JSON.stringify(item.json.port));
const EXPECT = 'sha256:0a9446bd6ecf199316519545daaa21b70eb56f18c57deccddf29822aa2005103';
console.log('oracle calls:', qi, '| SHA MATCHES ENGINE:', item.json.port.payload_sha256 === EXPECT);
console.log('keys of result:', Object.keys(item.json.result).join(','));
console.log('serializable :', (() => { try { JSON.stringify(item.json); return 'yes (binary not embedded)'; } catch (e) { return 'NO: ' + e.message; } })());
fs.writeFileSync(path.join(ROOT, 'fixtures', 'payload_node21.json'), JSON.stringify(item.json.result, null, 1));
