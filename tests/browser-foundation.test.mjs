import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const audio = readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8');
const save = readFileSync(new URL('../js/save.js', import.meta.url), 'utf8');
const engineSource = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const input = readFileSync(new URL('../js/input.js', import.meta.url), 'utf8');
const engine = config + '\n' + audio + '\n' + save + '\n' + input + '\n' + engineSource;
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
  assert.match(html, /<script src="\.\/js\/config\.js"><\/script><script src="\.\/js\/audio\.js"><\/script><script src="\.\/js\/save\.js"><\/script><script src="\.\/js\/input\.js"><\/script><script src="\.\/engine\.js"><\/script>/);
  assert.match(html, /<script src="\.\/multiplayer\.js"><\/script>/);
  assert.ok(html.indexOf('./js/config.js') < html.indexOf('./js/audio.js'));
  assert.ok(html.indexOf('./js/audio.js') < html.indexOf('./js/save.js'));
  assert.ok(html.indexOf('./js/save.js') < html.indexOf('./js/input.js'));
  assert.ok(html.indexOf('./js/input.js') < html.indexOf('./engine.js'));
  assert.ok(html.indexOf('./engine.js') < html.indexOf('./multiplayer.js'));
  assert.ok(engine.length > 200000);
  assert.ok(multiplayer.length > 0);
  assert.doesNotMatch(html, /<script>\s*['"]use strict['"]/);
});


test('IndexedDB backs up saved slots without replacing the localStorage compatibility path', () => {
  assert.match(html, /<script src="\.\/persistence\.js"><\/script><script src="\.\/js\/config\.js"><\/script><script src="\.\/js\/audio\.js"><\/script><script src="\.\/js\/save\.js"><\/script><script src="\.\/js\/input\.js"><\/script><script src="\.\/engine\.js"><\/script>/);
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


test('offline shell caching stays same-origin and keeps online code updates fresh', () => {
  const serviceWorker = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  assert.match(engine, /navigator\.serviceWorker\.register\('\.\/sw\.js'/);
  assert.match(serviceWorker, /request\.method !== 'GET'/);
  assert.match(serviceWorker, /url\.origin !== self\.location\.origin/);
  assert.match(serviceWorker, /const networkFirst = request\.mode === 'navigate'/);
  assert.match(serviceWorker, /cache\.addAll\(CORE_ASSETS\)/);
});


test('offline cache can survive temporary hosting errors as well as network loss', () => {
  const serviceWorker = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  assert.match(serviceWorker, /return await cache\.match\(request\) \|\| response/);
  assert.match(serviceWorker, /const cached = await cache\.match\(request\);\s*if \(cached\) return cached/);
});


test('game balance data is separated from runtime code and resize work is debounced', () => {
  assert.match(config, /const U=\{/);
  assert.match(config, /const B=\{/);
  assert.match(config, /const AG=\[/);
  assert.doesNotMatch(engineSource, /const U=\{|const B=\{|const AG=\[/);
  assert.match(engineSource, /clearTimeout\(resizeTimer\);resizeTimer=setTimeout\(rs,80\)/);
});
