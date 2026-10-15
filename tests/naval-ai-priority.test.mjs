import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/mapgen.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

test('AI war galleys favour enemy warships and focus a shared target', () => {
  assert.match(html, /const focus=e=>galleys\.filter\(u=>u\.o==='a'&&u\.tg===e\)\.length,navalTargetScore=\(e\)=>/);
  assert.match(html, /navalTargetScore=\(e\)=>Math\.hypot\(e\.x-ship\.x,e\.y-ship\.y\)-\(e\.k==='gal'\?6:0\)\+\(U\[e\.k\]\.dmg>=4\?0:10\)-Math\.min\(3,focus\(e\)\)\*4/,
    'naval target scoring must combine distance, combat capability, galley priority and coordinated focus');
  assert.match(html, /hostileShips\.slice\(\)\.sort\(\(a,b\)=>navalTargetScore\(a\)-navalTargetScore\(b\)\)/,
    'galleys must choose targets using the shared naval scoring function');
  assert.match(html, /if\(enemy&&Math\.hypot\(enemy\.x-ship\.x,enemy\.y-ship\.y\)<28\)/);
});
