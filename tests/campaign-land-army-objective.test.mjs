import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const campaign = readFileSync(new URL('../js/campaign.js', import.meta.url), 'utf8');
assert.match(campaign, /t:'Have 12 land soldiers alive',ok:\(\)=>aliveUnits\(0\)\.filter\(u=>U\[u\.k\]\.dmg>0&&!U\[u\.k\]\.sh&&!\['vil','king','mon'\]\.includes\(u\.k\)\)\.length>=12/,
  'The land-soldier objective must count combat-capable land units, not trade carts');
console.log('campaign-land-army-objective: noncombat units do not count as soldiers');
