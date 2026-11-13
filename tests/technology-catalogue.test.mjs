// Validate technology catalogue wiring without launching the browser runtime.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const { U, B, TE, AG } = vm.runInNewContext(source + '\n;({U,B,TE,AG})');
const offered = new Set();

for (const [buildingId, building] of Object.entries(B)) {
  for (const techId of building.rs || []) {
    assert.ok(TE[techId], `${buildingId} offers undefined technology ${techId}`);
    offered.add(techId);
  }
  for (const unitId of building.tr || []) {
    assert.ok(U[unitId], `${buildingId} trains undefined unit ${unitId}`);
  }
}
for (const [id, tech] of Object.entries(TE)) {
  assert.ok(offered.has(id), `technology ${id} cannot be researched at any building`);
  assert.ok(Number.isFinite(tech.t) && tech.t > 0, `technology ${id} has invalid research time`);
  assert.ok(Number.isInteger(tech.age) && tech.age >= 0 && tech.age < AG.length,
    `technology ${id} has invalid age`);
  for (const [resource, amount] of Object.entries(tech.cost || {})) {
    assert.ok(['f', 'w', 'g', 's'].includes(resource) && Number.isFinite(amount) && amount >= 0,
      `technology ${id} has invalid cost for ${resource}`);
  }
  for (const field of ['hpb', 'atkb']) {
    for (const [unitId, bonus] of Object.entries(tech[field] || {})) {
      assert.ok(U[unitId], `technology ${id} modifies unknown unit ${unitId}`);
      assert.ok(Number.isFinite(bonus), `technology ${id} has invalid ${field} bonus`);
    }
  }
  if (tech.pre) {
    assert.ok(TE[tech.pre], `technology ${id} requires unknown technology ${tech.pre}`);
    assert.ok(TE[tech.pre].age <= tech.age,
      `technology ${id} is available before prerequisite ${tech.pre}`);
  }
}
for (const id of Object.keys(TE)) {
  const seen = new Set([id]);
  let current = TE[id].pre;
  while (current) {
    assert.ok(!seen.has(current), `cyclic technology prerequisite at ${id}`);
    seen.add(current);
    current = TE[current].pre;
  }
}
console.log(`technology-catalogue: ${Object.keys(TE).length} technologies validated`);

// Full runtime matrix: every exposed technology must traverse the real paid
// queue and completion path, including the unique technologies registered later.
const {headlessGame}=await import('./helpers/headless-game.mjs');
const {gameplayContentInventory,validateGameplayInventory}=await import('../scripts/gameplay-content-inventory.mjs');
const inventory=gameplayContentInventory();
assert.deepEqual(validateGameplayInventory(inventory),[]);
assert.deepEqual(JSON.parse(readFileSync(new URL('../docs/gameplay-content-register.json',import.meta.url),'utf8')),inventory,
 'Regenerate the review inventory after changing production content');
const broken=structuredClone(inventory);
for(const stage of broken.civilizations[32].stages)for(const kinds of Object.values(stage.production)){
 const at=kinds.indexOf('winged');if(at>=0)kinds.splice(at,1);
}
assert.ok(validateGameplayInventory(broken).includes('Lithuanians: unreachable regional unit winged'),
 'The validator must catch an unavailable regional upgrade, not just accept names');
const {source:runtime,sandbox}=headlessGame();sandbox.assert=assert;
vm.createContext(sandbox);
const total=vm.runInContext(runtime+`\n(()=>{
 kingdoms=2;startAge=3;startRes=3;start();let checked=0;
 for(let id=0;id<CIV.length;id++){
  S.civ=[id,(id+1)%CIV.length];S.age=[3,3];
  for(const kind of Object.keys(B)){
   if(!civilizationBuildingAllowed(kind,0,S.civ))continue;
   for(const key of rsOf({k:kind,t:0})){
    S.tech=[{},{}];S.res[0]={f:100000,w:100000,g:100000,s:100000};
    S.us=[];S.bs=[];S.rel=[];S.pj=[];
    const b=addB(0,kind,30,30,true);b.cd=999;b.cg=[];
    S.res[0]={f:100000,w:100000,g:100000,s:100000};
    let pre=TE[key].pre;while(pre){S.tech[0][pre]=1;pre=TE[pre].pre;}
    const label=CIV[id].n+' / '+kind+' / '+key;
    const cost={...researchCost(b,key)};
    assert.equal(research(b,key),true,label+' starts');
    for(const [res,n] of Object.entries(cost))assert.equal(S.res[0][res],100000-n,label+' pays '+res);
    assert.equal(S.tech[0][key],undefined,label+' is not instantaneous');
    upB(b,.001);assert.equal(S.tech[0][key],undefined,label+' honors its timer');
    upB(b,TE[key].t+1);assert.equal(S.tech[0][key],1,label+' completes');
    const funds=JSON.stringify(S.res[0]);
    assert.equal(research(b,key),false,label+' cannot repeat');
    assert.equal(JSON.stringify(S.res[0]),funds,label+' cannot double charge');
    checked++;
   }
  }
 }
 return checked;
})()`,sandbox,{timeout:30000});
console.log('technology-catalogue: '+total+' civilization/building paid research contexts completed');

sandbox.inventory=inventory;
const training=vm.runInContext(`(()=>{
 let checked=0;popLimit=200;
 for(const c of inventory.civilizations)for(const stage of c.stages)
  for(const [kind,units] of Object.entries(stage.production))for(const unit of units){
   S.civ=[c.id,(c.id+1)%CIV.length];S.age=[stage.age,stage.age];
   S.tech=[Object.fromEntries(stage.research.map(k=>[k,1])),{}];
   S.us=[];S.bs=[];S.rel=[];S.pj=[];S.nodes=[];S.nd.fill(null);
   S.g.fill(0);S.gt.fill(0);S.wt.fill(U[unit].sh?1:0);
   S.res[0]={f:100000,w:100000,g:100000,s:100000};
   addB(0,'tc',5,5,true);
   const b=addB(0,kind,30,30,true);b.cd=999;b.cg=[];
   const label=c.name+' / age '+stage.age+' / '+kind+' / '+unit;
   const before={...S.res[0]},cost=unitTrainingCost(0,unit);
   assert.equal(train(b,unit),true,label+' starts');
   for(const [r,n] of Object.entries(cost))assert.equal(S.res[0][r],before[r]-n,label+' pays '+r);
   upB(b,.001);assert.equal(S.us.length,0,label+' honors training time');
   upB(b,1000);assert.equal(S.us.length,1,label+' produces one unit');
   assert.equal(S.us[0].k,unit,label+' produces correct kind');
   assert.ok(Number.isFinite(S.us[0].hp)&&S.us[0].hp>0,label+' alive');
   assert.ok(Number.isFinite(unitSpeed(S.us[0]))&&unitSpeed(S.us[0])>0,label+' mobile');
   checked++;
  }
 return checked;
})()`,sandbox,{timeout:30000});
console.log('technology-catalogue: '+training+' civilization/age/building training contexts completed');
