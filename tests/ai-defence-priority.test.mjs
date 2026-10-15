import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/mapgen.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

test('AI base defence prioritises nearby siege threats over ordinary attackers', () => {
  assert.match(html, /Math\.hypot\(a\.x-tc\.x,a\.y-tc\.y\)-\(\['ram','mang','scor','treb','bomb'\]\.includes\(a\.k\)\?8:0\)/);
  assert.match(html, /Math\.hypot\(b\.x-tc\.x,b\.y-tc\.y\)-\(\['ram','mang','scor','treb','bomb'\]\.includes\(b\.k\)\?8:0\)/);
});
