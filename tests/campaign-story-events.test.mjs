import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';
import {readFileSync} from 'node:fs';

function mission(index){
 const {source,sandbox}=headlessGame();
 vm.runInNewContext(source+'\nstartScenario('+index+');globalThis.storyRun=code=>eval(code);',sandbox,{timeout:15000});
 return expression=>sandbox.storyRun(expression);
}

test('Raiders at the Ford delivers a physical royal relief force, guarding the Town Centre without free victory',()=>{
 const c=mission(1);
 const before=c('S.res[0].w'),trained=c('S.pl.tr');
 assert.equal(c("CAMP[1].goals.find(g=>g.id==='s').t"),'Muster 8 soldiers');
 assert.equal(c('S.us.filter(u=>u.t===0&&[\'spear\',\'skirm\'].includes(u.k)).length'),0);
 c('cmpTick(445)');
 assert.equal(c('cmp.e[4]'),1,'the reinforcement event fires at its promised time');
 assert.equal(c('S.us.filter(u=>u.t===0&&u.hp>0&&u.k===\'spear\').length'),3);
 assert.equal(c('S.us.filter(u=>u.t===0&&u.hp>0&&u.k===\'skirm\').length'),2);
 assert.equal(c('S.us.filter(u=>u.t===0&&[\'spear\',\'skirm\'].includes(u.k)).every(u=>u.o===\'G\'&&u.tg===tcOf(0))'),true);
 assert.equal(c('S.pl.tr'),trained,'story arrivals are not recorded as paid unit training');
 assert.equal(c('S.res[0].w'),before,'story arrival does not change player resources');
 assert.equal(c('S.over'),null,'the real mission still requires eight minutes and a Barracks');
 c('cmpTick(1)');
 assert.equal(c("S.us.filter(u=>u.t===0&&['spear','skirm'].includes(u.k)).length"),5,'arrival occurs only once');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 c('cmpTick(1)');
 assert.equal(c("S.us.filter(u=>u.t===0&&['spear','skirm'].includes(u.k)).length"),5,'reload cannot duplicate story arrivals');
});

test('Redwater caravan waits for both elapsed time and an actual completed Market',()=>{
 const c=mission(7);
 assert.equal(c("CAMP[7].ev.some(e=>e.at===405&&typeof e.when==='function')"),true);
 c('cmpTick(405)');
 assert.equal(c('!!cmp.e[3]'),false,'405 seconds alone cannot bypass the Market requirement');
 assert.equal(c("S.us.some(u=>u.t===0&&u.k==='cart')"),false);
 assert.equal(c('!!S.over'),false);
 assert.equal(c("!!(globalThis.market=put(0,'market',tcOf(0).x+6,tcOf(0).y+4))"),true);
 c('cmpTick(1)');
 assert.equal(c('cmp.e[3]'),1);
 assert.equal(c("S.us.filter(u=>u.t===0&&u.k==='cart'&&u.hp>0).length"),2);
 assert.equal(c("S.us.filter(u=>u.t===0&&u.k==='cart'&&u.o==='m'&&u.p.length>0).length"),2,'merchants follow real routes to the Market');
 c('cmpTick(2)');
 assert.equal(c("S.us.filter(u=>u.t===0&&u.k==='cart').length"),2,'event is not replayed each game tick');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 c('cmpTick(1)');
 assert.equal(c("S.us.filter(u=>u.t===0&&u.k==='cart').length"),2,'a loaded campaign does not spawn free duplicate carts');
});

test('Strait mission creates a real enemy monastery with an enemy-owned relic',()=>{
 const c=mission(13);
 assert.equal(c("S.bs.filter(b=>b.t===1&&b.k==='monastery'&&b.hp>0&&b.done).length"),1);
 assert.equal(c("S.rel.some(q=>q.rl&&q.m&&q.m.t===1&&q.m.k==='monastery')"),true);
 assert.equal(c("S.us.filter(u=>u.t===0&&u.k==='mon'&&u.hp>0).length"),2);
 assert.equal(c('S.over'),null);
 assert.equal(c("CAMP[13].goals.find(g=>g.id==='relics').ok()"),false,'enemy relic does not count as a friendly monastery relic');
 const before=c('S.rel.length');
 c("globalThis.abbey=S.bs.find(b=>b.t===1&&b.k==='monastery');globalThis.stolen=S.rel.find(q=>q.m===abbey);abbey.hp=0;step(1/30)");
 assert.equal(c('S.rel.length'),before,'destruction does not invent or erase relics');
 assert.equal(c('stolen.m'),null,'destroyed enemy monastery releases the same relic');
 assert.equal(c('stolen.c'),null,'the liberated relic is available for a Monk to collect');
 c('cmpTick(13)');
 assert.equal(c("!!cmp.e[CAMP[13].ev.findIndex(e=>e.do.toString().includes('seized monastery is down'))]"),true,'destruction unlocks the one-time recovery prompt');
 assert.equal(c('S.over'),null,'destroying an abbey alone cannot win the mission');
});

