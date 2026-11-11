/* Crown & Kingdoms — military armour-class and research damage bonuses.
 * Loaded after configuration/state and before the live simulation. The
 * original declarations remain global to preserve classic script semantics.
 */

/* Shared max-unit-health lookup, relocated unchanged from simulation.js. */
const mhp=u=>U[u.k].hp+(S.tech[u.t].hpb&&S.tech[u.t].hpb[u.k]||0);

// The spear-line's cavalry/camel/elephant bonuses increase at each upgrade.
// These are armor-class approximations for the currently modelled unit kinds.
// Other class interactions (ships, shock infantry and regional bonuses) stay
// tracked separately in the AoE2 DE parity roadmap.
const SPEAR_CAVALRY=new Set(['scout','knight','cata','boyar','tarkan','huszar','mgd','conq','wagon','cavarch','arambai','konnik','keshik','steppe','kipchak','flamecamel','leitis','coust']);
const SPEAR_CAMELS=new Set(['camel','mamel']);
const SPEAR_ELEPHANTS=new Set(['ele','eled','batele']);
function spearLineBonus(a,t){
 const key=t.k,alias=U[key]?.lk,tech=S.tech[a.t]||{};
 const tier=tech.halb?2:tech.pike?1:0;
 const bohemian=value=>S.civ?.[a.t]===36?Math.round(value*1.25):value;
 if(SPEAR_ELEPHANTS.has(key)||SPEAR_ELEPHANTS.has(alias))return bohemian([15,25,28][tier]);
 if(SPEAR_CAMELS.has(key)||SPEAR_CAMELS.has(alias))return bohemian([12,18,26][tier]);
 if(SPEAR_CAVALRY.has(key)||SPEAR_CAVALRY.has(alias)){
  const elite=typeof eliteUniqueUnitUpgrade==='function'?eliteUniqueUnitUpgrade(key,t.t):null;
  return bohemian(Math.max(0,[15,22,32][tier]-(elite?.cavalryArmor||0)));
 }
 return bohemian(U.spear.bn?.[key]||U.spear.bn?.[alias]||0);
}
// Counter bonuses are attached to AoE2 armour classes, not broadly to
// villagers, siege and all ranged units. The compact roster still needs a
// complete class table (especially regional unique units) in a later audit.
const SKIRM_ARCHER_KINDS=new Set(['arc','xbow','lbow','skirm','genoa','plumed','chuko','rattan']);
const SKIRM_CAV_ARCHER_KINDS=new Set(['mgd','eled','wagon','cavarch','arambai','kipchak']);
// Pinned Camel and Heavy Camel combat bonuses share the existing cavalry classes.
const CAMEL_CAVALRY=new Set(['scout','knight','cata','boyar','tarkan','huszar','mgd','conq','wagon','ele','eled','cavarch','arambai','batele','konnik','keshik','steppe','kipchak','flamecamel','leitis','coust']);
const CAMEL_CLASS=new Set(['camel','mamel']);
function camelLineBonus(a,t){
 const key=t.k,alias=U[key]?.lk,heavy=!!S.tech[a.t]?.hcamel;
 if(CAMEL_CLASS.has(key)||CAMEL_CLASS.has(alias))return heavy?9:5;
 if(CAMEL_CAVALRY.has(key)||CAMEL_CAVALRY.has(alias)){
  const elite=typeof eliteUniqueUnitUpgrade==='function'?eliteUniqueUnitUpgrade(key,t.t):null;
  return Math.max(0,(heavy?18:9)-(elite?.cavalryArmor||0));
 }
 return U.camel.bn?.[key]||U.camel.bn?.[alias]||0;
}
function scoutLineBonus(a,t){
 return t.k==='mon'?(a.k==='winged'||S.tech[a.t]?.huss?12:S.tech[a.t]?.lcav?10:6):0;
}
function skirmisherBonus(a,t){
 const tech=S.tech[a.t]||{},elite=!!tech.elsk,k=t.k;
 if(k==='spear')return elite?4:3;
 if(SKIRM_ARCHER_KINDS.has(k))return elite?4:3;
 if(SKIRM_CAV_ARCHER_KINDS.has(k))return elite?2:0;
 if(k==='mamel')return 2;
 return 0;
}
// Source-backed Blacksmith melee bonuses: Forging +1, Iron Casting +1,
// Blast Furnace +2. Saved games from the current rules keep these flags.
function meleeResearchAttackBonus(tech){
 return (tech.forging?1:0)+(tech.ironCasting?1:0)+(tech.blastFurnace?2:0);
}

// One read-only armour calculation for damage resolution and unit inspection.
// Siege damage retains its existing melee-armour treatment.
function combatArmor(t,cls){
 // Combat helpers are also run in isolated deterministic damage tests.
 const elite=typeof eliteUniqueUnitUpgrade==='function'?eliteUniqueUnitUpgrade(t.k,t.t):null;
 const ta=S.tech[t.t]||{},ib=(INFARM.has(t.k)?((ta.armI?1:0)+(ta.armI2?1:0)+(ta.armI3?(cls==='p'?2:1):0)):0)+(ARCHARM.has(t.k)?((ta.armR?1:0)+(ta.armR2?1:0)+(ta.armR3?(cls==='p'?2:1):0)):0)+(CAVARM.has(t.k)?((ta.armC?1:0)+(ta.armC2?1:0)+(ta.armC3?(cls==='p'?2:1):0)):0);
 // Ironclad grants the Teutons' siege weapons +4 melee armour. This combat
 // model resolves siege-class hits against melee armour as well; pierce armour
 // is unchanged. Gate on the researched technology and real civilization,
 // never on a unit-supplied flag or a forged foreign team's research ledger.
 const bengaliMonk=S.civ?.[t.t]===38&&t.k==='mon'?3:0;
 const gurjaraGuard=S.civ?.[t.t]===39&&ta.ut39p&&cls==='m'&&
  ['camel','camelscout','eled'].includes(t.k)?4:0;
 const incaShield=t.k==='kamayuk'&&S.civ?.[t.t]===21&&ta.ut21p?(cls==='p'?2:1):0;
 const lastKhansArmor=(S.civ?.[t.t]===29&&ta.ut29p&&t.k==='mil'&&cls!=='p'?3:0)+
  (S.civ?.[t.t]===30&&ta.ut30&&['scout','steppe','cavarch','kipchak'].includes(t.k)?1:0);
 const regionalArmor=(S.civ?.[t.t]===26&&U[t.k]?.sh&&ta.ut26?1:0)+
  (S.civ?.[t.t]===27&&t.k==='batele'?(ta.ut27p?2:1):0);
 const lithShields=S.civ?.[t.t]===32&&ta.ut32p&&(t.k==='spear'||t.k==='skirm')&&cls==='p'?2:0;
 const sicilianHauberk=S.civ?.[t.t]===34&&ta.ut34p&&t.k==='knight'?(cls==='p'?2:1):0;
 const ironclad=cls!=='p'&&S.civ?.[t.t]===5&&ta.ut5p&&
  (t.k==='ram'||t.k==='mang'||t.k==='scor'||t.k==='bomb'||t.k==='treb')?4:0;
 const romanInfantryArmor=S.civ?.[t.t]===40&&INFARM.has(t.k)?ib:0;
 const romanGalleyArmor=S.civ?.[t.t]===40&&t.k==='gal'?1+(ta.galleon?1:0):0;
 const armor=t.s?((cls==='p'?8:2)+(ta.arch?(cls==='s'?3:1):0)):cls==='p'?(PRA[t.k]||0)+ib+(t.k==='knight'&&ta.pala?1:0)+(t.k==='skirm'&&ta.elsk?1:0)+(elite?.armor?.p||0)+incaShield+regionalArmor+lastKhansArmor+lithShields+sicilianHauberk+(t.k==='turtle'&&ta.eliteTurtle?5:0):(MA[t.k]||0)+ib+(t.k==='mil'&&ta.longs?1:0)+(elite?.armor?.m||0)+ironclad+incaShield+regionalArmor+lastKhansArmor+lithShields+sicilianHauberk+bengaliMonk+gurjaraGuard+(t.k==='turtle'&&ta.eliteTurtle?1:0);
 const strip=!t.s&&Number.isInteger(t.obuchArmorShred)?Math.max(0,Math.min(10,t.obuchArmorShred)):0;
 return t.s?armor:armor+romanInfantryArmor+romanGalleyArmor-Math.min(Math.max(0,armor+romanInfantryArmor+romanGalleyArmor),strip);
}

