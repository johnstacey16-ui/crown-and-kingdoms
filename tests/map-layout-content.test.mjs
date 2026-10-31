import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCoreGameSource} from '../scripts/runtime-sources.mjs';

const html = loadCoreGameSource({includeUI:true,includeAssets:true});

assert.match(html, /if\(M\.cs\|\|M\.sea\|\|M\.arch\|\|M\.lake\|\|mapLayout===11\|\|mapLayout===12\|\|mapLayout===13\)/,
  'the generator must apply special terrain shaping for the Causeway preset');
assert.ok(html.includes('"King\'s Causeway (fixed)"'), 'the new layout must be selectable from the controller menu');
assert.match(html, /\{mt:7,seed:202622\},\{mt:7,seed:202623\}\]\[mapLayout\]/,
  'the Causeway must use a repeatable map type and seed');
assert.match(html, /else if\(mapLayout===12\)\{const river=W\*\.38\+y\*\.24\+Math\.sin\(y\*\.055\)\*2\.2\+Math\.sin\(y\*\.13\)\*\.8;e=Math\.abs\(x-river\)<2\.7\}/,
  'the layout must carve a winding diagonal strait rather than reusing the base map');
assert.match(html, /if\(mapLayout===12\)\{for\(let y=1;y<H-1;y\+\+\)\{const center=W\*\.38\+y\*\.24\+Math\.sin\(y\*\.055\)\*2\.2\+Math\.sin\(y\*\.13\)\*\.8,ford=\[\.22,\.5,\.78\]\.some\(q=>Math\.abs\(y-H\*q\)<2\.5\)/,
  'three separated shallows must cross the strait for land armies');
assert.ok(html.includes('S.wt[i]=ford?2:1;S.g[i]=ford?0:1;S.gt[i]=0'),
  'crossings must be passable by ground units while retaining navigable shallow water');
assert.match(html, /mapLayout=\(mapLayout\+13\)%14/,
  'controller navigation must include the new layout without skipping the first item');
assert.match(html, /mapLayout=cl\(st\.mapLayout\|0,0,13\)/,
  'saved settings must restore the Causeway rather than clamp it to the previous last layout');
assert.ok(html.includes("'Broken Isles (fixed)'"), 'Broken Isles must be selectable from the map-layout menu');
assert.match(html, /else if\(mapLayout===13\)\{const r1=W\*\.30\+y\*\.12\+Math\.sin\(y\*\.07\)\*1\.6,r2=W\*\.70-y\*\.12\+Math\.cos\(y\*\.06\)\*1\.6,bar=H\*\.52\+Math\.sin\(x\*\.07\)\*H\*\.04\+Math\.cos\(x\*\.13\)\*1\.8;e=Math\.abs\(x-r1\)<2\.4\|\|Math\.abs\(x-r2\)<2\.4\|\|Math\.abs\(y-bar\)<2\.4\}/,
  'Broken Isles must generate two winding channels linked by a cross-channel');
assert.match(html, /if\(mapLayout===13\)\{for\(let y=1;y<H-1;y\+\+\)\{const r1=W\*\.30\+y\*\.12\+Math\.sin\(y\*\.07\)\*1\.6,r2=W\*\.70-y\*\.12\+Math\.cos\(y\*\.06\)\*1\.6,fordY=/,
  'Broken Isles channels must include shallow crossings');
console.log('map-layout-content: Causeway and Broken Isles assertions passed');

// Former standalone map-layouts fixture, retained with the other map shape contracts.
test('Broken Isles is a selectable repeatable coastal map layout', () => {
  assert.ok(html.includes("'Broken Isles (fixed)'"));
  assert.ok(html.includes("'Repeatable coastal seed for mixed naval and land battles.'"));
  assert.ok(html.includes("{mt:7,seed:202623}"));
  assert.ok(html.includes("mapLayout=(mapLayout+13)%14"));
  assert.ok(html.includes("mapLayout=(mapLayout+1)%14"));
});
