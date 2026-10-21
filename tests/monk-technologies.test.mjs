import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';
function fixture(){
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 const modules=['network-sync','network-commands','network-unit-map'].map(n=>readFileSync(new URL('../js/'+n+'.js',import.meta.url),'utf8')).join('\n');
 vm.runInContext(source+'\n'+modules+`\nseedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;vm=0;startAge=3;startRes=3;start();snd=0;S.humanTeams=[0,1];S.us=[];S.bs=[];S.nodes=[];S.rel=[];S.pj=[];S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.nd.fill(null);S.res.forEach(r=>{r.f=r.w=r.g=r.s=20000});
 globalThis.monk=addU(0,'mon',20.5,20.5);globalThis.target=addU(1,'mil',23.5,20.5);target.st=4;
 globalThis.run=code=>eval(code);globalThis.hash=()=>CK_SIM_SYNC.worldCheckpoint(S,1).hash;
 globalThis.act=(order,team=0)=>CK_GAME_COMMANDS.execute(order,team,1);`,sandbox);return sandbox;
}

test('all eleven monk technologies and Murder Holes have paid research, sites, age gates and duplicate protection',()=>{
 const c=fixture();
 c.run("globalThis.monastery=addB(0,'monastery',5,5,true);globalThis.university=addB(0,'univ',10,5,true)");
 for(const key of ['devotion','faith','heresy','redemption','atonement','sanctity','fervor','blockPrinting','illumination','theocracy','herbalMedicine','murderHoles']){
  const site=key==='murderHoles'?'university':'monastery';
  c.run(`S.age[0]=TE.${key}.age-1`);assert.equal(c.act({type:'research',entities:[c.run(`${site}.netId`)],value:key}),false,key+' age');
  c.run('S.age[0]=3');const gold=c.run('S.res[0].g');assert.equal(c.act({type:'research',entities:[c.run(`${site}.netId`)],value:key}),true,key);assert.equal(c.run('S.res[0].g'),gold-c.run(`TE.${key}.cost.g||0`));
  c.run(`upB(${site},TE.${key}.t)`);assert.equal(c.run(`S.tech[0].${key}`),1,key);
  const paid=c.run('S.res[0].g');assert.equal(c.run(`research(${site},'${key}')`),false);assert.equal(c.run('S.res[0].g'),paid);
 }
 c.run('S.tech[0].faith=0;S.tech[0].devotion=0');assert.equal(c.run("research(monastery,'faith')"),false,'Faith requires Devotion');
});

test('Sanctity preserves damage and upgrades future monks; Fervor, Block Printing and Illumination have real effects',()=>{
 const c=fixture();c.run("monk.hp=20;globalThis.home=addB(0,'monastery',5,5,true);research(home,'sanctity');upB(home,60)");
 assert.equal(c.run('monk.hp'),35);assert.equal(c.run("addU(0,'mon',18,18).hp"),45);assert.equal(c.run('mhp(monk)'),45);
 const speed=c.run('unitSpeed(monk)');c.run('S.tech[0].fervor=1');assert.equal(c.run('unitSpeed(monk)'),speed*1.15);
 assert.equal(c.run('conversionRange(monk,target)'),9);c.run('S.tech[0].blockPrinting=1');assert.equal(c.run('conversionRange(monk,target)'),12);assert.equal(c.run('unitSight(monk)'),14);
 c.run('monk.faith=0;upU(monk,10)');assert.equal(c.run('monk.faith'),16);
 c.run('monk.faith=0;S.tech[0].illumination=1;upU(monk,10)');assert.equal(c.run('monk.faith'),32);
});

test('conversion uses seeded interval rolls, current target identity, resistance, ownership and faith',()=>{
 const c=fixture();c.run('S.r=()=>0;beginConversion([monk],target)');
 c.run('for(let i=0;i<149;i++)upU(monk,DT)');assert.equal(c.run('target.t'),1);
 c.run('upU(monk,DT)');assert.equal(c.run('target.t'),0);assert.equal(c.run('monk.faith'),0);assert.equal(c.run('monk.o'),'i');
 assert.equal(c.run('beginConversion([monk],addU(1,\'mil\',25,20))'),false,'exhausted faith cannot convert again');
 for(const [flags,min,max] of [['',5,9],['S.tech[1].devotion=1',6,10],['S.tech[1].devotion=1;S.tech[1].faith=1',10,14]]){
  const d=fixture();d.run(flags);assert.equal(d.run('conversionWindow(target).min'),min);assert.equal(d.run('conversionWindow(target).max'),max);
 }
 const d=fixture();d.run("beginConversion([monk],target);monk.cv=8;globalThis.second=addU(1,'mil',25,20);monk.tg=second;S.r=()=>0;upU(monk,DT)");
 assert.equal(d.run('second.t'),1);assert.ok(d.run('monk.cv')<1,'new target cannot inherit old charge');
 d.run('second.t=0;upU(monk,DT)');assert.equal(d.run('monk.o'),'i');assert.equal(d.run('monk.cv'),0);
});