// Damage resolution and destruction; armour is shared with the HUD.
// A non-serializable private marker prevents saved/network-provided attacker
// properties from pretending their ordinary hits are armour-piercing trample.
const CK_TRAMPLE_DAMAGE=Symbol('ck.trample');
function romanChargeDamage(a){
 if(!a||S.civ?.[a.t]!==40||!S.tech?.[a.t]?.ut40p||
  !['mil','legionary','knight','centurion'].includes(a.k)||!S.us.includes(a)||
  !Number.isFinite(a.romanChargeReadyAt)||!Number.isFinite(S.t)||S.t<a.romanChargeReadyAt)
  return 0;
 return 5;
}
// Count living Monasteries holding real relics. Enemy and destroyed relic
// buildings cannot contribute the current-version Lithuanian cavalry bonus.
function lithuanianRelicAttack(a){
 if(S.civ?.[a.t]!==32||!['knight','leitis'].includes(a.k))return 0;
 return Math.min(4,S.rel.filter(r=>r.m&&r.m.t===a.t&&r.m.k==='monastery'&&
  r.m.hp>0&&r.m.done).length);
}
function burgundianChargeDamage(a){
 if(a.k!=='coust'||S.civ?.[a.t]!==33||!S.us.includes(a))return 0;
 return Number.isFinite(a.chargeReadyAt)&&S.t>=a.chargeReadyAt?
  (S.tech[a.t]?.eliteCoustillier?30:25):0;
}
/* A wagon must actually stand between a ranged attacker and its protected
 * ally. Proximity alone is not enough, and enemy/foreign wagons do not help. */
function hussiteWagonCover(a,t){
 if(!a||!t||t.s||!S.us.includes(t)||!Number.isFinite(a.x)||!Number.isFinite(a.y)||
   !Number.isFinite(t.x)||!Number.isFinite(t.y)||!(U[a.k]?.rng>2))return false;
 const dx=t.x-a.x,dy=t.y-a.y,dist2=dx*dx+dy*dy;
 if(dist2<=0)return false;
 for(const wagon of S.us)if(wagon&&wagon!==t&&wagon.k==='husswagon'&&
    wagon.t===t.t&&S.civ?.[wagon.t]===36&&wagon.hp>0&&!wagon.ld){
  const wx=wagon.x-a.x,wy=wagon.y-a.y,projection=(wx*dx+wy*dy)/dist2;
  const sideways=Math.abs(wx*dy-wy*dx)/Math.sqrt(dist2);
  if(projection>.1&&projection<.95&&sideways<=1.2&&
     Math.hypot(wagon.x-t.x,wagon.y-t.y)<=4)return true;
 }
 return false;
}
function urumiChargeDamage(a){if(a?.k!=='urumi'||S.civ?.[a.t]!==37||!S.us.includes(a)||!Number.isFinite(S.t)||!Number.isFinite(a.urumiReadyAt)||S.t<a.urumiReadyAt)return 0;return 6+(S.tech?.[a.t]?.eliteUrumi?2:0)}
/* Counter damage is evaluated after each civ's live age and alliances.
 * Only the bonus component is changed; ordinary attacks remain unchanged. */
