import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const multiplayer = readFileSync(new URL('../multiplayer.js', import.meta.url), 'utf8');
const persistence = readFileSync(new URL('../persistence.js', import.meta.url), 'utf8');

test('the game loads its shared stylesheet from the same-origin root', () => {
  assert.match(html, /<link rel="stylesheet" href="\.\/styles\.css">/);
  assert.doesNotMatch(html, /<style>/);
  assert.match(html, /<canvas id="c" tabindex="0" role="application" aria-label="Crown &amp; Kingdoms real-time strategy game\. Use a connected game controller to play\."><\/canvas>/);
});

test('the presentation foundation preserves full-screen controller-first canvas rendering', () => {
  assert.match(css, /html,\s*body\s*\{[\s\S]*?overflow:\s*hidden/);
  assert.match(css, /overscroll-behavior:\s*none/);
  assert.match(css, /touch-action:\s*none/);
  assert.match(css, /canvas\s*\{[\s\S]*?width:\s*100%[\s\S]*?height:\s*100%/);
  assert.match(css, /canvas:focus-visible/);
});


test('the sprite atlas manifest is external JSON and loaded without blocking startup', () => {
  const manifest = readFileSync(new URL('../assets/atlas-manifest.json', import.meta.url), 'utf8');
  assert.doesNotThrow(() => JSON.parse(manifest));
  assert.match(engine, /fetch\('\.\/assets\/atlas-manifest\.json'/);
  assert.match(engine, /\.then\(pack=>\{if\(pack&&typeof pack==='object'\)loadAssetPack\(pack\)\}\)/);
  assert.doesNotMatch(html, /id="ck-assets"/);
});


test('the core engine is external and loads before multiplayer integration', () => {
  assert.match(html, /<script src="\.\/engine\.js"><\/script>/);
  assert.match(html, /<script src="\.\/multiplayer\.js"><\/script>/);
  assert.ok(html.indexOf('./engine.js') < html.indexOf('./multiplayer.js'));
  assert.ok(engine.length > 200000);
  assert.ok(multiplayer.length > 0);
  assert.doesNotMatch(html, /<script>\s*['"]use strict['"]/);
});


test('IndexedDB backs up saved slots without replacing the localStorage compatibility path', () => {
  assert.match(html, /<script src="\.\/persistence\.js"><\/script><script src="\.\/engine\.js"><\/script>/);
  assert.match(persistence, /indexedDB\.open\(DB_NAME, 1\)/);
  assert.match(persistence, /mirrorSave, restoreMissing/);
  assert.match(engine, /mirrorSave\(skey\(slot\),payload\)/);
  assert.match(engine, /restoreMissing\(\)\.then\(\(\)=>refreshSlots\(\)\)/);
  assert.match(engine, /localStorage\.setItem\(skey\(slot\),payload\)/);
});


test('audio resume attempts cannot create unhandled autoplay-policy rejections', () => {
  assert.match(engine, /AC\.resume\(\)\.catch\(\(\)=>\{\}\)/);
  assert.doesNotMatch(engine, /AC\.resume\(\)(?!\.catch)/);
});
