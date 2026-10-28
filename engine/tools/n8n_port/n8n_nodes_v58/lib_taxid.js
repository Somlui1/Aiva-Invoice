// lib_taxid.js — the engine's tax-id rule, in one place so the two canvas copies cannot drift.
//
// Engine sources of truth:
//   perception/single_pass.py::tax_id_problem  — why an answer cannot be trusted (the R6-13 trigger)
//   domain/normalize.py::tax_id                — 13 digits + the Thai weighted check digit
//
// Two details here are not decoration, they are why this file exists:
//   * the weights are (13 - i) over the FIRST TWELVE digits and the check is (11 - sum%11)%10 — the popular
//     "10..2 over eleven digits" variant of the Thai rule gives different verdicts on real numbers;
//   * normalize.tax_id first maps Thai digits (๐-๙) to Arabic, drops every non-digit, and accepts a
//     twelve-digit id starting 0155 when "011"+rest passes the checksum — DMS ids are printed both ways.
//   * the message text is the engine's Invalid code, and it is not cosmetic: it lands in
//     extraction.extra.taxid_retry[].reason, which the assembler copies verbatim into the payload hash.
//
// Nodes 09t (decide) and 09d (accept/reject) each carry an INLINED copy — a n8n Code node ships as one file —
// and harness/test_taxid_parity.py checks those copies are byte-identical to the block below AND that the
// block agrees with python's tax_id_problem on every answer in the recorded corpus.
// >>>TAXID-BLOCK-START>>>
function thaiToArabic(s) {                                // domain.normalize.thai_to_arabic
  // The codepoints come from the ENGINE's table, not from what the Thai comment above suggests:
  // normalize.py:11 builds THAI_DIGITS from U+0E50-U+0E59 (Tai Tham), while ordinary Thai digits live
  // at U+0E60-U+0E69 — so the engine converts one set and not the other. Copying that is deliberate:
  // 'fixing' it here would make the flow accept a reading the engine rejects (divergence, not parity).
  // harness/test_taxid_parity.py asserts the same asymmetry on both sides.
  return String(s == null ? '' : s).replace(/[๐-๙]/g, (c) => String(c.charCodeAt(0) - 0x0E50));
}
function taxId(raw) {                                     // domain.normalize.tax_id; throws like Invalid
  let d = thaiToArabic(raw).replace(/\D/g, '');
  if (d.length === 12 && d.indexOf('0155') === 0) {       // the 0155xxxxxxxxx shorthand for 011xxxxxxxxxx
    const cand = '011' + d.slice(2);
    const cn = cand.split('').map(Number);
    let s2 = 0;
    for (let i = 0; i < 12; i++) s2 += cn[i] * (13 - i);
    if ((11 - (s2 % 11)) % 10 === cn[12]) d = cand;
  }
  if (d.length !== 13) throw new Error('TAX_ID_NOT_13_DIGITS');
  const n = d.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += n[i] * (13 - i);
  if ((11 - (sum % 11)) % 10 !== n[12]) throw new Error('TAX_ID_CHECKSUM');
  return d;
}
function taxIdProblem(answer) {                            // perception/single_pass.py::tax_id_problem
  const fields = (answer || {}).fields || {};
  const rawOf = (c) => {
    let v = c && typeof c === 'object' ? (c.raw !== undefined ? c.raw : (c.text !== undefined ? c.text : c.value)) : c;
    if (v == null) return null;
    const t = String(v).trim();
    if (!t || ['null', 'none', '-', 'n/a'].indexOf(t.toLowerCase()) >= 0) return null;
    return t;
  };
  for (const name of ['supplier_tax_id', 'customer_tax_id']) {
    const raw = rawOf(fields[name]);
    if (raw === null || raw === '') {
      if (name === 'supplier_tax_id') return 'TAX_ID_MISSING';    // printed on nearly every Thai tax invoice
      continue;                                                   // an absent customer id is not a trigger
    }
    try { taxId(raw); } catch (e) { return String(e.message); }
  }
  return null;
}
// <<<TAXID-BLOCK-END<<<
