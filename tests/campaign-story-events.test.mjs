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

test('Redwater merchant escort departs from a distant reachable checkpoint and never accepts a counterfeit cart',()=>{
 const c=mission(7);
 assert.equal(c("CAMP[7].ev.some(e=>e.at===405&&typeof e.when==='function')"),true);
 assert.equal(c("CAMP[7].goals.some(g=>g.id==='caravan'&&!g.optional)"),true,'a genuine convoy delivery is mandatory');
 c('cmpTick(405)');
 assert.equal(c('!!cmp.e[3]'),false,'the timer cannot dispatch carts before a real Market exists');
 assert.equal(c("S.us.some(u=>u.t===0&&u.k==='cart')"),false);
 assert.equal(c("campaignRedwaterCartArrived()"),false);
 assert.equal(c('!!S.over'),false);
 c("globalThis.market=put(0,'market',tcOf(0).x+6,tcOf(0).y+4)");
 assert.ok(c('!!market'));
 c('cmpTick(1)');
 assert.equal(c('cmp.e[3]'),1,'the real completed Market unlocks caravan departure');
 assert.equal(c("S.us.filter(u=>u.t===0&&u.k==='cart'&&u.campaignConvoy==='redwater'&&u.hp>0).length"),2);
 assert.equal(c("S.us.filter(u=>u.t===0&&u.k==='cart'&&u.o==='m'&&u.manualTradeMove&&u.p.length>0).length"),2,'both merchants use the real Trade Cart manual movement mode');
 assert.equal(c("S.us.filter(u=>u.t===0&&u.campaignConvoy==='redwater').every(u=>Math.hypot(u.x-market.x,u.y-market.y)>=23)"),true,'caravan must begin far enough away for an actual escort');
 assert.equal(c("campaignRedwaterCartArrived()"),false,'the arrival objective is not awarded at departure');
 c("globalThis.fake=addU(0,'cart',market.x+market.s+1,market.y+1)");
 assert.equal(c("campaignRedwaterCartArrived()"),false,'a purchased cart cannot impersonate a mission caravan');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c("S.us.filter(u=>u.t===0&&u.campaignConvoy==='redwater'&&u.hp>0).length"),2,'save/load retains the two tagged merchants');
 c('cmpTick(2)');
 assert.equal(c("S.us.filter(u=>u.t===0&&u.campaignConvoy==='redwater').length"),2,'one-shot event never duplicates carts after loading');
});

test('Redwater authentic carts resume bounded road legs but obey player Hold orders',()=>{
 const c=mission(7);
 c('cmpTick(405)');
 c("globalThis.market=put(0,'market',tcOf(0).x+6,tcOf(0).y+4)");
 c('cmpTick(1)');
 assert.equal(c("S.us.filter(u=>u.campaignConvoy==='redwater'&&u.p.length>0).length"),2);
 c("globalThis.merchants=S.us.filter(u=>u.campaignConvoy==='redwater');merchants[0].o='i';merchants[0].p=[];merchants[1].o='h';merchants[1].p=[]");
 c('cmp.k=29;cmpTick(1/30)');
 assert.equal(c("merchants[0].o"),'m','idle authentic caravans must automatically continue along the road');
 assert.ok(c("merchants[0].p.length")>0,'continuation must use real pathfinding to the Market');
 assert.equal(c("merchants[0].manualTradeMove"),true,'the trading-unit movement handler must execute the continued path');
 assert.equal(c("merchants[1].o"),'h','scripted path continuation must not override explicit Hold commands');
 assert.equal(c("merchants[1].p.length"),0);
 assert.equal(c("campaignRedwaterCartArrived()"),false,'resuming a route does not count as delivering a merchant');
 c('saveG()');
 c('loadG()');
 assert.equal(c("S.us.filter(u=>u.campaignConvoy==='redwater'&&u.hp>0).length"),2,'both convoy identities and orders survive reloading');
});

test('Redwater fails if both convoy merchants die before delivery and allows a real survivor',()=>{
 const c=mission(7);
 c('cmpTick(405)');
 c("globalThis.market=put(0,'market',tcOf(0).x+6,tcOf(0).y+4)");
 c('cmpTick(1)');
 assert.equal(c("campaignRedwaterCartArrived()"),false);
 c("globalThis.carts=S.us.filter(u=>u.campaignConvoy==='redwater'&&u.hp>0);carts[0].hp=0");
 c('cmpTick(1)');
 assert.equal(c('S.over'),null,'the second living merchant can still save the convoy');
 assert.equal(c("campaignRedwaterCartArrived()"),false);
 c("carts[1].hp=0");
 c('cmpTick(1)');
 assert.equal(c('S.over'),'lose','the mission fails when both authentic carts perish');
 assert.equal(c("S.reason||''"),'','the loss is reached through normal endGame, not a fabricated delivery');
});

