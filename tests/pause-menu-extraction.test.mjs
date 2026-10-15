import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const input = readFileSync(new URL('../js/input.js', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const input = readFileSync(new URL('../js/input.js', import.meta.url), 'utf8');

test('pause-menu model and drawing have one owner in the shared UI module', () => {
  assert.ok(html.indexOf('./js/ui.js') >= 0);
  assert.ok(html.indexOf('./js/ui.js') < html.indexOf('./engine.js'));
  assert.match(ui, /const GSP=\[\.5,1,1\.5,2,3\]/);
  assert.match(ui, /function pmItems\(\)\{[\s\S]*?\{n:'Resume',a:\(\)=>\{mode='play'\}\}/);
  assert.match(ui, /function drawPause\(\)\{/);
  assert.doesNotMatch(engine, /const GSP=/);
  assert.doesNotMatch(engine, /function pmItems\(\)/);
  assert.doesNotMatch(engine, /function drawPause\(\)/);
});

test('B or Menu resumes the paused game instead of navigating to the title screen', () => {
  assert.match(input, /if\(mode==='pause'\)\{const PI=pmItems\(\);[\s\S]{0,450}if\(E\[9\]\|\|E\[1\]\)mode='play';return\}/);
  assert.match(ui, /\{n:'Resume',a:\(\)=>\{mode='play'\}\}/);
});

test('controller-remap presentation is in js/ui.js and its actions remain in js/input.js', () => {
  assert.ok(ui.includes("const RA=[[0,'Select / command']"));
  assert.ok(ui.includes("function drawRemap(){"));
  assert.ok(!engine.includes("const RA="));
  assert.ok(!engine.includes("function drawRemap()"));
  assert.ok(engine.includes("const sv=()=>"));
  assert.ok(input.includes("BM[RA[ri][0]]=b;rw=0;sv()"));
  assert.ok(input.includes("if(ER[2]){BM={};sv()}"));
  assert.ok(input.includes("if(ER[9]||ER[1])mode=rbk;return"));
});
