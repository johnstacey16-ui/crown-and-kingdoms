import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
const start = ai.indexOf('function aiTeam(');
const end = ai.indexOf('\nconst hostileFleet=[]', start);
assert.ok(start >= 0 && end > start, 'AI team planning block must exist');
const roster = ai.slice(start, end);
assert.match(roster, /for\(const u of S\.us\)if\(u&&u\.t===t&&u\.hp>0&&U\[u\.k\]\)\{my\.push\(u\)/,
  'AI planning must ignore null, defeated, or unknown-unit records before accessing unit metadata');
assert.match(ai, /if\(vil\.length<[\s\S]{0,100}&&Array\.isArray\(tc\.q\)&&tc\.q\.length<2&&/,
  'AI must not read a Town Centre production queue length unless the queue is an array');
console.log('ai-planning-input-guards: malformed unit and Town Centre queue records cannot crash roster planning');
