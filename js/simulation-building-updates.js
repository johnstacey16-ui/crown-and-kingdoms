/* Building ticks: garrison healing, defensive fire, research and training.
 * Rally dispatch is owned by simulation-building-production.js. */
function upB(b,dt){if(!b||!b.done||b.hp<=0||!Number.isFinite(dt)||dt<=0)return;
if(b.cg?.length)healGarrison(b,dt);
 if(b.k==='tc'&&S.civ?.[b.t]===32&&!b.lithFoodGranted){
  S.res[b.t].f+=100;b.lithFoodGranted=true;
 }
if(b.k==='mill'&&S.civ?.[b.t]===39&&Number.isInteger(b.livestockCount)&&b.livestockCount>0)
 S.res[b.t].f+=Math.min(5,b.livestockCount)*.08*dt;
if(b.k==='feitoria'&&S.civ?.[b.t]===26){
 // A constructed Portuguese trade outpost produces modest resources
 // continuously. No fabricated villager/entity or local timer is needed.
 S.res[b.t].f+=.30*dt;S.res[b.t].w+=.30*dt;
 S.res[b.t].g+=.20*dt;S.res[b.t].s+=.10*dt;
}
if(b.k==='monastery'||b.k==='fchurch'){
 // Hunnic Atheism halves relic income of hostile kingdoms, not allies.
 const atheist=S.civ?.some((id,team)=>id===17&&S.tech?.[team]?.ut17p&&isHostile(team,b.t));
 const relics=S.rel.filter(q=>q.m===b).length;
 S.res[b.t].g+=relics*.5*(atheist?.5:1)*(typeof civilizationTeamBonusFactor==='function'?civilizationTeamBonusFactor(b.t,'relicGold'):1)*dt;
 const burgTeam=S.civ?.some((id,t)=>id===33&&(t===b.t||diplomacyRelation(t,b.t)==='ally'));
 if(burgTeam)S.res[b.t].f+=relics*.5*dt;
}// Celtic Stronghold heals allied infantry near a living Castle at 30 HP/min.
// Scan once per second per Castle, not at the full simulation tick rate.
if(b.k==='castle'&&S.civ?.[b.t]===6&&S.tech[b.t]?.ut6p){
 b.strongholdHealCd=(b.strongholdHealCd||0)-dt;
 if(b.strongholdHealCd<=0){
  b.strongholdHealCd=1;
  const cx=b.x+b.s/2,cy=b.y+b.s/2;
  for(const u of S.us)if(u&&u.hp>0&&!u.ld&&INFARM.has(u.k)&&
   (u.t===b.t||diplomacyRelation(u.t,b.t)==='ally')&&
   Math.hypot(u.x-cx,u.y-cy)<=7)u.hp=Math.min(mhp(u),u.hp+.5);
 }
}
const ak=B[b.k].atk;
 const churchVillagers=b.k==='fchurch'?(b.cg||[]).filter(u=>u?.hp>0&&u.k==='vil'&&u.ld===b).length:0;
 const churchRelics=b.k==='fchurch'?(S.rel||[]).filter(q=>q?.m===b).length:0;
 if(ak&&(b.k!=='fchurch'||churchVillagers+churchRelics>0)){b.cd=(b.cd||0)-dt;if(b.cd<=0){const o={k:ak,t:b.t,x:b.x+b.s/2,y:b.y+b.s/2},e=foe(o,attackRange(o),b);if(e&&!e.q){const teutonInfantry=b.k==='castle'&&S.civ?.[b.t]===5&&S.tech[b.t]?.ut5;const na=b.k==='fchurch'?(churchVillagers?1:0)+Math.min(5,churchRelics):
  1+(S.tech[b.t].ys?1:0)+Math.min(8,(b.cg||[]).filter(c=>U[c.k]?.dmg>3||(teutonInfantry&&INFARM.has(c.k))).length);for(let q=0;q<na;q++)launchProjectile(o,e);sfx('bow',o.x,o.y);b.cd=U[ak].cd/(S.civ?.[b.t]===6&&S.tech[b.t]?.ut6p&&(b.k==='castle'||b.k==='tower')?1.33:1)}}}
if(b.rs){b.rs.t-=dt*(b.k==='bar'&&S.tech[b.t]?.perfusion?2:1)*(typeof civilizationTeamWorkRate==='function'?civilizationTeamWorkRate(b,'research',b.rs.k):1);if(b.rs.t<=0){const k=b.rs.k;b.rs=null;if(k==='age'){S.age[b.t]++;
 if(S.civ?.[b.t]===37)S.res[b.t].w+=200;
 if(S.civ?.[b.t]===38&&typeof spawnPos==='function'&&typeof addU==='function'&&
   typeof livePopulation==='function'&&typeof capOf==='function'){
  for(const tc of S.bs)if(tc&&tc.t===b.t&&tc.k==='tc'&&tc.done&&tc.hp>0){
   for(let i=0;i<2&&livePopulation(b.t)<capOf(b.t);i++){
    const slot=spawnPos(tc);if(!slot)break;
    addU(b.t,'vil',slot[0],slot[1]);
   }
  }
 }if(b.t===0){note(AG[S.age[0]].n+' reached!');rumble(500,.7,.7);{const tc0=S.bs.find(x=>x.t===0&&x.k==='tc');if(tc0)emit('spark',tc0.x+1.5,tc0.y+1.5,40,{s:4,vz:5,l:1.2,c:'#f2c14e',r:2.4})}if(b.t===0)sfx('age')}}else{const T0=S.tech[b.t],e=TE[k];T0[k]=1;if(['coll','plow','crop'].includes(k)){const add=k==='coll'?75:k==='plow'?125:175;for(const n of S.nodes)if(n.k==='f'&&n.fm&&n.t===b.t&&S.nd[n.y*W+n.x]===n)n.amt+=add}if(e.hpb){T0.hpb=T0.hpb||{};for(const q in e.hpb){T0.hpb[q]=(T0.hpb[q]||0)+e.hpb[q];for(const x of S.us)if(x.t===b.t&&x.k===q&&x.hp>0)x.hp+=e.hpb[q]}}if(k==='sanctity'&&S.civ?.[b.t]===36){
 T0.hpb=T0.hpb||{};T0.hpb.vil=(T0.hpb.vil||0)+15;
 for(const villager of S.us)if(villager.t===b.t&&villager.k==='vil'&&villager.hp>0)villager.hp+=15;
}if(e.atkb){T0.atkb=T0.atkb||{};for(const q in e.atkb)T0.atkb[q]=(T0.atkb[q]||0)+e.atkb[q]}if(k==='eliteRatha'&&S.civ?.[b.t]===38){
 T0.hpb=T0.hpb||{};T0.hpb.rathaM=(T0.hpb.rathaM||0)+20;
 T0.atkb=T0.atkb||{};T0.atkb.rathaM=(T0.atkb.rathaM||0)+2;
 for(const ratha of S.us)if(ratha.t===b.t&&ratha.k==='rathaM'&&ratha.hp>0)
  ratha.hp+=20;
}
if(k==='mas')for(const x of S.bs)if(x.t===b.t){x.mh=Math.round((x.mh||B[x.k].hp)*1.4);x.hp=Math.min(x.mh,Math.round(x.hp*1.4))}if(k==='fw')for(const x of S.bs)if(x.t===b.t&&(x.k==='wall'||x.k==='gate')){x.mh=Math.round((x.mh||B[x.k].hp)*1.8);x.hp=Math.min(x.mh,Math.round(x.hp*1.8))}if(e.fx)e.fx(b.t);if(b.t===0){note(e.n+' researched');sfx('tech')}}}}
if(!b.q.length)return;const q=b.q[0];if(!q||!U[q.k]||!Number.isFinite(q.t)){b.q.shift();return}if(!Number.isFinite(dt)||dt<=0)return;q.t-=dt*trainRate(b,q.k);if(q.t<=0){if(livePopulation(b.t)>=capOf(b.t)){q.t=0;return}const p=spawnPos(b);if(!p){q.t=0;return}b.q.shift();if(b.t===0)sfx('train',b.x+b.s/2,b.y+b.s/2);const nu=addU(b.t,q.k,p[0],p[1]);if(q.k==='cart'||q.k==='cog')nu.tradeFromKey=[b.t,b.k,b.x,b.y].join(':');if(b.rally)applyProductionRally(nu,b.rally,b);if(b.t===0){S.pl.tr++;note(unitName(q.k,b.t)+' trained')}}}
