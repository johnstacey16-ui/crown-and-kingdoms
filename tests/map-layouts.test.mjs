import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('Broken Isles is a selectable repeatable coastal map layout', () => {
  assert.match(html, /'Broken Isles \\(fixed\\)'/);
  assert.match(html, /'Repeatable coastal seed for mixed naval and land battles\\.'/);
  assert.match(html, /\\{mt:7,seed:202623\\}/);
  assert.match(html, /mapLayout=\\(mapLayout\\+13\\)%14/);
  assert.match(html, /mapLayout=\\(mapLayout\\+1\\)%14/);
});
