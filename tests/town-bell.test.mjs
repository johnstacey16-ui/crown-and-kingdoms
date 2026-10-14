import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.match(html, /function townBell\(t\)\{[\s\S]{0,500}const workers=S\.us\.filter\(u=>u\.t===t&&u\.k==='vil'&&u\.hp>0&&!u\.ld\)/,
  'Town Bell must target live, ungarrisoned villagers belonging to the selected kingdom');
assert.match(html, /function townBell\(t\)\{[\s\S]{0,1100}b\.t===t&&b\.done&&b\.hp>0&&GAR\[b\.k\]/,
  'Town Bell may only target completed, living garrison-capable buildings belonging to that kingdom');
assert.match(html, /function townBell\(t\)\{[\s\S]{0,1400}\(b\.cg\|\|\[\]\)\.length\+S\.us\.filter\(v=>v!==u&&v\.hp>0&&v\.t===t&&v\.o==='B'&&v\.tg===b\)\.length\)<GAR\[b\.k\]/,
  'Town Bell must reserve capacity for villagers already garrisoned or en route');
assert.match(html, /if\(s\.k==='tc'\)\{it\.push\(\{l:'Town Bell: Garrison villagers'/,
  'Town Bell must be reachable from the Town Centre controller menu');
assert.match(html, /u\.o='B';u\.tg=shelter/,
  'Town Bell must issue the existing movement-to-garrison order rather than teleport villagers');

console.log('town-bell: all 5 source regression assertions passed');