function chakramPierceTargets(a,t){
 if(a?.k!=='chakram'||S.civ?.[a.t]!==39||!t||t.s||!S.us.includes(t))return [];
 const origin=S.us.includes(a)?a:S.us.find(u=>u&&u.netId===a.sourceNetId&&
    u.k==='chakram'&&u.t===a.t&&u.hp>0);
 if(!origin)return [];
 const x=Number.isFinite(a.sx)?a.sx:origin.x,y=Number.isFinite(a.sy)?a.sy:origin.y,
  dx=t.x-x,dy=t.y-y,dist=dx*dx+dy*dy;
 if(dist<.1||!Number.isFinite(dist))return [];
 return S.us.filter(u=>u&&u!==origin&&u!==t&&u.hp>0&&!u.ld&&
   isHostile(a.t,u.t)&&Number.isFinite(u.x)&&Number.isFinite(u.y)&&
   ((u.x-x)*dx+(u.y-y)*dy)/dist>=.1&&
   ((u.x-x)*dx+(u.y-y)*dy)/dist<=1.35&&
   Math.abs((u.x-x)*dy-(u.y-y)*dx)/Math.sqrt(dist)<=.65).slice(0,3);
}
function factionCounterBonus(a,t,base){
 const bonus=Number.isFinite(base)?base:0;
 const age=Math.max(0,Math.min(3,S.age?.[a.t]||0));
 const mounted=S.civ?.[a.t]===39&&U[a.k]?.mt&&age>=1;
 const boosted=mounted?Math.round(bonus*(1+.1*(age+1))):bonus;
 const bengali=S.civ?.[t.t]===38&&['ele','eled','batele'].includes(t.k);
 return bengali?Math.round(boosted*.75):boosted;
}
function dmgT(a,t){if(!a||!t||!U[a.k]||(!t.s&&!U[t.k])||!Number.isFinite(t.hp)||t.hp<=0||t.ld||!S.tech[a.t]||!isHostile(a.t,t.t))return;const ak=U[a.k],tk=S.tech[a.t];
 if(t.k==='shrivamsha'&&S.civ?.[t.t]===39&&S.us.includes(t)&&ak.rng>2&&
   !a[CK_TRAMPLE_DAMAGE]&&(Number.isInteger(t.dodgeCharges)?t.dodgeCharges:5)>0){
  t.dodgeCharges=Math.max(0,(Number.isInteger(t.dodgeCharges)?t.dodgeCharges:5)-1);
  t.dodgeRechargeAt=Math.max(S.t+4,Number.isFinite(t.dodgeRechargeAt)?t.dodgeRechargeAt:0);
  return;
 }
 const charge=burgundianChargeDamage(a),urumiCharge=urumiChargeDamage(a),romanCharge=romanChargeDamage(a),bd=(ak.rng<2?meleeResearchAttackBonus(tk):arrowBonus(a))+((a.k==='scout'||a.k==='winged')&&(S.age?.[a.t]||0)>=1?2:0)+(!t.s&&(typeof factionCounterBonus==='function'?factionCounterBonus(a,t,(a.k==='spear'?spearLineBonus(a,t):a.k==='skirm'?skirmisherBonus(a,t):(a.k==='scout'||a.k==='winged')?scoutLineBonus(a,t):a.k==='camel'?camelLineBonus(a,t):(ak.bn&&(ak.bn[t.k]||ak.bn[U[t.k].lk])||0))):(a.k==='spear'?spearLineBonus(a,t):a.k==='skirm'?skirmisherBonus(a,t):(a.k==='scout'||a.k==='winged')?scoutLineBonus(a,t):a.k==='camel'?camelLineBonus(a,t):(ak.bn&&(ak.bn[t.k]||ak.bn[U[t.k].lk])||0))))+(t.s&&ak.bb||0)+(typeof civilizationUniqueUnitTargetBonus==='function'?civilizationUniqueUnitTargetBonus(a,t):0)+(t.s&&a.k==='ram'?(tk.siegeRam?65:tk.cappedRam?25:0):0)+(t.s&&ak.rng<2&&INFARM.has(a.k)&&tk.arson?2:0)+(tk.atkb&&tk.atkb[a.k]||0)+(S.civ?.[a.t]===19&&tk.ut19&&INFARM.has(a.k)?4:0)+(S.civ?.[a.t]===19&&tk.ut19p&&a.k==='skirm'?1:0)+(S.civ?.[a.t]===10&&tk.ut10p?(a.k==='chuko'?2:a.k==='scor'?4:0):0)+(S.civ?.[a.t]===7&&tk.ut7p&&(a.k==='arc'||a.k==='xbow')?1:0)+
 (S.civ?.[a.t]===25&&tk.ut25p&&a.k==='cavarch'?1:0)+
 (S.civ?.[a.t]===27&&tk.burmeseInfantry&&INFARM.has(a.k)?Math.max(0,Math.min(3,S.age?.[a.t]||0)):0)+
 (S.civ?.[a.t]===27&&tk.ut27&&!t.s&&ARCHARM.has(t.k)&&(CAVARM.has(a.k)||a.k==='arambai')?4:0)+
 (S.civ?.[a.t]===40&&a.k==='gal'?1+(tk.ut40?2:0):0)+(a.k==='caravel'&&!t.s&&U[t.k]?.sh?3:0)+lithuanianRelicAttack(a)+charge+urumiCharge+romanCharge+
 (['scout','winged'].includes(a.k)&&!t.s&&
  (SKIRM_ARCHER_KINDS.has(t.k)||SKIRM_CAV_ARCHER_KINDS.has(t.k))&&
  typeof alliedCivilizationIds==='function'&&alliedCivilizationIds(a.t).includes(35)?1:0)+
 (S.civ?.[a.t]===33&&['hcan','bomb','cgal'].includes(a.k)?Math.round(ak.dmg*.25):0)+
 (S.civ?.[a.t]===4&&tk.ut4p&&a.k==='cs'?(4+(!t.s&&INFARM.has(t.k)?3:0)+(t.k==='ram'?3:0)):0)+
 (S.civ?.[a.t]===8&&tk.ut8p&&(a.k==='treb'||a.k==='mang')?Math.round(ak.dmg*.15):0)+
 (S.civ?.[a.t]===23&&tk.ut23p&&['scout','knight','camel'].includes(a.k)?5:0)+
 ((a.k==='tw'||a.k==='cs'||a.k==='tca')?(tk.slit?2:0)+(tk.gtow?3:0)+(tk.keep?3:0):0),cls=a.k==='chakram'?'m':ak.sg?'s':ak.rng>2?'p':'m',ar=!t.s&&((a.k==='leitis'&&S.civ?.[a.t]===32)||(S.civ?.[a.t]===37&&tk.ut37p&&ak.rng<=2&&(INFARM.has(a.k)||CAVARM.has(a.k))))?0:combatArmor(t,cls);const hpBeforeHit=t.hp,secondaryDamage=Number.isFinite(a[CK_TRAMPLE_DAMAGE])&&a[CK_TRAMPLE_DAMAGE]>0&&a[CK_TRAMPLE_DAMAGE]<=8;
 const raw=secondaryDamage?a[CK_TRAMPLE_DAMAGE]:Math.max(1,(ak.dmg+bd)*(!t.s&&ak.du?ak.du:1)-ar);
 t.hp-=!secondaryDamage&&typeof hussiteWagonCover==='function'&&hussiteWagonCover(a,t)?Math.max(1,Math.ceil(raw/2)):raw;
 if(a.k==='chakram'&&!a[CK_TRAMPLE_DAMAGE]&&
   typeof chakramPierceTargets==='function'&&S.civ?.[a.t]===39){
  const nearby=chakramPierceTargets(a,t),
   splash=Math.max(1,Math.min(8,Math.round((hpBeforeHit-t.hp)*.6)));
  for(const other of nearby)
   dmgT({k:'chakram',t:a.t,[CK_TRAMPLE_DAMAGE]:splash},other);
 }
 if(romanCharge)a.romanChargeReadyAt=S.t+20;
 if(urumiCharge){
 a.urumiReadyAt=S.t+18;
 if(!t.s)for(const victim of S.us)if(victim!==a&&victim!==t&&victim.hp>0&&!victim.ld&&isHostile(a.t,victim.t)&&Math.hypot(victim.x-t.x,victim.y-t.y)<=1.15)
  dmgT({k:'urumi',t:a.t,x:a.x,y:a.y,[CK_TRAMPLE_DAMAGE]:Math.ceil(urumiCharge*.6)},victim);
 }
 // Persistent Obuch armour stripping requires a genuine attacker and victim.
 if(a.k==='obuch'&&S.civ?.[a.t]===35&&!t.s&&S.us.includes(a)&&S.us.includes(t))
  t.obuchArmorShred=Math.min(10,Math.max(0,t.obuchArmorShred|0)+1);
 // Lechitic Legacy deals bounded splash once on a genuine Scout-line hit.
 if((a.k==='scout'||a.k==='winged')&&S.civ?.[a.t]===35&&tk.ut35p&&
    !t.s&&S.us.includes(a)&&S.us.includes(t)){
  const splash=Math.max(1,Math.min(8,Math.round(Math.max(1,hpBeforeHit-t.hp)/3)));
  const secondary={k:a.k,t:a.t,x:a.x,y:a.y,[CK_TRAMPLE_DAMAGE]:splash};
  for(const victim of S.us)if(victim!==a&&victim!==t&&victim.hp>0&&!victim.ld&&
    isHostile(a.t,victim.t)&&Math.hypot(victim.x-t.x,victim.y-t.y)<=.75)
    dmgT(secondary,victim);
 }
 // Reward only real, living Keshiks striking a real hostile combat unit.
 // Fake attacker objects and building hits must not mint gold.
 if(a.k==='keshik'&&S.civ?.[a.t]===30&&!t.s&&t.hp>0&&
    S.us.includes(a)&&S.us.includes(t))S.res[a.t].g+=1;
 if(a.k==='coust'&&S.civ?.[a.t]===33&&S.us.includes(a))a.chargeReadyAt=S.t+35;
 fx.push({x:t.x+(t.s||0)/2,y:t.y+(t.s||0)/2,l:.2,k:'h'});if(!t.s)t.hit=gt;emit('spark',t.x+(t.s||0)/2,t.y+(t.s||0)/2,t.s?3:5,{s:2.2,vz:2.6,l:.35,c:ak.rng>2?'#e8d8a0':'#ffb050',r:1.6});
hitSnd(a,t);
if(t.t===0){S.ping={x:t.x+(t.s||0)/2,y:t.y+(t.s||0)/2,t:S.t};if(S.t-S.al>12){S.al=S.t;note('Under attack! L3 with nothing selected jumps there');sfx('horn');rumble(260,.6,.3)}}
if(t.hp<=0&&!t.dead){t.dead=1;
 // A killed mounted Konnik becomes a new infantry entity rather than an
 // immortal health reset; this retains kill accounting and deterministic IDs.
 if(!t.s&&t.k==='konnik'&&S.civ?.[t.t]===29&&S.us.includes(t)&&
   livePopulation(t.t)<capOf(t.t)){
  const foot=addU(t.t,'footkonnik',t.x,t.y);
  if(t.tg&&t.tg.hp>0&&isHostile(foot.t,t.tg.t)){foot.o='a';foot.tg=t.tg}
 }
 if(t.s){for(let j=0;j<t.s;j++)for(let i=0;i<t.s;i++){S.g[(t.y+j)*W+t.x+i]=0;S.gt[(t.y+j)*W+t.x+i]=0}if(t.cg)for(const c of t.cg)c.ld=null;rub.push({x:t.x,y:t.y,s:t.s,t:gt});emit('smk',t.x+t.s/2,t.y+t.s/2,18,{s:1.6,vz:1.4,l:2.4,c:'#777',r:5});emit('deb',t.x+t.s/2,t.y+t.s/2,14,{s:3,vz:4,l:1,c:'#8a7a62',r:2.2});sfx('collapse',t.x+t.s/2,t.y+t.s/2);if(t.t===0)rumble(400,.9,.5);if(t.k==='tc'&&tcEnds(t)){if(cmp){if(t.t===0)endGame('lose','Your Town Centre fell');else if(CAMP[cmp.i].tcw)endGame('win','The enemy Town Centre fell')}else if(vm===0){if(t.t===0)endGame('lose','Your Town Centre fell');else if(!S.bs.some(b=>b.k==='tc'&&isHostile(0,b.t)&&b.hp>0))endGame('win','All hostile Town Centres have fallen');else note('A rival Town Centre has fallen')}else if(vm===6){if(t.t===0)endGame('lose','Your Town Centre fell in Sudden Death');else{for(const b of S.bs)if(b.t===t.t)b.hp=0;for(const u of S.us)if(u.t===t.t)u.hp=0;S.pj=S.pj.filter(p=>!p.a||p.a.t!==t.t);note(CIV[S.civ[t.t]].n+' was eliminated — Town Centre destroyed');if(!S.bs.some(b=>b.k==='tc'&&isHostile(0,b.t)&&b.hp>0))endGame('win','All hostile Town Centres have fallen in Sudden Death')}}}}else{sfx(U[t.k].sh?'sink':'death',t.x,t.y,{k:t.k});corp.push({x:t.x,y:t.y,k:t.k,tm:t.t,fd:t.fd||1,sh:!!U[t.k].sh,t:gt});emit('puff',t.x,t.y,6,{s:1.2,vz:1,l:.8,c:'#c8c0b0',r:3});if(corp.length>60)corp.shift();if(a.t===0)S.pl.kills++}}}

