import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../js/campaign.js',import.meta.url),'utf8');
function game(i=12){
 const data=new Map();
 const c={S:{bs:[{k:'tc',t:0,hp:100,done:true}],us:[],rel:[],over:null},
  U:{spear:{dmg:4},gal:{dmg:6,sh:true},cart:{dmg:0},vil:{dmg:1},mon:{dmg:0},king:{dmg:0}},
  cmp:{i,t:10,k:14,d:{},e:{}},mode:'play',E:[],bi:0,
  note(){},sfx(){},sting(){},rumble(){},localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}};
 c.endGame=result=>{c.S.over=result;c.mode='end'};
 vm.createContext(c);vm.runInContext(source+';globalThis.missions=CAMP;globalThis.counts={cb,cu,cmil,aliveUnits};globalThis.arcs=CAMP_ARCS',c);
 return {c,data,tick:()=>{c.cmp.k=14;c.cmpTick(1)},goal:id=>c.missions[i].goals.find(g=>g.id===id)};
}
test('living army objectives count sheltered and transported soldiers, excluding dead and foreign units',()=>{
 const {c,goal}=game();
 c.S.us=Array.from({length:12},(_,i)=>({k:'spear',t:0,hp:10,ld:i%2?{}:null}));
 assert.equal(goal('army').ok(),true);
 c.S.us[0].hp=0;
 c.S.us.push({k:'spear',t:1,hp:10},{k:'cart',t:0,hp:10},{k:'unknown',t:0,hp:10});
 assert.equal(goal('army').ok(),false);
 assert.equal(c.counts.cmil(0),11);
 assert.equal(c.counts.aliveUnits(0,'spear').length,11);
});
test('construction and villager counts require living owned entities and completed buildings',()=>{
 const {c}=game();
 c.S.bs.push(...[{done:true,hp:10},{done:false,hp:10},{done:true,hp:0},{done:true,hp:10,t:1}].map(b=>({k:'house',t:0,...b})));
 c.S.us=[{k:'vil',t:0,hp:10,ld:{}},{k:'vil',t:0,hp:0},{k:'vil',t:1,hp:10}];
 assert.equal(c.counts.cb('house'),1);assert.equal(c.counts.cu('vil'),1);
});
for(const [i,id,n] of [[3,'r',3],[11,'relics',2],[13,'relics',2]])test(`mission ${i} requires relics in surviving completed friendly monasteries`,()=>{
 const {c,goal}=game(i);const m={t:0,done:true,hp:100};
 c.S.rel=Array.from({length:n},()=>({m}));
 assert.equal(goal(id).ok(),true);
 for(const change of [{hp:0},{hp:100,done:false},{done:true,t:1}]){Object.assign(m,change);assert.equal(goal(id).ok(),false)}
});
test('losing a sustained force objective clears completion and blocks victory until restored',()=>{
 const {c,data,tick}=game();
 c.S.bs.push({k:'dock',t:0,hp:10,done:true},{k:'tc',t:1,hp:10});
 c.S.us=[...Array.from({length:3},()=>({k:'gal',t:0,hp:10})),...Array.from({length:12},()=>({k:'spear',t:0,hp:10,ld:{}}))];
 tick();assert.equal(c.cmp.d.army,1);assert.equal(c.S.over,null);
 c.S.us[3].hp=0;c.S.bs[2].hp=0;tick();
 assert.equal(c.cmp.d.army,0);assert.equal(c.S.over,null);assert.equal(data.size,0);
 c.S.us[3].hp=10;tick();assert.equal(c.S.over,'win');assert.equal(JSON.parse(data.get('ck_camp'))[12],1);
});
test('Town Centre destruction takes precedence over completed objectives',()=>{
 const {c,data,tick}=game(0);for(const g of c.missions[0].goals)c.cmp.d[g.id]=1;
 c.S.bs[0].hp=0;tick();assert.equal(c.S.over,'lose');assert.equal(data.size,0);
});
test('briefing rejects locked and invalid missions, permits each arc opener and unlocked successor',()=>{
 const {c}=game();const started=[];c.startScenario=i=>started.push(i);c.E[0]=1;
 for(const i of [-1,19,1.5,'0',1]){c.bi=i;c.briefCtl()}
 assert.deepEqual(started,[]);
 for(const arc of c.arcs){c.bi=arc.ids[0];c.briefCtl();c.campMark(arc.ids[0]);c.bi=arc.ids[1];c.briefCtl()}
 assert.deepEqual(started,Array.from(c.arcs).flatMap(a=>Array.from(a.ids).slice(0,2)));
});
test('retained dead enemy Town Centre records stop raids before spawning or pathfinding',()=>{
 const {c}=game();c.S.bs.push({k:'tc',t:1,hp:0});
 c.spawnPos=()=>assert.fail('No spawn lookup after the enemy Town Centre falls');
 c.raid(5,['spear'],'Raid');
 assert.equal(c.S.us.length,0);
});
