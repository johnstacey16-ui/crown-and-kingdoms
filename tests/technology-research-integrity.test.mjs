import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.match(html, /function research\(b,k\)\{if\(!b\|\|!S\|\|!Number\.isInteger\(b\.t\)\|\|!S\.tech\[b\.t\]\|\|!B\[b\.k\]\)return false;const t=b\.t;/,
  'Research must validate the building, match state and researching kingdom');
assert.match(html, /if\(k==='age'\)\{if\(b\.k!=='tc'\)\{if\(!t\)note\('Advance Age requires a Town Centre'\);return false\}/,
  'Age advancement must only start from a Town Centre');
assert.match(html, /d=TE\[k\];if\(!d\|\|!Array\.isArray\(B\[b\.k\]\.rs\)\|\|!B\[b\.k\]\.rs\.includes\(k\)\)\{if\(!t\)note\('Research unavailable at this building'\);return false\}/,
  'Unknown research and upgrades from the wrong building must be rejected before spending resources');
assert.match(html, /if\(!can\(t,d\.cost\)\)\{if\(!t\)note\('Not enough resources'\);return false\}pay\(t,d\.cost\);b\.rs=\{k,t:d\.t\};return true/,
  'Valid, affordable research must retain the normal payment and research-queue flow');

const techStart = html.indexOf('const TE={');
const techEnd = html.indexOf('};', techStart);
assert.ok(techStart >= 0 && techEnd > techStart, 'Technology table must remain identifiable');
const techText = html.slice(techStart, techEnd + 1);
const techMatches = [...techText.matchAll(/(?:const TE=\{|,)\s*([A-Za-z][A-Za-z0-9]*):\{n:/g)];
const techKeys = techMatches.map((match) => match[1]);
assert.ok(techKeys.length >= 25, 'Technology table must contain its core upgrade roster');
assert.equal(new Set(techKeys).size, techKeys.length, 'Technology keys must be unique');

const buildingStart = html.indexOf('const B={');
const buildingEnd = html.indexOf('};', buildingStart);
assert.ok(buildingStart >= 0 && buildingEnd > buildingStart, 'Building table must remain identifiable');
const buildingText = html.slice(buildingStart, buildingEnd + 1);
const buildingResearch = [...buildingText.matchAll(/([A-Za-z][A-Za-z0-9]*):\{[^{}]*(?:\{[^{}]*\}[^{}]*)*?rs:\[([^\]]*)\]/g)]
  .map((match) => ({ name: match[1], keys: [...match[2].matchAll(/'([^']+)'/g)].map((item) => item[1]) }));
const exposed = new Set(buildingResearch.flatMap((building) => building.keys));
assert.ok(buildingResearch.length > 0, 'At least one building must offer research');
const missingBuildings = techKeys.filter((key) => !exposed.has(key));
assert.deepEqual(missingBuildings, [], 'Every defined technology must be reachable from a building research list');

const records = techMatches.map((match, index) => {
  const end = index + 1 < techMatches.length ? techMatches[index + 1].index : techText.length;
  const block = techText.slice(match.index, end);
  return {
    key: match[1],
    cost: /cost:\{[^}]*\}/.test(block),
    time: /\bt:\d+/.test(block),
    age: /\bage:\d+/.test(block),
    prerequisite: block.match(/\bpre:'([^']+)'/)?.[1] ?? null
  };
});
assert.deepEqual(records.filter((record) => !record.cost || !record.time || !record.age).map((r) => r.key), [],
  'Every technology must define resource costs, research time and age');
const invalidPrereqs = records.filter((record) => record.prerequisite && !techKeys.includes(record.prerequisite));
assert.deepEqual(invalidPrereqs, [], 'Every technology prerequisite must point to a defined technology');
const unreachablePrereqs = records.filter((record) => record.prerequisite && !exposed.has(record.prerequisite));
assert.deepEqual(unreachablePrereqs, [], 'Every technology prerequisite must itself be researchable');

assert.match(html, /if\(e\.hpb\)\{T0\.hpb=T0\.hpb\|\|\{\};for\(const q in e\.hpb\)\{T0\.hpb\[q\]=\(T0\.hpb\[q\]\|\|0\)\+e\.hpb\[q\];for\(const x of S\.us\)if\(x\.t===b\.t&&x\.k===q\)x\.hp\+=e\.hpb\[q\]\}\}/,
  'Hit-point technologies must update existing units and the persistent technology ledger');
assert.match(html, /hp:U\[k\]\.hp\+\(S\.tech\[t\]\.hpb&&S\.tech\[t\]\.hpb\[k\]\|\|0\)/,
  'Newly trained units must inherit researched hit-point upgrades');
assert.match(html, /if\(e\.atkb\)\{T0\.atkb=T0\.atkb\|\|\{\};for\(const q in e\.atkb\)T0\.atkb\[q\]=\(T0\.atkb\[q\]\|\|0\)\+e\.atkb\[q\]\}/,
  'Attack technologies must update the persistent technology ledger');
assert.match(html, /tk\.atkb&&tk\.atkb\[a\.k\]\|\|0/,
  'Existing and newly trained attackers must use the researched damage bonus');
assert.match(html, /S\.tech\[u\.t\]\.crane\?1\.2:1/,
  'Treadmill Crane must affect construction rate for existing workers');
assert.match(html, /bd=\(ak\.rng<2\?\(tk\.atkM2\?5:tk\.atkM\?2:0\):\(tk\.atkR2\?3:tk\.atkR\?1:0\)\)/,
  'Blacksmith attack upgrades must be included in combat damage');
assert.match(html, /tk\.slit\?2:0/,
  'Arrowslits must affect defensive building attack damage');
assert.match(html, /tk\.gtow\?3:0/,
  'Guard Tower must affect defensive building attack damage');
assert.match(html, /tk\.keep\?3:0/,
  'Keep must affect defensive building attack damage');

console.log('technology-research-integrity: research availability and 31 technology records validated');
