import assert from 'node:assert/strict';
import {loadCoreGameSource} from '../scripts/runtime-sources.mjs';

const html = loadCoreGameSource({includeUI:true,includeAssets:true});

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

// Population settings offer 50, 100, 150, 200, 250, 300, 400 and 500.
// Both controller directions must wrap over the entire list, not just its first four values.
assert.match(html, /const a=\[50,100,150,200,250,300,400,500\];popLimit=a\[\(a\.indexOf\(popLimit\)\+a\.length-1\)%a\.length\]/,
  'Left should cycle backwards through every supported population limit');
assert.match(html, /const a=\[50,100,150,200,250,300,400,500\];popLimit=a\[\(a\.indexOf\(popLimit\)\+1\)%a\.length\]/,
  'Right should cycle forwards through every supported population limit');
