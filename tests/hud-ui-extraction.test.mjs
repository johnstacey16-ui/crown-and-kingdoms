import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

test('resource bar and in-match HUD have one owner in js/ui.js', () => {
  assert.ok(html.indexOf('./js/ui.js') < html.indexOf('./engine.js'));
  assert.match(ui, /function ico\(k,x,y\)\{/);
  assert.match(ui, /function topbar\(r\)\{/);
  assert.match(ui, /function hud\(\)\{/);
  assert.doesNotMatch(engine, /function ico\(k,x,y\)\{/);
  assert.doesNotMatch(engine, /function topbar\(r\)\{/);
  assert.doesNotMatch(engine, /function hud\(\)\{/);
  assert.match(ui, /function drawGameOverlays\(dt\)\{if\(mode==='play'\)\{const\[wx,wy\]=s2w\(cur\.x,cur\.y\);hud\(\);/);
  assert.match(engine, /else drawWorld\(\);[\s\S]*?const uiStart=perfHud\?performance\.now\(\):0/);
  assert.match(engine, /try\{drawGameOverlays\(dt\)\}finally\{X=WORLD_X\}/);
  assert.match(engine, /else drawGameOverlays\(dt\)/);
});

test('victory-mode status remains part of the extracted HUD', () => {
  assert.match(ui, /SCORE MODE · /);
  assert.match(ui, /KING OF THE HILL · HOLD THE CENTRAL HILL FOR 5 MIN/);
  assert.match(ui, /SUDDEN DEATH · DEFEND YOUR TOWN CENTRE/);
  assert.match(ui, /minimapDraw\(mm,0\)/);
});