test('Redwater delivery requires an authentic living cart at the Market and persists its successful milestone',()=>{
 const c=mission(7);
 c('cmpTick(405)');
 c("globalThis.market=put(0,'market',tcOf(0).x+6,tcOf(0).y+4)");
 assert.ok(c('!!market'));
 c('cmpTick(1)');
 assert.equal(c("campaignRedwaterCartArrived()"),false);
 c("globalThis.merchant=S.us.find(u=>u&&u.campaignConvoy==='redwater'&&u.hp>0);merchant.x=market.x+market.s+1;merchant.y=market.y+1;merchant.o='i';merchant.p=[]");
 assert.equal(c("campaignRedwaterCartArrived()"),true,'only a real alive campaign cart physically beside the Market counts');
 c('cmp.k=14;cmpTick(1)');
 assert.equal(c('!!cmp.d.caravan'),true,'delivery records a one-time objective milestone');
 assert.equal(c('!!S.over'),false,'cart delivery alone is not victory: towers and timed defence remain mandatory');
 c("S.us.filter(u=>u.campaignConvoy==='redwater').forEach(u=>u.hp=0)");
 c('cmpTick(1)');
 assert.equal(c('S.over'),null,'a merchant delivered alive before death earns the completed convoy objective');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c('!!cmp.d.caravan'),true,'successful delivery persists in the saved campaign');
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
 assert.match(src,/const defender=\([^\n]*index===13[^\n]*\)\&\&unit\.k!=='ram'/,
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
 // This test simulates completing real coastal reconnaissance, not a free Dock.
 c('S.ex.fill(1)');
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
 const before=JSON.parse(c("JSON.stringify({ram:aliveUnits(0,'ram').length,spear:aliveUnits(0,'spear').length,skirm:aliveUnits(0,'skirm').length,knight:aliveUnits(0,'knight').length,resources:S.res[0]})"));
 c("globalThis.blockedDock=S.bs.find(b=>b&&b.t===1&&b.k==='dock');blockedDock.hp=0");
 c('cmp.k=14;cmpTick(5)'); // Capital and harbour destruction milestones require >3 seconds.
 for(let i=0;i<15;i++)c('cmpTick(1/30)');
 assert.equal(c('!!cmp.d.blockade'),true,'the player must physically remove the hostile Dock before taking credit');
 c('cmpTick(1/30)');
 assert.equal(c("aliveUnits(0,'ram').length"),before.ram+4);
 assert.equal(c("aliveUnits(0,'spear').length"),before.spear+5);
 assert.equal(c("aliveUnits(0,'skirm').length"),before.skirm+4);
 assert.equal(c("aliveUnits(0,'knight').length"),before.knight+2,'the landing includes two normal cavalry escorts');
 assert.equal(c("S.us.filter(u=>u.t===0&&['spear','skirm'].includes(u.k)&&u.o==='G'&&u.tg?.k==='ram').length"),9,'all nine landed soldiers Guard one of four actual siege engines');
  assert.equal(c("S.us.filter(u=>u.t===0&&u.k==='ram'&&u.hp>0&&u.o==='a'&&u.tg===tcOf(1)).length"),4,'all four landing Rams issue real attack orders toward the capital');
  assert.equal(c("S.us.filter(u=>u.t===0&&u.k==='ram'&&u.hp>0&&Math.hypot(u.x-blockedDock.x,u.y-blockedDock.y)<25).length"),4,
    'all four siege engines land at genuinely walkable coastal cells near the captured Dock');
 assert.equal(c('JSON.stringify(S.res[0])'),JSON.stringify(before.resources),'coastal volunteers do not create resources');
 assert.equal(c("CAMP[12].goals.find(g=>g.id==='win').ok()"),false,'a blockade alone does not destroy the enemy capital');
 c('cmpTick(330)');
 assert.equal(c("CAMP[12].ev.filter(e=>e.at===150&&!!e.when||e.at===300&&!!e.when).every(e=>!cmp.e[CAMP[12].ev.indexOf(e)])"),true,'after destroying the rival harbour no further scripted sea waves spawn');
 assert.equal(c("CAMP[12].ev.filter(e=>e.at===150&&!e.when||e.at===300&&!e.when).every(e=>!!cmp.e[CAMP[12].ev.indexOf(e)])"),true,'land attacks still happen, keeping pressure on the settlement');
 assert.equal(c('S.over'),null);
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 c('cmpTick(1)');
 assert.equal(c("aliveUnits(0,'ram').length"),before.ram+4,'coastal volunteers never duplicate after reload');
});

