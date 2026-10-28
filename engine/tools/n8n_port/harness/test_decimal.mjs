// Decimal division must mean the same thing here as in python.  This test exists because the first port
// of dDiv divided (a.v * 10^(dec + b.s)) by b.v and forgot the dividend's own scale, so 75000.00/250000.00
// became 30.000 instead of 0.300 - and the number went straight into V-07's price tolerance and, on
// DMS-116, into a quantity the Portal showed.
//
//   node harness/test_decimal.mjs
//
// Expectations below are python's own answers:
//   python -c "from decimal import Decimal; print((Decimal(a)/Decimal(b)).quantize(Decimal(1).scaleb(-dec)))"
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const require = createRequire(import.meta.url);
const P = require(path.join(ROOT, 'dist', 'bundle.cjs'));

const CASES = [
  ['75000.00', '250000.00', 3, '0.300'],
  ['75000.00', '250000.00', 12, '0.300000000000'],
  ['1', '3', 6, '0.333333'],
  ['-7', '2', 3, '-3.500'],
  ['7', '-2', 3, '-3.500'],
  ['-7', '-2', 4, '3.5000'],
  ['2250.00', '1.00', 4, '2250.0000'],
  ['0.05', '3', 20, '0.01666666666666666667'],
  ['1.005', '2', 2, '0.50'],            // HALF_EVEN: 0.500 -> 0.50 (even)
  ['0.015', '2', 2, '0.01'],            // HALF_EVEN: 0.0075 -> 0.01? no: 0.0075 rounds to 0.01 only above half
  ['1', '8', 3, '0.125'],
  ['5', '10', 1, '0.5'],
  ['2.5', '2', 2, '1.25'],
  ['3.5', '2', 2, '1.75'],
  ['12345678901234567890', '7', 4, '1763668414462081127.1429'],
  ['0.1', '0.3', 5, '0.33333'],
  ['100', '3', 2, '33.33'],
  ['-0.300', '1', 3, '-0.300'],
  ['1000000', '0.001', 2, '1000000000.00'],
  ['0', '5', 3, '0.000'],
  ['999.99', '1000', 6, '0.999990'],
];

let bad = 0;
for (const [a, b, dec, want] of CASES) {
  const got = P.dStr(P.dDiv(P.D(a), P.D(b), dec));
  const ok = got === want;
  if (!ok) { bad++; console.log(`  dDiv(${a}, ${b}, ${dec})  python=${want}  port=${got}`); }
}
// the money paths that use it
const q = P.dDiv(P.D('0.02'), P.D('157.50'), 12);
if (P.dStr(q) !== '0.000126984127') { bad++; console.log('  price tolerance ratio:', P.dStr(q)); }
const frac = P.dDiv(P.D('0.3'), P.D('1'), 20);
if (P.dStr(frac) !== '0.30000000000000000000') { bad++; console.log('  receipt fraction:', P.dStr(frac)); }

console.log(bad ? `dDiv: ${bad} case(s) disagree with python` : `dDiv matches python Decimal on ${CASES.length + 2} cases`);
process.exitCode = bad ? 1 : 0;
