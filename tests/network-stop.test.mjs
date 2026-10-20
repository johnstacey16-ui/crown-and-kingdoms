import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

function fixture(){
  const unit=(netId,k='vil')=>({netId,k,t:1,hp:25,o:'m',p:[[5,5]],tg:{},pt:{},
    autoWorker:1,as:1,guardTarget:{},ret:1,retreating:true,retreatTarget:{},
    retreatRestUntil:20,retreatRouteRetryAt:20,ut:[4,4],unloadBeach:[3,3],unloadRouteRetryAt:20,
    st:2,car:7,ct:'w',cg:[],tradeCargo:13,manualTradeMove:true,tradePaused:false});
  const context={S:{teamN:2,us:[unit('u1'),unit('u2','cart')],bs:[{netId:'b1',k:'tc',t:1,hp:100,done:true}]},
    mode:'play',W:32,H:32,U:{vil:{},cart:{}},B:{tc:{}}};
  for(const name of ['network-sync','network-commands'])vm.runInNewContext(readFileSync(new URL('../js/'+name+'.js',import.meta.url),'utf8'),context);
  return context;
}

test('stop has an exact payload and authoritative unit-only ownership checks',()=>{
  const c=fixture(),sync=c.CK_SIM_SYNC,order={type:'stop',entities:['u1']};
  assert.equal(sync.validOrder(order,32),true);
  for(const extra of [{point:{x:2,y:2}},{value:'vil'},{target:'u2'}])assert.equal(sync.validOrder({...order,...extra},32),false);
  const roster=sync.lockRoster('host-session','guest-session',2);
  const host=sync.createCommandHost({roster,mapSize:32,lookupEntity:c.CK_GAME_COMMANDS.lookup,execute:c.CK_GAME_COMMANDS.execute});
  const packet=entities=>({v:2,sid:'guest-session',team:1,seq:1,frame:0,order:{type:'stop',entities}});
  assert.equal(host.receive(packet(['b1']),'guest-session',0).ok,false);
  c.S.us[0].ld={};assert.equal(host.receive(packet(['u1']),'guest-session',0).ok,false);
  c.S.us[0].ld=null;c.S.us[0].t=0;
  assert.equal(host.receive(packet(['u1']),'guest-session',0).ok,false);
});

test('stop clears queued activities and pauses trading while preserving cargo and stance',()=>{
  const c=fixture();
  assert.equal(c.CK_GAME_COMMANDS.execute({type:'stop',entities:['u1','u2']},1,1),true);
  for(const u of c.S.us){
    assert.equal(u.o,'i');assert.equal(u.p.length,0);
    for(const field of ['tg','pt','guardTarget','retreatTarget','ut','unloadBeach'])assert.equal(u[field],null);
    for(const field of ['autoWorker','as','ret','retreatRestUntil','retreatRouteRetryAt','unloadRouteRetryAt'])assert.equal(u[field],0);
    assert.equal(u.retreating,false);assert.equal(u.car,7);assert.equal(u.st,2);assert.equal(u.tradeCargo,13);
  }
  assert.equal(c.S.us[1].tradePaused,true);assert.equal(c.S.us[1].manualTradeMove,false);
});

test('invalid mixed selections stop nobody',()=>{
  for(const bad of ['enemy','dead','loaded','building']){
    const c=fixture();let ids=['u1','u2'];
    if(bad==='enemy')c.S.us[1].t=0;
    if(bad==='dead')c.S.us[1].hp=0;
    if(bad==='loaded')c.S.us[1].ld={};
    if(bad==='building')ids=['u1','b1'];
    const before=JSON.stringify(c.S);
    assert.equal(c.CK_GAME_COMMANDS.execute({type:'stop',entities:ids},1,1),false);
    assert.equal(JSON.stringify(c.S),before);
  }
});
