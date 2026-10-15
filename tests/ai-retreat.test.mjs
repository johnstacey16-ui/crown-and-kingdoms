import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

test('AI retreat triggers for critically wounded non-civilian land units', () => {
  assert.match(html, /function aiRetreat\(t,my,tc,bl\)/);
  assert.match(html, /ratio<=\.22/);
  assert.match(html, /u\.k==='vil'\|\|u\.k==='mon'\|\|u\.k==='king'/);
  assert.match(html, /aiRetreat\(t,my,tc,bl\)/);
});

test('AI retreat routes to completed Town Centres or Castles', () => {
  assert.match(html, /b\.k==='tc'\|\|b\.k==='castle'/);
  assert.match(html, /path\(u,goalNear\(safe,1\)\)/);
  assert.match(html, /u\.retreatTarget=safe/);
});

test('retreating units heal at shelter and resume only after recovering', () => {
  assert.match(html, /if\(u\.retreating\)/);
  assert.match(html, /u\.hp=Math\.min\(mhp\(u\),u\.hp\+Math\.max\(1\.5,mhp\(u\)\*\.035\)\*dt\)/);
  assert.match(html, /u\.hp>=mhp\(u\)\*\.65/);
  assert.match(html, /u\.retreating=false;u\.retreatTarget=null;u\.tg=null/);
});

test('retreating units are excluded from coordinated AI attack waves', () => {
  assert.match(html,
    /else if\(!U\[u\.k\]\.sh&&u\.k!=='scout'&&u\.k!=='king'&&u\.k!=='cart'&&!u\.retreating\)arm\.push\(u\)/,
    'The AI roster must exclude units already retreating before forming attacks');
});