test('Causeway forward-Castle side objectives require two real forts at different shallow crossings',()=>{
 const c=mission(17);
 assert.equal(c('mapLayout'),12,'the Causeway geography is used for this mission');
 assert.equal(c("CAMP[17].goals.filter(g=>g.optional).length"),2);
 assert.equal(c('!!campaignCausewayFordCastle(.22)'),false);
 assert.equal(c('!!campaignCausewayFordCastle(.78)'),false);
 // Explore normally hidden map terrain for the fixture only; addB must still
 // select genuinely legal Castle footprints on the player side of each ford.
 c('S.ex.fill(1)');
 const state=JSON.parse(c(`JSON.stringify((()=>{
  const before={town:tcOf(1).hp,resources:{...S.res[0]}},positions=[];
  const river=y=>W*.38+y*.24+Math.sin(y*.055)*2.2+Math.sin(y*.13)*.8;
  for(const ford of [.22,.78]){
   let placed=null;
   for(let y=Math.floor(H*ford)-11;y<=Math.floor(H*ford)+11&&!placed;y++){
    const cx=river(y);
    for(let x=Math.floor(cx)-22;x<=Math.floor(cx)-8;x++){
     if(x<2||y<2||x+5>=W||y+5>=H||!okPlace(0,'castle',x,y))continue;
     const b=addB(0,'castle',x,y,true);
     if(b){placed={x,y,netId:b.netId};break}
    }
   }
   positions.push(placed);
  }
  return {before,positions,north:!!campaignCausewayFordCastle(.22),south:!!campaignCausewayFordCastle(.78),castleCount:S.bs.filter(b=>b&&b.t===0&&b.k==='castle'&&b.hp>0).length};
 })())`));
 assert.ok(state.positions.every(Boolean),'both fords need at least one legal Castle footprint');
 assert.equal(state.north,true);
 assert.equal(state.south,true);
 assert.equal(state.castleCount,2);
 assert.equal(c("CAMP[17].goals.find(g=>g.id==='tc').ok()"),false,'forward Castles cannot defeat the real hostile capital');
 const original=c("S.us.filter(u=>u.t===0&&u.k==='spear'&&u.hp>0).length");
 c('cmp.k=14;cmpTick(5)');
 assert.equal(c('!!cmp.d.northford'),true);
 assert.equal(c('!!cmp.d.southford'),true);
 c('cmpTick(1/30)');
 assert.equal(c("S.us.filter(u=>u.t===0&&u.k==='spear'&&u.hp>0).length"),original+8,'both optional fords provide four Guard spears and both required Castles rally four royal Spearmen');
  assert.equal(c("S.us.filter(u=>u.t===0&&u.k==='spear'&&u.hp>0&&u.o==='G'&&u.tg===tcOf(0)).length"),4,'four extra royal Spears guard the Town Centre, not the optional ford Castles');
 assert.equal(c("S.us.filter(u=>u.t===0&&['spear','skirm'].includes(u.k)&&u.o==='G'&&u.tg?.k==='castle').length"),8);
 assert.equal(c('tcOf(1).hp'),state.before.town,'optional forward defence cannot deal automatic Town Centre damage');
 assert.equal(c('JSON.stringify(S.res[0])'),JSON.stringify(state.before.resources),'side-quest arrivals do not fabricate resources');
 assert.equal(c('S.over'),null,'destroying the enemy Town Centre remains necessary');
 c('cmpTick(1)');
 assert.equal(c("S.us.filter(u=>u.t===0&&['spear','skirm'].includes(u.k)&&u.o==='G'&&u.tg?.k==='castle').length"),8,'guard troops spawn only once');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 c('cmpTick(1)');
 assert.equal(c("S.us.filter(u=>u.t===0&&['spear','skirm'].includes(u.k)&&u.o==='G'&&u.tg?.k==='castle').length"),8,'reward never duplicates after reload');
});
test('Causeway forward-Castle objective rejects remote and hostile fortifications',()=>{
 const c=mission(17);
 c('S.ex.fill(1)');
 assert.equal(c("!!(globalThis.homeFort=put(0,'castle',tcOf(0).x+7,tcOf(0).y+8))"),true);
 assert.equal(c('!!campaignCausewayFordCastle(.22)'),false,'a Castle beside home does not secure the northern ford');
 assert.equal(c('!!campaignCausewayFordCastle(.78)'),false,'a Castle beside home does not secure the southern ford');
 c("homeFort.hp=0");
 assert.equal(c('!!campaignCausewayFordCastle(.22)'),false,'destroyed fortifications never earn crossing relief');
});

test('Causeway Dock completion earns a physical naval escort, without counting it as a War Galley',()=>{
 const c=mission(16);
 assert.equal(c('S.bs.filter(b=>b&&b.t===0&&b.k===\'house\'&&b.done&&b.hp>0).length'),4,'full starting expedition must have real housing');
 assert.equal(c("aliveUnits(0,'gal').length"),0,'the player still must train three War Galleys');
 assert.equal(c("aliveUnits(1,'gal').length"),3,'enemy patrol still occupies the strait');
 c('cmp.k=14;cmpTick(8)');
 assert.equal(c("aliveUnits(0,'fire').length"),0,'a Dock foundation alone cannot earn naval support');
 c('S.ex.fill(1)'); // Fixture simulates completed reconnaissance, not a free Dock.
 assert.equal(c("!!(globalThis.causewayDock=put(0,'dock',tcOf(0).x+8,tcOf(0).y+4))"),true);
 const before=c('JSON.stringify(S.res[0])');
 c('cmp.k=14;cmpTick(1)');
 assert.equal(c('cmp.d.dock'),1);
 c('cmpTick(1)');
 assert.equal(c("aliveUnits(0,'fire').length"),1,'the reward must be a living, navigable Fire Ship');
 assert.equal(c("aliveUnits(0,'gal').length"),0,'Fire Ship cannot bypass the actual fleet goal');
 assert.equal(c('JSON.stringify(S.res[0])'),before,'the escort must not invent resources');
 assert.equal(c("['a','G'].includes(aliveUnits(0,'fire')[0].o)"),true,'the ship receives a real combat or guard order');
 c('cmpTick(2)');
 assert.equal(c("aliveUnits(0,'fire').length"),1);
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 c('cmpTick(2)');
 assert.equal(c("aliveUnits(0,'fire').length"),1,'loading cannot spawn a second escort');
 assert.equal(c('S.over'),null,'the naval reward does not win the mission');
});

