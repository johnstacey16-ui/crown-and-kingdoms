import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const ai=readFileSync(new URL('../js/ai.js',import.meta.url),'utf8');
const start=ai.indexOf('function aiSavingAgeFood(t,villagers){');
const end=ai.indexOf('function aiTownTechReady(',start);
assert.ok(start>=0&&end>start,'AI age-up food reservation helper is present');
function policy({villagers,age=0,ready=true}){
 const S={age:[age]};const AG=[{}, {cost:{f:500}},{cost:{f:800,g:200}},{cost:{f:1000,g:800}}];
 const ageRequirements=()=>({ready});
 return vm.runInNewContext(ai.slice(start,end)+'\n;aiSavingAgeFood(0,'+villagers+');',{S,AG,ageRequirements});
}
test('AI saves food after reaching a productive village and meeting age requirements',()=>{
 assert.equal(policy({villagers:16}),true);
 assert.equal(policy({villagers:20}),true);
 assert.equal(policy({villagers:15}),false,'small early economies continue to grow');
 assert.equal(policy({villagers:25,ready:false}),false,'missing prerequisite buildings need workers');
 assert.equal(policy({villagers:30,age:3}),false,'Imperial Age has no next age');
});
test('real AI Town Centre training honours age budget decision',()=>{
 assert.match(ai,/!aiSavingAgeFood\(t,vil\.length\)\)train\(tc,'vil'\)/);
 assert.match(ai,/const savingForAge=/);
});
