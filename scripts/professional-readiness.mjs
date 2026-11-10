// Read-only, locally reproducible professional readiness snapshot.
// Counts source-backed content without inventing browser, Xbox or human evidence.
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>JSON.parse(readFileSync(new URL(p,root),'utf8'));
export function professionalReadiness(catalogue,graphics,atlas){
 if(!Array.isArray(catalogue?.civilizations)||!Array.isArray(graphics?.units)||
    !Array.isArray(graphics?.buildings)||!Array.isArray(atlas?.atlases))
   throw Error('Missing current runtime quality inventories');
 const civs=catalogue.civilizations,units=graphics.units,buildings=graphics.buildings;
 const valid=c=>typeof c.name==='string'&&c.name.length>0;
 if(!civs.every(valid)||civs.some((c,i)=>c.id!==i))throw Error('Invalid ordered civilization inventory');
 const metrics={
  civilizations:civs.length,
  eliteResearchLines:civs.filter(c=>typeof c.eliteUpgrade==='string'&&c.eliteUpgrade.length>0).length,
  secondUniqueTechnologies:civs.filter(c=>typeof c.secondUniqueTechnology==='string'&&c.secondUniqueTechnology.length>0).length,
  paintedUnitBases:units.filter(u=>u.paintedBase).length,
  totalUnits:units.length,
  movementAndAttackSheets:units.filter(u=>u.walkFrames>1&&u.attackFrames>1).length,
  independentDirectionArt:units.filter(u=>u.directionalArt==='verified').length,
  dedicatedDeathArt:units.filter(u=>u.deathArt==='verified').length,
  buildingsWithBaseArt:buildings.filter(b=>b.paintedBase).length,
  totalBuildings:buildings.length,
  factionArchitecture:buildings.filter(b=>b.factionArchitecture==='verified').length,
  atlasEntries:atlas.atlases.length
 };
 const artComplete=graphics.complete===true&&metrics.paintedUnitBases===metrics.totalUnits&&
  metrics.independentDirectionArt===metrics.totalUnits&&
  metrics.dedicatedDeathArt===metrics.totalUnits&&
  metrics.factionArchitecture===metrics.totalBuildings;
 return {
  scope:'Source/manifest coverage only; never device, player, match balance or production acceptance',
  metrics,
  gates:{
   gameplay:'PARTIAL — per-civilization/full game contract not established by inventory',
   graphics:artComplete?'STRUCTURAL COVERAGE ONLY — requires human and device inspection':
     'PARTIAL — inspect independent poses, faction art and dedicated Elite sprites',
   xbox:'UNVERIFIED — requires a measured, physical Series S Edge play session',
   campaigns:'UNVERIFIED ON CURRENT HEAD — run 19 full missions and human playtests',
   aiBalance:'UNVERIFIED — run repeated seeds/maps/difficulties and review win rates',
   multiplayer:'PARTIAL — reconnect, real WAN and anti-cheat threat model remain open',
   accessibility:'UNVERIFIED — test remapping, contrast, readability and reduced effects',
   legal:'REVIEW — original art licensing and redistribution policy need owner decision',
   release:'NOT VERIFIED — compare tested source SHA to the live Vercel alias'
  }
 };
}
export function renderReadiness(summary){
 const m=summary.metrics;
 return [
  '# Professional readiness — generated source snapshot',
  '',
  summary.scope,
  '',
  '| Metric | Source-observed count |','| --- | ---: |',
  ...Object.entries(m).map(([key,value])=>'| '+key+' | '+value+' |'),
  '',
  '| Acceptance dimension | Status / missing evidence |','| --- | --- |',
  ...Object.entries(summary.gates).map(([key,value])=>'| '+key+' | '+value+' |'),
  '',
  'Checks: node scripts/run-checks.mjs --quick / --focused / --regression-files / --skirmishes / --campaigns / --browser / --xbox-contracts.',
  'Do not confuse these source counts with shipped content, verified sprite states, real Xbox FPS or a production release.',
  ''
 ].join('\n');
}
if(process.argv[1]&&new URL('file://'+process.argv[1]).pathname===new URL(import.meta.url).pathname){
 const result=professionalReadiness(read('data/civilizations.json'),read('docs/graphics-inventory.json'),read('assets/atlas-manifest.json'));
 if(process.argv.includes('--json'))console.log(JSON.stringify(result,null,2));
 else console.log(renderReadiness(result));
}
