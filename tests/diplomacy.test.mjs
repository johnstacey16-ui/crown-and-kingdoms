import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/mapgen.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/kingdom.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

assert.match(html, /for\(let t=1;t<S\.teamN;t\+\+\)if\(diplomacyRelation\(0,t\)==='ally'&&\(S\.bs\.some\(b=>b\.t===t&&b\.hp>0\)\|\|S\.us\.some\(u=>u\.t===t&&u\.hp>0\)\)\)allies\.push\(t\)/,
  'Tribute recipients must include surviving allied kingdoms without a Town Centre');
assert.match(html, /const DIPLOMACY_STATES=\['enemy','neutral','ally'\]/,
  'Diplomacy must use explicit enemy, neutral and ally states');
assert.match(html, /function createDiplomacy\(n,source=null\)\{[\s\S]{0,650}d\[a\]\[b\]=d\[b\]\[a\]=rel/,
  'New games and restored saves must use a symmetric relationship matrix');
assert.match(html, /tech:Array\.from\(\{length:teamN\},\(\)=>\(\{\}\)\),dip:createDiplomacy\(teamN\),vp:createVillagerPriority\(\),scoreCache:Array\(teamN\)\.fill\(0\),kh:Array\(teamN\)\.fill\(0\),rel:\[\]/,
  'New matches must default to every rival being hostile');
assert.match(html, /function diplomacyRelation\(a,b\)\{if\(a===b\)return 'self';return S&&S\.dip&&S\.dip\[a\]&&S\.dip\[a\]\[b\]\|\|'enemy'\}/,
  'Missing relationship data must default safely to enemy');
assert.match(html, /function isHostile\(a,b\)\{return a!==b&&diplomacyRelation\(a,b\)==='enemy'\}/,
  'Hostility must come from the shared relationship helper');
assert.match(html, /function setDiplomacy\(a,b,rel\)\{[\s\S]{0,450}S\.dip\[a\]\[b\]=S\.dip\[b\]\[a\]=rel/,
  'Changing diplomacy must update both kingdoms symmetrically');
assert.match(html, /if\(rel!=='enemy'\)for\(const u of S\.us\)if\(\(u\.o==='a'\|\|u\.o==='v'\)/,
  'Changing a relationship away from enemy must cancel active attacks and conversions against that kingdom');
assert.match(html, /for\(let t=1;t<S\.teamN;t\+\+\)if\(S\.bs\.some\(b=>b\.t===t&&b\.hp>0\)\|\|S\.us\.some\(u=>u\.t===t&&u\.hp>0\)\)/,
  'Diplomacy must remain available when a kingdom loses its Town Centre but still has surviving forces or buildings');
assert.match(html, /function diplomacyMenuItems\(\)\{[\s\S]{0,500}l:\(\)=>rotateDiplomacy\(0,t,-1\),r:\(\)=>rotateDiplomacy\(0,t,1\),a:\(\)=>rotateDiplomacy\(0,t,1\)/,
  'Enemy, neutral and ally states must be changeable with the pause-menu controller');
assert.match(html, /if\(!isHostile\(a\.t,t\.t\)\)return;const ak=U\[a\.k\]/,
  'All damage must be blocked against neutral/allied kingdoms');
assert.match(html, /if\(tg&&tg\.t>0&&\(tg\.q\|\|U\[tg\.k\]\)&&!isHostile\(us\[0\]\.t,tg\.t\)\)/,
  'Manual attacks must reject non-hostile targets');
assert.match(html, /function foe\(u,r\)\{[\s\S]{0,500}isHostile\(u\.t,q\.t\)[\s\S]{0,280}isHostile\(u\.t,e\.t\)/,
  'Automatic target acquisition must ignore neutral/allied kingdoms');
assert.match(html, /const enemyBs=S\.bs\.filter\(b=>isHostile\(t,b\.t\)&&b\.hp>0\)/,
  'AI attack waves must choose targets only from hostile kingdoms');
assert.match(html, /S\.us\.filter\(u=>isHostile\(t,u\.t\)&&u\.hp>0&&U\[u\.k\]\.sh&&u\.k!=='fish'\)/,
  'Naval AI must ignore allied/neutral warships');
assert.match(html, /S\.us\.some\(e=>isHostile\(t,e\.t\)&&!e\.ld&&e\.hp>0&&U\[e\.k\]\.dmg>3/,
  'AI defensive threat detection must ignore non-hostile units');
assert.match(html, /vc:S\.vc,px:S\.px,civ:S\.civ,dip:S\.dip,vp:S\.vp,diff/,
  'Save data must preserve diplomacy relationships');
assert.match(html, /dip:createDiplomacy\(\(j\.res\|\|\[\]\)\.length\|\|2,j\.dip\)/,
  'Load data must restore diplomacy and default legacy saves to enemies');
assert.match(html, /if\(!S\.bs\.some\(b=>b\.k==='tc'&&isHostile\(0,b\.t\)&&b\.hp>0\)\)endGame\('win','All hostile Town Centres have fallen'\)/,
  'Town Centre victory must consider current hostile relationships');

assert.ok(html.includes("for(let ally=0;ally<S.teamN;ally++)if(ally!==t&&diplomacyRelation(t,ally)==='ally'&&(S.bs.some(b=>b.t===ally&&b.hp>0)||S.us.some(u=>u.t===ally&&u.hp>0)))allies.push(ally)"),
  'AI tribute must remain available to allied kingdoms with surviving units or buildings even after Town Centre loss');

console.log('diplomacy: all source regression assertions passed');
