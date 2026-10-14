import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('coastal campaign mission has naval and land-force objectives', () => {
  assert.match(html, /t:'The Golden Coast'/);
  assert.match(html, /t:'Build a Dock'/);
  assert.match(html, /t:'Have 3 War Galleys alive'/);
  assert.match(html, /t:'Have 12 land soldiers alive'/);
  assert.match(html, /t:'Destroy the enemy Town Centre'/);
});

test('coastal mission scripts timed mixed naval and land attacks', () => {
  assert.match(html, /at:150,do:\(\)=>raid\(5,\['gal','gal','scout','arc','spear'\]/);
  assert.match(html, /at:300,do:\(\)=>raid\(7,\['ram','knight','arc','spear','knight','arc','gal'\]/);
  assert.match(html, /n:'Coastal War',ids:\[12\]/);
});