test('Atonement and Redemption gate monks, siege and adjacent building capture without stealing production',()=>{
 const c=fixture();c.run("globalThis.other=addU(1,'mon',24,20);globalThis.ram=addU(1,'ram',25,20);globalThis.market=addB(1,'market',27,20,true)");
 for(const name of ['other','ram','market'])assert.equal(c.run(`canConvert(monk,${name})`),false,name);
 for(const kind of ['ram','mang','scor','treb','bomb'])assert.equal(c.run(`canConvert(monk,addU(1,'${kind}',25,20))`),false,kind+' requires Redemption');
 c.run('S.tech[0].atonement=1;S.tech[0].redemption=1');
 for(const name of ['other','ram','market'])assert.equal(c.run(`canConvert(monk,${name})`),true,name);
 assert.equal(c.run('conversionRange(monk,ram)'),1);assert.equal(c.run('conversionRange(monk,market)'),1);
 for(const kind of ['tc','castle','monastery','wall','palisade','gate','wonder'])assert.equal(c.run(`canConvert(monk,addB(1,'${kind}',40,40,true))`),false,kind);
 c.run("market.q=[{k:'cart',t:10}];market.rs={k:'loom',t:20};market.rally={x:30,y:30};beginConversion([monk],market);monk.x=26.5;monk.y=20.5;S.r=()=>0;for(let i=0;i<451;i++)upU(monk,DT)");
 assert.equal(c.run('market.t'),0);assert.equal(c.run('market.q.length'),0);assert.equal(c.run('market.rs'),null);assert.equal(c.run('market.rally'),null);
});

test('Heresy kills instead of transferring; Theocracy changes shared-target faith consumption',()=>{
 const c=fixture();c.run('S.tech[1].heresy=1;beginConversion([monk],target);upU(monk,DT);monk.cv=9;upU(monk,DT)');
 assert.equal(c.run('target.hp'),0);assert.equal(c.run('target.t'),1);assert.equal(c.run('monk.faith'),0);
 for(const theocracy of [false,true]){
  const d=fixture();d.run(`globalThis.helper=addU(0,'mon',20.5,21.5);S.tech[0].theocracy=${theocracy?1:0};beginConversion([monk,helper],target);monk.cvTargetId=target.netId;monk.cvTeam=target.t;monk.cv=9;upU(monk,DT)`);
  assert.equal(d.run('target.t'),0);assert.equal(d.run('monk.faith'),0);assert.equal(d.run('helper.faith??100'),theocracy?100:0);assert.equal(d.run('helper.o'),'i');
 }
});

test('conversion command rejects malformed, hidden, foreign, loaded, civilian and unavailable members atomically',()=>{
 for(const setup of ["monk.t=1","monk.ld={}","monk.rel={}","monk.st=4","monk.faith=50","target.hp=0","target.t=0","target.x=60;target.y=60","target.cg=[{hp:1}]"]){
  const c=fixture();c.run(setup);const before=c.hash();assert.equal(c.act({type:'convert',entities:[c.run('monk.netId')],target:c.run('target.netId')}),false,setup);assert.equal(c.hash(),before,setup);
 }
 const c=fixture();const order={type:'convert',entities:[c.run('monk.netId')],target:c.run('target.netId')};
 assert.equal(c.CK_SIM_SYNC.validOrder({...order,value:'instant'},72),false);assert.equal(c.CK_SIM_SYNC.validOrder({...order,point:{x:1,y:1}},72),false);
 c.run("globalThis.worker=addU(0,'vil',20,22)");assert.equal(c.act({...order,entities:[order.entities[0],c.run('worker.netId')]}),false);
 c.run('globalThis.pathOriginal=path;path=()=>null');const before=c.hash();assert.equal(c.act(order),false);assert.equal(c.hash(),before);
});

