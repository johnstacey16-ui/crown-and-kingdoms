/* Crown & Kingdoms — economy, combat, unit behaviour, AI, commands and fixed-step simulation. */
// Economy rates are continuous units/second; sea fishing has its own rate.
function unitSpeed(u){const tech=S.tech[u.t]||{};return (u.k==='scout'&&tech.lcav?1.5:U[u.k].sp)*((tech.husb&&CAVARM.has(u.k))?1.1:1)*((tech.squires&&INFARM.has(u.k))?1.1:1)*((u.k==='mil'&&tech.man)?(.96/.9):1)*(u.k==='vil'?1+(tech.wheel?.1:0)+(tech.handcart?.1:0):1)*((tech.fervor&&u.k==='mon')?1.15:1)}
/* ===== COMBAT ===== */
// Direct damage and its bonuses now belong to simulation-combat-bonuses.js.
/* ===== ECONOMY / UNIT BEHAVIOUR ===== */
// Farms have one live assigned worker. Old duplicate orders use stable unit order.
// Unit orders, combat, gathering and build work live in simulation-unit-behaviour.js.
/* Enemy strategy and composition-aware decisions are implemented in js/ai.js. */
/* ===== SIMULATION STEP ===== */
function WL(dt){for(const n of S.nodes)if(n.an&&(n.w=(n.w||0)-dt)<=0){n.w=3+S.r()*4;const[dx,dy]=D8[(S.r()*4)|0],x=n.x+dx,y=n.y+dy;if(x>0&&y>0&&x<W-1&&y<H-1&&!S.g[y*W+x]){S.g[n.y*W+n.x]=0;S.nd[n.y*W+n.x]=null;n.x=x;n.y=y;S.g[y*W+x]=1;S.nd[y*W+x]=n}}}
const mhp=u=>U[u.k].hp+(S.tech[u.t].hpb&&S.tech[u.t].hpb[u.k]||0);
function step(dt){foeGridDirty=true;S.t+=dt;if(S.vt%30===0)retryAutomaticFarmWorkers();for(const n of S.nodes)if(n&&n.fm&&n.amt<=0&&Number.isInteger(n.t)&&S.res[n.t]&&S.res[n.t].w>=60){S.res[n.t].w-=60;n.amt=farmFood(n.t);if(n.t===0)note('Farm reseeded (-60 wood)')}for(const u of S.us)upU(u,dt);sep();WL(dt);if(cmp)cmpTick(dt);if(vm)vict(dt);if(!cmp&&S.vt%30===0)elim();if(S.vt%150===0){for(const q of S.px)for(const k in q)q[k]+=q[k]<100?1:q[k]>100?-1:0;if(menu&&menu.items)for(const r of menu.items)if(r.up)r.up()}for(const q of S.rel){if(q.c){if(q.c.hp<=0)q.c=null;else{q.x=q.c.x;q.y=q.c.y}}if(q.m&&q.m.hp<=0){q.x=q.m.x+1;q.y=q.m.y+1;q.m=null}}
for(const s of S.us)if(s.cg&&s.cg.length){if(s.hp<=0)s.cg.forEach(c=>c.hp=0);else s.cg.forEach(c=>{c.x=s.x;c.y=s.y})}for(const b of S.bs)upB(b,dt);pjs(dt);if(!(cmp&&CAMP[cmp.i].noai))ai(dt);
for(const f of fx)f.l-=dt;compactPositive(fx,'l');compactPositive(S.us,'hp');compactPositive(S.bs,'hp');compactPositive(S.sel,'hp');
if(++S.vt%30===0)S.scoreCache=Array.from({length:S.teamN},(_,t)=>kingdomScore(t));if(S.vt%6===0){fog();if(S.vt%(W*H>20000?24:W*H>9000?12:6)===0)mmUp()}}



