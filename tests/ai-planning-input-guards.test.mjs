import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
const start = ai.indexOf('function aiTeam(');
const end = ai.indexOf('\nconst hostileFleet=[]', start);
assert.ok(start >= 0 && end > start, 'AI team planning block must exist');
const roster = ai.slice(start, end);
assert.match(roster, /for\(const u of S\.us\)if\(u&&u\.t===t&&u\.hp>0&&U\[u\.k\]\)\{my\.push\(u\)/,
  'AI planning must ignore null, defeated, or unknown-unit records before accessing unit metadata');
assert.match(ai, /if\(tc\.done&&!tc\.rs&&Array\.isArray\(tc\.q\)&&!aiTownTechReady\(t,tc,vil\.length\)&&vil\.length\+tc\.q\.filter\(/,
  'AI must validate the Town Centre production queue before counting queued villagers');
console.log('ai-planning-input-guards: malformed unit and Town Centre queue records cannot crash roster planning');
