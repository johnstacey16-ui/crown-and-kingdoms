/* Crown & Kingdoms — economy, combat, unit behaviour, AI, commands and fixed-step simulation. */
// Economy rates are continuous units/second; sea fishing has its own rate.
/* ===== COMBAT ===== */
// Direct damage and its bonuses now belong to simulation-combat-bonuses.js.
/* ===== ECONOMY / UNIT BEHAVIOUR ===== */
// Farms have one live assigned worker. Old duplicate orders use stable unit order.
// Unit orders, combat, gathering and build work live in simulation-unit-behaviour.js.
/* Enemy strategy and composition-aware decisions are implemented in js/ai.js. */
/* Shared stable in-place compaction for live entities, projectiles and notes.
 * Keep original element order and avoid array reallocation per simulation tick. */
function compactPositive(a,k){let w=0;for(let i=0;i<a.length;i++){const v=a[i];if(v[k]>0)a[w++]=v}a.length=w}
function compactNotFlag(a,k){let w=0;for(let i=0;i<a.length;i++){const v=a[i];if(!v[k])a[w++]=v}a.length=w}
// Rubble is purely visual and is never serialized. Keep only the 40-second
// painted lifetime; cap retained entries during mass destruction/headless runs.
// Stable in-place compaction avoids allocating another array every tick.
const RUBBLE_LIFETIME=40,RUBBLE_LIMIT=512;
function compactRubble(now){
 let w=0;
 for(let i=0;i<rub.length;i++){
  const q=rub[i];
  if(q&&Number.isFinite(q.t)&&now-q.t<=RUBBLE_LIFETIME)rub[w++]=q
 }
 if(w>RUBBLE_LIMIT){
  const excess=w-RUBBLE_LIMIT;
  for(let i=0;i<RUBBLE_LIMIT;i++)rub[i]=rub[i+excess];
  w=RUBBLE_LIMIT
 }
 rub.length=w
}


/* ===== SIMULATION STEP ===== */
// Preserve this coordinator's call ordering and 30 Hz tick cadence.
function step(dt){
  foeGridDirty=true;
  S.t+=dt;
  if(S.vt%30===0)retryAutomaticFarmWorkers();
  for(const n of S.nodes)if(n&&n.fm&&n.amt<=0&&Number.isInteger(n.t)&&S.res[n.t]&&S.res[n.t].w>=60){
    S.res[n.t].w-=60;
    n.amt=farmFood(n.t);
    if(n.t===0)note('Farm reseeded (-60 wood)')
  }
  for(const u of S.us)upU(u,dt);
  sep();
  WL(dt);
  if(cmp)cmpTick(dt);
  // The Last Crown uses the real Regicide combat rules, but its own King
  // objective must record completion and campaign progress before the generic
  // Regicide result can end the match (vict runs every tick; cmpTick every 15).
  if(vm&&!(cmp&&cmp.i===5))vict(dt);
  if(!cmp&&S.vt%30===0)elim();
  if(S.vt%150===0){
    for(const q of S.px)for(const k in q)q[k]+=q[k]<100?1:q[k]>100?-1:0;
    if(menu&&menu.items)for(const r of menu.items)if(r.up)r.up()
  }
  for(const q of S.rel){
    if(q.c){
      if(q.c.hp<=0)q.c=null;
      else{
        q.x=q.c.x;
        q.y=q.c.y
      }
    }
    if(q.m&&q.m.hp<=0){
      q.x=q.m.x+1;
      q.y=q.m.y+1;
      q.m=null
    }
  }
  
for(const s of S.us)if(s.cg&&s.cg.length){
    if(s.hp<=0)s.cg.forEach(c=>c.hp=0);
    else s.cg.forEach(c=>{
      c.x=s.x;
      c.y=s.y
    })
  }
  if(typeof tickMuleCarts==='function')tickMuleCarts(dt);
   for(const b of S.bs)upB(b,dt);
  pjs(dt);
  if(!(cmp&&CAMP[cmp.i].noai))ai(dt);
  
for(const f of fx)f.l-=dt;
  compactPositive(fx,'l');
  compactPositive(S.us,'hp');
  compactPositive(S.bs,'hp');
  compactPositive(S.sel,'hp');
  
if(++S.vt%30===0)S.scoreCache=Array.from({
    length:S.teamN
  },(_,t)=>kingdomScore(t));
  if(S.vt%30===0)compactRubble(gt);
  if(S.vt%6===0){
    fog();
    if(S.vt%(W*H>20000?24:W*H>9000?12:6)===0)mmUp()
  }
}