test('Causeway north and south ford Towers earn a guarded siege column, not an automatic Castle kill',()=>{
 const c=mission(16);
 assert.equal(c('CAMP[16].goals.find(g=>g.id===\'fords\').optional'),true);
 assert.equal(c('!!campaignCausewayFordTower(.22)'),false);
 assert.equal(c('!!campaignCausewayFordTower(.78)'),false);
 c('S.ex.fill(1)');
 const setup=JSON.parse(c(`JSON.stringify((()=>{
  const positions=[],river=y=>W*.38+y*.24+Math.sin(y*.055)*2.2+Math.sin(y*.13)*.8;
  for(const ford of [.22,.78]){
   let found=null;
   for(let y=Math.floor(H*ford)-9;y<=Math.floor(H*ford)+9&&!found;y++)
    for(let x=Math.floor(river(y))-18;x<=Math.floor(river(y))-5;x++)
     if(x>1&&y>1&&x+B.tower.s<W-1&&y+B.tower.s<H-1&&okPlace(0,'tower',x,y)){
      const tower=addB(0,'tower',x,y,true);if(tower){found={x,y};break}
     }
   positions.push(found);
  }
  return {positions,castleHp:S.bs.find(b=>b.t===1&&b.k==='castle')?.hp||0,homeHp:tcOf(0).hp,enemyHp:tcOf(1).hp,resources:{...S.res[0]}};
 })())`));
 assert.ok(setup.positions.every(Boolean),'both shallow fords must offer legal Tower locations');
 assert.equal(c('!!campaignCausewayFordTower(.22)'),true);
 assert.equal(c('!!campaignCausewayFordTower(.78)'),true);
 const before=JSON.parse(c("JSON.stringify({ram:aliveUnits(0,'ram').length,spear:aliveUnits(0,'spear').length,skirm:aliveUnits(0,'skirm').length})"));
 c('cmp.k=14;cmpTick(10)');
 assert.equal(c('cmp.d.fords'),1,'both Towers must be built on the crossing banks');
 c('cmpTick(1)');
 assert.equal(c("aliveUnits(0,'ram').length"),before.ram+1,'the royal detachment contributes one real Ram');
 assert.equal(c("aliveUnits(0,'spear').length"),before.spear+2);
 assert.equal(c("aliveUnits(0,'skirm').length"),before.skirm+2);
 assert.equal(c("S.us.filter(u=>u&&u.t===0&&['spear','skirm'].includes(u.k)&&u.o==='G'&&u.tg?.k==='ram').length"),4,'the new escort guards the siege engine');
 assert.equal(c('tcOf(0).hp'),setup.homeHp);
 assert.equal(c('tcOf(1).hp'),setup.enemyHp,'allied arrival never auto-damages the capital');
 assert.equal(c("S.bs.find(b=>b.t===1&&b.k==='castle').hp"),setup.castleHp,'enemy Castle must survive for genuine combat');
 assert.equal(c('JSON.stringify(S.res[0])'),JSON.stringify(setup.resources),'royal units do not mint resources');
 assert.equal(c('S.over'),null,'siege bonus alone cannot grant victory');
 c('cmpTick(2)');
 assert.equal(c("aliveUnits(0,'ram').length"),before.ram+1);
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 c('cmpTick(2)');
 assert.equal(c("aliveUnits(0,'ram').length"),before.ram+1,'reward persists across a save without duplication');
});

test('Remote and unfinished Causeway Towers are not credited as ford defences',()=>{
 const c=mission(16);
 c('S.ex.fill(1)');
 assert.equal(c("!!(globalThis.remoteTower=put(0,'tower',tcOf(0).x+7,tcOf(0).y+7))"),true);
 assert.equal(c('!!campaignCausewayFordTower(.22)'),false);
 assert.equal(c('!!campaignCausewayFordTower(.78)'),false);
 c('cmp.k=14;cmpTick(10)');
 assert.equal(c('!!cmp.d.fords'),false,'ordinary build-count cannot activate the special defensive milestone');
 assert.equal(c("CAMP[16].goals.find(g=>g.id==='towers').ok()"),false,'one Tower is not enough for the main objective');
 c('remoteTower.hp=0');
 assert.equal(c('!!campaignCausewayFordTower(.22)'),false,'dead or unfinished Towers do not protect a ford');
});

test('Causeway HUD keeps all five required victory objectives visible before optional ford rewards',()=>{
 const c=mission(16);
 const goals=JSON.parse(c("JSON.stringify(CAMP[16].goals.map(g=>({id:g.id,optional:!!g.optional})))"));
 assert.deepEqual(goals.slice(0,5).map(g=>g.id),['dock','fleet','towers','castle','tc']);
 assert.ok(goals.slice(0,5).every(g=>!g.optional),'the visible five-objective panel must not hide the final enemy capital goal');
 assert.deepEqual(goals.slice(5),[{id:'fords',optional:true}],'ford garrisons remain an explicitly optional bonus');
});

