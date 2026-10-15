import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

test('AI war galleys favour enemy warships and focus a shared target', () => {
  assert.match(html, /const focus=e=>galleys\.filter\(u=>u\.o==='a'&&u\.tg===e\)\.length,enemy=hostileShips\.slice\(\)\.sort/);
  assert.match(html, /Math\.min\(3,focus\(a\)\)\*4/);
  assert.match(html, /Math\.min\(3,focus\(b\)\)\*4/);
  assert.match(html, /if\(enemy&&Math\.hypot\(enemy\.x-ship\.x,enemy\.y-ship\.y\)<28\)/);
});
