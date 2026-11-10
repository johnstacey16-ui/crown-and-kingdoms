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

test('Raiders at the Ford selects a real reachable shallow crossing and uses the correct raid routes',()=>{
 const c=mission(1);
 const ford=JSON.parse(c('JSON.stringify(campaignRaidersFord())'));
 assert.ok(ford,'the seeded Arabia map must contain a reachable shallow river crossing');
 assert.equal(c('S.wt[(campaignRaidersFord()[1]|0)*W+(campaignRaidersFord()[0]|0)]'),2,
  'the crossing is actual shallow water, not a decorative marker');
 assert.ok(c("!!path(aliveUnits(0,'vil')[0],gp(...campaignRaidersFord(),1))"),
  'ordinary villagers can walk to the selected river crossing');
 assert.deepEqual(JSON.parse(c('JSON.stringify(CAMP[1].goals.map(g=>[g.id,!!g.optional]))')),
  [['b',false],['s',false],['t',false],['fordguard',true]],'the original three objectives remain required');
 assert.equal(c('CAMP[1].ev.filter(e=>e.at>=150&&e.at<=390).length'),3,
  'all three original mounted and infantry raid waves remain scheduled');
 assert.equal(c('campaignRaidersFordGuardReady()'),false);
 c('cmpTick(150)');
 assert.equal(c('cmp.e[1]'),1,'the real first raid fires on time');
 const crossingCount=c('cmp.d.raidersCrossings||0');
 assert.ok(crossingCount>=2,'multiple attackers must emerge on reachable enemy-facing approaches to the actual ford');
 const locations=JSON.parse(c('JSON.stringify(cmp.d.raidersRoadSpawns)'));
 assert.ok(locations.every(p=>Math.hypot(p[0]-ford[0],p[1]-ford[1])<=30),'every documented road spawn is near the actual saved shallow ford');
 assert.ok(c("S.us.some(u=>u&&u.campaignPatrol==='ford-crossing'&&u.o==='a'&&u.tg?.t===0)"),
  'the real raiders receive combat orders against living friendly targets');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c('JSON.stringify(cmp.d.raidersFord)'),JSON.stringify(ford),'ford coordinate survives save/load');
 assert.equal(c('cmp.d.raidersCrossings'),crossingCount,'raid evidence persists through save/load');
 c('cmpTick(120)');
 assert.equal(c('cmp.e[2]'),1,'second original wave still attacks');
 c('cmpTick(120)');
 assert.equal(c('cmp.e[3]'),1,'third original wave still attacks');
 assert.equal(c('cmp.e[4]'),undefined,'the late royal relief is not brought forward');
});