test('Causeway naval control summons a real royal land contingent without crediting enemy destruction',()=>{
 const c=mission(16);
 const event=c("CAMP[16].ev.findIndex(e=>e.do.toString().includes('campaignCausewayFleetRelief'))");
 assert.ok(event>=0,'the campaign must explicitly tell the story of land reinforcements');
 const before=JSON.parse(c("JSON.stringify({knight:aliveUnits(0,'knight').length,spear:aliveUnits(0,'spear').length,skirm:aliveUnits(0,'skirm').length,resources:{...S.res[0]},castleHp:S.bs.find(b=>b.t===1&&b.k==='castle')?.hp,tcHp:tcOf(1)?.hp})"));
 c('cmpTick(20)');
 assert.equal(c('!!cmp.e['+event+']'),false,'having a Dock alone must never grant fleet reinforcements');
 c('grp(0,\'gal\',3)'); // Seed three genuine ship entities for a focused objective fixture; normal gameplay pays to train them.
 assert.equal(c("aliveUnits(0,'gal').length"),3);
 c('cmp.k=14;cmpTick(1)');
 assert.equal(c('cmp.d.fleet'),1,'the normal sustained fleet objective must be satisfied first');
 assert.equal(c('!!cmp.e['+event+']'),false);
 c('cmpTick(1)');
 assert.equal(c('!!cmp.e['+event+']'),true,'land relief is dispatched only after naval control is recorded');
 assert.equal(c("aliveUnits(0,'knight').length"),before.knight+3);
 assert.equal(c("aliveUnits(0,'spear').length"),before.spear+4);
 assert.equal(c("aliveUnits(0,'skirm').length"),before.skirm+4);
 assert.equal(c("S.us.filter(u=>u.t===0&&['knight','spear','skirm'].includes(u.k)&&u.o==='G'&&u.tg===tcOf(0)).length"),11,'the campaign soldiers rally as a physical home guard');
 assert.equal(c('JSON.stringify(S.res[0])'),JSON.stringify(before.resources),'campaign reinforcements do not forge resources');
 assert.equal(c("S.bs.find(b=>b.t===1&&b.k==='castle').hp"),before.castleHp,'the Castle must be destroyed by genuine combat');
 assert.equal(c('tcOf(1).hp'),before.tcHp,'the Town Centre must be destroyed by genuine combat');
 assert.equal(c('S.over'),null,'the fleet does not grant victory');
 c('cmpTick(2)');
 assert.equal(c("aliveUnits(0,'knight').length"),before.knight+3,'the relief arrives only once');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 c('cmpTick(1)');
 assert.equal(c("aliveUnits(0,'knight').length"),before.knight+3,'save/load may not spawn a second fleet levy');
});

test('Crown crossing begins with housing and requires genuine royal Castles',()=>{
 const c=mission(17);
 assert.equal(c("S.bs.filter(b=>b&&b.t===0&&b.k==='house'&&b.done&&b.hp>0).length"),6);
 assert.equal(c('capOf(0)'),40,'completed Houses and Town Centre must offer real population capacity');
 assert.equal(c("S.bs.filter(b=>b&&b.t===0&&b.k==='castle'&&b.done&&b.hp>0).length"),0);
 assert.equal(c("S.bs.filter(b=>b&&b.t===1&&b.k==='castle'&&b.done&&b.hp>0).length"),1);
 assert.equal(c("CAMP[17].goals.find(g=>g.id==='castles').ok()"),false);
 assert.equal(c("CAMP[17].goals.find(g=>g.id==='tc').ok()"),false);
 assert.equal(c("aliveUnits(0,'bomb').length"),2,'the real attack force starts with two living Bombards');
 assert.equal(c('S.over'),null);
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c("S.bs.filter(b=>b.t===0&&b.k==='house'&&b.done&&b.hp>0).length"),6);
});

test('Two real Crown Castles signal a physical royal reserve that survives save/load without auto-victory',()=>{
 const c=mission(17);
 const event=c("CAMP[17].ev.findIndex(e=>e.do.toString().includes('campaignCrownRoyalReserve'))");
 assert.ok(event>=0);
 const before=JSON.parse(c("JSON.stringify({knight:aliveUnits(0,'knight').length,xbow:aliveUnits(0,'xbow').length,spear:aliveUnits(0,'spear').length,treb:aliveUnits(0,'treb').length,resources:{...S.res[0]},enemyTown:tcOf(1).hp,enemyCastle:S.bs.find(b=>b.t===1&&b.k==='castle').hp})"));
 c('cmpTick(25)');
 assert.equal(c('!!cmp.e['+event+']'),false,'the reinforcements require two finished Castles');
 c('S.ex.fill(1)'); // Focused fixture only: reveal terrain for completed Castle placement.
 assert.equal(c("!!(globalThis.castleA=put(0,'castle',tcOf(0).x+9,tcOf(0).y-9))"),true);
 assert.equal(c("!!(globalThis.castleB=put(0,'castle',tcOf(0).x+13,tcOf(0).y+6))"),true);
 assert.equal(c("S.bs.filter(b=>b.t===0&&b.k==='castle'&&b.done&&b.hp>0).length"),2);
 c('cmp.k=14;cmpTick(1)');
 assert.equal(c('cmp.d.castles'),1);
 assert.equal(c('!!cmp.e['+event+']'),false);
 c('cmpTick(1)');
 assert.equal(c('!!cmp.e['+event+']'),true);
 assert.equal(c("aliveUnits(0,'knight').length"),before.knight+4);
 assert.equal(c("aliveUnits(0,'xbow').length"),before.xbow+6);
 assert.equal(c("aliveUnits(0,'spear').length"),before.spear+4);
 assert.equal(c("aliveUnits(0,'treb').length"),before.treb+2,'the royal siege contingent includes two physical Trebuchets');
 assert.equal(c("S.us.filter(u=>u&&u.t===0&&u.k==='treb'&&u.hp>0&&u.o==='G'&&u.tg===tcOf(0)).length"),2,'Trebuchets arrive at the home garrison and require actual assault orders');
 assert.equal(c("S.us.filter(u=>u&&u.t===0&&u.hp>0&&['knight','xbow','spear'].includes(u.k)&&u.o==='G'&&u.tg===tcOf(0)).length"),14);
 assert.equal(c('JSON.stringify(S.res[0])'),JSON.stringify(before.resources),'milestone troops must not fabricate resources');
 assert.equal(c('tcOf(1).hp'),before.enemyTown,'enemy Town Centre still requires real attacks');
 assert.equal(c("S.bs.find(b=>b.t===1&&b.k==='castle').hp"),before.enemyCastle);
 assert.equal(c('S.over'),null);
 c('cmpTick(2)');
 assert.equal(c("aliveUnits(0,'knight').length"),before.knight+4);
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 c('cmpTick(2)');
 assert.equal(c("aliveUnits(0,'knight').length"),before.knight+4,'one-time reserves cannot duplicate after loading');
 assert.equal(c("aliveUnits(0,'treb').length"),before.treb+2,'the long-range royal siege detachment cannot duplicate after loading');
});