// Demolition Ships explode once upon reaching a valid hostile target. All combat
// mutations use the same deterministic tick as ordinary attacks: no timers,
// persistent explosives, or client-only damage. Allied and neutral ships are safe.
function detonateShip(ship){
 if(!ship||ship.k!=='demo'||ship.hp<=0||ship.dead||ship.ld||ship.o!=='a'||ship.cd>0||!S.us.includes(ship))return false;
 const target=ship.tg;
 if(!target||target.hp<=0||target.ld||!isHostile(ship.t,target.t)||!Number.isFinite(target.x)||!Number.isFinite(target.y)||d2(ship.x,ship.y,target)>U.demo.rng)return false;
 const blast=2.75,attack={k:'demo',t:ship.t,x:ship.x,y:ship.y};
 // Stable world-list ordering keeps replays and two-human simulation in step.
 for(const enemy of S.us)if(enemy!==ship&&enemy.hp>0&&!enemy.ld&&isHostile(ship.t,enemy.t)&&Number.isFinite(enemy.x)&&Number.isFinite(enemy.y)&&Math.hypot(enemy.x-ship.x,enemy.y-ship.y)<=blast)dmgT(attack,enemy);
 for(const b of S.bs)if(b.hp>0&&isHostile(ship.t,b.t)&&Number.isFinite(b.x)&&Number.isFinite(b.y)&&d2(ship.x,ship.y,b)<=blast)dmgT(attack,b);
 ship.hp=0;ship.dead=1;ship.o='i';ship.tg=null;ship.p=[];
 corp.push({x:ship.x,y:ship.y,k:ship.k,tm:ship.t,fd:ship.fd||1,sh:true,t:gt});if(corp.length>60)corp.shift();
 emit('spark',ship.x,ship.y,22,{s:3,vz:4,l:.6,c:'#f5a64d',r:3});
 sfx('sink',ship.x,ship.y,{k:'demo'});
 return true;
}

/* Tatar Flaming Camels detonate once in real combat. All victims are
 * checked for hostility, and no client-supplied blast radius is trusted. */
