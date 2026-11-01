import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
const buildingUpdates = readFileSync(new URL('../js/simulation-building-updates.js', import.meta.url), 'utf8');
assert.ok(ai.includes("vil.length+tc.q.filter(q=>q&&q.k==='vil').length<"),
  'AI worker target counts only queued villagers, not queued military units');
assert.ok(ai.includes("popOf(t)+5>capOf(t)"),
  'AI housing includes all queued units');
assert.ok(ai.includes('blood:68'), 'AI has explicit Bloodlines valuation');
assert.ok(ai.includes("if(k==='blood'&&ownCav>=3)score+=26"),
  'Bloodlines priority rises when fielding cavalry');
assert.ok(ai.includes("if(k==='blood'&&ownCav<2)score-=26"),
  'Bloodlines priority falls when cavalry are absent');
assert.ok(buildingUpdates.includes('x.k===q&&x.hp>0)x.hp+=e.hpb[q]'),
  'HP upgrades must not revive dead units');
console.log('ai-research-and-housing-policy: passed');
