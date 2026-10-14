import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('campaign arcs define the actual mission progression order', () => {
  const arcOrder = html.match(/const CAMP_ARCS=\[([^;]+)\];/)?.[1];
  assert.ok(arcOrder, 'The named campaign arcs must remain identifiable');
  const ids = [...arcOrder.matchAll(/ids:\[([0-9,]+)\]/g)]
    .flatMap((match) => match[1].split(',').map(Number));
  assert.deepEqual(ids, [0, 1, 2, 3, 4, 5, 8, 6, 7, 9, 10, 11, 12, 13],
    'Natural mission progression must follow the displayed arc sequence, not raw array order');
  assert.equal(new Set(ids).size, 14, 'Each of the 14 missions must occur once in the progression');
});

test('mission completion follows the next item in the campaign arc', () => {
  assert.match(html,
    /function nextCampaignMission\(i\)\{const order=CAMP_ARCS\.flatMap\(arc=>arc\.ids\),p=order\.indexOf\(i\);return p>=0&&p<order\.length-1\?order\[p\+1\]:null\}/,
    'The next mission must come from the declared campaign arc order');
  assert.match(html,
    /function endA\(\)\{if\(!cmp\)\{start\(\);return\}if\(S\.over==='win'\)\{const next=nextCampaignMission\(cmp\.i\);if\(next!==null\)\{bi=next;mode='brief'\}else\{mode='camp';ci=0\}\}else startScenario\(cmp\.i\)\}/,
    'Winning should open the next mission briefing, or return to the campaign list after the final mission');
  assert.doesNotMatch(html,
    /function endA\(\)\{[^}]*CAMP\[cmp\.i\+1\]/,
    'Mission completion must not advance by raw campaign-array index');
});

test('campaign-list lock rules use the previous mission in the same arc', () => {
  assert.match(html,
    /const CAMP_ARCS=\[\{n:'The Crown of Ashford',ids:\[0,1,2,3,4,5,8\]\},\{n:'Frontier Wars',ids:\[6,7\]\},\{n:'The Royal Campaign',ids:\[9,10,11\]\},\{n:'Coastal War',ids:\[12,13\]\}\]/,
    'Arc groupings must remain explicit and consistent');
  assert.match(html,
    /const m=CAMP\[i\],locked=j>0&&!dn\[arc\.ids\[j-1\]\]/,
    'Unlocking must use the previous mission in that arc');
});

console.log('campaign-progression: all 7 assertions passed');