test('Raiders at the Ford rewards a living three-soldier defense exactly once, without bypassing victory',()=>{
 const c=mission(1);
 const ford=JSON.parse(c('JSON.stringify(campaignRaidersFord())'));
 assert.ok(ford,'a real shallow crossing is required');
 c('cmp.d.fordguard=1;cmpTick(1/30)');
 assert.equal(c('!!cmp.e[5]'),false,'forging the milestone without real guards cannot summon troops');
 c('cmp.d.fordguard=0');
 const placed=JSON.parse(c(`JSON.stringify((()=>{
  const f=campaignRaidersFord(),out=[];
  for(let radius=2;radius<=9&&out.length<3;radius++)
   for(let y=Math.floor(f[1])-radius;y<=Math.floor(f[1])+radius&&out.length<3;y++)
    for(let x=Math.floor(f[0])-radius;x<=Math.floor(f[0])+radius&&out.length<3;x++){
     if(x<2||y<2||x>=W-2||y>=H-2||Math.hypot(x+.5-f[0],y+.5-f[1])>9)continue;
     const i=y*W+x;
     if(S.wt[i]===1||S.g[i]||S.nd[i]||S.us.some(u=>u&&u.hp>0&&!u.ld&&Math.hypot(u.x-x-.5,u.y-y-.5)<1.7))continue;
     const u=addU(0,'spear',x+.5,y+.5);
     if(u)out.push(u.netId);
    }
  return out;
 })())`));
 assert.equal(placed.length,3,'three normal, living player soldiers can be stationed near the ford');
 assert.equal(c('campaignRaidersFordGuardReady()'),true);
 const before=c("aliveUnits(0,'spear').length+aliveUnits(0,'skirm').length");
 const resources=c('JSON.stringify(S.res[0])'),trained=c('S.pl.tr');
 c('cmp.k=14;cmpTick(1/30)');
 assert.equal(c('cmp.d.fordguard'),1,'only three real soldiers near the shallow ford earn the optional milestone');
 c('cmpTick(1/30)');
 assert.equal(c('cmp.e[5]'),1);
 assert.equal(c("aliveUnits(0,'spear').length+aliveUnits(0,'skirm').length"),before+4,
  'the optional defense brings four mortal spearmen/skirmishers');
 assert.equal(c("S.us.filter(u=>u&&u.t===0&&u.hp>0&&u.o==='G'&&u.tg?.netId==="+JSON.stringify(placed[0])+").length"),4,
  'new royal troops follow a real living forward defender rather than guarding an invisible marker');
 assert.equal(c('JSON.stringify(S.res[0])'),resources,'the bonus does not forge extra resources');
 assert.equal(c('S.pl.tr'),trained,'story help is not falsely recorded as paid training');
 assert.equal(c('S.over'),null,'three guard soldiers cannot replace the Barracks, eight soldiers or eight-minute hold');
 assert.equal(c('saveG()'),true);assert.equal(c('loadG()'),true);
 c('cmpTick(1/30)');
 assert.equal(c("aliveUnits(0,'spear').length+aliveUnits(0,'skirm').length"),before+4,
  'saving and reloading cannot duplicate the optional royal guard');
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
test('Blackwood ford is a real, reachable seeded shallow crossing and defenses must remain standing',()=>{
 const c=mission(15);
 const ford=JSON.parse(c('JSON.stringify(campaignBlackwoodFord())'));
 assert.ok(ford,'the seeded Black Forest contains a reachable shallow ford on the forest road');
 assert.equal(c('S.wt[(campaignBlackwoodFord()[1]|0)*W+(campaignBlackwoodFord()[0]|0)]'),2,'the ford is actual walkable shallow water');
 assert.ok(c('!!path(aliveUnits(0,"mil")[0],gp(...campaignBlackwoodFord(),1))'),'a real starting soldier can reach the ford on foot');
 assert.deepEqual(JSON.parse(c('JSON.stringify(CAMP[15].goals.map(g=>[g.id,!!g.sustained,!!g.optional]))')),
  [['tower',true,false],['wall',true,false],['hold',false,false],['bridgehead',false,true]]);
 assert.equal(c('campaignBlackwoodBridgeReady()'),false,'unbuilt bridge defenses do not count');
 assert.equal(c('CAMP[15].ev.length'),7,'all five original enemy attack waves remain, plus the briefing and one optional relief event');
 // A completed Tower can lose the mandatory milestone once it is destroyed.
 c("addB(0,'tower',tcOf(0).x+6,tcOf(0).y-2,true)");
 c("S.bs.filter(b=>b.t===0&&b.k==='tower').forEach(b=>b.hp=0)");
 assert.equal(c("CAMP[15].goals.find(g=>g.id==='tower').ok()"),false,'dead Towers cannot secure the final victory');
});

test('Blackwood bridgehead earns physical guards once and late raids target reachable actual defenses',()=>{
 const c=mission(15);
 c('S.ex.fill(1)');
 const result=JSON.parse(c(`JSON.stringify((()=>{
  const ford=campaignBlackwoodFord(),home=tcOf(0);
  if(!ford||!home)return {error:'no ford'};
  const hx=home.x+home.s*.5,hy=home.y+home.s*.5,dist=Math.hypot(ford[0]-hx,ford[1]-hy);
  const built=[];
  const scout=aliveUnits(0,'vil')[0];
  for(const kind of ['tower','tower','wall','wall','wall']){
   const possible=[];
   for(let y=2;y<H-B[kind].s-2;y++)for(let x=2;x<W-B[kind].s-2;x++){
    const cx=x+B[kind].s*.5,cy=y+B[kind].s*.5;
    const d=Math.hypot(cx-ford[0],cy-ford[1]);
    if(d<3||d>(kind==='tower'?19:21)||Math.hypot(cx-hx,cy-hy)>=dist-1)continue;
    if(okPlace(0,kind,x,y))possible.push({x,y,score:Math.abs(d-10)});
   }
   possible.sort((a,b)=>a.score-b.score);
   const site=possible.slice(0,65).find(q=>path(scout,goalNear({x:q.x,y:q.y,s:B[kind].s},1)));
   if(!site)return {error:'no reachable buildable '+kind,built,ford,candidates:possible.length};
   const building=addB(0,kind,site.x,site.y,true);
   if(!building)return {error:'failed real building '+kind,built,ford};
   built.push({kind,netId:building.netId,x:site.x,y:site.y});
  }
  return {ford,built,bridgeReady:campaignBlackwoodBridgeReady(),tower:campaignBlackwoodBridgeTower()?.netId};
 })())`));
 assert.ok(!result.error,'there must be a feasible home-bank fortified bridgehead: '+JSON.stringify(result));
 assert.equal(result.built.length,5);
 assert.equal(result.bridgeReady,true,'only actual home-bank fortifications overlooking the ford earn the bonus');
 assert.equal(result.tower,result.built[0].netId);
 const before=c("aliveUnits(0,'spear').length+aliveUnits(0,'skirm').length");
 const resources=c('JSON.stringify(S.res[0])');
 const trained=c('S.pl.tr');
 c('for(let i=0;i<17;i++)cmpTick(1/30)');
 assert.equal(c('cmp.d.bridgehead'),1);
 const relief=c("CAMP[15].ev.findIndex(e=>e.do.toString().includes('campaignBlackwoodBridgeRelief'))");
 assert.equal(c('cmp.e['+relief+']'),1);
 assert.equal(c("aliveUnits(0,'spear').length+aliveUnits(0,'skirm').length"),before+6,'royal relief must be six live, ordinary soldiers');
 assert.equal(c("S.us.filter(u=>u.t===0&&u.hp>0&&u.o==='G'&&u.tg?.netId===campaignBlackwoodBridgeTower()?.netId).length"),6,'royal soldiers protect the physical forward Tower');
 assert.equal(c('JSON.stringify(S.res[0])'),resources,'the event does not mint resources');
 assert.equal(c('S.pl.tr'),trained,'story reinforcements are not misrepresented as paid training');
 assert.equal(c('S.over'),null,'optional bridgehead cannot end the timed defense');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c('JSON.stringify(cmp.d.blackwoodFord)'),JSON.stringify(result.ford),'the actual ford location persists across save/reload');
 c('cmpTick(1/30)');
 assert.equal(c("aliveUnits(0,'spear').length+aliveUnits(0,'skirm').length"),before+6,'reloading must not duplicate the relief');
 c('cmpTick(260)');
 const roadThreat=JSON.parse(c("JSON.stringify(S.us.filter(u=>u&&u.t===1&&u.hp>0&&u.o==='a').map(u=>({kind:u.k,target:u.tg?.k||null,id:u.tg?.netId||null})))"));
 const fortIds=JSON.parse(c("JSON.stringify(campaignBlackwoodBridgeFortifications().towers.concat(campaignBlackwoodBridgeFortifications().walls).map(b=>b.netId))"));
 assert.ok(roadThreat.some(u=>fortIds.includes(u.id)),
  'the third attack wave must target a real bridgehead Tower or its screening walls, using a reachable route: '+JSON.stringify({ford:result.ford,roadThreat,fortIds}));
 assert.equal(c('S.over'),null,'enemy attack orders cannot fabricate a win or loss');
});

test('Blackwood loses maintained fortification credit when real defenses fall and restores it after rebuilding',()=>{
 const c=mission(15);
 c('S.ex.fill(1)');
 const fixture=JSON.parse(c(`JSON.stringify((()=>{
  const tc=tcOf(0),built=[];
  for(const k of ['tower','tower','wall','wall','wall','wall','wall','wall']){
   const b=put(0,k,tc.x+7,tc.y-7);
   if(!b)return {failed:k,already:built};
   built.push({k,id:b.netId});
  }
  return {built};
 })())`));
 assert.ok(!fixture.failed,'eight ordinary completed fortifications must fit around the actual starting settlement: '+JSON.stringify(fixture));
 assert.equal(fixture.built.length,8);
 c('cmp.k=14;cmpTick(1/30)');
 assert.equal(c('cmp.d.tower'),1);
 assert.equal(c('cmp.d.wall'),1);
 c("S.bs.find(b=>b.netId==="+JSON.stringify(fixture.built.find(x=>x.k==='tower').id)+").hp=0;cmp.k=14;cmpTick(1/30)");
 assert.equal(c('!!cmp.d.tower'),false,'a destroyed Tower removes the previously earned sustained objective credit');
 assert.equal(c('cmp.d.wall'),1,'intact walls retain their own independently tracked objective credit');
 c("S.bs.find(b=>b.netId==="+JSON.stringify(fixture.built.find(x=>x.k==='wall').id)+").hp=0;cmp.k=14;cmpTick(1/30)");
 assert.equal(c('!!cmp.d.wall'),false,'a destroyed wall section also removes sustained completion credit');
 c('cmp.k=14;cmpTick(480)');
 assert.equal(c('S.over'),null,'the time milestone cannot award victory with broken Towers and walls');
 assert.ok(c("!!put(0,'tower',tcOf(0).x+7,tcOf(0).y-7)"),'a replacement real Tower must be buildable');
 assert.ok(c("!!put(0,'wall',tcOf(0).x+7,tcOf(0).y-7)"),'a replacement real wall must be buildable');
 c('cmp.k=14;cmpTick(1/30)');
 assert.equal(c('S.over'),'win','rebuilding the actual surviving fortifications after eight minutes finally earns victory');
});

test('Northern Watch forward beacon requires a real forward Tower and three live nearby ranged defenders',()=>{
 const c=mission(6);
 assert.equal(c('campaignNorthernBeaconTower()'),null,'a starting settlement has no invented forward beacon');
 assert.equal(c('campaignNorthernBeaconReady()'),false);
 c('S.ex.fill(1)');
 const loc=JSON.parse(c(`JSON.stringify((()=>{
  const h=tcOf(0),e=tcOf(1),hx=h.x+h.s*.5,hy=h.y+h.s*.5;
  const dx=e.x+e.s*.5-hx,dy=e.y+e.s*.5-hy,len=Math.hypot(dx,dy);
  const vil=aliveUnits(0,'vil')[0];
  for(let f=14;f<=30;f+=2)for(let offset of [0,3,-3,6,-6,9,-9,12,-12]){
   const x=Math.round(hx+dx/len*f-dy/len*offset),y=Math.round(hy+dy/len*f+dx/len*offset);
   if(x<2||y<2||x>=W-B.tower.s-2||y>=H-B.tower.s-2)continue;
   if(okPlace(0,'tower',x,y)&&path(vil,goalNear({x,y,s:B.tower.s},1)))return [x,y];
  }
  return null;
 })())`));
 assert.ok(loc,'the seeded frozen forest must allow a legal, accessible forward Watch Tower');
 assert.ok(c(`!!addB(0,'tower',${loc[0]},${loc[1]},true)`),'an actual friendly Tower is constructed');
 assert.equal(c('campaignNorthernBeaconReady()'),false,'the Tower alone does not light the signal');
 const towerId=c('campaignNorthernBeaconTower()?.netId');
 assert.ok(towerId,'the Tower occupies the real pine-line approach');
 const units=JSON.parse(c(`JSON.stringify((()=>{
  const tower=campaignNorthernBeaconTower(),out=[];
  for(let radius=4;radius<=8&&out.length<3;radius++)
   for(let y=Math.floor(tower.y)-radius;y<=Math.ceil(tower.y+tower.s+radius)&&out.length<3;y++)
    for(let x=Math.floor(tower.x)-radius;x<=Math.ceil(tower.x+tower.s+radius)&&out.length<3;x++){
     if(x<2||y<2||x>=W-2||y>=H-2)continue;
     if(Math.hypot(x+.5-(tower.x+tower.s*.5),y+.5-(tower.y+tower.s*.5))>8)continue;
     const i=y*W+x;
     if(S.wt[i]===1||S.g[i]||S.nd[i]||S.us.some(u=>u&&u.hp>0&&Math.hypot(u.x-x-.5,u.y-y-.5)<1.5))continue;
     const u=addU(0,'skirm',x+.5,y+.5);
     if(u)out.push(u.netId);
    }
  return out;
 })())`));
 assert.equal(units.length,3,'three ordinary living ranged troops can stand beside the Watch Tower');
 assert.equal(c('campaignNorthernBeaconReady()'),true);
 c('S.us.find(u=>u.netId==='+JSON.stringify(units[0])+').hp=0');
 assert.equal(c('campaignNorthernBeaconReady()'),false,'a dead nearby defender never satisfies the beacon');
 assert.equal(c('!!cmp.d.beacon'),false);
});

test('Northern Watch beacon earns a one-time physical royal defence without bypassing the timed mission',()=>{
 const c=mission(6);
 c('S.ex.fill(1)');
 // Fixture builds the real Tower on a navigable forward road; its live
 // Skirmishers are ordinary units and can die like a player-trained squad.
 const coords=JSON.parse(c(`JSON.stringify((()=>{
  const h=tcOf(0),e=tcOf(1),hx=h.x+h.s*.5,hy=h.y+h.s*.5;
  const dx=e.x+e.s*.5-hx,dy=e.y+e.s*.5-hy,len=Math.hypot(dx,dy),vil=aliveUnits(0,'vil')[0];
  for(let f=14;f<=30;f+=2)for(let off of [0,3,-3,6,-6,9,-9,12,-12]){
   const x=Math.round(hx+dx/len*f-dy/len*off),y=Math.round(hy+dy/len*f+dx/len*off);
   if(x>1&&y>1&&x<W-B.tower.s-2&&y<H-B.tower.s-2&&okPlace(0,'tower',x,y)&&path(vil,goalNear({x,y,s:B.tower.s},1)))return [x,y];
  }
  return null;
 })())`));
 assert.ok(coords,'an accessible Pine Tower site must exist');
 c(`addB(0,'tower',${coords[0]},${coords[1]},true)`);
 assert.equal(c('!!campaignNorthernBeaconTower()'),true);
 const created=JSON.parse(c(`JSON.stringify((()=>{
  const t=campaignNorthernBeaconTower(),a=[];
  for(let r=4;r<=8&&a.length<3;r++)for(let y=t.y-r;y<=t.y+t.s+r&&a.length<3;y++)
   for(let x=t.x-r;x<=t.x+t.s+r&&a.length<3;x++){
    if(x<2||y<2||x>=W-2||y>=H-2)continue;
    const i=y*W+x;
    if(S.wt[i]===1||S.g[i]||S.nd[i]||Math.hypot(x+.5-(t.x+t.s*.5),y+.5-(t.y+t.s*.5))>8)continue;
    if(S.us.some(u=>u&&u.hp>0&&Math.hypot(u.x-x-.5,u.y-y-.5)<1.5))continue;
    const u=addU(0,'skirm',x+.5,y+.5);if(u)a.push(u.netId);
   }
  return a;
 })())`));
 assert.equal(created.length,3);
 assert.equal(c('campaignNorthernBeaconReady()'),true);
 const count=c("aliveUnits(0,'spear').length+aliveUnits(0,'skirm').length");
 const resources=c('JSON.stringify(S.res[0])'),trained=c('S.pl.tr'),enemyHp=c('tcOf(1).hp');
 c('cmp.k=14;cmpTick(1/30)');
 assert.equal(c('cmp.d.beacon'),1,'the beacon goal recognizes the actually defended forward Tower');
 c('cmpTick(1/30)');
 const event=c("CAMP[6].ev.findIndex(e=>e.do.toString().includes('campaignNorthernBeaconRelief'))");
 assert.equal(c('cmp.e['+event+']'),1);
 assert.equal(c("aliveUnits(0,'spear').length+aliveUnits(0,'skirm').length"),count+4,'four real royal troops appear once');
 assert.equal(c("S.us.filter(u=>u.t===0&&u.hp>0&&u.o==='G'&&u.tg?.netId===campaignNorthernBeaconTower()?.netId).length"),4,'royal soldiers guard the real forward Tower');
 assert.equal(c('JSON.stringify(S.res[0])'),resources,'event does not fabricate resources');
 assert.equal(c('S.pl.tr'),trained,'story arrivals are not falsely recorded as paid production');
 assert.equal(c('tcOf(1).hp'),enemyHp,'optional assistance cannot damage enemy structures for free');
 assert.equal(c('S.over'),null,'signal beacons never bypass the ten-minute hold');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 c('cmpTick(1/30)');
 assert.equal(c("aliveUnits(0,'spear').length+aliveUnits(0,'skirm').length"),count+4,'a reload cannot duplicate royal relief');
 c("campaignNorthernBeaconTower().hp=0;cmp.k=14;cmpTick(1/30)");
 assert.equal(c('campaignNorthernBeaconReady()'),false,'destruction silences a forward beacon despite its previous reward');
});

test('Northern Watch royal relief waits for a live guarded beacon after interrupted signalling',()=>{
 const c=mission(6);
 const reliefEvent=c("CAMP[6].ev.findIndex(e=>e.do.toString().includes('campaignNorthernBeaconRelief'))");
 assert.ok(reliefEvent>=3,'the royal relief event is distinct from the three original timed raids');
 const starting=c("aliveUnits(0,'spear').length+aliveUnits(0,'skirm').length");
 // The optional milestone may have been earned in an earlier half-second,
 // but its signal guards can die before the next campaign event evaluation.
 c('cmp.d.beacon=1;cmpTick(1/30)');
 assert.equal(c('!!cmp.e['+reliefEvent+']'),false,'a broken beacon must not consume its one-time relief event');
 assert.equal(c("aliveUnits(0,'spear').length+aliveUnits(0,'skirm').length"),starting,'no troops are fabricated at an undefended signal');
 assert.equal(c('S.over'),null);
});
test('Northern Watch standing Tower and ranged soldiers are rechecked after losses',()=>{
 const c=mission(6);
 c('S.ex.fill(1)');
 const tower=JSON.parse(c(`JSON.stringify((()=>{
  const tc=tcOf(0);return put(0,'tower',tc.x+5,tc.y-5)?.netId||null;
 })())`));
 assert.ok(tower);
 c("grp(0,'skirm',6)");
 assert.ok(c("CAMP[6].goals.find(g=>g.id==='a').ok()"),'six actual ranged soldiers qualify');
 c('cmp.k=14;cmpTick(1/30)');
 assert.equal(c('cmp.d.t'),1);
 assert.equal(c('cmp.d.a'),1);
 c("S.bs.find(b=>b.netId==="+JSON.stringify(tower)+").hp=0;aliveUnits(0,'skirm')[0].hp=0;cmp.k=14;cmpTick(1/30)");
 assert.equal(c('!!cmp.d.t'),false,'destroyed Tower revokes maintained defense credit');
 assert.equal(c('!!cmp.d.a'),false,'the dead sixth ranged soldier revokes maintained army credit');
 c('cmp.k=14;cmpTick(600)');
 assert.equal(c('S.over'),null,'surviving the clock alone cannot complete broken defenses');
});
test('Iron Pass dispatches two real distant wagons rather than winning on a timer alone',()=>{
 const c=mission(18);
 assert.deepEqual(JSON.parse(c('JSON.stringify(CAMP[18].goals.map(g=>g.id))')),['towers','army','hold','convoy']);
 assert.equal(c("CAMP[18].goals.find(g=>g.id==='towers').sustained"),true,'both real defensive Towers must remain standing');
 c('cmpTick(474)');
 assert.equal(c('!!cmp.d.ironConvoySent'),false,'the convoy cannot be summoned ahead of its timed checkpoint');
 assert.equal(c("aliveUnits(0,'cart').filter(u=>u.campaignConvoy==='iron-pass').length"),0);
 c('cmpTick(1)');
 assert.equal(c('cmp.d.ironConvoySent'),1,'the scripted checkpoint dispatched genuine wagons');
 const carts=JSON.parse(c("JSON.stringify(aliveUnits(0,'cart').filter(u=>u.campaignConvoy==='iron-pass').map(u=>({id:u.netId,x:u.x,y:u.y,order:u.o,route:u.p?.length||0,distance:Math.hypot(u.x-tcOf(0).x,u.y-tcOf(0).y)})))"));
 assert.equal(carts.length,2,'the royal supply column consists of two living, identifiable Trade Carts');
 assert.ok(carts.every(u=>u.distance>=19&&u.route>0&&u.order==='m'),
  'wagons spawn on a genuinely reachable forward road and walk home rather than teleporting: '+JSON.stringify(carts));
 assert.equal(c('campaignIronPassCartArrived()'),false,'a remote wagon does not count as delivered');
 assert.equal(c('S.over'),null,'the timer by itself cannot bypass the convoy or army objectives');
 c('cmpTick(1)');
 assert.equal(c("aliveUnits(0,'cart').filter(u=>u.campaignConvoy==='iron-pass').length"),2,'the supply wagons are a one-shot encounter');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c("S.us.filter(u=>u.campaignConvoy==='iron-pass'&&u.hp>0).length"),2,'both convoy identities survive a normal game save');
 assert.equal(c('!!cmp.d.convoy'),false,'saving/loading may not complete an undelivered convoy');
});

