import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('coastal campaign sequel has relic, monastery and siege objectives', () => {
  assert.match(html, /t:'The Strait\\'s Last Relic'/);
  assert.match(html, /t:'Build a Monastery'/);
  assert.match(html, /t:'Hold 2 relics in your Monasteries'/);
  assert.match(html, /t:'Destroy the enemy Castle'/);
  assert.match(html, /t:'Destroy the enemy Town Centre'/);
});

test('sequel includes timed mixed naval and land attacks and campaign progression', () => {
  assert.match(html, /at:150,do:\(\)=>raid\(5,\['gal','gal','scout','spear','arc'\]/);
  assert.match(html, /at:300,do:\(\)=>raid\(7,\['ram','knight','arc','spear','gal','gal','arc'\]/);
  assert.match(html, /at:480,do:\(\)=>raid\(8,\['ram','ram','knight','knight','arc','spear','gal','gal'\]/);
  assert.match(html, /n:'Coastal War',ids:\[12,13,14\]/);
});

test('Causeway campaign uses the navigable strait layout and a staged land-and-sea objective set', () => {
  assert.match(html, /t:'The Causeway Muster'/);
  assert.match(html, /t:'The Causeway Muster'[\\s\\S]{0,220}layout:12/);
  assert.match(html, /mapLayout=Number\\.isInteger\\(sc\\.layout\\)\\?sc\\.layout:0;if\\(mapLayout\\)applyMapLayout\\(\\)/);
  assert.match(html, /t:'Build a Dock'/);
  assert.match(html, /t:'Have 3 War Galleys alive'/);
  assert.match(html, /t:'Build 2 completed Towers'/);
  assert.match(html, /n:'The Causeway Campaign',ids:\\\\[16\\\\]/);
});

