import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const campaign = readFileSync(new URL('../js/campaign.js', import.meta.url), 'utf8');
const relicGoalLines = campaign.split('\n').filter(line => /S\.rel\.filter/.test(line));

assert.equal(relicGoalLines.length, 3, 'All three relic campaign objectives must remain represented');
for (const line of relicGoalLines) {
  assert.match(line, /\.m\.done/, 'Relics count toward a campaign objective only when stored in a completed monastery');
}
assert.match(campaign, /Hold 3 relics in your Monasteries/);
assert.match(campaign, /Return both relics to your Monastery/);

console.log('campaign-relic-objectives: relic goals require completed monasteries');