test('Iron Pass pursuers target real caravans and destroying all wagons causes genuine defeat',()=>{
 const c=mission(18);
 c('cmpTick(475)');
 assert.equal(c('cmp.d.ironConvoySent'),1);
 const enemies=c("aliveUnits(1,'scout').length");
 c('cmpTick(8)');
 assert.equal(c('cmp.e[6]'),1,'the final pursuit event fires only after wagons depart');
 assert.ok(c("S.us.some(u=>u.t===1&&u.hp>0&&u.campaignPatrol==='iron-pass'&&u.o==='a'&&u.tg?.campaignConvoy==='iron-pass')"),
  'real hostile Scouts are tasked to attack actual moving royal Trade Carts');
 assert.ok(c("aliveUnits(1,'scout').length")>enemies);
 assert.equal(c('S.over'),null);
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.ok(c("S.us.some(u=>u.t===1&&u.hp>0&&u.campaignPatrol==='iron-pass'&&u.tg?.campaignConvoy==='iron-pass')"),
  'pursuit identity and entity target survive save/load');
 c("S.us.filter(u=>u.campaignConvoy==='iron-pass').forEach(u=>u.hp=0)");
 c('cmpTick(1)');
 assert.equal(c('S.over'),'lose','both destroyed wagons mean the supply route is lost even with a healthy Town Centre');
});

