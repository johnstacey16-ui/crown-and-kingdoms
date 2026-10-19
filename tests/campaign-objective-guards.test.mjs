import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Consolidates the former land-army, ranged-army and relic objective tests.
// Keep each assertion intact while eliminating two separate Node processes.
const campaign = readFileSync(new URL('../js/campaign.js', import.meta.url), 'utf8');

test('land-army objectives count only actual land combat units', () => {
  assert.match(campaign, /t:'Have 12 land soldiers alive',ok:\(\)=>aliveUnits\(0\)\.filter\(u=>U\[u\.k\]\.dmg>0&&!U\[u\.k\]\.sh&&!\['vil','king','mon'\]\.includes\(u\.k\)\)\.length>=12/,
    'The land-soldier objective must count combat-capable land units, not trade carts');
});

test('ranged objectives exclude melee, civilians and siege units', () => {
  assert.match(campaign, /t:'Train 6 ranged soldiers',ok:\(\)=>aliveUnits\(0\)\.filter\(u=>U\[u\.k\]\.rng>=4&&!U\[u\.k\]\.sh&&!\['vil','mon','king','ram','mang','scor','treb','bomb'\]\.includes\(u\.k\)\)\.length>=6/,
    'The ranged-soldier objective must count living ranged combat units rather than every military unit');
  assert.doesNotMatch(campaign, /t:'Train 6 ranged soldiers',ok:\(\)=>cmil\(0\)>=6/,
    'Melee troops must not satisfy a ranged-soldier objective');
});

test('three separate relic mission objectives require completed monasteries', () => {
  const relicGoalLines = campaign.split('\n').filter(line => /S\.rel\.filter/.test(line));
  assert.equal(relicGoalLines.length, 3, 'All three relic campaign objectives must remain represented');
  for (const line of relicGoalLines) {
    assert.match(line, /\.m\.done/, 'Relics count toward a campaign objective only when stored in a completed monastery');
  }
  assert.match(campaign, /Hold 3 relics in your Monasteries/);
  assert.match(campaign, /Return both relics to your Monastery/);
});
