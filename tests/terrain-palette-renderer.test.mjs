import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const render = readFileSync(new URL('../js/render.js', import.meta.url), 'utf8');

test('terrain colour palettes and deterministic tile variation belong to js/render.js', () => {
  assert.ok(html.indexOf('./js/render.js') < html.indexOf('./engine.js'));
  for (const marker of ['const hsh=', 'const GC=', ',SC={}', 'const shd=', 'const GCd=', 'GCl=GC.map', 'const PALS=']) {
    assert.ok(render.includes(marker), marker+' must be renderer-owned');
    assert.ok(!engine.includes(marker), marker+' must not be duplicated in engine.js');
  }
  assert.match(render, /function paintTile\(g,x,y,cx,cy\)[\s\S]*?PALS\[/);
  assert.match(render, /function paintTileDetail\(g,x,y,cx,cy\)[\s\S]*?hsh\(/);
});