function detonateFlamingCamel(u){
 if(!u||u.k!=='flamecamel'||u.hp<=0||u.dead||u.ld||u.o!=='a'||u.cd>0||
    !S.us.includes(u))return false;
 const target=u.tg;
 if(!target||target.hp<=0||target.ld||!isHostile(u.t,target.t)||
    !Number.isFinite(target.x)||!Number.isFinite(target.y)||
    Math.hypot(u.x-target.x,u.y-target.y)>U.flamecamel.rng)return false;
 const hit={k:'flamecamel',t:u.t,x:u.x,y:u.y};
 for(const enemy of S.us)if(enemy!==u&&enemy.hp>0&&!enemy.ld&&isHostile(u.t,enemy.t)&&
   Math.hypot(enemy.x-u.x,enemy.y-u.y)<=2.5)dmgT(hit,enemy);
 for(const b of S.bs)if(b.hp>0&&isHostile(u.t,b.t)&&
   Math.hypot(b.x+b.s/2-u.x,b.y+b.s/2-u.y)<=2.5)dmgT(hit,b);
 u.hp=0;u.dead=1;u.o='i';u.tg=null;u.p=[];
 corp.push({x:u.x,y:u.y,k:u.k,tm:u.t,fd:u.fd||1,sh:false,t:gt});
 if(corp.length>60)corp.shift();
 emit('spark',u.x,u.y,20,{s:2,vz:4,l:.7,c:'#f5a64d',r:3});
 return true;
}

// Conversion helpers shared by solo input, AI and authenticated orders.
// Unchanged source relocated from simulation.js; retain classic global names.
function resetConversion(u){u.cv=0;u.cvNext=0;u.cvTargetId=null;u.cvTeam=null}
function conversionRange(u,target){return target?.s||['ram','treb'].includes(target?.k)?1:9+(S.tech[u.t]?.blockPrinting?3:0)}
function unitSight(u){return u.k==='vil'?4:u.k==='mon'?11+(S.tech[u.t]?.blockPrinting?3:0):8+arrowSightBonus(u)}
const CONVERSION_SIEGE=new Set(['ram','mang','scor','treb','bomb','husswagon','houfnice']);
function canConvert(u,target){
 if(!u||u.k!=='mon'||u.hp<=0||u.ld||u.rel||u.st===4||!S.us.includes(u)||
    !target||target.hp<=0||target.ld||!isHostile(u.t,target.t)||
    !Number.isFinite(target.x)||!Number.isFinite(target.y))return false;
 const tech=S.tech[u.t]||{};
 // Cargo capture/ejection needs its own ownership model; never transfer a
 // container while its occupants still belong to another kingdom.
 if((target.cg||[]).some(c=>c&&c.hp>0))return false;
 if(target.s)return S.bs.includes(target)&&target.done&&!!tech.redemption&&
   !['tc','castle','monastery','farm','palisade','wall','gate','wonder'].includes(target.k);
 if(!S.us.includes(target)||!U[target.k]||target.k==='king')return false;
 if(target.k==='mon'&&!tech.atonement)return false;
 if((U[target.k].sg||CONVERSION_SIEGE.has(target.k))&&!tech.redemption)return false;
 return true;
}
function beginConversion(units,target){
 if(!units.length||units.some(u=>!canConvert(u,target)||(u.faith??100)<100||u.cd>0))return false;
 const routes=units.map(u=>path(u,goalNear(target,conversionRange(u,target)-.1)));
 if(routes.some(route=>!route))return false;
 units.forEach((u,i)=>{resetConversion(u);u.o='v';u.tg=target;u.p=routes[i];u.rp=.7;
  u.pt=null;u.as=0;u.autoWorker=0;u.guardTarget=null;u.retreating=false;u.retreatTarget=null;
  u.ut=null;u.unloadBeach=null;});return true;
}
function conversionWindow(target){
 const tech=S.tech[target.t]||{},resistance=(tech.devotion?1:0)+(tech.faith?4:0);
 const scout=target.k==='scout',ship=!!U[target.k]?.sh,
  bengaliResist=S.civ?.[target.t]===38&&
   (target.k==='mon'||['eled','batele','ele'].includes(target.k))?3:0;
 return {min:(target.s?15:5)+resistance+bengaliResist+(scout?3:ship?2:0),max:(target.s?25:9)+resistance+bengaliResist+(scout?1:ship?2:0)};
}
function completeConversion(u,target){
 const team=u.t,oldTeam=target.t;
 const helpers=S.us.filter(m=>m.k==='mon'&&m.t===team&&m.hp>0&&!m.ld&&m.o==='v'&&m.tg===target);
 for(const m of helpers){if(m===u||!S.tech[team].theocracy)m.faith=0;resetConversion(m);m.o='i';m.tg=null;m.p=[];}
 if(S.tech[oldTeam]?.heresy&&!target.s){
  if(target.rel){target.rel.c=null;target.rel=null;}
  target.hp=0;target.dead=1;target.o='i';target.tg=null;target.p=[];target.pt=null;resetConversion(target);
  return true;
 }
 target.t=team;target.p=[];target.tg=null;target.pt=null;target.o='i';target.autoWorker=0;target.as=0;
 target.guardTarget=null;target.retreating=false;target.retreatTarget=null;target.ut=null;target.unloadBeach=null;
 if(target.rel){target.rel.c=null;target.rel=null;}
 if(target.s){target.q=[];target.rs=null;target.rally=null;target.cd=0;}
 else{target.car=0;target.ct=null;target.ret=0;resetConversion(target);
  if(target.k==='mon')target.faith=0;
  if(['cart','cog'].includes(target.k)){target.tradeFromKey=null;target.tradeDestKey=null;target.tradeCargo=0;target.tradePaused=true;target.manualTradeMove=false;}
 }
 // Selection and control groups remain local; stale members are filtered by
 // their existing current-ownership guards instead of being sent to a peer.
 foeGridDirty=true;fx.push({x:target.x,y:target.y,l:.5,k:'p'});return true;
}
function tickConversion(u,dt){
 const target=u.tg;
 if(!canConvert(u,target)){resetConversion(u);u.o='i';u.tg=null;u.p=[];return;}
 if(u.cvTargetId!==target.netId||u.cvTeam!==target.t){resetConversion(u);u.cvTargetId=target.netId;u.cvTeam=target.t;}
 if((u.faith??100)<100||u.cd>0)return;
 const range=conversionRange(u,target),distance=d2(u.x,u.y,target);
 if(distance>range){if(!u.p.length||u.rp<=0){u.p=path(u,goalNear(target,Math.max(.8,range-.1)))||[];u.rp=.7;}if(u.p.length)walk(u,dt);return;}
 u.p=[];u.cv+=dt*(S.civ?.[u.t]===14&&S.tech[u.t]?.ut14p?1.3:1);
 const window=conversionWindow(target),interval=Math.floor(u.cv+1e-8);
 if(interval<window.min||interval<Math.max(window.min,u.cvNext||0))return;
 u.cvNext=interval+1;
 if(interval>=window.max||S.r()<.4)completeConversion(u,target);
}

/* Classic combat projectiles, ranged upgrades and deterministic hit resolution.
 * Function bodies are relocated unchanged from simulation.js. */
