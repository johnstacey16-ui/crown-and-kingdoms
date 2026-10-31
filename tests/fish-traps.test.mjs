import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCoreGameSource} from '../scripts/runtime-sources.mjs';
const html = loadCoreGameSource({includeUI:true,includeAssets:true});

test('fishing ships can deploy a renewable fish trap for wood', () => {
  assert.match(html, /function deployFishTrap\(ships\)/);
  assert.match(html, /S\.res\[u\.t\]\.w<100/);
  assert.match(html, /amt:900,fi:1,trap:1,t:u\.t/);
  assert.match(html, /S\.wt\[i\]===1&&!S\.nd\[i\]/);
});

test('fish traps are accessible from the fishing ship controller menu', () => {
  assert.match(html, /title:'Fishing Ship',i:0,items:\[\{l:'Deploy Fish Trap \(-100 Wood\)'/);
  assert.match(html, /deployFishTrap\(S\.sel\)/);
});

test('fish traps visually distinguish themselves and replenish instead of disappearing', () => {
  assert.match(html, /if\(tg\.trap\)\{tg\.amt=900/);
  assert.match(html, /if\(n\.trap\)\{X\.strokeStyle='#d7b36a'/);
});

test('AI fishing ships deploy traps when nearby fish resources run out', () => {
  assert.match(html, /if\(!target&&R\.w>=100&&S\.t>=\(s\.nextFishTrapAt\|\|0\)\)\{s\.nextFishTrapAt=S\.t\+45;deployFishTrap\(\[s\]\)/,
    'AI trap construction must require wood, zero reachable fishing targets and a 45-second cooldown');
  assert.match(html, /for\(const n of S\.nodes\.filter\(n=>n\.k==='f'&&n\.fi&&n\.amt>0&&\(!n\.trap\|\|n\.t===s\.t\)/,
    'AI must re-examine accessible fish, respecting fish-trap ownership before choosing a new route');
});