test('The Crown crossing has a fair staged army without overlapping autonomous surprise waves',()=>{
 const c=mission(17);
 const initial=JSON.parse(c("JSON.stringify({enemy:{knight:aliveUnits(1,'knight').length,xbow:aliveUnits(1,'xbow').length,spear:aliveUnits(1,'spear').length,ram:aliveUnits(1,'ram').length,bomb:aliveUnits(1,'bomb').length},castleHp:S.bs.find(b=>b.t===1&&b.k==='castle')?.hp,towers:cb('tower',1),enemyTc:tcOf(1)?.hp,ai:{nx:S.ai[1]?.nx,rn:S.ai[1]?.rn}})"));
 assert.deepEqual(initial.enemy,{knight:6,xbow:8,spear:6,ram:2,bomb:1},'enemy guards remain a real mixed force rather than a siege-heavy opening pileup');
 assert.equal(initial.castleHp,1400,'the intact defensive Castle must remain a meaningful challenge');
 assert.equal(initial.towers,2,'the royal player must still face both real enemy Towers');
 assert.equal(initial.enemyTc,900,'enemy capital still requires legitimate destruction');
 assert.ok(initial.ai.nx>=600&&initial.ai.rn>=600,'three written assaults must not stack with extra early automated waves');
 assert.deepEqual(JSON.parse(c("JSON.stringify(CAMP[17].ev.filter(e=>[110,260,440].includes(e.at)).map(e=>e.at))")),[110,260,440]);
 assert.equal(c('S.over'),null);
});

test('King’s Road requires genuine funds and a completed Market with two live Towers for roadwork delivery',()=>{
 const c=mission(10);
 const event=c("CAMP[10].ev.findIndex(e=>e.do.toString().includes('campaignKingsRoadSupply'))");
 assert.ok(event>=0);
 assert.equal(c("CAMP[10].goals.find(g=>g.id==='roadsupply').optional"),undefined);
 c('cmpTick(300)');
 assert.equal(c('!!cmp.e['+event+']'),false,'timer alone cannot pay the supply contract');
 c("globalThis.market=put(0,'market',tcOf(0).x+8,tcOf(0).y+4)");
 assert.ok(c('!!market'));
 c('cmpTick(1)');
 assert.equal(c('!!cmp.e['+event+']'),false,'the Market alone cannot replace two completed Towers');
 c("globalThis.t1=put(0,'tower',tcOf(0).x+12,tcOf(0).y+5);globalThis.t2=put(0,'tower',tcOf(0).x+12,tcOf(0).y-6)");
 assert.ok(c('!!t1&&!!t2'));
 assert.equal(c("cb('tower')"),2);
 c('S.res[0].w=149;S.res[0].s=75;cmpTick(1)');
 assert.equal(c('!!cmp.e['+event+']'),false,'insufficient wood cannot be delivered');
 c('S.res[0].w=150;S.res[0].s=74;cmpTick(1)');
 assert.equal(c('!!cmp.e['+event+']'),false,'insufficient stone cannot be delivered');
 const original=c("JSON.stringify({w:S.res[0].w,s:S.res[0].s,g:S.res[0].g,pl:S.pl.tr,units:S.us.length})");
 c('S.res[0].s=75;cmpTick(1)');
 assert.equal(c('!!cmp.e['+event+']'),true,'actual Market and resource stock unlock a one-time collection');
 assert.equal(c('S.res[0].w'),0,'roadworks consumes exactly 150 player wood');
 assert.equal(c('S.res[0].s'),0,'roadworks consumes exactly 75 player stone');
 const before=JSON.parse(original);
 assert.equal(c('S.res[0].g'),before.g,'roadworks cannot fabricate or spend unrelated resources');
 assert.equal(c('S.pl.tr'),before.pl,'earned soldiers are not mislabeled as paid player training');
 assert.equal(c("S.us.filter(u=>u.t===0&&u.hp>0&&u.o==='G'&&u.tg===market&&['spear','skirm'].includes(u.k)).length"),4,
 'four normal defensive soldiers guard the actual Market, not an invented victory flag');
 c('cmp.k=14;cmpTick(1)');
 assert.equal(c('!!cmp.d.roadsupply'),true,'payment records the irreversible supply milestone');
 assert.equal(c('S.over'),null,'the defence still requires 8:00 and real Towers');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 c('cmpTick(2)');
 assert.equal(c('!!cmp.d.roadsupply'),true,'save/load restores the paid contract');
 assert.equal(c("S.us.filter(u=>u.t===0&&u.hp>0&&u.o==='G'&&['spear','skirm'].includes(u.k)).length"),4,
 'royal road guards cannot duplicate when the event is restored');
 assert.equal(c('S.res[0].w'),0,'saved supply is never charged a second time');
});

