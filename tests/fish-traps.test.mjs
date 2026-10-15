import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/mapgen.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

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
  assert.match(html, /if\(!n&&R\.w>=100\)\{deployFishTrap\(\[s\]\);n=findNode\(s,'f',32\)\}/);
});
