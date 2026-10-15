import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/mapgen.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/kingdom.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/campaign.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

test('timed raids safely stop after the enemy Town Centre is destroyed', () => {
  const raidStart = html.indexOf('function raid(');
  const raidEnd = html.indexOf('\nconst CAMP=', raidStart);
  const raid = html.slice(raidStart, raidEnd);
  assert.ok(raidStart >= 0 && raidEnd > raidStart, 'The campaign raid helper must remain identifiable');
  assert.match(raid, /const e=tcOf\(1\);if\(!e\)return;const tg=/,
    'The raid helper must return before using the enemy Town Centre position');
});

test('campaign arcs define the actual mission progression order', () => {
  const arcOrder = html.match(/const CAMP_ARCS=\[([^;]+)\];/)?.[1];
  assert.ok(arcOrder, 'The named campaign arcs must remain identifiable');
  const ids = [...arcOrder.matchAll(/ids:\[([0-9,]+)\]/g)]
    .flatMap((match) => match[1].split(',').map(Number));
  assert.deepEqual(ids, [0, 1, 2, 3, 4, 5, 8, 6, 7, 9, 10, 11, 12, 13, 14, 15, 18, 16, 17],
    'Natural mission progression must follow the displayed arc sequence, not raw array order');
  assert.equal(new Set(ids).size, 19, 'Each of the 19 missions must occur once in the progression');
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
    /const CAMP_ARCS=\[\{n:'The Crown of Ashford',ids:\[0,1,2,3,4,5,8\]\},\{n:'Frontier Wars',ids:\[6,7\]\},\{n:'The Royal Campaign',ids:\[9,10,11\]\},\{n:'Coastal War',ids:\[12,13,14\]\},\{n:'Northern March',ids:\[15,18\]\},\{n:'The Causeway Campaign',ids:\[16,17\]\}\]/,
    'Arc groupings must remain explicit and consistent');
  assert.match(html,
    /const m=CAMP\[i\],locked=j>0&&!dn\[ids\[j-1\]\]/,
    'Unlocking must use the previous valid mission in the displayed arc');
  assert.match(html,
    /ids=arc\.ids\.filter\(i=>Number\.isInteger\(i\)&&CAMP\[i\]&&typeof CAMP\[i\]\.t==='string'\)/,
    'Invalid or missing mission entries must be filtered before drawing or unlocking');
});

test('destroy-castle objectives ignore destroyed castle records', () => {
  const castleGoals = html.split('\n').filter(line => /t:'(?:Destroy the enemy Castle|Destroy Tidewatch Castle)'/.test(line));
  assert.equal(castleGoals.length, 4, 'All four castle-destruction objectives must remain covered');
  for (const goal of castleGoals) {
    assert.match(goal, /b\.hp>0/, 'A castle with zero health must count as destroyed even if its record remains in S.bs');
  }
});

test('multi-objective naval campaigns cannot bypass remaining objectives on Town Centre destruction', () => {
  assert.doesNotMatch(html, /tcw:1/,
    'Campaign Town Centre destruction must be evaluated by cmpTick alongside the mission\'s other objectives, not force an immediate win');
  const tickStart = html.indexOf('function cmpTick(');
  const tickEnd = html.indexOf('\nfunction endA()', tickStart);
  const tick = html.slice(tickStart, tickEnd);
  assert.match(tick, /if\(all\)\{S\.over='win';mode='end';campMark\(cmp\.i\)/,
    'Campaign victory must wait until every listed objective has completed');
});

test('destroyed Town Centres no longer block campaign objectives or timed-raid shutdown', () => {
  assert.match(html, /const tcOf=t=>S\.bs\.find\(b=>b\.t===t&&b\.k==='tc'&&b\.hp>0\)/,
    'Campaign Town Centre lookup must ignore retained zero-health building records');
  assert.match(html, /function raid\(n,ks,msg\)\{const e=tcOf\(1\);if\(!e\)return;/,
    'Timed raids must stop once the enemy Town Centre has no remaining health');
});


test('leaving campaign restores every pre-campaign setup option', () => {
  assert.match(html,
    /function restoreCampaignPrefs\(\)\{if\(PRF\)\{\(\{civ,msz,mt,mapLayout,diff,aip,vm,scoreLimit\}=PRF\);PRF=null\}\}/,
    'Leaving campaign must restore civilisation, map, difficulty, AI, victory mode and score duration');
  assert.match(html,
    /function leaveCampaign\(\)\{restoreCampaignPrefs\(\);cmp=null;seedOv=null;aiCiv=-1;mode='title'\}/,
    'Campaign exit must clear campaign state and restore normal title-menu mode');
  assert.match(html,
    /\{n:'Back',a:\(\)=>\{leaveCampaign\(\)\}\}/,
    'The campaign list Back action must use the shared exit handler');
  assert.match(html,
    /function campCtl\(\)\{[^}]*if\(E\[1\]\)leaveCampaign\(\)\}/,
    'The controller Back input must use the shared exit handler');
  assert.match(html,
    /function endB\(\)\{if\(cmp\)\{if\(S\.over==='win'&&nextCampaignMission\(cmp\.i\)===null\)\{leaveCampaign\(\)\}else\{mode='camp';ci=0\}\}else leaveCampaign\(\)\}/,
    'Leaving the final mission results screen must restore the saved setup');
});


test('Last Crown does not treat a safely garrisoned King as defeated', () => {
  assert.match(html,
    /if\(cmp\.i===5&&!S\.us\.some\(u=>u&&u\.t===0&&u\.k==='king'&&u\.hp>0\)\)\{endGame\('lose','Your King has fallen'\);return\}/,
    'The King remains alive while garrisoned; only a dead or missing King loses the mission');
  const kingCheck = html.slice(html.indexOf('if(cmp.i===5'), html.indexOf('cmp.t+=dt', html.indexOf('if(cmp.i===5')));
  assert.doesNotMatch(kingCheck, /!u\.ld/,
    'Garrison state must not be mistaken for death');
});

console.log('campaign-progression: regression assertions passed');
