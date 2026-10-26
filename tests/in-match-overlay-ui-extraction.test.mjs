import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');

test('in-match presentation overlays are owned by js/ui.js', () => {
  assert.ok(html.indexOf('./js/ui.js') < html.indexOf('./engine.js'));
  assert.match(ui, /function drawGameOverlays\(dt\)\{/);
  for (const marker of [
    "if(mode==='play'){const[wx,wy]=s2w(cur.x,cur.y);hud();",
    "if(mode==='pause')drawPause()",
    "if(mode==='end'){const p=S.pl",
    "window.CK_NET.drawMatchStatus()"
  ]) assert.ok(ui.includes(marker), marker+' must remain in the UI overlay');
  assert.doesNotMatch(engine, /if\(mode==='play'\)\{const\[wx,wy\]=s2w\(cur\.x,cur\.y\);hud\(\);/);
  assert.match(engine, /else drawWorld\(\);[\s\S]*?const uiStart=perfHud\?performance\.now\(\):0/);
  assert.match(engine, /try\{drawGameOverlays\(dt\)\}finally\{X=WORLD_X\}/);
  assert.match(engine, /else drawGameOverlays\(dt\)/);
});

test('extraction keeps selection, menu and match-status overlays wired', () => {
  assert.match(ui, /if\(boxR\)\{/);
  assert.match(ui, /if\(menu&&menu\.rad\)drawRadial\(\)/);
  assert.match(ui, /if\(cgo\)drawCg\(\)/);
  assert.match(ui, /if\(mode==='pause'\)drawPause\(\)/);
  assert.match(ui, /if\(mode==='end'\)\{/);
  assert.match(ui, /window\.CK_NET\.drawMatchStatus\(\)/);
});
