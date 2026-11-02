import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const commands = readFileSync(new URL('../js/ui-commands.js', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const render = readFileSync(new URL('../js/render.js', import.meta.url), 'utf8');
const input = readFileSync(new URL('../js/input.js', import.meta.url), 'utf8');
const policy = readFileSync(new URL('../js/input-selection.js', import.meta.url), 'utf8');
const picture = readFileSync(new URL('../js/engine-picture.js', import.meta.url), 'utf8');

test('radial menu, control-group and quick-select drawing live only in js/ui-commands.js', () => {
  assert.ok(html.indexOf('./js/ui.js') < html.indexOf('./js/ui-commands.js'));
  assert.ok(html.indexOf('./js/ui-commands.js') < html.indexOf('./engine.js'));
  assert.ok(html.includes('./js/ui-commands.js'));
  for (const marker of ['const DS={','function stt(a){','function drawRadial(){','function drawCg(){','function quickBar(){']) {
    assert.ok(commands.includes(marker), marker+' must be command-overlay-owned');
    assert.ok(!ui.includes(marker),marker+' must not be duplicated in ui.js');
    assert.ok(!engine.includes(marker), marker+' must not be duplicated in engine.js');
  }
  assert.match(ui, /function hud\(\)[\s\S]*?quickBar\(\)/);
  assert.match(commands, /DS\[sit\.l\]/);
  assert.match(commands, /stt\(a\)/);
});

test('draw loop and command state remain connected to the extracted overlays', () => {
  assert.match(ui, /function drawGameOverlays\(dt\)\{[\s\S]*?if\(menu&&menu\.rad\)drawRadial\(\);if\(cgo\)drawCg\(\)/);
  assert.match(render, /else drawWorld\(\);[\s\S]*?const uiStart=perfHud\?performance\.now\(\):0/);
  assert.match(picture, /try\{drawGameOverlays\(dt\)\}finally\{X=WORLD_X\}/);
  assert.match(picture, /else drawGameOverlays\(dt\)/);
  assert.match(render, /drawXboxHudOverlays\(dt\)/);
  assert.match(policy, /function openRadial\(wx,wy\)\{/);
  assert.doesNotMatch(input, /function openRadial\(wx,wy\)\{/);
  assert.doesNotMatch(engine, /function openRadial\(wx,wy\)\{/);
  assert.match(input, /function playCtl\(dt\)\{/);
  assert.doesNotMatch(engine, /function playCtl\(dt\)\{/);
  assert.match(policy, /let aDown=null/);
  assert.doesNotMatch(input, /let aDown=null/);
  assert.doesNotMatch(engine, /let aDown=null/);
});
