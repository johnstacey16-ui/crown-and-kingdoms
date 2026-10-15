import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.match(html, /if\(M\.cs\|\|M\.sea\|\|M\.arch\|\|M\.lake\|\|mapLayout===11\|\|mapLayout===12\)/,
  'the generator must apply special terrain shaping for the Causeway preset');
assert.ok(html.includes('"King\'s Causeway (fixed)"'), 'the new layout must be selectable from the controller menu');
assert.match(html, /\{mt:7,seed:202622\}\]\[mapLayout\]/,
  'the Causeway must use a repeatable map type and seed');
assert.match(html, /else if\(mapLayout===12\)\{const river=W-y\+Math\.sin\(y\*\.055\)\*2\.2\+Math\.sin\(y\*\.13\)\*\.8;e=Math\.abs\(x-river\)<2\.7\}/,
  'the layout must carve a winding diagonal strait rather than reusing the base map');
assert.match(html, /if\(mapLayout===12\)\{for\(let y=1;y<H-1;y\+\+\)\{const center=W-y\+Math\.sin\(y\*\.055\)\*2\.2\+Math\.sin\(y\*\.13\)\*\.8,ford=\[\.22,\.5,\.78\]\.some\(q=>Math\.abs\(y-H\*q\)<2\.5\)/,
  'three separated shallows must cross the strait for land armies');
assert.ok(html.includes('S.wt[i]=ford?2:1;S.g[i]=ford?0:1;S.gt[i]=0'),
  'crossings must be passable by ground units while retaining navigable shallow water');
assert.match(html, /mapLayout=\(mapLayout\+12\)%13/,
  'controller navigation must include the new layout without skipping the first item');
console.log('map-layout-content: King\'s Causeway assertions passed');