test('Feudal Frontier optional watchpost must be completed ahead of Ashford on the enemy approach',()=>{
 const c=mission(2);
 assert.equal(c("CAMP[2].goals.find(g=>g.id==='frontierwatch').optional"),true);
 assert.equal(c('!!campaignFrontierWatchpost()'),false);
 const start=JSON.parse(c("JSON.stringify((()=>{const h=tcOf(0),e=tcOf(1);return {home:{x:h.x,y:h.y},enemy:{x:e.x,y:e.y},age:S.age[0],resources:{...S.res[0]},initialRaidCount:CAMP[2].ev.length}})())"));
 assert.equal(start.initialRaidCount,6,'original hints and final raid plus two reactive patrols and a watchpost reward');
 c('S.ex.fill(1)');
 const position=JSON.parse(c(`JSON.stringify((()=>{
  const h=tcOf(0),e=tcOf(1),hx=h.x+h.s*.5,hy=h.y+h.s*.5;
  const dx=e.x+e.s*.5-hx,dy=e.y+e.s*.5-hy,dist=Math.hypot(dx,dy);
  let valid=null;
  for(let forward=12;forward<=30&&!valid;forward+=2)
   for(let lateral=-8;lateral<=8&&!valid;lateral+=2){
    const x=Math.round(hx+dx/dist*forward-dy/dist*lateral),
          y=Math.round(hy+dy/dist*forward+dx/dist*lateral);
    if(x>1&&y>1&&x+B.outpost.s<W-1&&y+B.outpost.s<H-1&&okPlace(0,'outpost',x,y))valid={x,y};
   }
  return valid;
 })())`));
 assert.ok(position,'a legally buildable forward Outpost site must exist on this seeded map');
 assert.equal(c(`!!(globalThis.post=addB(0,'outpost',${position.x},${position.y},true))`),true);
 assert.equal(c('campaignFrontierWatchpost()===post'),true);
 const enemyHp=c('tcOf(1).hp');
 const resources=c('JSON.stringify(S.res[0])');
 c('cmp.k=14;cmpTick(1)');
 assert.equal(c('!!cmp.d.frontierwatch'),true);
 c('cmpTick(1)');
 assert.equal(c("S.us.filter(u=>u.t===0&&u.hp>0&&u.o==='G'&&u.tg===post&&['spear','skirm'].includes(u.k)).length"),4,'four real defenders guard the forward post');
 assert.equal(c('tcOf(1).hp'),enemyHp,'watchpost garrison cannot fabricate enemy losses');
 assert.equal(c('JSON.stringify(S.res[0])'),resources,'milestone reward never fabricates materials');
 assert.equal(c('S.over'),null,'optional Outpost never counts as winning four required goals');
 c('cmpTick(2)');
 assert.equal(c("S.us.filter(u=>u.t===0&&u.hp>0&&u.o==='G'&&u.tg===post&&['spear','skirm'].includes(u.k)).length"),4);
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 c('cmpTick(2)');
 assert.equal(c("S.us.filter(u=>u.t===0&&u.hp>0&&u.o==='G'&&u.tg===campaignFrontierWatchpost()&&['spear','skirm'].includes(u.k)).length"),4,'the garrison remains unique after save/load');
});

test('Feudal Frontier raids react to actual Towers and a Market, never age-up alone',()=>{
 const c=mission(2);
 assert.equal(c("CAMP[2].ev.filter(e=>e.at===205||e.at===390).length"),2);
 c('cmpTick(395)');
 assert.equal(c('!!cmp.e[3]'),false,'no early raid before first real Tower');
 assert.equal(c('!!cmp.e[4]'),false,'no market raid before two real Towers');
 c('S.age[0]=1');
 c('cmpTick(1)');
 assert.equal(c('!!cmp.e[3]'),false);
 assert.equal(c("!!(globalThis.first=put(0,'tower',tcOf(0).x+8,tcOf(0).y+5))"),true);
 c('cmpTick(1)');
 assert.equal(c('!!cmp.e[3]'),true,'the first real Tower provokes the small scouting attack');
 assert.equal(c('!!cmp.e[4]'),false);
 assert.equal(c("!!(globalThis.second=put(0,'tower',tcOf(0).x-8,tcOf(0).y-5))"),true);
 assert.equal(c("!!(globalThis.market=put(0,'market',tcOf(0).x+7,tcOf(0).y-8))"),true);
 c('cmpTick(1)');
 assert.equal(c('!!cmp.e[4]'),true,'real Market and two completed Towers provoke the second raid');
 assert.equal(c('S.over'),null);
});

