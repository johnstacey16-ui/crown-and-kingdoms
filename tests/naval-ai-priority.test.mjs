import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('AI war galleys favour enemy warships over less dangerous ships at similar range', () => {
  assert.match(html, /hostileShips\.sort\(\(a,b\)=>\(Math\.hypot\(a\.x-ship\.x,a\.y-ship\.y\)-\(a\.k==='gal'\?6:0\)\)-\(Math\.hypot\(b\.x-ship\.x,b\.y-ship\.y\)-\(b\.k==='gal'\?6:0\)\)\)/);
  assert.match(html, /if\(enemy&&Math\.hypot\(enemy\.x-ship\.x,enemy\.y-ship\.y\)<28\)/);
});