test('Iron Pass accepts only a living tagged wagon actually reaching the Town Centre',()=>{
 const c=mission(18);
 c('cmpTick(475)');
 const home=c('tcOf(0).netId');
 assert.ok(home);
 assert.equal(c('campaignIronPassCartArrived()'),false);
 c("S.us.filter(u=>u.campaignConvoy==='iron-pass').forEach(u=>u.hp=0)");
 c("const h=tcOf(0);addU(0,'cart',h.x+2,h.y+2)");
 assert.equal(c('campaignIronPassCartArrived()'),false,'an unrelated Trade Cart at home cannot forge royal convoy completion');
 const another=mission(18);
 another('cmpTick(475)');
 another("const h=tcOf(0),w=aliveUnits(0,'cart').find(u=>u.campaignConvoy==='iron-pass');w.x=h.x+1;w.y=h.y+1;");
 assert.equal(another('campaignIronPassCartArrived()'),true,'the correct living wagon at the real Town Centre is delivered');
 another("const w=aliveUnits(0,'cart').find(u=>u.campaignConvoy==='iron-pass');w.hp=0;");
 assert.equal(another('campaignIronPassCartArrived()'),false,'a dead wagon never qualifies as a delivery');
});
test('Greywatch has two genuine fortification objectives and a unique saved relay Tower',()=>{
 const c=mission(9);
 assert.deepEqual(JSON.parse(c('JSON.stringify(CAMP[9].goals.map(g=>[g.id,!!g.optional]))')),
  [['castle',false],['greywatch',false],['relay',true]]);
 const id=c('cmp.d.greywatchRelayId');
 assert.ok(id,'the original hostile Tower must have a persistent sabotage target ID');
 assert.equal(c("S.bs.filter(b=>b.t===1&&b.k==='tower'&&b.hp>0&&b.netId===cmp.d.greywatchRelayId).length"),1);
 assert.equal(c('campaignGreywatchRelaySabotaged()'),false,'an intact relay cannot be silenced by an arbitrary building');
 c('cmp.t=30;cmp.k=14;tcOf(1).hp=0;cmpTick(1/30)');
 assert.equal(c('cmp.d.greywatch'),1,'the actual enemy Town Centre is destroyed');
 assert.equal(c('!!cmp.d.castle'),false,'a real Castle still blocks victory');
 assert.equal(c('S.over'),null,'destroying only the Town Centre is no longer an automatic win');
 c("S.bs.find(b=>b.t===1&&b.k==='castle'&&b.hp>0).hp=0;cmp.k=14;cmpTick(1/30)");
 assert.equal(c('S.over'),'win','both enemy structures must fall for real victory');
});

test('Greywatch relay sabotage before 4:00 reduces a real enemy cavalry raid and survives reload',()=>{
 const c=mission(9);
 const healthy=c('S.bs.find(b=>b.netId===cmp.d.greywatchRelayId).hp');
 assert.ok(healthy>0);
 // In this clock-only fixture, no simulation step has moved the original
 // enemy garrison away from the Town Centre's spawn cells. Clear only those
 // soldiers so raid production can be tested without changing its real code.
 c("S.us.filter(u=>u.t===1&&u.k!=='vil').forEach(u=>u.hp=0)");
 const before=c("S.us.filter(u=>u.t===1&&u.hp>0&&['knight','arc','spear'].includes(u.k)).length");
 c('cmp.t=238;cmp.k=14;cmpTick(1/30)');
 assert.equal(c('!!cmp.d.relay'),false);
 c('S.bs.find(b=>b.netId===cmp.d.greywatchRelayId).hp=0;cmp.k=14;cmpTick(1/30)');
 assert.equal(c('cmp.d.relay'),1,'only a dead authored enemy relay before 4:00 satisfies the optional sabotage');
 const relayId=c('cmp.d.greywatchRelayId');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c('cmp.d.greywatchRelayId'),relayId,'the original relay identity persists across save and reload');
 c('cmpTick(2)');
 assert.equal(c('cmp.e[1]'),1,'the reinforcement event still occurs once');
 assert.equal(c("S.us.filter(u=>u.t===1&&u.hp>0&&['knight','arc','spear'].includes(u.k)).length"),before+3,
  'sabotage leaves three real foot defenders instead of five cavalry-led reinforcements');
 assert.equal(c("S.us.filter(u=>u.t===1&&u.hp>0&&u.k==='knight').length"),0,'the relay sabotage suppresses cavalry');
 assert.equal(c('S.over'),null,'optional sabotage does not substitute for the Castle and Town Centre');
 c('cmpTick(1)');
 assert.equal(c("S.us.filter(u=>u.t===1&&u.hp>0&&['knight','arc','spear'].includes(u.k)).length"),before+3,
  'reload and repeat campaign ticks cannot duplicate the suppressed raid');
 const intact=mission(9);
 intact("S.us.filter(u=>u.t===1&&u.k!=='vil').forEach(u=>u.hp=0)");
 intact('cmpTick(240)');
 assert.equal(intact('!!cmp.d.relay'),false);
 assert.ok(intact("S.us.filter(u=>u.t===1&&u.hp>0&&u.k==='knight').length")>=2,
  'failing to silence the relay launches real cavalry reinforcements');
 intact("S.bs.find(b=>b.netId===cmp.d.greywatchRelayId).hp=0;cmp.k=14;cmpTick(1/30)");
 assert.equal(intact('!!cmp.d.relay'),false,'destroying the Tower after the cavalry signal cannot retroactively earn early sabotage');
});

