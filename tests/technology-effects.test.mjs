import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/entities.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input-selection.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render-troops.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation-combat-bonuses.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation-resource-routing.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation-building-production.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation-building-updates.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation-unit-behaviour.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation-separation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const researchPolicy = readFileSync(new URL('../js/ai-policy.js', import.meta.url), 'utf8');

// Source-level guards for technology effects on current and future game objects.
assert.match(html, /function farmFood\(t\)\{const q=S\.tech\[t\]\|\|\{\};return 175\+\(q\.coll\?75:0\)\+\(q\.plow\?125:0\)\+\(q\.crop\?175:0\)\}/, 'farm capacity must reflect researched Horse Collar, Heavy Plow and Crop Rotation');
assert.match(html, /if\(\['coll','plow','crop'\]\.includes\(k\)\)\{const add=k==='coll'\?75:k==='plow'\?125:175;for\(const n of S\.nodes\)if\(n\.k==='f'&&n\.fm&&n\.t===b\.t&&S\.nd\[n\.y\*W\+n\.x\]===n\)n\.amt\+=add\}/, 'farm capacity research must also extend existing farms');
assert.match(html, /if\(e\.hpb\)\{T0\.hpb=T0\.hpb\|\|\{\};for\(const q in e\.hpb\)\{T0\.hpb\[q\]=\(T0\.hpb\[q\]\|\|0\)\+e\.hpb\[q\];for\(const x of S\.us\)if\(x\.t===b\.t&&x\.k===q&&x\.hp>0\)x\.hp\+=e\.hpb\[q\]\}\}/, 'unit hit-point upgrades must update existing units as well as the tech ledger');
assert.match(html, /hp:U\[k\]\.hp\+\(S\.tech\[t\]\.hpb&&S\.tech\[t\]\.hpb\[k\]\|\|0\)/, 'newly created units must inherit researched hit-point upgrades');
assert.match(html, /if\(e\.atkb\)\{T0\.atkb=T0\.atkb\|\|\{\};for\(const q in e\.atkb\)T0\.atkb\[q\]=\(T0\.atkb\[q\]\|\|0\)\+e\.atkb\[q\]\}/, 'unit attack upgrades must update the shared tech ledger');
assert.match(html, /tk\.atkb&&tk\.atkb\[a\.k\]\|\|0/, 'combat damage must apply researched unit-specific attack bonuses');
assert.match(html, /if\(k==='mas'\|\|k==='fw'\)refreshResearchedBuildingHP\(b.t,k\)/, 'structural research refreshes existing buildings through the shared calculation');
assert.match(html, /mh0=buildingMaxHP\(t,k\)/, 'new buildings use the same health calculation');
assert.match(html, /tech\.mas\?1\.4:1/, 'Masonry retains its health multiplier');
assert.match(html, /tech\.fw&&wall\?1\.8:1/, 'Fortified Wall retains its wall and gate multiplier');



