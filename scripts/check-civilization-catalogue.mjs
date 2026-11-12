/* Current active roster inventory and DLC-data schema validation.
 * No gameplay content is loaded from JSON yet; js/civilizations.js remains authoritative
 * until the runtime data migration has tests for saves, production and peers. */
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const readHere=relative=>readFileSync(new URL(relative,import.meta.url),'utf8');

export function currentCivilizationRuntime(roster=readHere('../js/civilizations.js'),config=readHere('../js/config.js'),kingdom=readHere('../js/kingdom.js')){
 // Evaluate the live definitions/selectors, rather than a copied tech tree.
 return vm.runInNewContext(config+'\n'+kingdom+'\n'+roster+`\n({
  civilizations:CIV.map((c,id)=>({id,name:c.n,uniqueUnit:c.uu,uniqueTechnology:c.ut?.k,secondUniqueTechnology:c.ut2?.k,eliteUpgrade:c.elite?.k,fx:c.fx,ut:c.ut,ut2:c.ut2,elite:c.elite})),
  units:U,buildings:B,technologies:TE,regionalUnitAccess:REGIONAL_UNIT_ACCESS,
  researchGroups:[
   ['archery',CIV_ARCHERY_RESEARCH,{xbow:'x',arb:'a',thumb:'t'}],
   ['coreMilitary',CIV_CORE_MILITARY,CORE_MILITARY_RESEARCH_KEYS,CORE_MILITARY_UNIT_KEYS],
   ['field',CIV_FIELD_RESEARCH,FIELD_RESEARCH_KEYS],
   ['monastery',CIV_MONASTERY_RESEARCH,MONASTERY_RESEARCH_KEYS],
   ['university',CIV_UNIVERSITY_RESEARCH,UNIVERSITY_RESEARCH_KEYS],
   ['blacksmith',CIV_BLACKSMITH_RESEARCH,BLACKSMITH_RESEARCH_KEYS],
   ['infantryArmor',CIV_INFANTRY_ARMOR_RESEARCH,INFANTRY_ARMOR_RESEARCH_KEYS],
   ['archerArmor',CIV_ARCHER_ARMOR_RESEARCH,ARCHER_ARMOR_RESEARCH_KEYS],
   ['cavalryArmor',CIV_CAVALRY_ARMOR_RESEARCH,CAVALRY_ARMOR_RESEARCH_KEYS],
   ['melee',CIV_MELEE_RESEARCH,MELEE_RESEARCH_KEYS]
  ].map(([id,flags,techKeys,unitKeys={}])=>({id,flags,techKeys,unitKeys})),
  researchAvailability:CIV.map((c,id)=>Object.fromEntries(Object.keys(B).map(kind=>[kind,rsOf({k:kind,t:0},[id])])) )
 })`,{}, {timeout:1000});
}