const ARROW_WEAPONS=new Set(['arc','xbow','skirm','lbow','chuko','mgd','eled','genoa','plumed','wagon','cavarch','rattan','arambai','caravel','gal','tw','cs','tca','kipchak']);
// AoE2:DE Thumb Ring: +100% nominal accuracy against non-moving targets.
// Skirmishers gain accuracy but no faster reload; mounted archers gain a
// smaller firing-speed increase; Chu Ko Nu gains a larger one.
const THUMB_FOOT_ARCHERS=new Set(['arc','xbow','lbow','genoa','plumed','eled','rattan']);
const THUMB_MOUNTED_ARCHERS=new Set(['mgd','wagon','cavarch','kipchak']);
function rangedAccuracy(a){
 const d=U[a.k];if(!d)return 1;
 if(S.tech[a.t]?.thumb&&(['arc','xbow','skirm','cavarch'].includes(a.k)))return 1;
 return a.k==='xbow'&&S.tech[a.t]?.arb?.9:(d.acc??1);
}
function romanScorpionMinimumRange(u){
 if(u?.k!=='scor')return 0;
 return typeof alliedCivilizationIds==='function'&&alliedCivilizationIds(u.t).includes(40)?1:2;
}
function romanCenturionAura(u){
 if(!u||!['mil','legionary'].includes(u.k)||!Array.isArray(S?.us))return 1;
 for(const c of S.us)if(c&&c.k==='centurion'&&c.t===u.t&&S.civ?.[c.t]===40&&c.hp>0&&!c.ld&&
   Math.hypot(c.x-u.x,c.y-u.y)<=(S.tech?.[c.t]?.eliteCenturion?12:10))
  return S.tech?.[c.t]?.eliteCenturion?1.33:1.25;
 return 1;
}
function attackReload(u){
 const base=(u.k==='knight'&&S.tech[u.t]?.pala)||(u.k==='scout'&&S.tech[u.t]?.huss)?1.9:u.k==='fire'&&S.tech[u.t]?.fastFire?.25:U[u.k]?.cd||2;
 if(S.civ?.[u.t]===40&&S.tech?.[u.t]?.ut40&&['scor','gal'].includes(u.k))return base/1.33;
 if(romanCenturionAura(u)>1)return base/romanCenturionAura(u);
 if(S.civ?.[u.t]===38&&S.tech?.[u.t]?.ut38&&['ratha','rathaM','batele','eled','ele'].includes(u.k))
  return base/1.2;
 if(S.civ?.[u.t]===37&&['skirm','eled'].includes(u.k))return base/1.25;
 if(u.k==='treb'&&S.civ?.[u.t]===11&&S.tech[u.t]?.ut11p)return base/1.33;
 if(S.civ?.[u.t]===29&&S.tech?.[u.t]?.ut29&&['scout','knight','konnik'].includes(u.k))return base/1.25;
 // Byzantines fire their Fire Ships 25% more often even before Greek Fire.
 // 25% faster attack rate means a cooldown of 1 / 1.25 (not -25%).
 if(u.k==='fire'&&S.civ?.[u.t]===3)return base/1.25;
 if(!S.tech[u.t]?.thumb)return base;
 if(u.k==='chuko')return base*.8;
 if(THUMB_MOUNTED_ARCHERS.has(u.k))return base*.9;
 if(THUMB_FOOT_ARCHERS.has(u.k))return base*.85;
 return base;
}
function arrowBonus(a){const t=S.tech[a.t]||{};return ARROW_WEAPONS.has(a.k)?(t.atkR2?3:t.bodkin?2:t.atkR?1:0):0}
function arrowSightBonus(e){return arrowBonus({k:B[e.k]?.atk||e.k,t:e.t})}
function attackRange(a){return (U[a.k]?.rng||0)+(a.k==='tca'?0:arrowBonus(a))+(a.k==='cs'&&S.civ?.[a.t]===5&&S.tech[a.t]?.ut5?3:0)+(a.k==='skirm'&&S.civ?.[a.t]===19&&S.tech[a.t]?.ut19p?1:0)+(a.k==='skirm'&&S.tech[a.t]?.elsk?1:0)+(a.k==='mang'&&S.tech[a.t]?.onager?1:0)+(a.k==='cgal'&&S.tech[a.t]?.eliteCgal?1:0)+(S.civ?.[a.t]===9&&S.tech[a.t]?.ut9p&&(a.k==='bomb'||a.k==='cgal')?2:0)+(a.k==='gal'&&S.tech[a.t]?.galleon?1:0)+(a.k==='fire'&&S.tech[a.t]?.fastFire?.5:0)+(a.k==='fire'&&S.civ?.[a.t]===3&&S.tech[a.t]?.gf?1:0)
 +(a.k==='tca'&&S.civ?.[a.t]===32&&S.tech[a.t]?.ut32?3:0)
 +(a.k==='tw'&&S.civ?.[a.t]===24&&S.tech[a.t]?.ut24p?2:0)
 +(a.k==='turtle'&&S.civ?.[a.t]===24&&S.tech[a.t]?.ut24?1:0)
 +(a.k==='cavarch'&&S.civ?.[a.t]===25&&S.tech[a.t]?.ut25p?1:0)+(a.k==='treb'&&S.civ?.[a.t]===30&&S.tech[a.t]?.ut30p?2:0)+(a.k==='axe'&&S.tech[a.t]?.beardedAxes?1:0)+(typeof eliteUniqueUnitUpgrade==='function'?eliteUniqueUnitUpgrade(a.k,a.t)?.range||0:0)}
