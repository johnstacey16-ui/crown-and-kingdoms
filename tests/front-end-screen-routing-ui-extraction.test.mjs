import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');

test('full-screen routing is owned by js/ui.js', () => {
  assert.ok(html.indexOf('./js/ui.js') < html.indexOf('./engine.js'));
  assert.match(ui, /function drawFrontEndScreen\(\)\{/);
  for (const mode of ['title','multiplayer','remap','info','setup','opts','slots','camp','brief','obj','tree']) {
    assert.ok(ui.includes("mode==='"+mode+"'"), mode+' must remain routed by the UI module');
  }
  assert.doesNotMatch(engine, /if\(mode==='title'\)return drawTitle\(\)/);
  assert.doesNotMatch(engine, /if\(mode==='multiplayer'\)return window\.CK_NET/);
  assert.match(engine, /if\(drawFrontEndScreen\(\)\)return;/);
});

test('screen routing still precedes world and live-match drawing', () => {
  const clear = engine.indexOf("X.fillRect(0,0,CW,CH);if(drawFrontEndScreen())return;");
  const notes = engine.indexOf("for(const n of notes)n.t-=dt", clear);
  const world = engine.indexOf("drawWorld();", clear);
  assert.ok(clear >= 0, 'canvas must be cleared before full-screen routing');
  assert.ok(notes > clear, 'notes and world drawing must not run for full-screen menus');
  assert.ok(world > notes, 'world drawing must only follow an unhandled screen');
  assert.match(ui, /if\(mode==='multiplayer'\)\{if\(window\.CK_NET\)window\.CK_NET\.drawLobby\(\);else drawTitle\(\);return true\}/);
});
