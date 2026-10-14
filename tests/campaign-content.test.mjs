import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('coastal campaign has a relic-and-siege sequel with distinct objectives', () => {
  assert.match(html, /t:'The Strait\\'s Last Relic'/);
  assert.match(html, /t:'Build a Monastery'/);
  assert.match(html, /t:'Hold 2 relics in your Monasteries'/);
  assert.match(html, /t:'Destroy the enemy Castle'/);
  assert.match(html, /t:'Destroy the enemy Town Centre'/);
});

test('coastal sequel has timed mixed naval and land events and follows Golden Coast', () => {
  assert.match(html, /at:150,do:\(\)=>raid\(5,\['gal','gal','scout','spear','arc'\]/);
  assert.match(html, /at:300,do:\(\)=>raid\(7,\['ram','knight','arc','spear','gal','gal','arc'\]/);
  assert.match(html, /at:480,do:\(\)=>raid\(8,\['ram','ram','knight','knight','arc','spear','gal','gal'\]/);
  assert.match(html, /n:'Coastal War',ids:\[12,13\]/);
});
