import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('Broken Isles is a selectable repeatable coastal map layout', () => {
  assert.ok(html.includes("'Broken Isles (fixed)'"));
  assert.ok(html.includes("'Repeatable coastal seed for mixed naval and land battles.'"));
  assert.ok(html.includes("{mt:7,seed:202623}"));
  assert.ok(html.includes("mapLayout=(mapLayout+13)%14"));
  assert.ok(html.includes("mapLayout=(mapLayout+1)%14"));
});
