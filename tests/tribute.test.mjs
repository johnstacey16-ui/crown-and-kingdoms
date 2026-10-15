import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/kingdom.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

assert.match(html, /const TRIBUTE_RESOURCES=\[\{k:'f',n:'Food'\},\{k:'w',n:'Wood'\},\{k:'g',n:'Gold'\},\{k:'s',n:'Stone'\}\]/,
  'Tribute must support food, wood, gold and stone');
assert.match(html, /const TRIBUTE_AMOUNT_STEP=50,TRIBUTE_AMOUNT_MAX=5000/,
  'Tribute amount selection must support 50-unit steps up to 5,000');
assert.match(html, /let tributeResource=0,tributeAmount=100;/,
  'Resource and amount selectors must have independent selection state and start at 100');
assert.match(html, /function sendTribute\(from,to,resourceIndex,amount=100\)\{/,
  'Tribute transfers must keep a safe default and validate each amount');
assert.match(html, /if\(diplomacyRelation\(from,to\)!=='ally'\)\{if\(from===0\)note\('Tribute requires an alliance'\);return false\}/,
  'Resource tribute must be restricted to ally relationships');
assert.match(html, /if\(!S\.res\[from\]\|\|!S\.res\[to\]\|\|S\.res\[from\]\[resource\.k\]<amount\)/,
  'Tribute must reject unaffordable transfers before changing either kingdom');
assert.match(html, /S\.res\[from\]\[resource\.k\]-=amount;S\.res\[to\]\[resource\.k\]\+=amount/,
  'A successful tribute must subtract and add exactly the same resource amount');
assert.ok(html.includes("for(let t=1;t<S.teamN;t++)if(diplomacyRelation(0,t)==='ally'&&(S.bs.some(b=>b.t===t&&b.hp>0)||S.us.some(u=>u.t===t&&u.hp>0)))allies.push(t)"),
  'Allied kingdoms with surviving units or buildings should receive tribute menu entries even after Town Centre loss');
assert.match(html, /if\(!allies\.length\)return \[\]/,
  'Tribute selectors should not appear when no eligible ally exists');
assert.match(html, /n:'Tribute resource',v:\(\)=>TRIBUTE_RESOURCES\[tributeResource\]\.n,l:\(\)=>\{tributeResource=/,
  'The controller must expose a resource selector');
assert.match(html, /n:'Tribute amount',v:\(\)=>tributeAmount,l:\(\)=>\{tributeAmount=Math\.max\(TRIBUTE_AMOUNT_STEP,tributeAmount-TRIBUTE_AMOUNT_STEP\)\},r:\(\)=>\{tributeAmount=Math\.min\(TRIBUTE_AMOUNT_MAX,tributeAmount\+TRIBUTE_AMOUNT_STEP\)\}/,
  'The controller must expose adjustable tribute amounts with lower and upper bounds');
assert.match(html, /a:\(\)=>sendTribute\(0,t,tributeResource,tributeAmount\)/,
  'The send action must use the currently selected resource and exact amount');
assert.match(html, /\.\.\.diplomacyMenuItems\(\),\.\.\.tributeMenuItems\(\)/,
  'Tribute entries must remain integrated into the existing pause-menu controller interface');

console.log('tribute: all 13 source regression assertions passed');
