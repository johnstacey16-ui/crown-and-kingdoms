import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCoreGameSource} from '../scripts/runtime-sources.mjs';

const html = loadCoreGameSource({includeUI:true,includeAssets:true});

test('Broken Isles is a selectable repeatable coastal map layout', () => {
  assert.ok(html.includes("'Broken Isles (fixed)'"));
  assert.ok(html.includes("'Repeatable coastal seed for mixed naval and land battles.'"));
  assert.ok(html.includes("{mt:7,seed:202623}"));
  assert.ok(html.includes("mapLayout=(mapLayout+13)%14"));
  assert.ok(html.includes("mapLayout=(mapLayout+1)%14"));
});
