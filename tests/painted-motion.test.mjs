import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';
const pack=JSON.parse(readFileSync(new URL('../assets/atlas-manifest.json',import.meta.url)));
function fixture(){const {source,sandbox}=headlessGame();vm.createContext(sandbox);vm.runInContext(source+'\n'+readFileSync(new URL('../js/assets.js',import.meta.url),'utf8')+`\nglobalThis.evaluate=code=>eval(code);`,sandbox);return sandbox.evaluate;}

test('all four kingdoms resolve eight distinct poses for core walking, attacks and villager work',()=>{
 const run=fixture();
 for(const a of pack.atlases){run(`regAtlas(${JSON.stringify(a.id)}, {}, ${JSON.stringify(a.meta)})`)}
 for(const kind of ['mil','knight','vil','arc','xbow','spear','scout','skirm','mon','axe','lbow','woad','bers','saml','tk','huskarl','jaguar','kamayuk','shotel','jan','genoa','plumed','gbeto','chuko','hcan','camel','mamel','mgd','cata','conq','boyar','tarkan','huszar'])for(let team=0;team<4;team++)for(const state of [1,2,...(['vil','mon'].includes(kind)?[3]:[])]){
  const frames=new Set();
  for(let i=0;i<8;i++)frames.add(run(`JSON.stringify(assetFrame('${kind}',${team},${state},0,0,0,${i/8}).f)`));
  assert.equal(frames.size,8,`${kind}/${state}/${team}`);
 }
});

test('cooldown phase controls attack frames and clamps endpoints independently of render time',()=>{
 const run=fixture(),a=pack.atlases.find(a=>a.id==='painted-motion-mil');run(`regAtlas('motion',{},${JSON.stringify(a.meta)})`);
 assert.equal(run("assetFrame('mil',0,2,0,0,0,0).f.x"),run("assetFrame('mil',0,2,0,999,0,-1).f.x"));
 assert.equal(run("JSON.stringify(assetFrame('mil',0,2,0,0,0,1).f)"),JSON.stringify(a.meta.anims['mil/attack/0'].frames[7]));
 run("globalThis.actor={k:'mil',netId:'u:1',x:12,y:15,p:[],o:'a',cd:U.mil.cd,tg:{x:10,y:15}}");
 assert.equal(run('unitVisualPose(actor,1).phase'),0);
 run('actor.cd=U.mil.cd/2');assert.equal(run('unitVisualPose(actor,1).phase'),.5);
 assert.equal(run('unitVisualPose(actor,1).heading'),Math.PI);
});

test('render poses freeze with game time, ignore route retry timers and never write simulation entities',()=>{
 const run=fixture();run("globalThis.actor={k:'vil',netId:'u:2',x:12,y:15,p:[[13,16]],o:'m',dr:3,fd:-1,rp:.6}");
 const before=run('JSON.stringify(actor)'),pose=run('JSON.stringify(unitVisualPose(actor,3))');
 for(let i=0;i<20;i++)assert.equal(run('JSON.stringify(unitVisualPose(actor,3))'),pose);
 assert.equal(run('JSON.stringify(actor)'),before);
 run('actor.rp=.1');assert.equal(run('JSON.stringify(unitVisualPose(actor,3))'),pose);
 assert.notEqual(run('unitVisualPose(actor,4).time'),run('unitVisualPose(actor,3).time'));
});

test('missing motion sheets fall through to the original painted poses',()=>{
 const run=fixture(),base=pack.atlases.find(a=>a.id==='painted-forces');run(`regAtlas('base',{},${JSON.stringify(base.meta)})`);
 assert.equal(run("assetFrame('knight',1,1,0,0).animated"),false);
 assert.equal(run("assetFrame('knight',1,1,0,0).painted"),true);
 for(const kind of ['jan','genoa','plumed','gbeto','chuko','hcan','camel','mamel','mgd','cata','conq','boyar','tarkan','huszar'])assert.equal(run(`assetFrame('${kind}',0,1,0,0).animated`),false);
});

