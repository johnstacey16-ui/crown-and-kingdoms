import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

// These guards protect the existing fishing loop from regressions. They are
// source-level checks, not a substitute for simulating a live match.
assert.match(html, /fish:\{n:'Fishing Ship'[^\n]*sh:1/, 'Fishing Ships must be classified as water units');
assert.match(html, /dock:\{n:'Dock'[^\n]*tr:\[[^\]]*'fish'/, 'Docks must produce Fishing Ships');
assert.match(html, /function findNode\(u,k,r=16\)[\s\S]{0,220}n\.k===k&&n\.amt>0&&!n\.fi===!u\.sh/, 'resource searches must distinguish land resources from water fish');
assert.match(html, /q\.k==='dock':q\.k==='tc'/, 'water units must return gathered resources to a friendly Dock');
assert.match(html, /S\.res\[u\.t\]\[u\.ct\]\+=u\.car/, 'delivered cargo must be credited to the owning kingdom');
assert.match(html, /u\.car>=\(S\.tech\[u\.t\]\.carry\?15:CAP\)/, 'gatherers must return when their carry capacity is reached');
assert.match(html, /my\.filter\(u=>u\.k==='fish'\)\.length<3/, 'AI fishing-ship production must be capped');
assert.match(html, /for\(const s of fish\.filter\(u=>u\.o==='i'\)\)/, 'idle AI fishing ships must receive fishing orders');

console.log('fishing-economy: static assertions passed');
