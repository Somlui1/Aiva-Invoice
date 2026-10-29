#!/usr/bin/env node
/** Print the tests affected by files: `node scripts/patch/affected-tests.mjs src/lib/i18n.ts server/app.ts` */
import { affectedTests } from './lib.mjs'
const argv = process.argv.slice(2)
const r = affectedTests(argv.filter(a => a !== '--deep'), { depth: argv.includes('--deep') ? Infinity : 1 })
console.log(r.full ? `FULL SUITE (${r.reason})` : r.tests.join('\n') || '(no tests import these files)')