test('stopping retains visual facing while solo rendering leaves the entity untouched',()=>{
 const run=fixture();run("seedOv=123456;start();mode='title';globalThis.actor=addU(0,'mil',20,20);actor.p=[[19,20]];globalThis.facing=unitVisualPose(actor,S.t).heading;actor.p=[]");
 assert.equal(run('unitVisualPose(actor,S.t).heading'),run('facing'));
 run('actor.p=[[19,20]];globalThis.beforeActor=JSON.stringify(actor);drawUnit(actor,new Set())');
 assert.equal(run('JSON.stringify(actor)'),run('beforeActor'));
});

test('every motion kind has a single ready pose at the same body scale as its walk cycle',()=>{
 const kinds=['mil','knight','vil','arc','xbow','spear','scout','skirm','mon','axe','lbow','woad','bers','saml','tk','huskarl','jaguar','kamayuk','shotel','jan','genoa','plumed','gbeto','chuko','hcan','camel','mamel','mgd','cata','conq','boyar','tarkan','huszar'];
 assert.equal(pack.atlases.filter(a=>a.meta.motion).length,kinds.length);
 for(const kind of kinds){const a=pack.atlases.find(a=>a.id==='painted-motion-'+kind);
  for(let team=0;team<4;team++){const idle=a.meta.anims[kind+'/idle/'+team],walk=a.meta.anims[kind+'/walk/'+team];assert.equal(idle.frames.length,1);assert.equal(idle.scale,walk.scale);assert.equal(idle.referenceHeight,walk.referenceHeight)}
 }
});

test('monk conversion gestures follow active progress, yield to walking and never mutate orders',()=>{
 const run=fixture();
 run("globalThis.actor={k:'mon',netId:'u:mon',x:12,y:15,p:[],o:'v',cd:0,cv:2,tg:{x:10,y:15}}");
 const before=run('JSON.stringify(actor)'),pose=run('JSON.stringify(unitVisualPose(actor,4))');
 assert.equal(run('unitVisualPose(actor,4).state'),3);
 assert.equal(run('unitVisualPose(actor,4).phase'),undefined);
 assert.equal(run('unitVisualPose(actor,4).heading'),Math.PI);
 assert.equal(run('JSON.stringify(unitVisualPose(actor,4))'),pose,'paused game time freezes the gesture');
 assert.equal(run('JSON.stringify(actor)'),before);
 run('actor.cv=0');assert.equal(run('unitVisualPose(actor,4).state'),0,'an unstarted conversion has no casting gesture');
 run('actor.cv=2;actor.p=[[11,15]]');assert.equal(run('unitVisualPose(actor,4).state'),1);
 run("actor.p=[];actor.o='i'");assert.equal(run('unitVisualPose(actor,4).state'),0);
 run("actor.o='v';actor.k='mil'");assert.equal(run('unitVisualPose(actor,4).state'),0);
 for(const name of ['network-sync','network-commands','network-unit-map'])run(readFileSync(new URL('../js/'+name+'.js',import.meta.url),'utf8'));
 run("seedOv=123456;start();mode='title';actor=addU(0,'mon',20,20);actor.o='v';actor.cv=2;actor.tg=addU(1,'mil',22,20);globalThis.beforePose=CK_SIM_SYNC.worldCheckpoint(S,1).hash");
 assert.equal(run('CK_UNIT_MAP.project(S,0,W,H).units.find(u=>u.id===actor.netId).pose.state'),3);
 assert.equal(run('CK_SIM_SYNC.worldCheckpoint(S,1).hash'),run('beforePose'),'multiplayer projection leaves conversion and simulation untouched');
});


test('camel and horse motion retain the shared cavalry body scale and one ready pose for all four teams',()=>{
 for(const kind of ['camel','mamel','mgd','cata','conq','boyar','tarkan','huszar'])for(let team=0;team<4;team++){
  const a=pack.atlases.find(a=>a.id==='painted-motion-'+kind);assert.ok(a);
  for(const state of ['idle','walk','attack']){const pose=a.meta.anims[kind+'/'+state+'/'+team];assert.ok(Math.abs(pose.scale*pose.referenceHeight-60)<.000001)}
  assert.equal(a.meta.anims[kind+'/idle/'+team].frames.length,1);
 }
});
