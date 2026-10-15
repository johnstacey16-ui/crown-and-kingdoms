import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

// Population settings offer 50, 100, 150, 200, 250, 300, 400 and 500.
// Both controller directions must wrap over the entire list, not just its first four values.
assert.match(html, /const a=\[50,100,150,200,250,300,400,500\];popLimit=a\[\(a\.indexOf\(popLimit\)\+a\.length-1\)%a\.length\]/,
  'Left should cycle backwards through every supported population limit');
assert.match(html, /const a=\[50,100,150,200,250,300,400,500\];popLimit=a\[\(a\.indexOf\(popLimit\)\+1\)%a\.length\]/,
  'Right should cycle forwards through every supported population limit');

console.log('population-limit-controls: all eight population limit choices are reachable in both directions');
