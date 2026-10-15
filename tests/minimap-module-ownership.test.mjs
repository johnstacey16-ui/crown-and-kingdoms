import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const minimap = readFileSync(new URL('../js/minimap.js', import.meta.url), 'utf8');

assert.match(minimap, /const FOG_OFFSETS=\{\};/, 'minimap module must own cached circular vision offsets');
assert.match(minimap, /function fog\(\)\{S\.vs\.fill\(0\)/, 'minimap module must own fog-of-war visibility updates');
assert.match(minimap, /diplomacyRelation\(0,t\)==='ally'/, 'allied vision sharing must remain part of fog calculation');
assert.doesNotMatch(engine, /const FOG_OFFSETS=|function fog\(/, 'engine orchestration must not duplicate minimap visibility ownership');
assert.ok(html.indexOf('src="./js/kingdom.js"') < html.indexOf('src="./js/minimap.js"') && html.indexOf('src="./js/minimap.js"') < html.indexOf('src="./engine.js"'), 'diplomacy and minimap helpers must load before engine orchestration');

console.log('minimap-module-ownership: fog-of-war ownership and script order passed');