test('Greywatch sabotage cannot be forged by destroying a different hostile Tower',()=>{
 const c=mission(9);
 const original=c('cmp.d.greywatchRelayId');
 assert.ok(original,'Greywatch must have one identified relay Tower');
 c("globalThis.decoy=put(1,'tower',tcOf(1).x+9,tcOf(1).y-7)");
 assert.ok(c('!!decoy'),'the mission allows another ordinary enemy Tower');
 assert.notEqual(c('decoy.netId'),original,'the second Tower must have its own persistent identity');
 c('decoy.hp=0;cmp.k=14;cmpTick(1/30)');
 assert.equal(c('campaignGreywatchRelayDown()'),false,'an unrelated destroyed Tower cannot disable the actual enemy signal');
 assert.equal(c('!!cmp.d.relay'),false,'a counterfeit Tower cannot earn the timed optional objective');
 c("S.bs.find(b=>b.netId===cmp.d.greywatchRelayId).hp=0;cmp.k=14;cmpTick(1/30)");
 assert.equal(c('cmp.d.relay'),1,'the genuine destroyed relay is credited before the enemy reinforcement signal');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c('cmp.d.greywatchRelayId'),original,'the original sabotage target identity survives reload');
 assert.equal(c('cmp.d.relay'),1,'the early sabotage milestone cannot be reset by saving');
});
test('Breaching Greywatch Castle launches one-shot mortal siege hunters against real rams',()=>{
 const c=mission(9);
 const fort=c("S.bs.find(b=>b.t===1&&b.k==='castle'&&b.hp>0).netId");
 assert.ok(fort);
 const before=c("S.us.filter(u=>u.t===1&&u.hp>0&&['scout','spear'].includes(u.k)).length");
 c("S.bs.find(b=>b.netId==="+JSON.stringify(fort)+").hp=S.bs.find(b=>b.netId==="+JSON.stringify(fort)+").mh*.7;cmpTick(1/30)");
 assert.equal(c('!!cmp.e[2]'),false,'minor Castle damage does not trigger the elite siege hunt');
 c("S.bs.find(b=>b.netId==="+JSON.stringify(fort)+").hp=S.bs.find(b=>b.netId==="+JSON.stringify(fort)+").mh*.5;cmpTick(1/30)");
 assert.equal(c('cmp.e[2]'),1);
 assert.equal(c("S.us.filter(u=>u.t===1&&u.hp>0&&['scout','spear'].includes(u.k)).length"),before+4,
  'four physical siege hunters sortie from the enemy capital');
 assert.ok(c("S.us.some(u=>u&&u.t===1&&u.hp>0&&u.campaignPatrol==='greywatch-siege'&&u.o==='a'&&u.tg?.k==='ram')"),
  'the counterattack uses real attack orders against live Battering Rams');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 c('cmpTick(1)');
 assert.equal(c("S.us.filter(u=>u.t===1&&u.hp>0&&['scout','spear'].includes(u.k)).length"),before+4,
  'reload cannot summon another sortie from the same breach');
});
test('Relic Road authors exactly three spaced, dry, reachable inland shrines',()=>{
 const c=mission(3);
 const sites=JSON.parse(c('JSON.stringify(cmp.d.relicRoadShrines)'));
 assert.equal(sites?.length,3,'the three-site pilgrimage must be authored successfully on the real seed');
 const actual=JSON.parse(c("JSON.stringify(S.rel.map(q=>({x:q.x,y:q.y,kind:q.campaignShrine,ground:S.wt[(q.y|0)*W+(q.x|0)],blocked:S.g[(q.y|0)*W+(q.x|0)]})))"));
 assert.equal(actual.length,3,'random easy relics must not bypass the three designed shrines');
 assert.ok(actual.every(q=>q.kind==='relic-road'&&q.ground===0&&!q.blocked),'relics must be grounded on genuine walkable land');
 for(let i=0;i<3;i++)for(let j=0;j<i;j++)
  assert.ok(Math.hypot(sites[i][0]-sites[j][0],sites[i][1]-sites[j][1])>=12,'each real shrine must be separated from the others');
 assert.ok(c("S.rel.every(q=>!!path(aliveUnits(0,'mon')[0],gp(q.x,q.y,.8)))"),'the original living Monk must be able to walk to every shrine');
 assert.equal(c("aliveUnits(0,'spear').length"),4,'a genuine four-person Spear escort begins with the fragile pilgrims');
 assert.equal(c("aliveUnits(0,'skirm').length"),2,'two ordinary ranged escorts are supplied');
 assert.equal(c("CAMP[3].goals.find(g=>g.id==='trackers').optional"),true,'enemy trackers are not an additional mandatory win shortcut');
 assert.equal(c('campaignRelicRoadHuntersDefeated()'),false,'no patrol defeated without a real pursuit');
 assert.equal(c('campaignRelicRoadDeposited()'),0);
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c('campaignRelicRoadDeposited()'),0,'undelivered shrines remain uncredited after a reload');
 assert.equal(c('cmp.d.relicRoadShrines.length'),3,'shrine route coordinates persist through regular save/load');
});

test('Relic Road enemy pursuit follows a genuine first relic deposit, never a fabricated timer',()=>{
 const c=mission(3);
 assert.equal(c('CAMP[3].ev.length'),4,'the original late Turkish raid remains, with two added objective-driven events');
 c('cmpTick(20)');
 assert.equal(c('!!cmp.e[2]'),false,'no enemy trackers spawn before a genuine delivery');
 assert.equal(c("S.us.filter(u=>u.campaignPatrol==='relic-road').length"),0);
 c("globalThis.sanctuary=put(0,'monastery',tcOf(0).x+7,tcOf(0).y+4)");
 assert.ok(c('!!sanctuary'),'a real completed friendly Monastery must exist');
 // Real Monks move relic objects as they walk home. Exercise that mutable
 // position explicitly; a delivered relic must count by ownership, not the
 // original site coordinates written in campaign state.
 c('S.rel[0].x=sanctuary.x+.5;S.rel[0].y=sanctuary.y+.5;S.rel[0].m=sanctuary;S.rel[0].c=null;cmpTick(1/30)');
 assert.equal(c('cmp.e[2]'),1,'an actual relic delivered to a completed Monastery triggers the pursuit');
 const ids=JSON.parse(c('JSON.stringify(cmp.d.relicRoadHunterIds)'));
 assert.ok(ids.length>=2,'at least two physical Turkish trackers must be spawned');
 assert.equal(new Set(ids).size,ids.length,'each enemy tracker must retain its own real identity');
 assert.ok(c("S.us.some(u=>u.campaignPatrol==='relic-road'&&u.hp>0&&u.o==='a'&&u.tg?.k==='mon')"),
  'the enemy trackers must actually target a living player Monk');
 assert.equal(c('campaignRelicRoadHuntersDefeated()'),false,'the live trackers prevent the optional reward');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c('JSON.stringify(cmp.d.relicRoadHunterIds)'),JSON.stringify(ids),'tracker IDs survive save/load');
 assert.equal(c('campaignRelicRoadDeposited()'),1,'the moved relic is recognized as delivered after save/load drops its optional entity tag');
 assert.ok(c('Math.hypot(S.rel[0].x-cmp.d.relicRoadShrines[0][0],S.rel[0].y-cmp.d.relicRoadShrines[0][1])>5'),
  'relic movement must not be mistaken for a different relic after a reload');
 assert.equal(c('cmp.d.relicRoadShrines.length'),3,'all three original shrine coordinates remain saved');
 c('cmpTick(1)');
 assert.equal(c('JSON.stringify(cmp.d.relicRoadHunterIds)'),JSON.stringify(ids),'pursuit cannot re-spawn after a reload');
 assert.equal(c('S.over'),null,'a single deposited relic cannot win a three-relic mission');
});

test('Relic Road optional victory over actual trackers earns a one-shot living pilgrim escort',()=>{
 const c=mission(3);
 c("globalThis.sanctuary=put(0,'monastery',tcOf(0).x+7,tcOf(0).y+4)");
 assert.ok(c('!!sanctuary'));
 c('S.rel[0].m=sanctuary;cmpTick(1/30)');
 assert.ok(c('cmp.d.relicRoadHunterIds.length>=2'));
 const monks=c("aliveUnits(0,'mon').length"),soldiers=c("aliveUnits(0,'spear').length");
 const res=c('JSON.stringify(S.res[0])'),trained=c('S.pl.tr');
 // Killing an unrelated enemy Scout must not earn the royal pilgrim relief.
 c("S.us.filter(u=>u.t===1&&u.k==='scout'&&u.campaignPatrol!=='relic-road').forEach(u=>u.hp=0)");
 assert.equal(c('campaignRelicRoadHuntersDefeated()'),false);
 c("S.us.filter(u=>u.campaignPatrol==='relic-road').forEach(u=>u.hp=0);cmp.k=14;cmpTick(1/30)");
 assert.equal(c('cmp.d.trackers'),1,'the objective checks defeat of the actual named patrol');
 c('cmpTick(1/30)');
 assert.equal(c("aliveUnits(0,'mon').length"),monks+1,'a third real Monk is earned by protecting the road');
 assert.equal(c("aliveUnits(0,'spear').length"),soldiers+2,'two mortal spearmen join the escort');
 assert.equal(c('JSON.stringify(S.res[0])'),res,'the reward does not create player resources');
 assert.equal(c('S.pl.tr'),trained,'royal relief is not misrecorded as paid production');
 assert.equal(c('S.over'),null,'optional escort reward cannot bypass all three relics');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 c('cmpTick(1)');
 assert.equal(c("aliveUnits(0,'mon').length"),monks+1,'save/load does not duplicate the third Monk');
 assert.equal(c("aliveUnits(0,'spear').length"),soldiers+2,'save/load does not duplicate royal spearmen');
});
test('Kronburg flank Towers have genuine persistent identities and a timed pre-breach option',()=>{
 const c=mission(4);
 const ids=JSON.parse(c('JSON.stringify(cmp.d.kronburgFlankIds)'));
 assert.equal(ids.length,2,'both real enemy towers must be authored');
 assert.equal(new Set(ids).size,2,'two distinct towers make up the flank line');
 assert.equal(c("S.bs.filter(b=>b&&b.t===1&&b.k==='tower'&&b.hp>0&&b.campaignFlank==='kronburg').length"),2);
 assert.deepEqual(JSON.parse(c('JSON.stringify(CAMP[4].goals.map(g=>[g.id,!!g.optional]))')),
  [['c',false],['t',false],['flanks',true]],'Castle and Town Centre remain mandatory');
 assert.equal(c('campaignKronburgFlanksSilenced()'),false);
 c('S.bs.find(b=>b.netId===cmp.d.kronburgFlankIds[0]).hp=0;cmp.k=14;cmpTick(1/30)');
 assert.equal(c('!!cmp.d.flanks'),false,'one tower cannot disrupt the flank signal');
 c('S.bs.find(b=>b.netId===cmp.d.kronburgFlankIds[1]).hp=0;cmp.k=14;cmpTick(1/30)');
 assert.equal(c('cmp.d.flanks'),1,'both real towers destroyed before breach earn the option');
 const before=c("aliveUnits(1).filter(u=>u.k==='spear'||u.k==='arc'||u.k==='scout').length");
 c("S.bs.find(b=>b.t===1&&b.k==='castle'&&b.hp>0).hp*=.6;cmpTick(1/30)");
 assert.equal(c('cmp.e[2]'),1,'a real damaged Castle launches its one-time garrison reaction');
 assert.equal(c("S.us.filter(u=>u.campaignPatrol==='kronburg-sortie'&&u.hp>0).length"),2,
  'clearing both flanks reduces the real sortie to two mortal spearmen');
 assert.equal(c("aliveUnits(1).filter(u=>u.k==='spear'||u.k==='arc'||u.k==='scout').length"),before+2);
 assert.ok(c("S.us.some(u=>u.campaignPatrol==='kronburg-sortie'&&u.o==='a'&&u.tg?.k==='ram')"),
  'the smaller defending force still targets real player rams with combat orders');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c('JSON.stringify(cmp.d.kronburgFlankIds)'),JSON.stringify(ids),'original flank identities survive reload');
 assert.equal(c('cmp.d.flanks'),1,'earned optional disruption persists');
 c('cmpTick(1)');
 assert.equal(c("S.us.filter(u=>u.campaignPatrol==='kronburg-sortie'&&u.hp>0).length"),2,
  'the Castle cannot respawn its reserve after loading');
});

