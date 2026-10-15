import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' +
  readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' +
  readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' +
  readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' +
  readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' +
  readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' +
  readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8') + '\n' +
  readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8') + '\n' +
  readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const start = source.indexOf('function townBell(t){');
const end = source.indexOf('function gm(', start);
assert.ok(start >= 0 && end > start, 'Town Bell must remain an isolated simulation helper');
const townBell = source.slice(start, end);

assert.match(townBell, /const workers=S\.us\.filter\(u=>u\.t===t&&u\.k==='vil'&&u\.hp>0&&!u\.ld\)/,
  'Town Bell must target live, ungarrisoned villagers belonging to the selected kingdom');
assert.match(townBell, /const shelters=S\.bs\.filter\(b=>b\.t===t&&b\.done&&b\.hp>0&&GAR\[b\.k\]\)/,
  'Town Bell must build its eligible shelter list once per command');
assert.match(townBell, /const occupancy=new Map\(shelters\.map\(b=>\[b,\(b\.cg\|\|\[\]\)\.length\]\)\)/,
  'Town Bell must pre-count garrisoned villagers once per shelter');
assert.match(townBell, /for\(const v of S\.us\)if\(v\.hp>0&&v\.t===t&&v\.o==='B'&&occupancy\.has\(v\.tg\)\)/,
  'Town Bell must reserve capacity for villagers already en route');
assert.match(townBell, /const ownReservation=u\.o==='B'&&u\.tg===b\?1:0/,
  'A villager must not consume its own previously reserved shelter slot when choosing again');
assert.match(townBell, /const distance=d2\(u\.x,u\.y,b\)/,
  'Town Bell must choose the nearest shelter with available capacity');
assert.doesNotMatch(townBell, /S\.us\.filter\(v=>/,
  'Town Bell must not rescan all units inside the per-villager shelter loop');
assert.match(townBell, /occupancy\.set\(shelter,\(occupancy\.get\(shelter\)\|\|0\)\+1\)/,
  'Town Bell must reserve each newly assigned slot immediately');
assert.match(source, /if\(s\.k==='tc'\)\{it\.push\(\{l:'Town Bell: Garrison villagers'/,
  'Town Bell must be reachable from the Town Centre controller menu');
assert.match(townBell, /u\.o='B';u\.tg=shelter/,
  'Town Bell must issue the existing movement-to-garrison order rather than teleport villagers');

console.log('town-bell: occupancy is pre-counted, reservations preserved, nearest available shelter selected');
