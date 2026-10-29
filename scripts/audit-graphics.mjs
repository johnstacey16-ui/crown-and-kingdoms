// Inventory actual runtime catalogue coverage; art presence is not final acceptance.
import {readFileSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
const pack=JSON.parse(read('assets/atlas-manifest.json')),ctx={};vm.createContext(ctx);vm.runInContext(read('js/config.js')+'\n'+read('engine.js').split('\n').filter(line=>line.startsWith('Object.assign(U,')).join('\n')+';globalThis.catalog={U,B}',ctx);
const proxies=new Set(['tca','tw','cs']);
const animations=key=>pack.atlases.map(a=>a.meta.anims[key]).filter(Boolean);
const units=Object.entries(ctx.catalog.U).filter(([k])=>!proxies.has(k)).map(([kind,d])=>({kind,name:d.n,paintedBase:animations(kind+'/idle/0').length>0,walkFrames:Math.max(0,...animations(kind+'/walk/0').map(a=>a.frames?.length||0)),attackFrames:Math.max(0,...animations(kind+'/attack/0').map(a=>a.frames?.length||0)),directionalArt:'unfinished',deathArt:'base-art fall transform'}));
const buildings=Object.entries(ctx.catalog.B).map(([kind,d])=>({kind,name:d.n,paintedBase:animations('bld_'+kind+'/idle/0').length>0,factionArchitecture:'unfinished',ageArt:['house','tc'].includes(kind)&&animations('bld_'+kind+'_age_3/idle/0').length?'four original shared age designs':'unfinished',constructionArt:'shared scaffolding overlay',damageArt:'shared smoke overlay'}));
const checklist=[
 {category:'Unit base artwork',state:'present',evidence:'47 playable kinds; see catalogue',remaining:'play-scale faction/direction review'},
 {category:'Unit animation',state:'partial',evidence:units.filter(u=>u.walkFrames>1&&u.attackFrames>1).length+' of '+units.length+' kinds have painted multi-frame movement/activity art',remaining:(units.some(u=>u.walkFrames<=1||u.attackFrames<=1)?units.filter(u=>u.walkFrames<=1||u.attackFrames<=1).length+' kinds, ':'')+'independent directions, work variants and dedicated death sheets'},
 {category:'Building artwork',state:'partial',evidence:buildings.length+' painted kinds including farm',remaining:'faction architecture, other building age variants and distinct construction/damage states'},
 {category:'Terrain and coasts',state:'partial',evidence:'painted materials and textured transitions',remaining:'biome-specific integration and repetition review'},
 {category:'Natural resources',state:'partial',evidence:'painted resources with last-40-units stone/gold/berry art; eight-pose neutral deer/fish idles',remaining:'tree/death states and physical Xbox resource/wildlife readability'},
 {category:'Fish traps',state:'partial',evidence:'four neutral painted basket/net variants shared by solo and team-relative views',remaining:'waterline/readability review on Xbox'},
 {category:'Relics',state:'partial',evidence:'painted ground/carried reliquary in both renderers',remaining:'hardware readability and animated pickup/deposit presentation'},
 {category:'Combat and world effects',state:'partial',evidence:'procedural projectiles, particles, smoke, rubble and transformed corpses',remaining:'coherent upgraded effects and dedicated destruction art'},
 {category:'HUD, menus and command wheels',state:'partial',evidence:'navy/gold panels, text and command markers',remaining:'complete icon set, scene backgrounds and Xbox readability review'},
 {category:'Minimap and multiplayer presentation',state:'partial',evidence:'team-relative terrain and current-sight entities; responsive room panels',remaining:'full match and large scene acceptance'},
 {category:'Xbox Series S Edge image/performance',state:'unverified',evidence:'local desktop Chromium checks only',remaining:'physical Xbox 50/75/100 percent picture presets and large land/naval benchmarks'}
];
const inventory={scope:'All currently implemented graphics categories; future gameplay/DLC additions require new art coverage',complete:false,atlases:pack.atlases.length,units,buildings,checklist};
const out=JSON.stringify(inventory,null,2)+'\n',path=new URL('docs/graphics-inventory.json',root);
const table=checklist.map(x=>'| '+x.category+' | '+x.state+' | '+x.remaining+' |').join('\n');
const missing=units.filter(x=>x.walkFrames<=1||x.attackFrames<=1).map(x=>x.name).join(', ');
const human='# Complete graphics overhaul checklist\n\nTracks every current visual category, including unfinished art. Source catalogue: [graphics-inventory.json](graphics-inventory.json). Regenerate with `node scripts/audit-graphics.mjs`; verify with `--check`.\n\n| Category | Status | Remaining work |\n|---|---|---|\n'+table+'\n\n## Painted movement/activity roster\n\n'+(missing?missing+'.':'All current playable kinds have painted movement/activity sheets; automatic activity-event integration still requires review.')+'\n\nAll 47 playable troops have base artwork. Dedicated directional/work/death art still requires review across the full roster; an eight-frame sheet is not eight independent directions. New gameplay/DLC catalogue entries must also receive art and acceptance coverage.\n';
const humanPath=new URL('docs/GRAPHICS_OVERHAUL_CHECKLIST.md',root);
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==out||readFileSync(humanPath,'utf8')!==human)throw Error('Graphics inventory or checklist is stale');console.log('Graphics inventory and checklist match runtime catalogue.')}else{writeFileSync(path,out);writeFileSync(humanPath,human);console.log('Wrote graphics inventory and checklist; full overhaul remains unfinished.');}
