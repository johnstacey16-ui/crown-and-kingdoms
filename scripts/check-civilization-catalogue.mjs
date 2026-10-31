/* Current active roster inventory and DLC-data schema validation.
 * No gameplay content is loaded from JSON yet; engine.js remains authoritative
 * until the runtime data migration has tests for saves, production and peers. */
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const readHere=relative=>readFileSync(new URL(relative,import.meta.url),'utf8');

export function currentCivilizationRuntime(engine=readHere('../engine.js'),config=readHere('../js/config.js')){
 const from=engine.indexOf('const CIV=['),to=engine.indexOf('];\nCIV.forEach(',from);
 if(from<0||to<from)throw Error('Active CIV roster was moved without updating the catalogue checker');
 const civScript=engine.slice(from,to+2);
 const civilians=vm.runInNewContext('const hpbF=()=>{},atkbF=()=>{};\n'+civScript+
  '\nCIV.map((c,id)=>({id,name:c.n,uniqueUnit:c.uu,uniqueTechnology:c.ut?.k,fx:c.fx,ut:c.ut}))');
 const definitions=vm.runInNewContext(config+'\n({U,B,TE})');
 return {civilizations:civilians,units:definitions.U,buildings:definitions.B,technologies:definitions.TE};
}

export function inspectCivilizationCatalogue(catalogue,runtime){
 const errors=[],civs=runtime?.civilizations,units=runtime?.units,buildings=runtime?.buildings;
 if(!catalogue||catalogue.schemaVersion!==1)errors.push('Unknown civilization catalogue schema');
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
  if(typeof actual?.fx!=='function'||typeof actual?.ut?.fx!=='function')
   errors.push('Missing live civilization/technology effects for '+entry.name);
  if(!actual?.ut||!Number.isInteger(actual.ut.age)||actual.ut.age<0||actual.ut.age>3||
   !Number.isFinite(actual.ut.t)||actual.ut.t<=0||!actual.ut.cost||typeof actual.ut.cost!=='object'||
   Object.entries(actual.ut.cost).some(([resource,amount])=>!['f','w','g','s'].includes(resource)||!Number.isFinite(amount)||amount<0))
   errors.push('Invalid unique technology definition for '+entry.name);
  if(!ruleIds.has(entry.rulepack)||entry.rulepack!=='medieval')errors.push('Unimplemented or invalid current ruleset for '+entry.name);
  if(entry.status!=='partial')errors.push('Current content must not be falsely marked complete for '+entry.name);
 }
 const regional=catalogue.regionalUnitAccess;
 if(!regional||!statuses.has(regional.implementation)||!Array.isArray(regional.entries)){
  errors.push('Invalid regional-unit access registry');
 }else{
  if(regional.implementation==='missing'&&regional.entries.length)errors.push('Unimplemented regional-unit access has playable entries');
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
 const errors=inspectCivilizationCatalogue(catalogue,currentCivilizationRuntime());
 if(errors.length){for(const error of errors)console.error('[civilization catalogue] '+error);process.exitCode=1;return}
 console.log('Civilization catalogue valid:',catalogue.civilizations.length,
  'current civs,',catalogue.rulesets.length,'ruleset status families,',
  catalogue.regionalUnitAccess.entries.length,'implemented regional-unit entries');
}
if(process.argv[1]&&new URL('file://'+process.argv[1]).pathname===new URL(import.meta.url).pathname)main();
