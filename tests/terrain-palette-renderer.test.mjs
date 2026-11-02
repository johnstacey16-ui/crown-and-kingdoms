import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const render = readFileSync(new URL('../js/render.js', import.meta.url), 'utf8');
const terrain = readFileSync(new URL('../js/render-terrain.js', import.meta.url), 'utf8');

test('terrain colour palettes and deterministic tile variation belong to js/render-terrain.js', () => {
  assert.ok(html.indexOf('./js/render.js') < html.indexOf('./engine.js'));
  for (const marker of ['const hsh=', 'const GC=', ',SC={}', 'const shd=', 'const GCd=', 'GCl=GC.map', 'const PALS=']) {
    assert.ok(terrain.includes(marker), marker+' must be terrain-owned');
    assert.ok(!render.includes(marker), marker+' must not be duplicated in the world renderer');
    assert.ok(!engine.includes(marker), marker+' must not be duplicated in engine.js');
  }
  assert.match(terrain, /function paintTile\(g,x,y,cx,cy\)[\s\S]*?PALS\[/);
  assert.match(terrain, /function paintTileDetail\(g,x,y,cx,cy\)[\s\S]*?hsh\(/);
});

test('units retain a high-contrast team marker at strategic zoom', () => {
  assert.match(render, /if\(z<\.8\)\{const my=sy\+z\+1;X\.fillStyle='#17130f'/,
    'A dark outline must keep the zoomed-out unit marker visible against varied terrain');
  assert.match(render, /X\.fillStyle=teamColor\(u\.t\);X\.beginPath\(\);X\.moveTo\(sx,my-2\)/,
    'The inner marker must use the owning kingdom colour');
});

test('palette constants and painted-tile fallback preserve deterministic native colours',()=>{
 const start=terrain.indexOf('/* Deterministic terrain variation');
 const ctx=vm.createContext({});
 vm.runInContext(terrain.slice(start)+';globalThis.values={hsh,PALS,GC,GCd,GCl,shd};',ctx);
 const {hsh,PALS,GC,GCd,GCl,shd}=ctx.values;
 assert.equal(PALS.length,4,'all four existing terrain variants stay present');
 assert.equal(GC.length,6);assert.equal(GCd.length,6);assert.equal(GCl.length,6);
 assert.equal(PALS[0].coast,'#cdbd82');
 assert.equal(PALS[1].coast,'#e6d8a8');
 assert.equal(PALS[2].coast,'#c3d0d6');
 assert.equal(PALS[3].coast,'#b8b090');
 assert.equal(hsh(11,29),hsh(11,29),'tile variation is repeatable');
 assert.notEqual(hsh(11,29),hsh(11,30),'adjacent cells use different hashes');
 assert.equal(shd('#808080',1),'rgb(128,128,128)');
 assert.deepEqual(JSON.parse(JSON.stringify(PALS[0].g)),JSON.parse(JSON.stringify(GC)));
});
