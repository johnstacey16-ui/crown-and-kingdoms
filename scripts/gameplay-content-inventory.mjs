/* Generate a reviewable content register from production rules, never hand-copy
 * availability tables. Presence/structural validity is not gameplay acceptance. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const files=['js/config.js','js/kingdom.js','js/civilizations.js',
 'js/simulation-research.js','js/simulation-production-queues.js'];
export function gameplayContentInventory(){
 const sources=files.map(file=>readFileSync(new URL('../'+file,import.meta.url),'utf8'));
 const result=vm.runInNewContext('let S=null;\n'+sources.join('\n')+`\n(()=>{
 const civilizations=CIV.map((c,id)=>{
  const world={civ:[id],age:[3],tech:[{}],bs:[]};
  const allowedBuildings=Object.keys(B).filter(k=>civilizationBuildingAllowed(k,0,world.civ));
  world.bs=allowedBuildings.map(k=>({k,t:0,done:true,hp:B[k].hp}));
  const availableResearch=[...new Set(allowedBuildings.flatMap(k=>rsOf({k,t:0},world.civ)))];
  const stages=[];
  for(let age=0;age<=3;age++){
   world.age[0]=age;world.tech[0]={};
   // Fixed point handles prerequisite order and early civilization research.
   let changed=true;
   while(changed){changed=false;for(const kind of allowedBuildings){
    if(buildingUnlock(kind,0,world).state!=='available')continue;
    const b={k:kind,t:0};
    for(const key of rsOf(b,world.civ)){
     const d=TE[key];if(!d||world.tech[0][key]||researchEffectiveAge(b,key,world.civ)>age||d.pre&&!world.tech[0][d.pre])continue;
     world.tech[0][key]=1;changed=true;
    }
   }}
   const production=Object.fromEntries(allowedBuildings.filter(k=>buildingUnlock(k,0,world).state==='available').map(k=>[
    k,trOf({k,t:0},world.civ,world.tech,world.age).filter(u=>unitTrainingUnlock({k,t:0},u,world).state==='available')
   ]));
   stages.push({age,research:Object.keys(world.tech[0]),production});
  }
  return {id,name:c.n,playstyle:c.d,status:'partial',uniqueUnit:c.uu,
   uniqueTechnologies:[c.ut.k,c.ut2?.k].filter(Boolean),elite:c.elite?.k,
   startingEffect:c.fx.toString(),teamWork:c.teamWork||{},teamEconomic:c.teamEconomic||{},
   teamCombat:c.teamCombat||{},teamResearch:c.teamResearch||null,teamDockPopulation:c.teamDockPopulation||0,
   allowedBuildings,unavailableBuildings:Object.keys(B).filter(k=>!allowedBuildings.includes(k)),
   availableResearch,unavailableResearch:Object.keys(TE).filter(k=>!availableResearch.includes(k)),stages};
 });
 const technologies=Object.fromEntries(Object.entries(TE).map(([id,d])=>[id,{...d,
  effect:d.fx?.toString()||null,fx:undefined,status:'partial',
  civilizations:civilizations.filter(c=>c.availableResearch.includes(id)).map(c=>c.id)}]));
 const units=Object.fromEntries(Object.entries(U).map(([id,d])=>[id,{...d,status:'partial',
  production:civilizations.flatMap(c=>c.stages.flatMap(stage=>Object.entries(stage.production)
   .filter(([,units])=>units.includes(id)).map(([building])=>({civilization:c.id,age:stage.age,building})))),
  upgrades:Object.entries(TE).filter(([,d])=>d.hpb?.[id]||d.atkb?.[id]).map(([key])=>key)}]));
 const buildings=Object.fromEntries(Object.entries(B).map(([id,d])=>[id,{...d,status:'partial',
  civilizations:civilizations.filter(c=>c.allowedBuildings.includes(id)).map(c=>c.id)}]));
 return {civilizations,technologies,units,buildings,regionalUnitAccess:REGIONAL_UNIT_ACCESS};
})()`,{}, {timeout:10000});
 return JSON.parse(JSON.stringify({schemaVersion:1,
  sourceDigest:createHash('sha256').update(sources.join('\n')).digest('hex'),sources:files,
  scope:'Existing production roster only. Stages describe reachable unlocks, not automatic/free research. All entries remain partial pending behavioral and acceptance review. Unit upgrades list declarative stat changes; callback/special mechanics also require review.',
  ...result}));
}
export function validateGameplayInventory(report){
 const errors=[];
 for(const rule of report.regionalUnitAccess)for(const id of rule.civilizations){
  const c=report.civilizations[id];
  if(!c?.stages.some(s=>rule.buildings.some(b=>s.production[b]?.includes(rule.unit))))
   errors.push(c?.name+': unreachable regional unit '+rule.unit);
 }
 for(const c of report.civilizations){
  for(const stage of c.stages)for(const [building,kinds] of Object.entries(stage.production))
   if(new Set(kinds).size!==kinds.length)errors.push(c.name+': duplicate production option at '+building);
  const reached=new Set(c.stages.flatMap(s=>s.research));
  for(const k of c.availableResearch){
   const d=report.technologies[k];
   if(!d)errors.push(c.name+': missing technology '+k);
   else if(!reached.has(k))errors.push(c.name+': unreachable technology '+k);
  }
 }
 for(const [key,d] of Object.entries(report.technologies)){
  if(!Number.isFinite(d.t)||d.t<=0)errors.push(key+': invalid research duration');
  if(!Number.isInteger(d.age)||d.age<0||d.age>3)errors.push(key+': invalid age');
  if(!d.civilizations.length)errors.push(key+': no civilization can research this');
  for(const [resource,n] of Object.entries(d.cost||{}))if(!['f','w','g','s'].includes(resource)||!Number.isFinite(n)||n<0)errors.push(key+': invalid cost');
  for(const stat of ['hpb','atkb'])for(const [unit,n] of Object.entries(d[stat]||{}))
   if(!report.units[unit]||!Number.isFinite(n))errors.push(key+': invalid '+stat+' unit '+unit);
 }
 return errors;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const report=gameplayContentInventory(),errors=validateGameplayInventory(report);
 if(process.argv.includes('--write'))writeFileSync(new URL('../docs/gameplay-content-register.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({civilizations:report.civilizations.length,technologies:Object.keys(report.technologies).length,
  units:Object.keys(report.units).length,buildings:Object.keys(report.buildings).length,errors},null,2));
 if(errors.length)process.exitCode=1;
}
