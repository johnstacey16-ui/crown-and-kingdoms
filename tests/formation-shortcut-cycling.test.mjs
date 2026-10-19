import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const formations = readFileSync(new URL('../js/formations.js', import.meta.url), 'utf8');

test('controller Y shortcut cycles through every available formation, including Wedge', () => {
 const declaration = formations.match(/const FMN=\[[^\n]+;/)?.[0];
 const next = engine.match(/fm=\(fm\+1\)%FMN\.length/)?.[0];
 assert.ok(declaration, 'formation names must have a single source of truth');
 assert.ok(next, 'Y shortcut must use the count of defined formations, not a hardcoded modulus');
 const seen = vm.runInNewContext(
   declaration + '\nlet fm=0;const seen=[];for(let i=0;i<FMN.length;i++){' + next +
   ';seen.push(FMN[fm])}seen;');
 assert.deepEqual(Array.from(seen), ['Line','Column','Staggered','Wedge','Box']);
});
