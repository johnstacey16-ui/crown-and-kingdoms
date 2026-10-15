import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/mapgen.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/kingdom.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/campaign.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

test('campaign arcs define the actual mission progression order', () => {
  const arcOrder = html.match(/const CAMP_ARCS=\[([^;]+)\];/)?.[1];
  assert.ok(arcOrder, 'The named campaign arcs must remain identifiable');
  const ids = [...arcOrder.matchAll(/ids:\[([0-9,]+)\]/g)]
    .flatMap((match) => match[1].split(',').map(Number));
  assert.deepEqual(ids, [0, 1, 2, 3, 4, 5, 8, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    'Natural mission progression must follow the displayed arc sequence, not raw array order');
  assert.equal(new Set(ids).size, 18, 'Each of the 18 missions must occur once in the progression');
});

test('mission completion follows the next item in the campaign arc', () => {
  assert.match(html,
    /function nextCampaignMission\(i\)\{const order=CAMP_ARCS\.flatMap\(arc=>arc\.ids\),p=order\.indexOf\(i\);return p>=0&&p<order\.length-1\?order\[p\+1\]:null\}/,
    'The next mission must come from the declared campaign arc order');
  assert.match(html,
    /function endA\(\)\{if\(!cmp\)\{start\(\);return\}if\(S\.over==='win'\)\{const next=nextCampaignMission\(cmp\.i\);if\(next!==null\)\{bi=next;mode='brief'\}else\{mode='camp';ci=0\}\}else startScenario\(cmp\.i\)\}/,
    'Winning should open the next mission briefing, or return to the campaign list after the final mission');
  const endA = html.slice(html.indexOf('function endA()'), html.indexOf('function endB()'));
  assert.ok(endA.startsWith('function endA()'), 'The mission end handler must remain identifiable');
  assert.doesNotMatch(endA, /CAMP\[cmp\.i\+1\]/,
    'Mission completion must not advance by raw campaign-array index');
});

test('campaign-list lock rules use the filtered previous mission in the same arc', () => {
  assert.match(html,
    /const CAMP_ARCS=\[\{n:'The Crown of Ashford',ids:\[0,1,2,3,4,5,8\]\},\{n:'Frontier Wars',ids:\[6,7\]\},\{n:'The Royal Campaign',ids:\[9,10,11\]\},\{n:'Coastal War',ids:\[12,13,14\]\},\{n:'Northern March',ids:\[15\]\},\{n:'The Causeway Campaign',ids:\[16,17\]\}\]/,
    'Arc groupings must remain explicit and consistent');
  assert.match(html,
    /const m=CAMP\[i\],locked=j>0&&!dn\[ids\[j-1\]\]/,
    'Unlocking must use the previous valid mission in the displayed arc');
  assert.match(html,
    /ids=arc\.ids\.filter\(i=>Number\.isInteger\(i\)&&CAMP\[i\]&&typeof CAMP\[i\]\.t==='string'\)/,
    'Invalid or missing mission entries must be filtered before drawing or unlocking');
});

console.log('campaign-progression: all 10 assertions passed');