test('Strait Pilgrim Guard is earned after two relics and keeps the Monastery defended across saves',()=>{
 const c=mission(13);
 const index=c("CAMP[13].ev.findIndex(e=>e.do.toString().includes('campaignStraitPilgrimGuard'))");
 assert.ok(index>=0,'the pilgrimage reward has its own one-time event');
 assert.equal(c("S.bs.filter(b=>b.t===0&&b.k==='house'&&b.hp>0&&b.done).length"),4,'the starting religious expedition has paid-capacity housing');
 assert.equal(c('capOf(0)'),30);
 const count=c("S.us.filter(u=>u.t===0&&['spear','skirm'].includes(u.k)).length");
 const res=c('JSON.stringify(S.res[0])');
 c('cmpTick(20)');
 assert.equal(c('!!cmp.e['+index+']'),false,'pilgrims cannot arrive before real relic recovery');
 assert.equal(c('S.us.length>0'),true);
 c("globalThis.abbey=put(0,'monastery',tcOf(0).x+7,tcOf(0).y+7)");
 assert.equal(c('!!abbey'),true);
 c("globalThis.rel=S.rel.filter(q=>q&&q.rl).slice(0,2);for(const q of rel){q.c=null;q.m=abbey};cmp.k=14;cmpTick(1)");
 assert.equal(c('cmp.d.relics'),1);
 assert.equal(c('!!cmp.e['+index+']'),false,'the milestone unlocks an event on the next normal tick');
 c('cmpTick(1)');
 assert.equal(c('!!cmp.e['+index+']'),true);
 assert.equal(c("S.us.filter(u=>u.t===0&&['spear','skirm'].includes(u.k)).length"),count+8);
 assert.equal(c("S.us.filter(u=>u.t===0&&['spear','skirm'].includes(u.k)&&u.o==='G'&&u.tg===abbey).length"),8);
 assert.equal(c("S.us.filter(u=>u.t===0&&u.k==='ram'&&u.hp>0&&u.o==='a'&&u.tg?.k==='castle').length"),2,'the relic levy contributes two real siege engines attacking the hostile Castle');
 assert.equal(c('JSON.stringify(S.res[0])'),res,'story relief grants real troops but not fake resources');
 assert.equal(c('S.over'),null,'relics alone do not defeat the enemy Castle or Town Centre');
 c('cmpTick(2)');
 assert.equal(c("S.us.filter(u=>u.t===0&&['spear','skirm'].includes(u.k)).length"),count+8);
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 c('cmpTick(1)');
 assert.equal(c("S.us.filter(u=>u.t===0&&['spear','skirm'].includes(u.k)).length"),count+8,'the guard cannot duplicate after save/load');
});
test('Strait siege decisions do not require the opening War Galleys to survive',()=>{
 const src=readFileSync(new URL('./simulation-smoke.test.mjs',import.meta.url),'utf8');
 assert.match(src,/index===13&&\(straitAssaultStarted\|\|!!cmp\.d\.relics&&S\.us\.some\(u=>u&&u\.t===0&&u\.k==='ram'&&u\.hp>0\)\)/,
  'after two real relics, a surviving Ram must be enough to launch the land assault');
 assert.match(src,/if\(index===13\)straitAssaultStarted=true/,
  'attack orders must continue after a Ram or fleet casualty');
 assert.match(src,/index===9\|\|index===13\)\&\&unit\.k!=='ram'/,
  'foot soldiers clear defenders while Rams attack fortifications');
});
test('The 19 original missions retain their objectives, setup ages and arc progression',()=>{
 const c=mission(0);
 const evidence=JSON.parse(c("JSON.stringify({count:CAMP.length,arcs:CAMP_ARCS.map(x=>x.ids),goals:CAMP.map(x=>x.goals.length),events:CAMP.map(x=>x.ev.length),unique:CAMP.every(x=>new Set(x.goals.map(g=>g.id)).size===x.goals.length)})"));
 assert.equal(evidence.count,19);
 assert.equal(evidence.arcs.flat().length,19);
 assert.equal(new Set(evidence.arcs.flat()).size,19);
 assert.ok(evidence.goals.every(n=>n>=1));
 assert.ok(evidence.events.every(n=>n>=1));
 assert.equal(evidence.unique,true);
});