// A shot records a fixed impact point at launch. Ballistics predicts constant
// movement along the current path segment; later turns can still dodge it.
function projectileSpeed(a){return U[a.k]?.ps||14}
function projectileAim(a,t){
 let x=t.x+(t.s||0)/2,y=t.y+(t.s||0)/2;
 const next=t.p?.[0],predict=(S.tech[a.t]?.ballistics&&(ARROW_WEAPONS.has(a.k)||a.k==='scor'))||
 (S.civ?.[a.t]===26&&S.tech[a.t]?.ut26p&&['orgun','hcan','bomb','cgal'].includes(a.k));
 if(predict&&!t.s&&!t.ld&&next&&U[t.k]){
  const dx=next[0]-t.x,dy=next[1]-t.y,length=Math.hypot(dx,dy);
  if(length>0&&Number.isFinite(length)){
   const speed=unitSpeed(t),vx=dx/length*speed,vy=dy/length*speed,rx=x-a.x,ry=y-a.y;
   const arrowSpeed=projectileSpeed(a),aa=vx*vx+vy*vy-arrowSpeed*arrowSpeed,bb=2*(rx*vx+ry*vy),cc=rx*rx+ry*ry,disc=bb*bb-4*aa*cc;
   const time=Math.abs(aa)<1e-9?(bb<0?-cc/bb:0):disc>=0?(-bb-Math.sqrt(disc))/(2*aa):0;
   if(Number.isFinite(time)&&time>0){x+=vx*time;y+=vy*time;}
  }
 }
 return {tx:Math.max(0,Math.min(W-.001,x)),ty:Math.max(0,Math.min(H-.001,y))};
}
function launchProjectile(a,t){
 const aim=projectileAim(a,t);
 // Fixed inaccurate aim is sampled at launch from the saved/replicated RNG.
 // A miss never magically homes back towards its original target.
 // Building targets are fully accurate; projectile collision is still checked
 // at arrival, so Ballistics and target movement remain distinct mechanics.
 if(!t.s&&rangedAccuracy(a)<1&&S.r()>=rangedAccuracy(a)){
  const dx=aim.tx-a.x,dy=aim.ty-a.y,distance=Math.hypot(dx,dy)||1;
  const deviation=(.8+S.r()*.6)*(S.r()<.5?-1:1);
  aim.tx=Math.max(0,Math.min(W-.001,aim.tx-dy/distance*deviation));
  aim.ty=Math.max(0,Math.min(H-.001,aim.ty+dx/distance*deviation));
 }
 S.pj.push({x:a.x,y:a.y,t,a:{k:a.k,t:a.t},...aim});
 if(a.k==='chakram'&&S.civ?.[a.t]===39&&S.us.includes(a)){
  const projectile=S.pj[S.pj.length-1];
  projectile.a.sourceNetId=a.netId;
  projectile.a.sx=a.x;projectile.a.sy=a.y;
 }
 if(a.k==='kipchak'&&S.civ?.[a.t]===31){
  const count=S.tech?.[a.t]?.eliteKipchak?2:1;
  for(let i=0;i<count;i++)S.pj.push({x:a.x,y:a.y,t,a:{k:a.k,t:a.t},...aim});
 }
 if(a.k==='thirisadai'&&S.civ?.[a.t]===37){
  const dx=aim.tx-a.x,dy=aim.ty-a.y,length=Math.hypot(dx,dy)||1;
  for(const spread of [-.3,.3])S.pj.push({x:a.x,y:a.y,t,a:{k:a.k,t:a.t},
   tx:Math.max(0,Math.min(W-.001,aim.tx-dy/length*spread)),
   ty:Math.max(0,Math.min(H-.001,aim.ty+dx/length*spread))});
 }
 if(a.k==='hcan'){const shot=S.pj[S.pj.length-1];shot.sx=a.x;shot.sy=a.y;}
 // Double Crossbow fires an additional deterministic Scorpion bolt. Keep the
 // second projectile in the normal collision/damage path, not a visual effect.
 if(a.k==='scor'&&S.civ?.[a.t]===12&&S.tech[a.t]?.ut12p)
  S.pj.push({x:a.x,y:a.y,t,a:{k:a.k,t:a.t},...aim});
 // Original Portuguese Organ Gun salvo: three standard deterministic pellets
 // that retain normal collision, target death and save/network semantics.
 if(a.k==='orgun'&&S.civ?.[a.t]===26){
  const dx=aim.tx-a.x,dy=aim.ty-a.y,length=Math.hypot(dx,dy)||1;
  for(const spread of [-.35,.35])S.pj.push({x:a.x,y:a.y,t,a:{k:a.k,t:a.t},
   tx:Math.max(0,Math.min(W-.001,aim.tx-dy/length*spread)),
   ty:Math.max(0,Math.min(H-.001,aim.ty+dx/length*spread))});
 }
 // Shinkichon adds two more Korean Turtle Ship rockets via the same
 // authoritative projectile simulation and normal damage/death accounting.
 if(a.k==='turtle'&&S.civ?.[a.t]===24&&S.tech[a.t]?.ut24)
  for(let rocket=0;rocket<2;rocket++)S.pj.push({x:a.x,y:a.y,t,a:{k:a.k,t:a.t},...aim});
}
/* Trample is a second, deterministic direct-damage pass after the primary
 * melee strike. It never re-enters hit(), so secondary victims cannot cause
 * chained splash attacks. Reuse dmgT for death, score and corpse accounting.
 * The current unit catalogue lacks the 2026 Varangian Guard, so Logistica
 * intentionally covers real Cataphracts only until that separate unit ships. */
function trampleAdjacentEnemies(a,primary,damage=5,radius=.5){
 if(!Array.isArray(S?.us)||!Number.isFinite(primary?.x)||!Number.isFinite(primary?.y))return;
 const limit=radius*radius;
 const splash={k:a.k,t:a.t,x:a.x,y:a.y,[CK_TRAMPLE_DAMAGE]:damage};
 for(const target of S.us){
  if(target===primary||!target||target.hp<=0||target.dead||target.ld||
     !isHostile(a.t,target.t)||!Number.isFinite(target.x)||!Number.isFinite(target.y))continue;
  const dx=target.x-primary.x,dy=target.y-primary.y;
  if(dx*dx+dy*dy<=limit)dmgT(splash,target);
 }
}
const hit=(a,t)=>{
 if(U[a.k].rng>2){sfx(U[a.k].sg?'launch':'bow',a.x,a.y);launchProjectile(a,t)}
 else{
  const druzhina=INFARM.has(a.k)&&a.hp>0&&!a.ld&&S.us.includes(a)&&S.civ?.[a.t]===16&&S.tech[a.t]?.ut16p&&t&&!t.s&&t.hp>0&&!t.dead&&!t.ld&&isHostile(a.t,t.t);
  const splash=a.k==='cata'&&a.hp>0&&!a.ld&&S.us.includes(a)&&
   S.civ?.[a.t]===3&&S.tech[a.t]?.logistica&&t&&!t.s&&t.hp>0&&!t.dead&&!t.ld&&isHostile(a.t,t.t);
  dmgT(a,t);
  if(splash)trampleAdjacentEnemies(a,t);
   if(druzhina)trampleAdjacentEnemies(a,t,5,.75);
 }
};
function pjs(dt){
 if(!Number.isFinite(dt)||dt<=0)return;
 for(const p of S.pj){
  if(!p||!p.t||!p.a||!U[p.a.k]||!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Number.isFinite(p.t.x)||!Number.isFinite(p.t.y)||!Number.isFinite(p.t.hp)){if(p)p.dead=1;continue;}
  // Old saves lack an aim: migrate once, then retain the same fixed trajectory.
  if(p.tx===undefined&&p.ty===undefined){p.tx=p.t.x+(p.t.s||0)/2;p.ty=p.t.y+(p.t.s||0)/2;}
  if(!Number.isFinite(p.tx)||!Number.isFinite(p.ty)||p.tx<0||p.ty<0||p.tx>=W||p.ty>=H||p.t.hp<=0||p.t.ld||!isHostile(p.a.t,p.t.t)){p.dead=1;continue;}
  const dx=p.tx-p.x,dy=p.ty-p.y,dist=Math.hypot(dx,dy),travel=(U[p.a.k].ps||14)*dt;
  if(dist>travel){p.x+=dx/dist*travel;p.y+=dy/dist*travel;continue;}
  p.x=p.tx;p.y=p.ty;
  const size=p.t.s||0,gapX=Math.max(p.t.x-p.tx,0,p.tx-p.t.x-size),gapY=Math.max(p.t.y-p.ty,0,p.ty-p.t.y-size);
  const direct=gapX*gapX+gapY*gapY<=.35*.35;
  if(direct)dmgT(p.a,p.t);
  // Pirotechnia passes a bounded fraction of the shot into enemies directly
  // behind its first impact. The private marker still uses normal death logic.
  if(direct&&p.a.k==='hcan'&&S.civ?.[p.a.t]===15&&S.tech?.[p.a.t]?.ut15p&&
     Number.isFinite(p.sx)&&Number.isFinite(p.sy)){
   const dx=p.tx-p.sx,dy=p.ty-p.sy,length=Math.hypot(dx,dy);
   if(length>0)for(const e of S.us){
    if(e===p.t||!e||e.hp<=0||e.ld||!isHostile(p.a.t,e.t))continue;
    const ex=e.x-p.tx,ey=e.y-p.ty,along=(ex*dx+ey*dy)/length;
    const cross=Math.abs(ex*dy-ey*dx)/length;
    if(along>0&&along<=1.5&&cross<.5)dmgT({k:'hcan',t:p.a.t,[CK_TRAMPLE_DAMAGE]:3},e);
   }
  }
  // Siege Onager upgrades extend the existing deterministic impact radius;
  // the ordinary Mangonel radius remains unchanged.
  const st=S.tech?.[p.a.t]||{},sp=(U[p.a.k].spl||0)+(p.a.k==='mang'?(st.siegeOnager?.4:st.onager?.2:0):p.a.k==='cgal'&&st.eliteCgal?.35:0)+
   (S.civ?.[p.a.t]===1&&st.ut1p&&p.a.k==='treb'?.8:0)+
   (S.civ?.[p.a.t]===22&&st.ut22p&&['mang','treb','bomb','scor'].includes(p.a.k)?.65:0);
  if(sp){const splash2=sp*sp,ix=p.tx,iy=p.ty;
   for(const e of S.us)if((e!==p.t||!direct)&&isHostile(p.a.t,e.t)&&e.hp>0&&!e.ld&&(e.x-ix)*(e.x-ix)+(e.y-iy)*(e.y-iy)<splash2)dmgT(p.a,e);
   for(const e of S.bs)if((e!==p.t||!direct)&&isHostile(p.a.t,e.t)&&e.hp>0&&(e.x+(e.s||0)/2-ix)**2+(e.y+(e.s||0)/2-iy)**2<splash2)dmgT(p.a,e);
  }
  p.dead=1;
 }
 compactNotFlag(S.pj,'dead');
}

