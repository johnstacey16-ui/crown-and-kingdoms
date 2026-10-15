import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

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
  assert.match(html, /fetch\('\.\/assets\/atlas-manifest\.json'/);
  assert.match(html, /\.then\(pack=>\{if\(pack&&typeof pack==='object'\)loadAssetPack\(pack\)\}\)/);
  assert.doesNotMatch(html, /<script id="ck-assets" type="application\/json">\s*\{/);
});