test('Kronburg flanking objective cannot be forged by an unrelated rebuilt enemy Tower',()=>{
 const c=mission(4);
 const originals=JSON.parse(c('JSON.stringify(cmp.d.kronburgFlankIds)'));
 assert.equal(originals.length,2);
 c("globalThis.decoy=put(1,'tower',tcOf(1).x+12,tcOf(1).y-10)");
 assert.ok(c('!!decoy'),'a third ordinary enemy Tower can be placed on the same seeded battlefield');
 assert.ok(!originals.includes(c('decoy.netId')),'the third Tower must have its own identity');
 c('decoy.hp=0;cmp.k=14;cmpTick(1/30)');
 assert.equal(c('campaignKronburgFlanksDown()'),false,'destroying a decoy cannot silence the authored flank line');
 assert.equal(c('!!cmp.d.flanks'),false);
 c("S.bs.find(b=>b.netId===cmp.d.kronburgFlankIds[0]).hp=0;cmp.k=14;cmpTick(1/30)");
 assert.equal(c('campaignKronburgFlanksDown()'),false,'one actual outer Tower still stands');
 c("S.bs.find(b=>b.netId===cmp.d.kronburgFlankIds[1]).hp=0;cmp.k=14;cmpTick(1/30)");
 assert.equal(c('cmp.d.flanks'),1,'both original outer Towers, not any pair, earn the disruption');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c('JSON.stringify(cmp.d.kronburgFlankIds)'),JSON.stringify(originals),
  'the original Tower targets persist even after dead structures are compacted by saving');
 assert.equal(c('cmp.d.flanks'),1,'the completed flank disruption stays earned across reload');
});

