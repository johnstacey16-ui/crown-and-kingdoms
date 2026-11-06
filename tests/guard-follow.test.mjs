import assert from 'node:assert/strict';
import {loadCoreGameSource} from '../scripts/runtime-sources.mjs';

const html = loadCoreGameSource({includeUI:true,includeAssets:true});

assert.match(html, /function orderGuardFollow\(wx,wy,kind\)\{/,
  'Guard and Follow must use a shared controller-order handler');
assert.match(html, /target\.t!==0&&diplomacyRelation\(0,target\.t\)!=='ally'/,
  'Guard/Follow targets must be owned by the player or an ally');
assert.match(html, /u\.k!=='vil'&&u\.k!=='cart'&&u\.k!=='cog'&&guardTargetCompatible\(u,target\)/,
  'Guard/Follow must exclude villagers/traders and keep land/ship movement types compatible');
assert.match(html, /if\(u\.o==='F'\|\|u\.o==='G'\)\{const target=u\.tg;/,
  'Guard/Follow orders must be processed continuously by the simulation');
assert.match(html, /if\(u\.o==='G'&&u\.st!==4\)\{const e=foe\(u,6\);if\(e&&e!==target&&d2\(e\.x,e\.y,target\)<=5\)/,
  'Guard must engage hostile units only around the protected target and respect No Attack');
assert.match(html, /const spacing=u\.o==='F'\?1\.25:2,dist=d2\(u\.x,u\.y,target\)/,
  'Follow and Guard must maintain separate target distances');
assert.match(html, /const guard=u\.guardTarget&&u\.guardTarget\.hp>0\?u\.guardTarget:null;u\.o=guard\?'G'/,
  'A guard unit must return to its protected target after its attack ends');
assert.match(html, /\{l:'Follow friendly target',c:\{\},lk:'',fn:\(\)=>\{menu=null;pat=3;/,
  'Follow must be accessible from the existing controller menu');
assert.match(html, /\{l:'Guard friendly target',c:\{\},lk:'',fn:\(\)=>\{menu=null;pat=4;/,
  'Guard must be accessible from the existing controller menu');
assert.match(html, /if\(pat===3\|\|pat===4\)orderGuardFollow\(wx,wy,pat===3\?'F':'G'\)/,
  'The next controller A press must apply Guard/Follow to the cursor target');
assert.match(html, /pat===3\?'FOLLOW: select a friendly target, B cancel':pat===4\?'GUARD: select a friendly target, B cancel'/,
  'The HUD must explain Guard/Follow targeting to the player');
assert.match(html, /u\.autoWorker=0;u\.guardTarget=null;/,
  'New direct player orders must cancel previous guard behaviour');
assert.match(html, /function stopSel\(\)\{[\s\S]{0,200}u\.guardTarget=null/,
  'Stop must clear guard/follow behavior');

console.log('guard-follow: all 13 source regression assertions passed');

// Execute production orders and movement, rather than only inspecting source.
const {default: test}=await import('node:test');
const {default: vm}=await import('node:vm');
const {headlessGame}=await import('./helpers/headless-game.mjs');
function coast(){
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+';globalThis.run=code=>eval(code);',sandbox);
 sandbox.run("kingdoms=2;start();S.us=[];S.bs=[];S.nodes=[];S.nd.fill(null);S.wt.fill(0);S.g.fill(0);S.gt.fill(0);S.ex.fill(1);S.vs.fill(1);for(let y=38;y<44;y++)for(let x=1;x<W-1;x++)S.wt[y*W+x]=1;globalThis.home=addB(0,'dock',40,36,true);globalThis.ship=addU(0,'gal',50.5,40.5);globalThis.land=addU(0,'knight',35.5,35.5);S.sel=[ship];foeGridDirty=true;");
 return sandbox.run;
}
test('warships guard and follow a completed friendly Dock through the production movement loop',()=>{
 for(const action of ['G','F']){
  const run=coast();assert.equal(run(`orderGuardFollow(41,37,'${action}')`),true);
  run('for(let i=0;i<900;i++)upU(ship,1/30)');
  assert.equal(run('ship.tg===home'),true);assert.equal(run('ship.o'),action);
  assert.ok(run('d2(ship.x,ship.y,home)')<=(action==='G'?2:1.25));
  run('home.hp=0;upU(ship,1/30)');assert.equal(run('ship.o'),'i');assert.equal(run('ship.tg'),null);
 }
});
test('Dock compatibility retains ownership, completion and unit-family restrictions',()=>{
 const run=coast();run("globalThis.enemy=addB(1,'dock',60,36,true);globalThis.unfinished=addB(0,'dock',70,36,false);globalThis.castle=addB(0,'castle',80,30,true)");
 for(const point of [[61,37],[71,37],[82,32],[35.5,35.5]])assert.equal(run(`orderGuardFollow(${point},'G')`),false);
 run("S.dip[0][1]='ally'");assert.equal(run("orderGuardFollow(61,37,'G')"),true,'allied completed Docks are valid');
 run("S.dip[0][1]='neutral'");assert.equal(run("orderGuardFollow(61,37,'G')"),false);run('upU(ship,1/30)');assert.equal(run('ship.o'),'i','a revoked alliance cancels guarding');
 run('S.sel=[land]');assert.equal(run("orderGuardFollow(ship.x,ship.y,'G')"),false,'land troops cannot follow a ship');
 assert.equal(run("orderGuardFollow(41,37,'G')"),true,'land troops can still guard their own Dock');
 run("ship.ld=home;S.sel=[ship]");assert.equal(run("orderGuardFollow(41,37,'G')"),false,'loaded units cannot receive a new order');
});
test('Dock guards respect No Attack, intercept perimeter threats and return after combat',()=>{
 const run=coast();assert.equal(run("orderGuardFollow(41,37,'G')"),true);
 run("for(let i=0;i<900;i++)upU(ship,1/30);globalThis.raider=addU(1,'gal',ship.x+1,ship.y);foeGridDirty=true;ship.st=4;upU(ship,1/30)");
 assert.equal(run('ship.o'),'G','No Attack preserves the guard station without engaging');
 run('ship.st=0;upU(ship,1/30)');assert.equal(run('ship.o'),'a');assert.equal(run('ship.tg===raider&&ship.guardTarget===home'),true);
 run('raider.hp=0;upU(ship,1/30)');assert.equal(run('ship.o'),'G');assert.equal(run('ship.tg===home'),true);
});

test('Dock guards stop pursuing a living raider outside the protected perimeter',()=>{
 const run=coast();run("orderGuardFollow(41,37,'G');for(let i=0;i<900;i++)upU(ship,1/30);globalThis.raider=addU(1,'gal',ship.x+1,ship.y);foeGridDirty=true;upU(ship,1/30)");
 assert.equal(run('ship.o'),'a');
 run('raider.x=70.5;ship.wind=.2;ship.windTarget=raider.netId;upU(ship,1/30)');
 assert.equal(run('raider.hp>0'),true,'the raider escapes alive');
 assert.equal(run('ship.o'),'G','the guard resumes its duty without needing a kill');
 assert.equal(run('ship.tg===home'),true);assert.equal(run('ship.guardTarget'),null);
 assert.equal(run('ship.wind'),0,'an abandoned attack cannot release a delayed shot');
 run('foeGridDirty=true;for(let i=0;i<600;i++)upU(ship,1/30)');
 assert.ok(run('d2(ship.x,ship.y,home)')<=2);
});

test('an active interception respects No Attack and changes to the protected target',()=>{
 for(const change of ['ship.st=4','home.hp=0',"home.t=1;S.dip[0][1]='neutral'",'home.done=false']){
  const run=coast();run("orderGuardFollow(41,37,'G');for(let i=0;i<900;i++)upU(ship,1/30);globalThis.raider=addU(1,'gal',ship.x+1,ship.y);foeGridDirty=true;upU(ship,1/30)");
  assert.equal(run('ship.o'),'a');const health=run('raider.hp');
  run(change+';ship.cd=0;ship.wind=.2;upU(ship,1/30)');
  assert.equal(run('ship.o'),change==='ship.st=4'?'G':'i',change);
  assert.equal(run('raider.hp'),health);assert.equal(run('ship.guardTarget'),null);assert.equal(run('ship.wind'),0);
 }
});
test('direct Attack continues beyond a nearby Dock perimeter',()=>{
 const run=coast();run("globalThis.raider=addU(1,'gal',70.5,40.5);ship.o='a';ship.tg=raider;ship.guardTarget=null;upU(ship,1/30)");
 assert.equal(run('ship.o'),'a');assert.equal(run('ship.tg===raider'),true);assert.ok(run('ship.p.length')>0);
});

test('saving during an interception restores the live protected target and rejects invalid references',()=>{
 const run=coast();run("orderGuardFollow(41,37,'G');for(let i=0;i<900;i++)upU(ship,1/30);globalThis.raider=addU(1,'gal',ship.x+1,ship.y);foeGridDirty=true;upU(ship,1/30);globalThis.shipId=ship.netId;globalThis.raiderId=raider.netId");
 assert.equal(run('saveG()'),true);assert.equal(run('loadG()'),true);
 run("ship=S.us.find(u=>u.netId===shipId);home=S.bs.find(b=>b.k==='dock');raider=S.us.find(u=>u.netId===raiderId)");
 assert.equal(run('ship.guardTarget===home'),true,'the target must resolve to the actual restored building');
 run('raider.x+=20;upU(ship,1/30)');assert.equal(run('ship.o'),'G');assert.equal(run('ship.tg===home'),true);
 run('globalThis.goodSave=localStorage.getItem(skey(slot))');
 for(const bad of ['{}',"'n0'","'u99999'",'42']){
  run(`globalThis.payload=JSON.parse(goodSave);payload.us.find(u=>u.netId===shipId).guardTarget=${bad};localStorage.setItem(skey(slot),JSON.stringify(payload));globalThis.beforeLoad=S`);
  assert.equal(run('loadG()'),false,'reject invalid guard reference '+bad);assert.equal(run('S===beforeLoad'),true);
 }
});

test('a guarded moving unit with reciprocal combat targets saves without circular data',()=>{
 const run=coast();run("globalThis.ram=addU(0,'ram',35.5,34.5);globalThis.raider=addU(1,'knight',36.5,35.5);S.sel=[land];foeGridDirty=true;orderGuardFollow(ram.x,ram.y,'G');upU(land,1/30);ram.o='a';ram.tg=raider;raider.o='a';raider.tg=land;globalThis.landId=land.netId;globalThis.ramId=ram.netId");
 assert.equal(run('land.guardTarget===ram'),true);assert.equal(run('saveG()'),true,'combat cycles use references instead of embedded entities');
 assert.equal(run('loadG()'),true);run('land=S.us.find(u=>u.netId===landId);ram=S.us.find(u=>u.netId===ramId)');
 assert.equal(run('land.guardTarget===ram'),true);
});
