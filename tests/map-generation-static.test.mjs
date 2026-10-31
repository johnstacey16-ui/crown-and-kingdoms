import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {loadCoreGameSource} from '../scripts/runtime-sources.mjs';
const html = loadCoreGameSource({includeUI:true,includeAssets:true});
assert.match(html, /function auditGeneratedMap\(starts\)/, 'real map generator must contain the terrain audit');
assert.match(html, /S\.mapAudit=mapAudit/, 'generated audit result must be attached to the game state');
assert.match(html, /startReach\[i\]===1/, 'starting positions must be tested against the same reachable component');
assert.match(html, /tries<12\)return newGame\(tries\+1\)/, 'disconnected terrain must trigger bounded regeneration');
assert.match(html, /n:'Scattered Lakes'.*arch:1/, 'scattered-lakes generator preset must exist');
assert.match(html, /n:'Twin Lakes'.*lake:1/, 'twin-lakes generator preset must exist');
assert.match(html, /function drawUnit\(u,selectedUnits\)/, 'unit renderer must remain present');
assert.match(html, /ASSET\.n\?assetFrame/, 'validated upright atlas must be enabled with fallback');
const atlasManifest = JSON.parse(readFileSync(new URL('../assets/atlas-manifest.json', import.meta.url), 'utf8'));
assert.ok(html.includes("fetch('./assets/atlas-manifest.json'"), 'the game must load the sprite manifest as a local external asset');
assert.ok(atlasManifest.atlases.some((a) => a.id === 'painted-forces'), 'detailed troop, cavalry, siege and ship atlas must be integrated through the external manifest');
assert.ok(atlasManifest.atlases.some((a) => a.id === 'painted-architecture'), 'detailed building atlas must be integrated through the external manifest');
assert.match(html, /paintedBuildingFrame\(b\.k,b\.t,gt,buildingVisualAge\(b\)\)/, 'buildings must use the painted atlas with procedural fallback');
assert.match(html, /baf=ASSET\.n\?paintedBuildingFrame\(b\.k,b\.t,gt,buildingVisualAge\(b\)\):null,\s*c=baf\?null:spr\(/, 'building sprite rendering must prefer the atlas and retain a procedural fallback');
assert.match(html, /dockableStarts/, 'map audit must report starts with a legal Dock site nearby');
assert.match(html, /partialNavalAccess:dockableStarts>0/, 'map audit must expose whether any valid dock site exists');
console.log('map-generation-static: graphics and map assertions passed');



// Retry behaviour formerly verified in the separate map-retry-seed test.
assert.match(
  html,
  /mk\(seedOv!=null\?\(seedOv\+tries\)&0xffffff:\(Date\.now\(\)\+tries\*104729\)&0xffffff\)/,
  'Each retry of an unseeded generated map must use a different seed even when retries happen in the same millisecond'
);
assert.match(
  html,
  /if\(!mapAudit\.ok&&tries<12\)return newGame\(tries\+1\)/,
  'Disconnected starting regions must continue to trigger bounded map regeneration'
);


