import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/mapgen.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

test('AI coordinated waves assign siege units a dedicated defensive target', () => {
  assert.match(html, /const siegeT=enemyBs\.find\(b=>b\.k==='castle'&&b\.done\)\|\|enemyBs\.find\(b=>b\.k==='tower'&&b\.done\)\|\|enemyBs\.find\(b=>b\.k==='tc'&&b\.done\)\|\|tgt/);
  assert.match(html, /A\.stg=\{t:S\.t,tg:tgt,siegeT\}/);
  assert.match(html, /\['ram','mang','scor','treb','bomb'\]\.includes\(u\.k\)&&A\.stg\.siegeT/);
});

test('retreating AI units are excluded from attack-wave release', () => {
  assert.match(html, /filter\(u=>u\.hp>0&&u\.k!=='mon'&&!u\.retreating\)/);
});
