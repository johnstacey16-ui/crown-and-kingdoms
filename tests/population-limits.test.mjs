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

// The chosen option is an upper cap; houses determine the capacity available during the match.
assert.match(
  html,
  /const capOf=t=>Math\.min\(popLimit,10\+5\*S\.bs\.filter\(b=>b\.t===t&&b\.k==='house'&&b\.done\)\.length\)/,
  'population capacity must be limited by the chosen maximum and completed Houses'
);
assert.match(
  html,
  /const popOf=t=>S\.us\.filter\(u=>u\.t===t\)\.length\+S\.bs\.reduce\(\(a,b\)=>a\+\(b\.t===t\?b\.q\.length:0\),0\)/,
  'population count must include live units and units reserved in production queues'
);
assert.match(
  html,
  /if\(popOf\(t\)>=capOf\(t\)\)/,
  'training must not exceed available population capacity'
);
assert.match(html, /if\(b\.q\.length>=5\)return false/, 'production queue limit must remain intact');

console.log('population-limits: all 5 regression assertions passed');
