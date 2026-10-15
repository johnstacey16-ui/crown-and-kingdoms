import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');

test('AI base defence prioritises nearby siege threats over ordinary attackers in one pass', () => {
  assert.match(ai, /for\(const e of S\.us\)\{if\(!e\|\|e\.hp<=0\|\|e\.ld\|\|!isHostile\(t,e\.t\)\|\|!\(U\[e\.k\]\?\.dmg>3\)\)continue;const d=Math\.hypot\(e\.x-bx,e\.y-by\);if\(d>=13\)continue;const score=d-\(\['ram','mang','scor','treb','bomb'\]\.includes\(e\.k\)\?7:0\);if\(score<best\)\{best=score;intruder=e\}\}/);
  assert.match(ai, /let intruder=null,best=Infinity;const bx=base\.x\+base\.s\/2,by=base\.y\+base\.s\/2;/);
});
