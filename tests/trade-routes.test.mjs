import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert.match(html, /market:\{n:'Market'[^\n]*tr:\['cart'\]/, 'Market must produce Trade Carts');
assert.match(html, /dock:\{n:'Dock'[^\n]*tr:\[[^\]]*'cog'/, 'Dock must produce Trade Cogs');
assert.match(html, /cart:\{n:'Trade Cart'/, 'Trade Cart unit data must exist');
assert.match(html, /cog:\{n:'Trade Cog'/, 'Trade Cog unit data must exist');
assert.match(html, /function tickTrader\(u,dt\)/, 'traders must run a dedicated route simulation');
assert.match(html, /S\.res\[u\.t\]\.g\+=earned/, 'successful deliveries must grant gold to the trader owner');
assert.match(html, /Math\.max\(2,Math\.round\(distance\*0\.35\)\)/, 'trade gold must scale with route distance and have a minimum payout');
assert.match(html, /if\(q\.k==='cart'\|\|q\.k==='cog'\)nu\.tradeFromKey=/, 'new traders must remember their production endpoint');
assert.match(html, /u\.k==='cart'\|\|u\.k==='cog'\)\{tickTrader\(u,dt\);return\}/, 'traders must not use combat or gathering AI');
assert.match(html, /Farm':'Renewable food; reseeds itself for 60 wood\.'/ , 'farm help text must match the actual reseed cost');
console.log('trade-routes: static assertions passed');
