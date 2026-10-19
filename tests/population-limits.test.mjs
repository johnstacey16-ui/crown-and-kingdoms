import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/menus.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

// Both left/right controller actions in the setup menu must offer the same limits.
const choices = '[50,100,150,200,250,300,400,500]';
assert.equal(
  html.split(choices).length - 1,
  2,
  'population-limit selector must offer 50, 100, 150, 200, 250, 300, 400 and 500 in both directions'
);

// Runtime population, destroyed housing and queue completion are exercised by
// population-completion.test.mjs and training-population-reservation.test.mjs.
assert.ok(html.includes('Math.min(popLimit,10+5*'), 'configured population limit remains an upper cap');
assert.match(html, /if\(b\.q\.length>=5\)return false/, 'production queue limit remains intact');
console.log('population-limits: setup limits and queue size passed');
