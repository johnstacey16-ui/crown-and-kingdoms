import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const campaign = readFileSync(new URL('../js/campaign.js', import.meta.url), 'utf8');
assert.match(campaign, /aliveUnits=\(t,k\)=>S\.us\.filter\(u=>u&&Number\.isInteger\(u\.t\)&&u\.t===t&&u\.hp>0&&!u\.ld&&U\[u\.k\]&&\(!k\|\|u\.k===k\)\)/,
  'Campaign live-unit objectives must ignore null records, unknown unit types, and garrisoned units');
assert.match(campaign, /t:'Have 3 War Galleys alive',ok:\(\)=>aliveUnits\(0,'gal'\)\.length>=3/,
  'Fleet objectives must count only live, active war galleys');
assert.match(campaign, /t:'Field 2 Bombard Cannons alive',ok:\(\)=>aliveUnits\(0,'bomb'\)\.length>=2/,
  'Siege objectives must count only live, active bombard cannons');
assert.match(campaign, /t:'Keep 15 land soldiers alive',ok:\(\)=>aliveUnits\(0\)\.filter/,
  'Survival objectives must use the guarded live-unit roster');
assert.match(campaign, /cmp\.i===5&&!S\.us\.some\(u=>u&&u\.t===0&&u\.k==='king'&&u\.hp>0\)\)\{endGame\('lose','Your King has fallen'\);return\}/,
  'The Last Crown must end in defeat immediately when the player King is dead or missing (a garrisoned King is still alive)');
console.log('campaign-live-unit-guards: active army and fleet objectives ignore invalid and garrisoned records');