test('Reliquary Trail patrols pursue real Monks before the old 3:40 scripted raid',()=>{
 const c=mission(11);
 const first=c("CAMP[11].ev.findIndex(e=>e.do.toString().includes('campaignReliquaryPatrol'))");
 assert.ok(first>=0);
 assert.equal(c("CAMP[11].ev[first].at"),55);
 assert.equal(c("CAMP[11].goals.find(g=>g.id==='trailpost').optional"),true);
 assert.ok(c("aliveUnits(0,'mon').length")>=2,'two genuine player Monks begin the mission');
 assert.equal(c("cb('monastery')"),1,'the mission briefing reflects the starting Monastery');
 assert.equal(c('S.rel.length'),2,'only the two authored pilgrim relics may exist; generated map loot must not bypass the trail');
 assert.equal(c("S.rel.filter(q=>q.rl&&!q.c&&!q.m).length"),2,'both mission relics begin on the map, unclaimed');
 assert.equal(c("S.rel.every(q=>!!path(aliveUnits(0,'mon')[0],gp(q.x,q.y,.8)))"),true,
 'both authored relic sites must be navigable by a real Monk, not merely drawn on dry terrain');
 assert.equal(c("CAMP[11].goals.find(g=>g.id==='relics').ok()"),false,'no free relic objectives at the start');
 const shore=JSON.parse(c(`JSON.stringify((()=>{
  const home=tcOf(0),hx=home.x+home.s/2,hy=home.y+home.s/2;
  const dx=W/2-hx,dy=H/2-hy,dist=Math.hypot(dx,dy);
  return S.rel.filter(q=>q&&q.rl&&!q.c&&!q.m).map(q=>{
   const x=q.x-hx,y=q.y-hy,cell=(q.y|0)*W+(q.x|0);
   return{forward:(x*dx+y*dy)/dist,side:(x*dy-y*dx)/dist,dry:!S.wt[cell]&&!S.g[cell]&&!S.nd[cell]};
  });
 })())`));
 for(const direction of [-1,1])
  assert.ok(shore.some(q=>q.dry&&q.forward>=19&&q.forward<=34&&q.side*direction>=4),
   'each flank of the Mediterranean shore must have a physically placed, unclaimed mission relic');
 const before=c("aliveUnits(1).length");
 c('cmpTick(54)');
 assert.equal(c('!!cmp.e['+first+']'),false,'early patrols cannot fire ahead of their timing');
 c('cmpTick(1)');
 assert.equal(c('cmp.e['+first+']'),1,'the first contested-road patrol fires at 0:55');
 assert.ok(c("aliveUnits(1).length")>=before+2,'the patrol consists of real living units');
 assert.ok(c("S.us.some(u=>u.t===1&&u.hp>0&&u.o==='a'&&u.tg?.t===0)"),'at least one patrol unit actually targets a reachable friendly Monk or holding');
 assert.equal(c('S.over'),null,'patrol arrivals do not grant victory');
 const afterFirst=c("aliveUnits(1).length");
 c('cmpTick(75)');
 assert.ok(c("aliveUnits(1).length")>=afterFirst+2,'a second physical patrol is dispatched at 2:10');
 assert.equal(c("CAMP[11].goals.find(g=>g.id==='relics').ok()"),false,'only relics returned to a live friendly Monastery complete the mission');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c('S.rel.length'),2,'the only two authored relics persist across save/reload');
 const afterReload=c("aliveUnits(1).length");
 c('cmpTick(1)');
 assert.equal(c("aliveUnits(1).length"),afterReload,'saved one-shot patrol events never duplicate on reload');
});

test('Reliquary Trail optional forward Outpost earns four mortal Monk escorts once, without bypassing relic recovery',()=>{
 const c=mission(11);
 assert.equal(c('campaignReliquaryWaystation()'),null);
 const reward=c("CAMP[11].ev.findIndex(e=>e.do.toString().includes('campaignReliquaryEscort'))");
 assert.ok(reward>=0);
 c('S.ex.fill(1)');
 const site=JSON.parse(c(`JSON.stringify((()=>{
  const h=tcOf(0),hx=h.x+h.s/2,hy=h.y+h.s/2;
  const dx=W/2-hx,dy=H/2-hy,dist=Math.hypot(dx,dy);
  for(let forward=14;forward<=30;forward+=2)
   for(let lateral=-10;lateral<=10;lateral+=2){
    const x=Math.round(hx+dx/dist*forward-dy/dist*lateral),
          y=Math.round(hy+dy/dist*forward+dx/dist*lateral);
    if(x>1&&y>1&&x+B.outpost.s<W-1&&y+B.outpost.s<H-1&&okPlace(0,'outpost',x,y))return{x,y};
   }
  return null;
 })())`));
 assert.ok(site,'the player bank must have a legal buildable forward Outpost above the Mediterranean shoreline');
 assert.equal(c(`!!(globalThis.post=addB(0,'outpost',${site.x},${site.y},true))`),true);
 assert.equal(c('campaignReliquaryWaystation()===post'),true,'the forward location is verified from completed physical buildings');
 const resources=c('JSON.stringify(S.res[0])');
 const enemyTc=c('tcOf(1).hp');
 const prior=c("aliveUnits(0,'spear').length+aliveUnits(0,'skirm').length");
 c('cmp.k=14;cmpTick(1)');
 assert.equal(c('!!cmp.d.trailpost'),true,'the optional goal records a genuine built waystation');
 c('cmpTick(1)');
 assert.equal(c('cmp.e['+reward+']'),1);
 assert.equal(c("aliveUnits(0,'spear').length+aliveUnits(0,'skirm').length"),prior+4,'four real soldiers arrive to guard Monks');
 assert.equal(c("S.us.filter(u=>u.t===0&&u.hp>0&&['spear','skirm'].includes(u.k)&&u.o==='G'&&u.tg?.k==='mon').length"),4,'the escorts guard living Monks rather than an arbitrary map marker');
 assert.equal(c('JSON.stringify(S.res[0])'),resources,'the optional reward does not mint free materials');
 assert.equal(c('tcOf(1).hp'),enemyTc,'a guard reward cannot fabricate damage or an enemy defeat');
 assert.equal(c('S.over'),null,'an optional Outpost does not replace retrieving two actual relics');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 c('cmpTick(2)');
 assert.equal(c("aliveUnits(0,'spear').length+aliveUnits(0,'skirm').length"),prior+4,'the escort is not doubled on save/reload');
});