export function inspectCivilizationCatalogue(catalogue,runtime){
 const errors=[],civs=runtime?.civilizations,units=runtime?.units,buildings=runtime?.buildings;
 if(!catalogue||catalogue.schemaVersion!==2)errors.push('Unknown civilization catalogue schema');
 if(!Array.isArray(civs)||!civs.length||!units||!buildings)errors.push('Invalid active runtime catalogue');
 if(!Array.isArray(catalogue?.civilizations)||!catalogue.civilizations.length)errors.push('Missing civilization records');
 if(!Array.isArray(catalogue?.rulesets)||!catalogue.rulesets.length)errors.push('Missing ruleset status registry');
 if(errors.length)return errors;
 const statuses=new Set(['missing','partial','verified']);
 const ruleIds=new Set();
 for(const pack of catalogue.rulesets){
  if(!pack||typeof pack.id!=='string'||!pack.id||ruleIds.has(pack.id))errors.push('Invalid/duplicate ruleset ID: '+pack?.id);
  ruleIds.add(pack?.id);
  if(!statuses.has(pack?.implementation))errors.push('Invalid ruleset implementation status: '+pack?.id);
 }
 for(const id of ['medieval','return-of-rome','chronicles'])if(!ruleIds.has(id))errors.push('Missing reference ruleset: '+id);
 if(catalogue.civilizations.length!==civs.length)errors.push('Active civilization roster count mismatch: JSON '+
  catalogue.civilizations.length+', runtime '+civs.length);
 const names=new Set(),techs=new Set();
 for(let id=0;id<catalogue.civilizations.length;id++){
  const entry=catalogue.civilizations[id],actual=civs[id];
  if(!entry||!Number.isInteger(entry.id)||entry.id!==id){errors.push('Invalid ordered civilization ID at '+id);continue}
  if(typeof entry.name!=='string'||!entry.name.trim()||names.has(entry.name))errors.push('Invalid/duplicate civilization name at '+id);
  names.add(entry.name);
  if(!actual||entry.name!==actual.name)errors.push('Civilization name/index differs from active code at '+id);
  if(entry.uniqueUnit!==actual?.uniqueUnit||!units[entry.uniqueUnit])errors.push('Unknown or mismatched unique unit for '+entry.name);
  if(entry.uniqueTechnology!==actual?.uniqueTechnology||!actual?.ut||techs.has(entry.uniqueTechnology))
   errors.push('Unknown/duplicate unique technology for '+entry.name);
  techs.add(entry.uniqueTechnology);
  // Optional unique/Elite technologies must match the registered runtime,
  // not merely the source catalogue. This also guards accidental duplicate IDs.
  for(const [field,slot,label] of [
   ['secondUniqueTechnology','ut2','second unique technology'],
   ['eliteUpgrade','elite','Elite unique-unit upgrade']
  ]){
   const key=entry[field],definition=actual?.[slot];
   if(key!==actual?.[field]||
    key!==undefined&&(typeof key!=='string'||!key||!definition||techs.has(key)||
     runtime.technologies?.[key]!==definition))
    errors.push('Unknown/duplicate '+label+' for '+entry.name);
   if(key!==undefined)techs.add(key);
   if(key!==undefined&&(!definition||
    !(typeof definition.fx==='function'||definition.hpb||definition.atkb)||
    !Number.isInteger(definition.age)||definition.age<0||definition.age>3||
    !Number.isFinite(definition.t)||definition.t<=0||!definition.cost||
    Object.entries(definition.cost).some(([resource,amount])=>
     !['f','w','g','s'].includes(resource)||!Number.isFinite(amount)||amount<0)))
    errors.push('Invalid '+label+' definition for '+entry.name);
  }
  // Elite-only modifiers must be data-driven, finite and bounded.
  if(actual?.elite){
   const elite=actual.elite;
   if(elite.age!==3)errors.push('Elite upgrade must require Imperial Age for '+entry.name);
   if(elite.range!==undefined&&(!Number.isFinite(elite.range)||elite.range<0||elite.range>5))
    errors.push('Invalid Elite range modifier for '+entry.name);
   for(const [field,keys] of [['armor',['m','p']],['bonus',['archer','infantry','siege','building']]]){
    if(elite[field]!==undefined&&(
     !elite[field]||typeof elite[field]!=='object'||
     Object.entries(elite[field]).some(([name,n])=>!keys.includes(name)||!Number.isFinite(n)||n<0||n>30)))
     errors.push('Invalid Elite '+field+' modifier for '+entry.name);
   }
   for(const field of ['hpb','atkb']){
    if(elite[field]!==undefined&&Object.keys(elite[field]).some(k=>k!==actual.uniqueUnit))
     errors.push('Elite '+field+' affects foreign units for '+entry.name);
   }
  }
  // Per-civilization early-age research must be explicit, version-safe and
  // refer only to technologies actually present in that civilization's tree.
  if(actual?.earlyResearch!==undefined){
   const rule=actual.earlyResearch,keys=rule?.techs;
   if(!rule||Array.isArray(rule)||typeof rule!=='object'||
      Object.keys(rule).some(k=>!['economic','techs'].includes(k))||
      rule.economic!==undefined&&typeof rule.economic!=='boolean'||
      !Array.isArray(keys)||new Set(keys).size!==keys.length||
      (!keys.length&&!rule.economic)){
    errors.push('Invalid early research schema for '+entry.name);
   }else for(const key of keys){
    if(typeof key!=='string'||!runtime.technologies?.[key]||
       !Object.values(runtime.researchAvailability?.[id]||{}).some(list=>list.includes(key)))
     errors.push('Unavailable early research '+key+' for '+entry.name);
   }
  }
  if(typeof actual?.fx!=='function'||!(typeof actual?.ut?.fx==='function'||actual?.ut?.hpb||actual?.ut?.atkb))
   errors.push('Missing live civilization/technology effects for '+entry.name);
  if(!actual?.ut||!Number.isInteger(actual.ut.age)||actual.ut.age<0||actual.ut.age>3||
   !Number.isFinite(actual.ut.t)||actual.ut.t<=0||!actual.ut.cost||typeof actual.ut.cost!=='object'||
   Object.entries(actual.ut.cost).some(([resource,amount])=>!['f','w','g','s'].includes(resource)||!Number.isFinite(amount)||amount<0))
   errors.push('Invalid unique technology definition for '+entry.name);
  if(!ruleIds.has(entry.rulepack)||entry.rulepack!=='medieval')errors.push('Unimplemented or invalid current ruleset for '+entry.name);
  if(entry.status!=='partial')errors.push('Current content must not be falsely marked complete for '+entry.name);
 }
 // Every represented civilization must have an explicit row in each live
 // restriction table. The runtime's permissive legacy fallback is not proof
 // that a newly added civilization has a complete, intentional technology tree.
 const groups=runtime.researchGroups,technologies=runtime.technologies;
 if(!Array.isArray(groups)||groups.length!==10||!technologies)errors.push('Missing research restriction groups');
 else{
  const groupIds=new Set();
  for(const group of groups){
   if(!group||typeof group.id!=='string'||groupIds.has(group.id)||!group.flags||!group.techKeys||!group.unitKeys){errors.push('Invalid research restriction group');continue}
   groupIds.add(group.id);
   const codes=[...Object.values(group.techKeys),...Object.values(group.unitKeys)],alphabet=new Set(codes);
   if(codes.some(code=>typeof code!=='string'||code.length!==1)||alphabet.size!==codes.length)errors.push('Invalid research flag mapping in '+group.id);
   for(const key of Object.keys(group.techKeys))if(!technologies[key])errors.push('Unknown research technology '+key+' in '+group.id);
   for(const key of Object.keys(group.unitKeys))if(!units[key])errors.push('Unknown restricted unit '+key+' in '+group.id);
   for(const name of Object.keys(group.flags))if(!civs.some(c=>c.name===name))errors.push('Unknown civilization row '+name+' in '+group.id);
   for(let id=0;id<civs.length;id++){
    const civ=civs[id],flags=group.flags[civ.name],listed=catalogue.civilizations[id]?.researchFlags;
    if(typeof flags!=='string'){errors.push('Missing research row '+group.id+' for '+civ.name);continue}
    if(new Set(flags).size!==flags.length||[...flags].some(flag=>!alphabet.has(flag)))errors.push('Invalid research flags '+group.id+' for '+civ.name);
    if(!listed||listed[group.id]!==flags)errors.push('Research catalogue differs for '+civ.name+' / '+group.id);
   }
  }
  for(const entry of catalogue.civilizations)if(entry?.researchFlags&&Object.keys(entry.researchFlags).some(key=>!groupIds.has(key)))errors.push('Unknown catalogue research group for '+entry.name);
 }
 if(technologies){
  const checked=new Set(),checking=new Set();
  const visit=key=>{
   if(checking.has(key)){errors.push('Cyclic research prerequisite at '+key);return}
   if(checked.has(key))return;
   checking.add(key);
   const tech=technologies[key],parent=tech?.pre;
   if(parent!==undefined){
    if(typeof parent!=='string'||!parent||!Object.prototype.hasOwnProperty.call(technologies,parent)||!technologies[parent])errors.push('Unknown research prerequisite '+parent+' for '+key);
    else{
     if((technologies[parent].age??0)>(tech.age??0))errors.push('Later-age research prerequisite '+parent+' for '+key);
     visit(parent);
    }
   }
   checking.delete(key);checked.add(key);
  };
  for(const key of Object.keys(technologies))visit(key);
 }
 if(!Array.isArray(runtime.researchAvailability)||runtime.researchAvailability.length!==civs.length)errors.push('Missing compiled research availability');
 else for(let id=0;id<civs.length;id++){
  const availability=runtime.researchAvailability[id];
  const accessible=new Set(Object.values(availability||{}).flatMap(list=>Array.isArray(list)?list:[]));
  for(const kind of Object.keys(buildings)){
   const list=availability?.[kind];
   if(!Array.isArray(list)||new Set(list).size!==list.length){errors.push('Invalid compiled research list for '+civs[id].name+' / '+kind);continue}
   for(const key of list){
    const tech=technologies?.[key];
    if(!tech)errors.push('Unknown compiled research '+key+' for '+civs[id].name);
    else if(tech.pre&&!accessible.has(tech.pre))errors.push('Unavailable research prerequisite '+tech.pre+' for '+civs[id].name+' / '+key);
   }
  }
 }
 const regional=catalogue.regionalUnitAccess;
 if(!regional||!statuses.has(regional.implementation)||!Array.isArray(regional.entries)){
  errors.push('Invalid regional-unit access registry');
 }else{
  if(regional.implementation==='missing'&&regional.entries.length)errors.push('Unimplemented regional-unit access has playable entries');
  const compiled=runtime.regionalUnitAccess;
  const listed=regional.entries.map(e=>({unit:e?.unit,civilizations:e?.civilizations,buildings:e?.buildings}));
  const running=Array.isArray(compiled)?Array.from(compiled,e=>({
   unit:e.unit,civilizations:Array.from(e.civilizations),buildings:Array.from(e.buildings)
  })):[];
  if(JSON.stringify(listed)!==JSON.stringify(running))errors.push('Regional production runtime differs from versioned JSON catalogue');
  const seen=new Set();
  for(const e of regional.entries){
   if(!e||typeof e.unit!=='string'||seen.has(e.unit)||!units[e.unit]){errors.push('Invalid/duplicate regional unit: '+e?.unit);continue}
   seen.add(e.unit);
   if(!Array.isArray(e.civilizations)||!e.civilizations.length||new Set(e.civilizations).size!==e.civilizations.length||
    e.civilizations.some(i=>!Number.isInteger(i)||i<0||i>=civs.length))errors.push('Invalid regional civilization eligibility: '+e.unit);
   if(!Array.isArray(e.buildings)||!e.buildings.length||new Set(e.buildings).size!==e.buildings.length||
    e.buildings.some(k=>!buildings[k]?.tr))errors.push('Invalid regional training building: '+e.unit);
  }
 }
 return errors;
}

function main(){
 const catalogue=JSON.parse(readHere('../data/civilizations.json'));
 const runtime=currentCivilizationRuntime(),errors=inspectCivilizationCatalogue(catalogue,runtime);
 if(errors.length){for(const error of errors)console.error('[civilization catalogue] '+error);process.exitCode=1;return}
 console.log('Civilization catalogue valid:',catalogue.civilizations.length,
  'current civs,',catalogue.rulesets.length,'ruleset status families,',
  catalogue.regionalUnitAccess.entries.length,'implemented regional-unit entries,',
  runtime.researchGroups.length*runtime.civilizations.length,'restriction rows,',
  runtime.researchAvailability.reduce((n,entry)=>n+Object.keys(entry).length,0),'compiled research contexts');
}
if(process.argv[1]&&new URL('file://'+process.argv[1]).pathname===new URL(import.meta.url).pathname)main();