test('Golden Coast harbour builds a real naval patrol without granting the War Galley objective',()=>{
 const c=mission(12);
 assert.equal(c("S.bs.filter(b=>b.t===0&&b.k==='house'&&b.hp>0&&b.done).length"),4,'the expedition has enough housing for a paid fleet and land muster');
 assert.equal(c("aliveUnits(0,'gal').length"),2);
 assert.equal(c("aliveUnits(1,'gal').length"),3,'the rival admiral begins with a superior navy');
 assert.equal(c("CAMP[12].goals.find(g=>g.id==='blockade').optional"),true);
 assert.equal(c("CAMP[12].goals.find(g=>g.id==='fleet').ok()"),false);
 c('cmpTick(30)');
 assert.equal(c("aliveUnits(0,'fire').length"),0,'a scripted patrol must not appear before the Dock is completed');
 assert.equal(c("!!(globalThis.coastDock=put(0,'dock',tcOf(0).x+7,tcOf(0).y+5))"),true);
 for(let i=0;i<16;i++)c('cmpTick(1/30)');
 assert.equal(c('!!cmp.d.dock'),true);
 const before=c('JSON.stringify(S.res[0])');
 c('cmpTick(1/30)');
 assert.equal(c("aliveUnits(0,'fire').length"),1,'the harbour calls a real single Fire Ship');
 assert.equal(c("S.us.find(u=>u.t===0&&u.k==='fire').o"),'a','the patrol moves against the rival fleet');
 assert.equal(c("CAMP[12].goals.find(g=>g.id==='fleet').ok()"),false,'Fire Ships cannot substitute for War Galleys');
 assert.equal(c('JSON.stringify(S.res[0])'),before,'story support cannot invent wood or gold');
 c('cmpTick(1)');
 assert.equal(c("aliveUnits(0,'fire').length"),1,'harbour support is one-time');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 c('cmpTick(1)');
 assert.equal(c("aliveUnits(0,'fire').length"),1,'restoring a save cannot duplicate allied ships');
 assert.equal(c('S.over'),null,'the real land army and enemy capital remain required');
});

test('Golden Coast enemy Dock blockade stops later sea waves and rallies physical land escorts',()=>{
 const c=mission(12);
 const enemyDock=c("S.bs.filter(b=>b&&b.t===1&&b.k==='dock'&&b.hp>0).length");
 assert.equal(enemyDock,1,'a living rival Dock is the optional blockade target');
 const before=JSON.parse(c("JSON.stringify({ram:aliveUnits(0,'ram').length,spear:aliveUnits(0,'spear').length,skirm:aliveUnits(0,'skirm').length,resources:S.res[0]})"));
 c("globalThis.blockedDock=S.bs.find(b=>b&&b.t===1&&b.k==='dock');blockedDock.hp=0");
 for(let i=0;i<15;i++)c('cmpTick(1/30)');
 assert.equal(c('!!cmp.d.blockade'),true,'the player must physically remove the hostile Dock before taking credit');
 c('cmpTick(1/30)');
 assert.equal(c("aliveUnits(0,'ram').length"),before.ram+1);
 assert.equal(c("aliveUnits(0,'spear').length"),before.spear+3);
 assert.equal(c("aliveUnits(0,'skirm').length"),before.skirm+2);
 assert.equal(c("S.us.filter(u=>u.t===0&&['spear','skirm'].includes(u.k)&&u.o==='G'&&u.tg?.k==='ram').length"),5,'the arriving escort guards the real siege engine');
 assert.equal(c('JSON.stringify(S.res[0])'),JSON.stringify(before.resources),'coastal volunteers do not create resources');
 assert.equal(c("CAMP[12].goals.find(g=>g.id==='win').ok()"),false,'a blockade alone does not destroy the enemy capital');
 c('cmpTick(330)');
 assert.equal(c("CAMP[12].ev.filter(e=>e.at===150&&!!e.when||e.at===300&&!!e.when).every(e=>!cmp.e[CAMP[12].ev.indexOf(e)])"),true,'after destroying the rival harbour no further scripted sea waves spawn');
 assert.equal(c("CAMP[12].ev.filter(e=>e.at===150&&!e.when||e.at===300&&!e.when).every(e=>!!cmp.e[CAMP[12].ev.indexOf(e)])"),true,'land attacks still happen, keeping pressure on the settlement');
 assert.equal(c('S.over'),null);
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 c('cmpTick(1)');
 assert.equal(c("aliveUnits(0,'ram').length"),before.ram+1,'coastal volunteers never duplicate after reload');
});
