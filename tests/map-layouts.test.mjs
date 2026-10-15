import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/mapgen.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/menus.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

test('Broken Isles is a selectable repeatable coastal map layout', () => {
  assert.ok(html.includes("'Broken Isles (fixed)'"));
  assert.ok(html.includes("'Repeatable coastal seed for mixed naval and land battles.'"));
  assert.ok(html.includes("{mt:7,seed:202623}"));
  assert.ok(html.includes("mapLayout=(mapLayout+13)%14"));
  assert.ok(html.includes("mapLayout=(mapLayout+1)%14"));
});