assert.match(html, /function gm\(u,tg\)\{const t=S\.tech\[u\.t\];let m=\(t\.gath\?1\.25:1\)\*\(typeof georgianChurchWorkRate==='function'\?georgianChurchWorkRate\(u\):1\)/,
  'Gather Rate research must affect existing villagers on future collection ticks');
assert.match(html, /if\(k==='w'\)\{m\*=1\+\(armenian\?\.28:\.2\)\*!!t\.axe\+\(armenian\?\.28:\.2\)\*!!t\.saw/,
  'Double-bit Axe and Bow Saw must affect wood gathering');
assert.match(html, /if\(k==='g'\)m\*=1\+\(armenian\?\.21:\.15\)\*!!t\.gmine[\s\S]{0,100}if\(k==='s'\)m\*=1\+\(armenian\?\.21:\.15\)\*!!t\.smine/,
  'Gold Mining and Stone Mining must affect the matching resource gathering rates');
assert.match(html, /function gatherCapacity\(u\).*\bhunt=.*\?35:CAP\).*tech\.handcart\?\(hunt\?22:7\)/,
  'Carrying capacity must use the actual researched upgrades for current workers');
assert.match(html, /u\.car>=gatherCapacity\(u\)/,
  'Gatherers must query current capacity when deciding to return with resources');
const sim=readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
const routing=readFileSync(new URL('../js/simulation-resource-routing.js',import.meta.url),'utf8');
const begin=routing.indexOf('function gatherCapacity(u){');
const finish=routing.indexOf('\nfunction farmAvailableTo(',begin);
assert.ok(begin>=0&&finish>begin,'carry calculation must remain available');
const context={CAP:10,S:{tech:[{}]}};
const gatherCapacity=vm.runInNewContext(routing.slice(begin,finish)+'\n;gatherCapacity;',context);
const workingVillager={t:0,k:'vil'};
assert.equal(gatherCapacity(workingVillager),10);
context.S.tech[0].carry=1;
assert.equal(gatherCapacity(workingVillager),15,'an existing villager gains the carrying upgrade immediately');
context.S.tech[0].wheel=1;context.S.tech[0].handcart=1;
assert.equal(gatherCapacity(workingVillager),25,'Wheelbarrow and Hand Cart upgrades stack for villagers');
assert.match(html, /const line=INFARM\.has\(t\.k\)\?'armI':ARCHARM\.has\(t\.k\)\|\|t\.k==='rathaM'\?'armR':CAVARM\.has\(t\.k\)\?'armC':null/,
  'Blacksmith armour selects exactly one class, preserving Ratha stance continuity');
const mountedClass=html.match(/const CAVARM=new Set\(\[([^\]]+)\]\)/)?.[1];
assert.ok(mountedClass,'explicit mounted-class table must exist');
const cavalryKinds=new Set((mountedClass.match(/'[^']+'/g)||[]).map(k=>k.slice(1,-1)));
for(const kind of ['scout','knight','camel','centurion','monaspa','winged','shrivamsha'])
 assert.ok(cavalryKinds.has(kind),'mounted cavalry '+kind+' receives appropriate armour');
for(const kind of ['mil','spear','composite','warpriest','vil'])
 assert.equal(cavalryKinds.has(kind),false,'foot unit '+kind+' cannot receive cavalry armour');

assert.match(html, /smith:\{n:'Blacksmith',s:3,hp:400,cost:\{w:150\},bt:25,rs:\['forging','ironCasting','blastFurnace','atkR','armI','armI2','armI3','armR','armR2','armR3','armC','armC2','armC3','atkR2','bodkin'\]/,
  'Cavalry armour must be researched at the Blacksmith');
assert.match(html, /armC:\{n:'Scale Barding Armor \(\+1\/\+1 cavalry\)',cost:\{f:150\},t:45,age:1\}/,
  'Cavalry Armour matches the first source-pinned armor tier cost, research time and age');
assert.match(researchPolicy, /if\(k==='armC'&&ownCav>=3\)score\+=32/,
  'AI research priority must value cavalry armour when its own army fields cavalry');
assert.match(researchPolicy, /if\(k==='armI'&&ownInf>=3\)score\+=30/,
  'AI research priority must value infantry armour when its own army fields infantry');
assert.match(researchPolicy, /if\(k==='armR'&&ownRanged>=3\)score\+=32/,
  'AI research priority must value ranged armour when its own army fields ranged units');
assert.match(researchPolicy, /if\(k==='armR'&&ownRanged<2\)score-=28/,
  'AI should delay ranged armour when it has no meaningful ranged force');
assert.match(researchPolicy, /if\(k==='armC'&&ownCav<2\)score-=28/,
  'AI should delay cavalry armour when it has no meaningful cavalry force');
assert.match(researchPolicy, /if\(\['atkR','bodkin','atkR2','ballistics','thumb'\]\.includes\(k\)&&ownRanged<2\)score-=20/,
  'AI should avoid premature ranged attack research before fielding ranged units');
assert.match(html, /cav=!!\(T\.armC&&CAVARM\.has\(k\)\)/,
  'Researched cavalry armour must be visible on matching battlefield units');
assert.match(html, /if\(cav\)\{[\s\S]*?X\.stroke\(\);[\s\S]*?X\.restore\(\)/,
  'Cavalry barding must be drawn inside the translated/scaled sprite context');
assert.match(html, /const buildRate=\(S\.tech\[u\.t\]\.crane\?1\.2:1\)\*\(u\.k==='vil'&&S\.civ\?\.\[u\.t\]===40\?1\.05:1\)/,
  'Treadmill Crane must affect ongoing and future construction work rates');
assert.match(html, /\(tk\.slit\?2:0\)\+\(tk\.gtow\?3:0\)\+\(tk\.keep\?3:0\)\+\(S\.civ\?\.\[a\.t\]===42&&tk\.ut42\?2:0\)/,
  'Arrowslits, Guard Tower and Keep must feed the defensive building damage calculation');
assert.doesNotMatch(html, /tk\.gf\?4:0/,
  'Byzantine Greek Fire must not strengthen ordinary tower arrows');
assert.match(html, /a\.k==='fire'&&S\.civ\?\.\[a\.t\]===3&&S\.tech\[a\.t\]\?\.gf\?1:0/,
  'Greek Fire must instead extend a researched Byzantine Fire Ship attack range');
assert.match(html, /tk\.gtow\?3:0/,
  'Guard Tower must feed the defensive building damage calculation');
assert.match(html, /tk\.keep\?3:0/,
  'Keep must feed the defensive building damage calculation');

assert.match(html, /function unitName\(k,t\)\{\s*const tech=S&&S\.tech&&S\.tech\[t\]\|\|\{\};/,
  'Unit rank display must read the actual researching kingdom technology ledger');
assert.match(html, /if\(k==='mil'\)return tech\.champ\?'Champion':tech\.twohand\?'Two-Handed Swordsman':tech\.longs\?'Long Swordsman':tech\.man\?'Man-at-Arms':U\[k\]\.n/,
  'Existing and newly trained Militia must display the highest researched infantry rank');
const {B:technologyBuildings}=vm.runInNewContext(readFileSync(new URL('../js/config.js',import.meta.url),'utf8')+'\n;({B})');
assert.ok(['man','longs','twohand','champ','pike','halb'].every(id=>technologyBuildings.bar.rs.includes(id)),
  'Barracks must offer the six infantry upgrade technologies, alongside any newer valid research');
assert.match(html, /twohand:\{n:'Two-Handed Swordsman',cost:\{f:200,g:100\},t:45,age:3,pre:'longs',hpb:\{mil:5\},atkb:\{mil:3\}\}/,
  'Two-Handed Swordsman must have explicit prerequisites and real unit effects');
assert.match(html, /champ:\{n:'Champion',cost:\{f:650,g:350\},t:70,age:3,pre:'twohand',hpb:\{mil:5\},atkb:\{mil:2\}\}/,
  'Champion must require Two-Handed Swordsman and add real health and attack');
assert.ok(technologyBuildings.castle.rs.includes('cons'),
  'Conscription must remain researchable at the Castle after its tech tree expands');
assert.ok(technologyBuildings.castle.rs.includes('hoardings'),
  'Hoardings must be offered by the Castle, without replacing Conscription');
assert.match(html, /cons:\{n:'Conscription',cost:\{f:150,g:150\},t:60,age:3\}/,
  'Conscription must have explicit cost, research time and Imperial Age requirement');
assert.match(html, /const MILITARY_PRODUCTION_BUILDINGS=new Set\(\['bar','rng','stable','siege','castle','monastery','fchurch','dock'\]\)/,
  'Conscription must cover all military production buildings');
// Exercise the production source rather than pinning one minified function body.
const productionSource=readFileSync(new URL('../js/simulation-building-production.js',import.meta.url),'utf8');
const working={S:{tech:[{}]}};
const actualRate=vm.runInNewContext(productionSource+'\ntrainRate',working);
assert.equal(actualRate({k:'bar',t:0},'mil'),1);
working.S.tech[0].cons=1;
assert.equal(actualRate({k:'bar',t:0},'mil'),4/3,
 'Conscription speeds eligible military without requiring a different function shape');
for(const key of ['vil','cart','fish','trn','cog'])
 assert.equal(actualRate({k:'bar',t:0},key),1,'Conscription never speeds '+key);
assert.equal(actualRate({k:'tc',t:0},'vil'),1);
working.S.tech[0].perfusion=1;
assert.equal(actualRate({k:'bar',t:0},'mil'),8/3,'Goth Barracks work bonus stacks with Conscription');
assert.equal(actualRate({k:'rng',t:0},'arc'),4/3,'Perfusion affects Barracks only');
assert.match(html, /q\.t-=dt\*trainRate\(b,q\.k\)/,
  'Conscription must accelerate the live unit production queue, including units already queued');
assert.match(researchPolicy, /if\(k==='cons'&&arm\.length>=8\)score\+=24/,
  'AI must value Conscription once it has a substantial army');
assert.ok(['pike','halb'].every(id=>technologyBuildings.bar.rs.includes(id)),
  'Pikeman and Halberdier must remain in the Barracks research list without excluding other valid upgrades');
assert.match(html, /halb:\{n:'Halberdier',cost:\{f:300,g:600\},t:50,age:3,pre:'pike',hpb:\{spear:5\},atkb:\{spear:2\}\}/,
  'Halberdier must require Pikeman and add health/attack effects');
assert.match(html, /function spearLineBonus\(a,t\)/,
  'The evolving spear-line class bonus must be implemented in real combat');
assert.match(html, /T\.halb\?'halb':T\.pike\?'pike'/,
  'Battlefield sprites must use the highest researched spear-line rank');
assert.match(html, /rank==='pike'\|\|rank==='halb'/,
  'Halberdiers must receive the upgraded polearm rendering path');
assert.ok(technologyBuildings.stable.rs.includes('husb'),
  'Husbandry must be researchable at the Stable');
assert.match(html, /husb:\{n:'Husbandry',cost:\{f:150,g:150\},t:40,age:2\}/,
  'Husbandry must have explicit cost, duration and Castle Age availability');
const movement=readFileSync(new URL('../js/simulation-separation.js',import.meta.url),'utf8');
const speedStart=movement.indexOf('function unitSpeed(u){');
const speedEnd=movement.indexOf('const mv=(u,dx,dy)=>',speedStart);
assert.ok(speedStart>=0&&speedEnd>speedStart,'shared unit speed calculation must be present');
const speedContext={S:{tech:[{husb:1}]},U:{knight:{sp:1},mil:{sp:1},vil:{sp:1}},
  CAVARM:new Set(['knight']),INFARM:new Set(['mil'])};
const speed=vm.runInNewContext(movement.slice(speedStart,speedEnd)+'\n;unitSpeed;',speedContext);
assert.equal(speed({t:0,k:'knight'}),1.1,'Husbandry grants ten percent speed to mounted units');
assert.equal(speed({t:0,k:'mil'}),1,'Husbandry alone cannot accelerate infantry');
assert.equal(speed({t:0,k:'vil'}),1,'Husbandry alone cannot accelerate villagers');
speedContext.S.tech[0].squires=1;
assert.equal(speed({t:0,k:'mil'}),1.1,'Squires independently improves infantry mobility');
for(const kind of ['scout','knight','camel','coust','centurion','monaspa','shrivamsha'])
 assert.ok(cavalryKinds.has(kind),'Mounted classification covers '+kind+' consistently');
assert.match(researchPolicy, /if\(k==='husb'&&ownCav>=3\)score\+=22/,
  'AI should value Husbandry when it has a meaningful mounted force');
assert.match(html, /const rank=k==='mil'\?\(T\.champ\?'champ':T\.twohand\?'twohand':T\.longs\?'long':T\.man\?'man':''\)/,
  'The battlefield renderer must use the highest researched sword-line tier');
assert.match(html, /if\(rank==='man'\|\|rank==='long'\|\|rank==='twohand'\|\|rank==='champ'\)/,
  'Each sword-line tier must get the battlefield equipment drawing path');
assert.match(html, /if\(k==='spear'&&tech\.halb\)return 'Halberdier'/,
  'Pikemen must display as Halberdiers after the Imperial upgrade');
assert.match(html, /if\(k==='spear'&&tech\.pike\)return 'Pikeman'/,
  'Spearmen must display as Pikemen after that upgrade');
assert.match(html, /if\(k==='xbow'&&tech\.arb\)return 'Arbalester'/,
  'Crossbowmen must display as Arbalesters after that upgrade');
assert.match(html, /if\(k==='skirm'&&tech\.elsk\)return 'Elite Skirmisher'/,
  'Skirmishers must display their researched elite rank');
assert.match(html, /if\(k==='scout'&&tech\.lcav\)return 'Light Cavalry'/,
  'Scouts must display as Light Cavalry after that upgrade');
assert.match(html, /if\(k==='knight'&&tech\.cavl\)return 'Cavalier'/,
  'Knights must display as Cavaliers after that upgrade');
assert.match(html, /return\{l:unitName\(k,s\.t\),c:unitTrainingCost\(s\.t,k\)/,
  'Production menu labels must use the selected kingdom upgrade state');
assert.match(html, /note\(unitName\(q\.k,b\.t\)\+' trained'\)/,
  'Training feedback must use the researched unit name');
assert.match(html, /\$\{unitName\(a\.k,a\.t\)\}/,
  'The selected-unit HUD must use the researched unit name');
assert.ok(html.includes("const names=queue.map(q=>q&&U[q.k]?(unitName(q.k,a.t)?.[0]||'?'):'?').join('')"),
  'Production queue initials must use researched ranks and tolerate stale queue entries');
assert.match(html, /Training \$\{names\}/,
  'The selected-building HUD must display those validated queue initials');

// Every technology must connect to either a shared effect payload (unit HP/attack
// bonus or a callback), or one of the explicitly handled scalar technology flags.
const techStart = html.indexOf('const TE={');
const techEnd = html.indexOf('};', techStart);
assert.ok(techStart >= 0 && techEnd > techStart, 'Technology table must remain identifiable');
const techText = html.slice(techStart, techEnd + 1);
const techMatches = [...techText.matchAll(/(?:const TE=\{|,)\s*([A-Za-z][A-Za-z0-9]*):\{n:/g)];
const handledFlags = new Set(['gath','carry','wheel','handcart','squires','arson','forging','ironCasting','blastFurnace','atkR','armI','armI2','armI3','armR','armR2','armR3','armC','armC2','armC3','cons','husb','fw','gtow','keep','crane','mas','slit','axe','saw','gmine','smine','coll','plow','crop','atkR2','bodkin','ballistics','thumb','devotion','faith','heresy','redemption','atonement','fervor','blockPrinting','illumination','theocracy','herbalMedicine','murderHoles']);
const techRows = techMatches.map((match,index)=>{
 const end=index+1<techMatches.length?techMatches[index+1].index:techText.length;
 const block=techText.slice(match.index,end);
 return {key:match[1],hasEffectPayload:/\b(?:hpb|atkb):\{/.test(block)||/\bfx:/.test(block),hasRuntimeHandler:handledFlags.has(match[1])};
});
assert.deepEqual(techRows.filter(r=>!r.hasEffectPayload&&!r.hasRuntimeHandler).map(r=>r.key), [],
  'Every defined technology must have a generic effect payload or an explicitly handled gameplay flag');

console.log('technology-effects: static assertions passed');