test('Murder Holes removes the blind spot and defensive search skips an ineligible nearer enemy',()=>{
 const c=fixture();c.run("S.us=[];globalThis.tower=addB(0,'tower',20,20,true);globalThis.close=addU(1,'mil',19.5,21);globalThis.far=addU(1,'mil',16,21);upB(tower,DT)");
 assert.equal(c.run('S.pj.length'),1);assert.equal(c.run('S.pj[0].t===far'),true);
 c.run('S.pj=[];far.hp=0;tower.cd=0;upB(tower,DT)');assert.equal(c.run('S.pj.length'),0);
 c.run("S.tech[0].murderHoles=1;tower.cd=0;upB(tower,DT)");assert.equal(c.run('S.pj[0].t===close'),true);
 const castle=fixture();castle.run("S.us=[];globalThis.fort=addB(0,'castle',40,40,true);addU(1,'mil',39.5,42);upB(fort,DT)");assert.equal(castle.run('S.pj.length'),0);castle.run('S.tech[0].murderHoles=1;fort.cd=0;upB(fort,DT)');assert.equal(castle.run('S.pj.length'),1);
 const d=fixture();d.run("S.us=[];globalThis.tc=addB(0,'tc',20,20,true);globalThis.raider=addU(1,'mil',19.5,21.5);upB(tc,DT)");assert.equal(d.run('S.pj.length'),1,'Town Centres have no blind spot');
});

test('Herbal Medicine heals validated garrison passengers faster without healing transports or foreign manifests',()=>{
 const c=fixture();c.run("globalThis.tc=addB(0,'tc',20,20,true);monk.ld=tc;monk.hp=10;tc.cg=[monk];upB(tc,10)");assert.equal(c.run('monk.hp'),11);
 c.run('S.tech[0].herbalMedicine=1;upB(tc,10)');assert.equal(c.run('monk.hp'),17);
 c.run('monk.t=1;upB(tc,10)');assert.equal(c.run('monk.hp'),17);
});

test('conversion progress, target binding and faith survive save/load and participate in checksums',()=>{
 const c=fixture();c.run('beginConversion([monk],target);upU(monk,DT);monk.cv=3.25;monk.cvNext=5');
 const id=c.run('monk.netId'),before=c.hash();c.run('monk.cv+=.1');assert.notEqual(c.hash(),before);c.run('monk.cv-=.1');
 assert.equal(c.run('saveG()'),true);assert.equal(c.run('loadG()'),true);assert.equal(c.run(`S.us.find(u=>u.netId==='${id}').cv`),3.25);
 for(const bad of ['faith=-1','faith=101','cv=-1','cvNext=2.2','cvTeam=9']){
  c.run(`globalThis.raw=JSON.parse(localStorage.getItem(skey(slot)));raw.us[0].${bad};localStorage.setItem(skey(slot),JSON.stringify(raw))`);assert.equal(c.run('loadG()'),false,bad);c.run('saveG()');
 }
});

test('controller contextual A and RT Convert submit typed orders without local conversion, with pending/cancel guards',()=>{
 const c=fixture(),orders=[],description={textContent:''},canvas={style:{},setAttribute(){},addEventListener(){},focus(){},getContext:()=>new Proxy({},{get:()=>()=>{}})};
 const map=c.CK_UNIT_MAP.create({canvas,description,submit:o=>{orders.push(o);return{ok:true}},leave(){}});
 c.map=map;c.run('map.refresh(S,0,W,H,true)');map.choose({x:20.5,y:20.5});const before=c.hash();
 map.choose({x:23.5,y:20.5});assert.equal(orders[0].type,'convert');assert.equal(c.hash(),before);
 c.run('map.refresh(S,0,W,H,true)');
 const arm=()=>{map.control({7:true},{7:true});const angle=2*Math.PI/3;map.control({}, {7:true},[Math.sin(angle),-Math.cos(angle)]);map.control({0:true},{7:true,0:true});map.control({},{});};
 arm();assert.equal(orders.length,1);assert.match(description.textContent,/hostile target/);
 map.choose({x:23.5,y:20.5});assert.equal(orders[1].type,'convert');assert.equal(c.hash(),before);
 c.run('map.refresh(S,0,W,H,true)');arm();map.control({1:true},{1:true});map.control({},{});assert.equal(orders.length,2);
 map.choose({x:20.5,y:20.5});arm();c.run('map.refresh(S,0,W,H,false)');map.choose({x:23.5,y:20.5});assert.equal(orders.length,2);
});