/* Combat target index and defensive/siege targeting. Original classic-script
 * bodies extracted from simulation.js; step() still invalidates this index. */
const FOE_CELL=8,FOE_BUCKETS=new Map(),FOE_BUCKET_POOL=[];
let foeGridDirty=true;
function rebuildFoeGrid(){
 for(const bin of FOE_BUCKETS.values()){bin.length=0;FOE_BUCKET_POOL.push(bin)}
 FOE_BUCKETS.clear();
 for(let i=0;i<S.us.length;i++){
  const e=S.us[i];if(!e||e.hp<=0||e.ld||!Number.isFinite(e.x)||!Number.isFinite(e.y))continue;
  const key=Math.floor(e.x/FOE_CELL)+','+Math.floor(e.y/FOE_CELL);
  let bin=FOE_BUCKETS.get(key);
  if(!bin){bin=FOE_BUCKET_POOL.pop()||[];FOE_BUCKETS.set(key,bin)}
  bin.push(i)
 }
 foeGridDirty=false
}
// Defensive fire and combat-target selection shared by buildings, AI and simulation.
function defenceTarget(building,shooter,range){
 const minimum=['tower','castle'].includes(building.k)&&!S.tech[building.t]?.murderHoles?1:0;
 let best=null,distance=range*range;
 for(const e of S.us){if(!e||e.hp<=0||e.ld||!isHostile(building.t,e.t))continue;
  const edgeX=Math.max(building.x-e.x,0,e.x-building.x-building.s),edgeY=Math.max(building.y-e.y,0,e.y-building.y-building.s);
  if(minimum&&edgeX*edgeX+edgeY*edgeY<minimum*minimum)continue;
  const dx=e.x-shooter.x,dy=e.y-shooter.y,d=dx*dx+dy*dy;
  if(d<distance){best=e;distance=d;}
 }return best;
}
function nearestFoeUnit(u,r){
 if(!Number.isFinite(u.x)||!Number.isFinite(u.y)||!Number.isFinite(r)||r<=0)return null;
 if(foeGridDirty)rebuildFoeGrid();
 let b=null,bd2=r*r,bestIndex=Infinity;
 /* Compare squared distances: thousands of nearby combat checks need no square roots. */
 const minX=Math.floor((u.x-r)/FOE_CELL),maxX=Math.floor((u.x+r)/FOE_CELL);
 const minY=Math.floor((u.y-r)/FOE_CELL),maxY=Math.floor((u.y+r)/FOE_CELL);
 /* Empty or wholly out-of-map search bounds cannot contain indexed units. */
 if(maxX<0||maxY<0||minX>=Math.ceil(W/FOE_CELL)||minY>=Math.ceil(H/FOE_CELL))return null;
 for(let cy=minY;cy<=maxY;cy++)for(let cx=minX;cx<=maxX;cx++){
  const bin=FOE_BUCKETS.get(cx+','+cy);if(!bin)continue;
  for(const i of bin){
   const e=S.us[i];
   if(!e||!isHostile(u.t,e.t)||e.hp<=0||e.ld)continue;
   const dx=e.x-u.x,dy=e.y-u.y,d2=dx*dx+dy*dy;
   if(d2<bd2||(b&&d2===bd2&&i<bestIndex)){bd2=d2;b=e;bestIndex=i}
  }
 }
 return b
}
// Guards retain their local patrol boundary, but also defend against a nearby
// shooter currently firing at the protected target from its own weapon range.
function guardThreatensTarget(u,enemy,target){
 if(!u||!enemy||!target||enemy.hp<=0||enemy.ld||!isHostile(u.t,enemy.t))return false;
 if(u.st===2&&d2(u.x,u.y,enemy)>attackRange(u))return false;
 const distance=d2(enemy.x,enemy.y,target);
 return distance<=5||!!U[enemy.k]&&U[enemy.k].dmg>0&&enemy.o==='a'&&enemy.tg===target&&distance<=attackRange(enemy)+.1;
}
function foe(u,r,building){
 if(building)return defenceTarget(building,u,r);
 let b=null,bd2=r*r;
 /* Siege still prioritises hostile buildings before searching for units. */
 if(U[u.k]?.sg){
  for(const q of S.bs)if(isHostile(u.t,q.t)&&q.hp>0){
   const sz=q.s||0,dx=Math.max(q.x-u.x,0,u.x-(q.x+sz)),dy=Math.max(q.y-u.y,0,u.y-(q.y+sz)),d=dx*dx+dy*dy;
   if(d<bd2){bd2=d;b=q}
  }
  if(b)return b
 }
 b=nearestFoeUnit(u,r);if(b)return b;
 for(const q of S.bs)if(isHostile(u.t,q.t)&&q.hp>0){
  const sz=q.s||0,dx=Math.max(q.x-u.x,0,u.x-(q.x+sz)),dy=Math.max(q.y-u.y,0,u.y-(q.y+sz)),d=dx*dx+dy*dy;
  if(d<bd2){bd2=d;b=q}
 }
 return b
}
