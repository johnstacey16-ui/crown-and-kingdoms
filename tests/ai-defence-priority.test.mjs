import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('AI base defence prioritises nearby siege threats over ordinary attackers', () => {
  assert.match(html, /Math\.hypot\(a\.x-tc\.x,a\.y-tc\.y\)-\(\['ram','mang','scor','treb','bomb'\]\.includes\(a\.k\)\?8:0\)/);
  assert.match(html, /Math\.hypot\(b\.x-tc\.x,b\.y-tc\.y\)-\(\['ram','mang','scor','treb','bomb'\]\.includes\(b\.k\)\?8:0\)/);
});
