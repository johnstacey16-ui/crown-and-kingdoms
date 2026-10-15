import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

test('save-slot menu model and drawing live in js/ui.js', () => {
  assert.ok(html.indexOf('./js/ui.js') < html.indexOf('./engine.js'));
  assert.match(ui, /const slotItems=\(\)=>\{const items=SI\.map\(/);
  assert.match(ui, /function drawSlots\(\)\{titleBg\(\);drawList\(/);
  assert.doesNotMatch(engine, /const slotItems=\(\)/);
  assert.doesNotMatch(engine, /function drawSlots\(\)/);
});

test('save-slot orchestration and existing callbacks remain intact', () => {
  assert.match(engine, /function refreshSlots\(\)\{/);
  assert.match(engine, /function openSlots\(m,back\)\{/);
  assert.match(engine, /function slotsCtl\(\)\{const it=slotItems\(\),n=it\.length;/);
  assert.match(ui, /if\(sm==='save'\)\{slot=n;saveG\(\);refreshSlots\(\);mode=sb\}else if\(ok\)\{slot=n;if\(loadG\(\)\)mode='play'\}/);
  assert.match(ui, /x==='bad'\?'This slot cannot be read\.'/);
  assert.match(ui, /A: '\+\(sm==='save'\?'save here':'load'\)\+'    B: back'/);
});
