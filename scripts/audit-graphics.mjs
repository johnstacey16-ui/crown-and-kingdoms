// Inventory actual runtime catalogue coverage; art presence is not final acceptance.
import {readFileSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
const pack=JSON.parse(read('assets/atlas-manifest.json')),ctx={};vm.createContext(ctx);vm.runInContext(read('js/config.js')+'\n'+read('engine.js').split('\n').filter(line=>line.startsWith('Object.assign(U,')).join('\n')+';globalThis.catalog={U,B}',ctx);
const proxies=new Set(['tca','tw','cs']);
const animations=key=>pack.atlases.map(a=>a.meta.anims[key]).filter(Boolean);
const units=Object.entries(ctx.catalog.U).filter(([k])=>!proxies.has(k)).map(([kind,d])=>({kind,name:d.n,paintedBase:animations(kind+'/idle/0').length>0,walkFrames:Math.max(0,...animations(kind+'/walk/0').map(a=>a.frames?.length||0)),attackFrames:Math.max(0,...animations(kind+'/attack/0').map(a=>a.frames?.length||0)),directionalArt:'unfinished',deathArt:'base-art fall transform'}));
const buildings=Object.entries(ctx.catalog.B).map(([kind,d])=>({kind,name:d.n,paintedBase:animations('bld_'+kind+'/idle/0').length>0,factionArchitecture:'unfinished',constructionArt:'shared scaffolding overlay',damageArt:'shared smoke overlay'}));
const checklist=[
 {category:'Unit base artwork',state:'present',evidence:'47 playable kinds; see catalogue',remaining:'play-scale faction/direction review'},
 {category:'Unit animation',state:'partial',evidence:units.filter(u=>u.walkFrames>1&&u.attackFrames>1).length+' of '+units.length+' kinds have painted multi-frame walk and attack',remaining:'28 kinds, independent directions, work variants and dedicated death sheets'},
 {category:'Building artwork',state:'partial',evidence:buildings.length+' painted kinds including farm',remaining:'faction/age architecture and distinct construction/damage states'},
 {category:'Terrain and coasts',state:'partial',evidence:'painted materials and textured transitions',remaining:'biome-specific integration and repetition review'},
 {category:'Natural resources',state:'partial',evidence:'painted wood, stone, gold, berries, fish and deer',remaining:'depletion states and wildlife/fish animation'},
 {category:'Fish traps',state:'partial',evidence:'procedural basket/water marker',remaining:'dedicated painted trap sprite'},
 {category:'Relics',state:'partial',evidence:'painted ground/carried reliquary in both renderers',remaining:'hardware readability and animated pickup/deposit presentation'},
 {category:'Combat and world effects',state:'partial',evidence:'procedural projectiles, particles, smoke, rubble and transformed corpses',remaining:'coherent upgraded effects and dedicated destruction art'},
 {category:'HUD, menus and command wheels',state:'partial',evidence:'navy/gold panels, text and command markers',remaining:'complete icon set, scene backgrounds and Xbox readability review'},
 {category:'Minimap and multiplayer presentation',state:'partial',evidence:'team-relative terrain and current-sight entities; responsive room panels',remaining:'full match and large scene acceptance'},
 {category:'Xbox Series S Edge image/performance',state:'unverified',evidence:'local desktop Chromium checks only',remaining:'physical Xbox 50/75/100 percent picture presets and large land/naval benchmarks'}
];
const inventory={scope:'All currently implemented graphics categories; future gameplay/DLC additions require new art coverage',complete:false,atlases:pack.atlases.length,units,buildings,checklist};
const out=JSON.stringify(inventory,null,2)+'\n',path=new URL('docs/graphics-inventory.json',root);
if(process.argv.includes('--check')){if(readFileSync(path,'utf8')!==out)throw Error('Graphics inventory is stale');console.log('Graphics inventory matches runtime catalogue.')}else{writeFileSync(path,out);console.log('Wrote graphics inventory; full overhaul remains unfinished.');}
