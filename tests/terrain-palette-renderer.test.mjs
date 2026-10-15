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

test('units retain a high-contrast team marker at strategic zoom', () => {
  assert.match(render, /if\(z<\.8\)\{const my=sy\+z\+1;X\.fillStyle='#17130f'/,
    'A dark outline must keep the zoomed-out unit marker visible against varied terrain');
  assert.match(render, /X\.fillStyle=teamColor\(u\.t\);X\.beginPath\(\);X\.moveTo\(sx,my-2\)/,
    'The inner marker must use the owning kingdom colour');
});
