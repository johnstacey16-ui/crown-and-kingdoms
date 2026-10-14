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

// Route and economy regression guards.
assert.match(html, /const capOf=t=>Math\.min\(popLimit,10\+5\*S\.bs\.filter\(b=>b\.t===t&&b\.k==='house'&&b\.done\)\.length\)/, 'only completed Houses should add population capacity');
assert.match(html, /const popOf=t=>S\.us\.filter\(u=>u\.t===t\)\.length\+S\.bs\.reduce\(\(a,b\)=>a\+\(b\.t===t\?b\.q\.length:0\),0\)/, 'population count must reserve slots for queued units');
assert.match(html, /if\(popOf\(t\)>=capOf\(t\)\)/, 'training must refuse units when live plus queued population reaches the cap');
assert.match(html, /if\(u\.tradeReturning\)u\.tradeReturning=false;[\s\S]{0,360}u\.tradeReturning=true/, 'trade routes must alternate destination and return journeys');
assert.match(html, /u\.trWait=2/, 'traders without a valid destination must wait and retry');
assert.match(html, /u\.k==='cart'\|\|u\.k==='cog'\)\{tickTrader\(u,dt\);return\}/, 'trader movement must remain separate from combat orders');

console.log('trade-routes: static assertions passed');