test('Kronburg direct Castle rush provokes full mortal garrison, even if both towers fall later',()=>{
 const c=mission(4);
 c("S.bs.find(b=>b.t===1&&b.k==='castle'&&b.hp>0).hp*=.6;cmp.k=14;cmpTick(1/30)");
 assert.equal(c('cmp.e[2]'),1,'breaching a real Castle is the only counterattack trigger');
 assert.equal(c("S.us.filter(u=>u.campaignPatrol==='kronburg-sortie'&&u.hp>0).length"),6,
  'an intact flank line leaves six real spear, archer and scout defenders');
 assert.ok(c("S.us.filter(u=>u.campaignPatrol==='kronburg-sortie'&&u.k==='arc'&&u.hp>0).length")>=2,
  'the full reserve contains ranged defenders instead of a dummy strength counter');
 assert.ok(c("S.us.some(u=>u.campaignPatrol==='kronburg-sortie'&&u.o==='a'&&u.tg?.k==='ram')"),
  'the defenders truly attack the siege train');
 c("S.bs.filter(b=>b.t===1&&b.k==='tower'&&b.netId&&cmp.d.kronburgFlankIds.includes(b.netId)).forEach(b=>b.hp=0)");
 c('cmp.k=14;cmpTick(1/30)');
 assert.equal(c('!!cmp.d.flanks'),false,'tower sabotage after the Castle breach cannot retroactively weaken a sortie');
 assert.equal(c("S.us.filter(u=>u.campaignPatrol==='kronburg-sortie'&&u.hp>0).length"),6,
  'later tower destruction cannot undo enemies that physically spawned');
 assert.equal(c('S.over'),null,'neither the full reserve nor optional towers bypasses the Castle and Town Centre objectives');
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


test('Ashford forward Siege Workshop requires real completed construction near its enemy Castle',()=>{
 const c=mission(8);
 assert.equal(c("CAMP[8].goals.find(g=>g.id==='forwardcamp').optional"),true);
 assert.equal(c('campaignAshfordForwardSiegeCamp()'),null);
 const place=JSON.parse(c(`JSON.stringify((()=>{
  const h=tcOf(0),castle=S.bs.find(b=>b.t===1&&b.k==='castle'&&b.hp>0);
  const hx=h.x+h.s*.5,hy=h.y+h.s*.5,cx=castle.x+castle.s*.5,cy=castle.y+castle.s*.5;
  const len=Math.hypot(cx-hx,cy-hy),ux=(cx-hx)/len,uy=(cy-hy)/len;
  S.ex.fill(1);
  let site=null;
  for(const gap of [22,25,28,31,34])for(const side of [0,3,-3,6,-6,9,-9,12,-12]){
   const x=Math.round(cx-ux*gap-uy*side),y=Math.round(cy-uy*gap+ux*side);
   if(x>1&&y>1&&x+B.siege.s<W-1&&y+B.siege.s<H-1&&okPlace(0,'siege',x,y)){site={x,y};break}
   if(site)break;
  }
  return site;
 })())`));
 assert.ok(place,'the existing Ashford seed has a legally buildable forward siege site');
 // An unbuilt or destroyed workshop cannot earn the optional objective.
 assert.equal(c(`!!(globalThis.camp=addB(0,'siege',${place.x},${place.y},false))`),true);
 assert.equal(c('!!campaignAshfordForwardSiegeCamp()'),false);
 c('camp.hp=camp.mh;camp.done=true');
 assert.equal(c('campaignAshfordForwardSiegeCamp()===camp'),true);
 c('camp.t=1');assert.equal(c('!!campaignAshfordForwardSiegeCamp()'),false,'enemy Workshops do not count');
 c('camp.t=0;camp.hp=0');assert.equal(c('!!campaignAshfordForwardSiegeCamp()'),false,'ruins do not count');
 c('camp.hp=camp.mh');
 assert.equal(c('campaignAshfordForwardSiegeCamp()===camp'),true);
 c("S.bs.find(b=>b.t===1&&b.k==='castle'&&b.hp>0).hp=0");
 assert.equal(c('!!campaignAshfordForwardSiegeCamp()'),false,'the camp must be built while the target Castle still stands');
});

test('Ashford forward camp raises one physical, guard-ordered siege relief with no free victory',()=>{
 const c=mission(8);
 const trigger=c("CAMP[8].ev.findIndex(e=>e.do.toString().includes('campaignAshfordForwardSiegeRelief'))");
 assert.ok(trigger>=0);
 c('cmp.d.forwardcamp=1;cmpTick(1/30)');
 assert.equal(c('!!cmp.e['+trigger+']'),false,'a forged objective flag cannot create soldiers');
 c('cmp.d.forwardcamp=0');
 const site=JSON.parse(c(`JSON.stringify((()=>{
  const h=tcOf(0),castle=S.bs.find(b=>b.t===1&&b.k==='castle'&&b.hp>0);
  const hx=h.x+h.s*.5,hy=h.y+h.s*.5,cx=castle.x+castle.s*.5,cy=castle.y+castle.s*.5;
  const len=Math.hypot(cx-hx,cy-hy),ux=(cx-hx)/len,uy=(cy-hy)/len;
  S.ex.fill(1);
  for(const gap of [22,25,28,31,34])for(const side of [0,3,-3,6,-6,9,-9,12,-12]){
   const x=Math.round(cx-ux*gap-uy*side),y=Math.round(cy-uy*gap+ux*side);
   if(x>1&&y>1&&x+B.siege.s<W-1&&y+B.siege.s<H-1&&okPlace(0,'siege',x,y))return{x,y};
  }
  return null;
 })())`));
 assert.ok(site,'a real forward Siege Workshop must fit the original map');
 assert.equal(c(`!!(globalThis.camp=addB(0,'siege',${site.x},${site.y},true))`),true);
 assert.equal(c('campaignAshfordForwardSiegeCamp()===camp'),true);
 const before=JSON.parse(c("JSON.stringify({ram:aliveUnits(0,'ram').length,spear:aliveUnits(0,'spear').length,skirm:aliveUnits(0,'skirm').length,res:S.res[0],capital:tcOf(1).hp,castle:S.bs.find(b=>b.t===1&&b.k==='castle').hp})"));
 c('cmp.k=14;cmpTick(1)');
 assert.equal(c('cmp.d.forwardcamp'),1,'only a finished forward Workshop completes the optional goal');
 assert.equal(c('!!cmp.e['+trigger+']'),false,'the milestone is observed before the one-time relief event');
 c('cmpTick(1)');
 assert.equal(c('cmp.e['+trigger+']'),1);
 assert.deepEqual(JSON.parse(c("JSON.stringify([aliveUnits(0,'ram').length,aliveUnits(0,'spear').length,aliveUnits(0,'skirm').length])")),
 [before.ram+1,before.spear+2,before.skirm+2]);
 assert.equal(c("S.us.filter(u=>u.t===0&&u.hp>0&&u.o==='G'&&u.tg===camp&&['ram','spear','skirm'].includes(u.k)).length"),5,
 'new troops are mortal controllable units guarding the forward Siege Workshop');
 assert.equal(c('JSON.stringify(S.res[0])'),JSON.stringify(before.res),'reward never fabricates resources');
 assert.equal(c('tcOf(1).hp'),before.capital);
 assert.equal(c("S.bs.find(b=>b.t===1&&b.k==='castle').hp"),before.castle);
 assert.equal(c('S.over'),null,'the required Castle and Town Centre still need to fall');
 assert.equal(c('saveG()'),true);assert.equal(c('loadG()'),true);
 c('cmpTick(1)');
 assert.equal(c("S.us.filter(u=>u.t===0&&u.hp>0&&u.o==='G'&&u.tg===campaignAshfordForwardSiegeCamp()&&['ram','spear','skirm'].includes(u.k)).length"),5,
 'reloading cannot re-award the same siege detachment');
});


test('Last Crown royal standard requires a genuine forward Outpost and three living defenders; its escort is one-shot',()=>{
 const c=mission(5);
 assert.equal(c("CAMP[5].goals.find(g=>g.id==='royalstandard').optional"),true);
 const event=c("CAMP[5].ev.findIndex(e=>e.do.toString().includes('campaignLastCrownRoyalGuard'))");
 assert.ok(event>=0);
 assert.equal(c('campaignLastCrownRoyalStandardReady()'),false);
 const before=c("aliveUnits(0,'spear').length+aliveUnits(0,'xbow').length");
 const enemyKing=c("aliveUnits(1,'king').length"),playerKing=c("aliveUnits(0,'king').length");
 const resources=c('JSON.stringify(S.res[0])'),enemyTC=c('tcOf(1).hp');
 // Forged milestones cannot conjure reinforcements without the actual defense.
 c('cmp.d.royalstandard=1;cmpTick(1/30)');
 assert.equal(c('!!cmp.e['+event+']'),false);
 c('cmp.d.royalstandard=0');
 // A completed home-base Outpost is real but does not defend the forward road.
 c("globalThis.homePost=put(0,'outpost',tcOf(0).x+5,tcOf(0).y+5)");
 assert.equal(c('campaignLastCrownRoyalStandardReady()'),false);
 // Find a buildable, reachable location ahead of the player, using the same
 // world placement/collision rules as a finished, player-owned Outpost.
 const banner=JSON.parse(c(`JSON.stringify((()=>{
  const h=tcOf(0),e=tcOf(1),hx=h.x+h.s*.5,hy=h.y+h.s*.5,
   dx=e.x+e.s*.5-hx,dy=e.y+e.s*.5-hy,d=Math.hypot(dx,dy);
  const villager=aliveUnits(0,'vil')[0];
  for(const forward of [24,28,32,36,20,40])for(const off of [0,-4,4,-8,8]){
   const x=Math.floor(hx+dx/d*forward-dy/d*off),
    y=Math.floor(hy+dy/d*forward+dx/d*off);
   if(!okPlace(0,'outpost',x,y)||!path(villager,gp(x+.5,y+.5,1.5)))continue;
   const b=addB(0,'outpost',x,y,true);
   if(campaignLastCrownRoyalStandard()===b)return {id:b.netId,x:b.x,y:b.y};
  }
  return null;
 })())`));
 assert.ok(banner,'a legitimate forward Outpost site exists in the seeded mission');
 assert.equal(c('campaignLastCrownRoyalStandardReady()'),false,'construction alone does not earn royal soldiers');
 const defenders=JSON.parse(c(`JSON.stringify((()=>{
  const b=campaignLastCrownRoyalStandard(),soldiers=[],v=aliveUnits(0,'vil')[0];
  for(let radius=2;radius<=9&&soldiers.length<3;radius++)
   for(let dy=-radius;dy<=radius&&soldiers.length<3;dy++)
    for(let dx=-radius;dx<=radius&&soldiers.length<3;dx++){
     const x=b.x+(b.s>>1)+dx,y=b.y+(b.s>>1)+dy;
     if(x<2||y<2||x>=W-2||y>=H-2||Math.hypot(x+.5-b.x-b.s*.5,y+.5-b.y-b.s*.5)>9)continue;
     const i=y*W+x;
     if(S.g[i]||S.wt[i]===1||S.nd[i]||
       S.us.some(u=>u.hp>0&&!u.ld&&Math.hypot(u.x-x-.5,u.y-y-.5)<1.2)||
       !path(v,gp(x+.5,y+.5,.8)))continue;
     const u=addU(0,'spear',x+.5,y+.5);
     soldiers.push(u.netId);
    }
  return soldiers;
 })())`));
 assert.equal(defenders.length,3,'three real soldiers can reach and defend the banner');
 assert.equal(c('campaignLastCrownRoyalStandardReady()'),true);
 c('cmp.k=14;cmpTick(1/30)');
 assert.equal(c('cmp.d.royalstandard'),1);
 assert.equal(c('!!cmp.e['+event+']'),false,'reinforcements arrive only after the objective has been earned');
 c('cmpTick(1/30)');
 assert.equal(c('cmp.e['+event+']'),1);
 assert.equal(c("aliveUnits(0,'spear').length+aliveUnits(0,'xbow').length"),before+3+5);
 assert.equal(c("S.us.filter(u=>u.t===0&&u.hp>0&&['spear','xbow'].includes(u.k)&&u.o==='G'&&u.tg?.netId==="+JSON.stringify(banner.id)+").length"),5,'the entire contingent guards the actual banner');
 assert.equal(c('JSON.stringify(S.res[0])'),resources,'earned units do not change player resources');
 assert.equal(c('tcOf(1).hp'),enemyTC,'no scripted damage to enemy capital');
 assert.equal(c("aliveUnits(1,'king').length"),enemyKing);
 assert.equal(c("aliveUnits(0,'king').length"),playerKing);
 assert.equal(c('S.over'),null,'the optional goal never wins Regicide');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 c('cmpTick(1/30)');
 assert.equal(c("aliveUnits(0,'spear').length+aliveUnits(0,'xbow').length"),before+3+5,
  'reloading cannot spawn a second guard contingent');
});
test('Ashford capital siege requires the real Castle as well as the rival Town Centre',()=>{
 const c=mission(8);
 assert.equal(c("CAMP[8].goals.find(g=>g.id==='castle').optional"),undefined,'the Castle is a mandatory siege objective');
 assert.equal(c("S.bs.filter(b=>b.t===1&&b.k==='castle'&&b.hp>0).length"),1,'the enemy really begins with a living Castle');
 assert.equal(c("S.bs.filter(b=>b.t===1&&b.k==='tower'&&b.campaignSignal==='ashford'&&b.hp>0).length"),2,'two actual enemy towers can be disabled');
 assert.equal(c("CAMP[8].goals.find(g=>g.id==='tc').ok()"),false);
 assert.equal(c("CAMP[8].goals.find(g=>g.id==='castle').ok()"),false);
 // Taking the capital alone can no longer bypass its fortified Castle.
 c('tcOf(1).hp=0;cmp.k=14;cmpTick(5)');
 assert.equal(c('cmp.d.tc'),1);
 assert.equal(c('!!cmp.d.castle'),false);
 assert.equal(c('S.over'),null,'an intact hostile Castle prevents premature victory');
 c("S.bs.find(b=>b.t===1&&b.k==='castle'&&b.hp>0).hp=0;cmp.k=29;cmpTick(1)");
 assert.equal(c('cmp.d.castle'),1);
 assert.equal(c('S.over'),'win','only destruction of both authentic enemy buildings wins the capital siege');
});

test('Ashford signal towers earn one physical siege escort and cannot be forged by arbitrary buildings',()=>{
 const c=mission(8);
 assert.equal(c("CAMP[8].goals.find(g=>g.id==='signals').optional"),true);
 const ids=JSON.parse(c("JSON.stringify(cmp.d.ashfordSignalIds)"));
 assert.equal(ids.length,2,'the two originally placed hostile signal towers have persistent unique identities');
 assert.equal(new Set(ids).size,2);
 const first=c("CAMP[8].ev.findIndex(e=>e.do.toString().includes('campaignAshfordSignalRelief'))");
 assert.ok(first>=0);
 const start=c("aliveUnits(0,'spear').length+aliveUnits(0,'arc').length");
 const resources=c('JSON.stringify(S.res[0])');
 const capital=c('tcOf(1).hp');
 assert.equal(c('campaignAshfordSignalsDisabled()'),false);
 c("S.bs.find(b=>b.netId===cmp.d.ashfordSignalIds[0]).hp=0;cmp.k=14;cmpTick(5)");
 assert.equal(c('campaignAshfordSignalsDisabled()'),false,'destroying one tower is not enough');
 assert.equal(c('!!cmp.d.signals'),false,'one real signal tower keeps the optional objective open');
 c("S.bs.find(b=>b.netId===cmp.d.ashfordSignalIds[1]).hp=0;cmp.k=29;cmpTick(1)");
 assert.equal(c('cmp.d.signals'),1,'only the two identified real towers satisfy the objective');
 assert.equal(c('!!cmp.e['+first+']'),false,'the reward waits for its objective trigger');
 c('cmpTick(1)');
 assert.equal(c('cmp.e['+first+']'),1);
 assert.equal(c("aliveUnits(0,'spear').length+aliveUnits(0,'arc').length"),start+6,'six actual mortal troops join the siege');
 assert.equal(c("S.us.filter(u=>u&&u.t===0&&u.k==='spear'&&u.hp>0&&u.o==='G'&&u.tg?.k==='ram').length"),3,'fresh spearmen guard a real Battering Ram');
 assert.equal(c('JSON.stringify(S.res[0])'),resources,'story reinforcements do not fabricate resources');
 assert.equal(c('tcOf(1).hp'),capital,'the optional signal reward never damages the enemy for free');
 assert.equal(c('S.over'),null,'optional towers cannot replace the Castle and Town Centre');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c('JSON.stringify(cmp.d.ashfordSignalIds)'),JSON.stringify(ids),'tower IDs persist after save/reload');
 c('cmpTick(1)');
 assert.equal(c("aliveUnits(0,'spear').length+aliveUnits(0,'arc').length"),start+6,'reward cannot duplicate after reloading');
});

test('the fall of Ashford Castle provokes real, one-shot defenders attacking the siege',()=>{
 const c=mission(8);
 const first=c("CAMP[8].ev.findIndex(e=>e.do.toString().includes('campaignAshfordCastleSortie'))");
 assert.ok(first>=0);
 const enemyBefore=c("aliveUnits(1,'spear').length+aliveUnits(1,'arc').length");
 const castle=c("S.bs.find(b=>b.t===1&&b.k==='castle'&&b.hp>0).netId");
 assert.ok(castle);
 c("S.bs.find(b=>b.t===1&&b.k==='castle'&&b.hp>0).hp=0;cmp.k=14;cmpTick(5)");
 assert.equal(c('cmp.d.castle'),1);
 assert.equal(c('S.over'),null,'the Castle breach does not bypass the remaining enemy Town Centre');
 c('cmpTick(1)');
 assert.equal(c('cmp.e['+first+']'),1);
 assert.equal(c("aliveUnits(1,'spear').length+aliveUnits(1,'arc').length"),enemyBefore+6,'real defenders sortie after the authentic Castle falls');
 assert.ok(c("S.us.some(u=>u.t===1&&u.k==='spear'&&u.hp>0&&u.o==='a'&&u.tg?.t===0)"),'the sortie targets living player soldiers or siege engines');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 c('cmpTick(1)');
 assert.equal(c("aliveUnits(1,'spear').length+aliveUnits(1,'arc').length"),enemyBefore+6,'the Castle sortie does not respawn after save/load');
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
 assert.equal(c("campaignFrontierRaidTarget('late')===post"),true,'the final raid must prefer the living forward Outpost over unrelated farms');
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

test('Feudal Frontier prioritizes living Towers and Market and never consumes an unearned Outpost relief',()=>{
 const c=mission(2);
 assert.equal(c("campaignFrontierRaidTarget('first')"),null);
 assert.equal(c("campaignFrontierRaidTarget('market')"),null);
 // An imported or stale save flag must not spend the one-time royal reward
 // unless a finished, living forward Outpost actually exists.
 c('cmp.d.frontierwatch=1;cmpTick(1/30)');
 assert.equal(c('!!cmp.e[5]'),false,'a missing Outpost cannot consume the reward event');
 assert.equal(c("aliveUnits(0,'spear').length+aliveUnits(0,'skirm').length"),0,'a fake milestone never creates soldiers');
 c('cmp.d.frontierwatch=0;S.age[0]=1');
 assert.equal(c("!!(globalThis.first=put(0,'tower',tcOf(0).x+8,tcOf(0).y+5))"),true);
 assert.equal(c("campaignFrontierRaidTarget('first')===first"),true,'first raid prioritizes a physical finished Tower');
 assert.equal(c("!!(globalThis.market=put(0,'market',tcOf(0).x+7,tcOf(0).y-8))"),true);
 assert.equal(c("campaignFrontierRaidTarget('market')===market"),true,'second raid prioritizes the actual trading hub');
 assert.equal(c("campaignFrontierRaidTarget('late')===first"),true,'final raid presses an existing Tower when no Outpost is ready');
 c('first.hp=0');
 assert.equal(c("campaignFrontierRaidTarget('first')"),null,'dead Towers cannot be selected as strategic raid targets');
 assert.equal(c("campaignFrontierRaidTarget('late')===market"),true,'final raid falls back to the living Market after the Tower falls');
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
 assert.equal(c("CAMP[11].ev["+first+"].at"),55);
 assert.equal(c("CAMP[11].goals.find(g=>g.id==='trailpost').optional"),true);
 assert.ok(c("aliveUnits(0,'mon').length")>=2,'two genuine player Monks begin the mission');
 assert.equal(c("cb('monastery')"),1,'the mission briefing reflects the starting Monastery');
 assert.equal(c('S.rel.length'),2,'only the two authored pilgrim relics may exist; generated map loot must not bypass the trail');
 assert.equal(c("S.rel.filter(q=>q.rl&&!q.c&&!q.m).length"),2,'both mission relics begin on the map, unclaimed');
 assert.equal(c("S.rel.every(q=>!!path(aliveUnits(0,'mon')[0],gp(q.x,q.y,.8)))"),true,
 'both authored relic sites must be navigable by a real Monk, not merely drawn on dry terrain');
 assert.equal(c("S.us.filter(u=>u.campaignPatrol==='reliquary'&&u.t===1&&u.hp>0).length"),2,
 'each relic starts guarded by one real enemy Scout Cavalry, not a text-only threat');
 assert.equal(c("S.us.filter(u=>u.campaignPatrol==='reliquary').every(u=>u.k==='scout'&&u.o==='p'&&u.pt?.a?.length===2&&u.pt?.b?.length===2)"),true,
 'the two enemy scouts have ordinary movable patrol waypoints');
 assert.equal(c("S.us.filter(u=>u.campaignPatrol==='reliquary').every(u=>!!path(u,gp(u.pt.b[0],u.pt.b[1],1)))"),true,
 'both scouts can physically reach their guarded relics with normal land movement');
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
 assert.equal(c("S.us.filter(u=>u.campaignPatrol==='reliquary'&&u.t===1&&u.hp>0&&u.pt?.b?.length===2).length"),2,
 'both genuine patrol identities and waypoint routes survive save/reload');
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

