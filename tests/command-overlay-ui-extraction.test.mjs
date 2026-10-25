import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

test('radial menu, control-group and quick-select drawing live in js/ui.js', () => {
  assert.ok(html.indexOf('./js/ui.js') < html.indexOf('./engine.js'));
  for (const marker of ['const DS={','function stt(a){','function drawRadial(){','function drawCg(){','function quickBar(){']) {
    assert.ok(ui.includes(marker), marker+' must be UI-owned');
    assert.ok(!engine.includes(marker), marker+' must not be duplicated in engine.js');
  }
  assert.match(ui, /function hud\(\)[\s\S]*?quickBar\(\)/);
  assert.match(ui, /DS\[sit\.l\]/);
  assert.match(ui, /stt\(a\)/);
});

test('draw loop and command state remain connected to the extracted overlays', () => {
  assert.match(ui, /function drawGameOverlays\(dt\)\{[\s\S]*?if\(menu&&menu\.rad\)drawRadial\(\);if\(cgo\)drawCg\(\)/);
  assert.match(engine, /drawWorld\(\);[\s\S]{0,160}?drawGameOverlays\(dt\)/);
  assert.match(engine, /function openRadial\(wx,wy\)\{/);
  assert.match(engine, /function playCtl\(dt\)\{/);
  assert.match(engine, /let aDown=null/);
});
