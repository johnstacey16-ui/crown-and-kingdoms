import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');

assert.match(simulation, /const SEP_GRID=new Map\(\),SEP_BUCKET_POOL=\[\];/, 'simulation module must own reusable spatial separation buckets');
assert.match(simulation, /function sep\(\)\{const us=S\.us;if\(us\.length<=128\)/, 'simulation module must preserve the small-army separation path');
assert.match(simulation, /SEP_BUCKET_POOL\.pop\(\)\|\|\[\]/, 'large-army separation must reuse pooled bucket arrays');
assert.doesNotMatch(engine, /SEP_GRID|function sep\(\)/, 'engine orchestration must not own the separation algorithm');
assert.ok(html.indexOf('src="./js/simulation.js"') < html.indexOf('src="./engine.js"'), 'simulation must load before the engine calls sep()');

console.log('simulation-separation-ownership: spatial grid, fallback and script order passed');
