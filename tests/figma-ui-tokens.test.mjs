import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const data = JSON.parse(readFileSync(new URL('../docs/game-ui-tokens.json', import.meta.url), 'utf8'));
const property = key => '--ck-' + key.replaceAll('/', '-');

test('Figma colour and measurement snapshot remains mapped to CSS variables', () => {
  assert.equal(Object.keys(data.colors).length, 20);
  assert.equal(Object.keys(data.layoutPx).length, 12);
  for (const [name, value] of Object.entries(data.colors)) {
    assert.ok(css.includes(property(name) + ': ' + value + ';'), 'missing colour: ' + name);
  }
  for (const [name, value] of Object.entries(data.layoutPx)) {
    assert.ok(css.includes(property(name) + ': ' + value + 'px;'), 'missing measurement: ' + name);
  }
});

test('Browser chrome and focus use the declared design palette without changing controller logic', () => {
  assert.match(css, /background:\\s*var\\(--ck-surface-deep\\)/);
  assert.match(css, /outline:\\s*2px solid var\\(--ck-brand-gold\\)/);
  assert.match(css, /border-left:\\s*4px solid var\\(--ck-status-information\\)/);
});
