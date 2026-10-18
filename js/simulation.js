/* Crown & Kingdoms — economy, combat, unit behaviour, AI, commands and fixed-step simulation. */
function tickTrader(u,dt){
 const endpoint=u.k==='cog'?'dock':'market',keyOf=b=>[b.t,b.k,b.x,b.y].join(':');
 // AoE2 DE Xbox fidelity: trade units follow their assigned routes; they do not
 // autonomously flee enemy forces or choose a new escape destination.
 // Clear the legacy flee state when restoring older saves.
 if(u.tradeFleeing){u.tradeFleeing=false;u.tradeThreatCheckAt=0;u.p=[];u.rp=0;u.tradeDestKey=null;u.tradeReturning=false;u.tradeCargo=0;}

 let src=u.tradeFromKey?S.bs.find(b=>keyOf(b)===u.tradeFromKey&&b.t===u.t&&b.k===endpoint&&b.done&&b.hp>0):null;
 if(!src){
  // A lost home depot must not silently reassign the player's trade route.
  if(u.t===0){u.tradePaused=true;u.tradeFromKey=null;u.tradeDestKey=null;u.tradeReturning=false;u.tradeCargo=0;u.o='i';u.p=[];u.rp=0;return}
  if((u.tradeSourceWait||0)>0){u.tradeSourceWait=Math.max(0,u.tradeSourceWait-dt);u.o='i';u.p=[];u.rp=0;return}
  const sources=S.bs.filter(b=>b.t===u.t&&b.k===endpoint&&b.done&&b.hp>0).sort((a,b)=>d2(u.x,u.y,a)-d2(u.x,u.y,b));src=sources.slice(0,24).find(b=>path(u,goalNear(b,1)))||null;
  u.tradeFromKey=src?keyOf(src):null;u.tradeDestKey=null;u.tradeReturning=false;u.tradeCargo=0;u.p=[];u.rp=0;
 }
 if(!src){if(u.t===0&&u.tradeDestKey){u.tradePaused=true;u.tradeDestKey=null;u.tradeReturning=false;u.tradeCargo=0}u.tradeSourceWait=4;u.o='i';u.p=[];u.rp=0;return}
 u.tradeSourceWait=0;
 let dest=u.tradeDestKey?S.bs.find(b=>keyOf(b)===u.tradeDestKey&&b.done&&b.hp>0&&b.t!==u.t&&b.k===endpoint&&!isHostile(u.t,b.t)):null;
 if(!dest){
  // Player trade routes require an explicit foreign market/dock order.
  // Do not silently pick a replacement destination on the player's behalf.
  if(u.t===0){u.tradeDestKey=null;u.tradeReturning=false;u.tradeCargo=0;u.p=[];u.rp=0;u.o='i';u.tradePaused=true;return}
  u.tradeDestKey=null;u.tradeReturning=false;u.tradeCargo=0;u.p=[];u.trWait=(u.trWait||0)-dt;
  if(u.trWait>0){u.o='i';u.p=[];u.rp=0;return}
  const candidates=S.bs.filter(b=>b.done&&b.hp>0&&b.k===endpoint&&Number.isInteger(b.t)&&b.t>=0&&b.t<S.teamN&&b.t!==u.t&&!isHostile(u.t,b.t)&&Math.hypot(b.x-src.x,b.y-src.y)>=6).map(b=>{
   const distance=Math.hypot(b.x-src.x,b.y-src.y);
   let danger=0;
   for(const e of S.us)if(e&&e.hp>0&&!e.ld&&isHostile(u.t,e.t)&&U[e.k]?.dmg>0&&!!U[e.k].sh===!!U[u.k].sh){
    const dx=b.x-src.x,dy=b.y-src.y,denom=dx*dx+dy*dy||1;
    const fraction=Math.max(0,Math.min(1,((e.x-src.x)*dx+(e.y-src.y)*dy)/denom));
    if(Math.hypot(e.x-(src.x+fraction*dx),e.y-(src.y+fraction*dy))<7)danger++;
   }
   return {b,score:distance-danger*12}
  }).sort((a,b)=>b.score-a.score);
  dest=null;for(const candidate of candidates.slice(0,24)){if(path(u,goalNear(candidate.b,1))){dest=candidate.b;break}}
  if(!dest){u.trWait=6;u.o='i';u.p=[];u.rp=0;return}
  u.tradeDestKey=keyOf(dest);u.trWait=0;
 }
 const goal=u.tradeReturning?src:dest;
 if(d2(u.x,u.y,goal)<=1.1){
  u.p=[];u.rp=0;
  if(u.tradeReturning){const earned=Number.isSafeInteger(u.tradeCargo)&&u.tradeCargo>0?u.tradeCargo:0,bank=S.res[u.t];if(earned&&bank&&Number.isSafeInteger(bank.g)&&Number.isSafeInteger(bank.g+earned)){bank.g+=earned;if(u.t===0)note(U[u.k].n+' delivered +'+earned+' gold')}u.tradeCargo=0;u.tradeReturning=false;u.tradeSourceWait=0;}
  else{
   const distance=Math.hypot((src.x+src.s/2)-(dest.x+dest.s/2),(src.y+src.s/2)-(dest.y+dest.s/2));
   u.tradeCargo=Number.isFinite(distance)?Math.max(2,Math.round(distance*0.35)):0;
   u.tradeReturning=true;u.rp=0;
  }
  u.o='i';return;
 }
 if(!u.p.length||u.rp<=0){
  const p=path(u,goalNear(goal,1));u.rp=1;
  if(!p){if(u.tradeReturning){u.tradeFromKey=null;u.tradeCargo=0;u.tradeReturning=false}else u.tradeDestKey=null;u.p=[];u.rp=0;u.trWait=5;u.o='i';return}
  u.p=p;
 }
 u.o='m';walk(u,dt)
}
function gatherCapacity(u){const tech=S.tech[u.t]||{};return CAP+(tech.carry?5:0)+(u.k==='vil'&&tech.wheel?3:0)+(u.k==='vil'&&tech.handcart?7:0)}
function unitSpeed(u){const tech=S.tech[u.t]||{};return U[u.k].sp*((tech.husb&&CAVARM.has(u.k))?1.1:1)*((tech.squires&&INFARM.has(u.k))?1.1:1)*((tech.wheel&&u.k==='vil')?1.05:1)*((tech.handcart&&u.k==='vil')?1.05:1)}
function walk(u,dt){const p=u.p;if(!p.length)return true;if(!Number.isFinite(dt)||dt<=0)return false;if(!Array.isArray(p[0])||p[0].length!==2){u.p=[];u.rp=0;return true}const[tx,ty]=p[0];if(!Number.isFinite(tx)||!Number.isFinite(ty)||tx<0||ty<0||tx>=W||ty>=H){u.p=[];u.rp=0;return true}if((u.sh?!(S.wt[(ty|0)*W+(tx|0)]&&!S.nd[(ty|0)*W+(tx|0)]):(S.wt[(ty|0)*W+(tx|0)]===1||S.g[(ty|0)*W+(tx|0)]&&S.gt[(ty|0)*W+(tx|0)]!==u.t+1))&&p.length>1){u.p=[];u.rp=0;return true}
const dx=tx-u.x,dy=ty-u.y,d=Math.hypot(dx,dy),st=Math.max(0,unitSpeed(u)*dt),tl=p.length>1?.45:u.o==='m'?.6:0;if(d<=st){const ox=u.x,oy=u.y;mv(u,dx,dy);if(u.x===ox&&u.y===oy&&d>0){u.p=[];u.rp=0;return true}p.shift()}else if(d<=tl)p.shift();else{const ox=u.x,oy=u.y;mv(u,dx/d*st,dy/d*st);if(u.x===ox&&u.y===oy){u.p=[];u.rp=0;return true}}return!p.length}
/* ===== COMBAT ===== */
function dmgT(a,t){if(!a||!t||!U[a.k]||(!t.s&&!U[t.k])||!Number.isFinite(t.hp)||t.hp<=0||t.ld||!S.tech[a.t]||!isHostile(a.t,t.t))return;const ak=U[a.k],tk=S.tech[a.t],ta=S.tech[t.t]||{},bd=(ak.rng<2?(tk.atkM2?5:tk.atkM?2:0):(tk.atkR2?3:tk.atkR?1:0))+(!t.s&&ak.bn&&(ak.bn[t.k]||ak.bn[U[t.k].lk])||0)+(!t.s&&a.k==='spear'&&tk.halb&&ak.bn&&(ak.bn[t.k]||ak.bn[U[t.k].lk])?6:0)+(t.s&&ak.bb||0)+(t.s&&ak.rng<2&&INFARM.has(a.k)&&tk.arson?2:0)+(tk.atkb&&tk.atkb[a.k]||0)+((a.k==='tw'||a.k==='cs'||a.k==='tca')?(tk.slit?2:0)+(tk.gtow?3:0)+(tk.keep?3:0)+(tk.gf?4:0):0),cls=ak.sg?'s':ak.rng>2?'p':'m',ib=(INFARM.has(t.k)&&ta.armI?1:0)+(ARCHARM.has(t.k)&&ta.armR?1:0)+(CAVARM.has(t.k)&&ta.armC?1:0),ar=t.s?(cls==='p'?8:2):cls==='p'?(PRA[t.k]||0)+ib:(MA[t.k]||0)+ib;t.hp-=Math.max(1,(ak.dmg+bd)*(!t.s&&ak.du?ak.du:1)-ar);fx.push({x:t.x+(t.s||0)/2,y:t.y+(t.s||0)/2,l:.2,k:'h'});if(!t.s)t.hit=gt;emit('spark',t.x+(t.s||0)/2,t.y+(t.s||0)/2,t.s?3:5,{s:2.2,vz:2.6,l:.35,c:ak.rng>2?'#e8d8a0':'#ffb050',r:1.6});
hitSnd(a,t);
if(t.t===0){S.ping={x:t.x+(t.s||0)/2,y:t.y+(t.s||0)/2,t:S.t};if(S.t-S.al>12){S.al=S.t;note('Under attack! L3 with nothing selected jumps there');sfx('horn');rumble(260,.6,.3)}}
if(t.hp<=0&&!t.dead){t.dead=1;if(t.s){for(let j=0;j<t.s;j++)for(let i=0;i<t.s;i++){S.g[(t.y+j)*W+t.x+i]=0;S.gt[(t.y+j)*W+t.x+i]=0}if(t.cg)for(const c of t.cg)c.ld=null;rub.push({x:t.x,y:t.y,s:t.s,t:gt});emit('smk',t.x+t.s/2,t.y+t.s/2,18,{s:1.6,vz:1.4,l:2.4,c:'#777',r:5});emit('deb',t.x+t.s/2,t.y+t.s/2,14,{s:3,vz:4,l:1,c:'#8a7a62',r:2.2});sfx('collapse',t.x+t.s/2,t.y+t.s/2);if(t.t===0)rumble(400,.9,.5);if(t.k==='tc'&&tcEnds(t)){if(cmp){if(t.t===0)endGame('lose','Your Town Centre fell');else if(CAMP[cmp.i].tcw)endGame('win','The enemy Town Centre fell')}else if(vm===0){if(t.t===0)endGame('lose','Your Town Centre fell');else if(!S.bs.some(b=>b.k==='tc'&&isHostile(0,b.t)&&b.hp>0))endGame('win','All hostile Town Centres have fallen');else note('A rival Town Centre has fallen')}else if(vm===6){if(t.t===0)endGame('lose','Your Town Centre fell in Sudden Death');else{for(const b of S.bs)if(b.t===t.t)b.hp=0;for(const u of S.us)if(u.t===t.t)u.hp=0;S.pj=S.pj.filter(p=>!p.a||p.a.t!==t.t);note(CIV[S.civ[t.t]].n+' was eliminated — Town Centre destroyed');if(!S.bs.some(b=>b.k==='tc'&&isHostile(0,b.t)&&b.hp>0))endGame('win','All hostile Town Centres have fallen in Sudden Death')}}}}else{sfx(U[t.k].sh?'sink':'death',t.x,t.y,{k:t.k});corp.push({x:t.x,y:t.y,k:t.k,tm:t.t,fd:t.fd||1,sh:!!U[t.k].sh,t:gt});emit('puff',t.x,t.y,6,{s:1.2,vz:1,l:.8,c:'#c8c0b0',r:3});if(corp.length>60)corp.shift();if(a.t===0)S.pl.kills++}}}
const hit=(a,t)=>{if(U[a.k].rng>2){sfx(U[a.k].sg?'launch':'bow',a.x,a.y);S.pj.push({x:a.x,y:a.y,t,a})}else dmgT(a,t)};
function pjs(dt){for(const p of S.pj){if(!p||!p.t||!p.a||!U[p.a.k]||!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Number.isFinite(p.t.x)||!Number.isFinite(p.t.y)||!Number.isFinite(p.t.hp)){if(p)p.dead=1;continue}const h=(p.t.s||0)/2,tx=p.t.x+h,ty=p.t.y+h,dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy),st=14*dt;if(p.t.hp<=0||p.t.ld||!isHostile(p.a.t,p.t.t))p.dead=1;else if(d<=st+.3){dmgT(p.a,p.t);const sp=U[p.a.k]&&U[p.a.k].spl;if(sp){const ix=p.t.x+h,iy=p.t.y+h;for(const e of S.us)if(e!==p.t&&isHostile(p.a.t,e.t)&&e.hp>0&&!e.ld&&Math.hypot(e.x-ix,e.y-iy)<sp)dmgT(p.a,e);for(const e of S.bs)if(e!==p.t&&isHostile(p.a.t,e.t)&&e.hp>0&&Math.hypot(e.x+(e.s||0)/2-ix,e.y+(e.s||0)/2-iy)<sp)dmgT(p.a,e);}p.dead=1}else{p.x+=dx/d*st;p.y+=dy/d*st}}compactNotFlag(S.pj,'dead')}
const FOE_CELL=8,FOE_BUCKETS=new Map(),FOE_BUCKET_POOL=[];
let foeGridDirty=true,foeGridEpoch=0;
function rebuildFoeGrid(){
 foeGridEpoch++;
 for(const bin of FOE_BUCKETS.values()){bin.length=0;FOE_BUCKET_POOL.push(bin)}
 FOE_BUCKETS.clear();
 for(let i=0;i<S.us.length;i++){
  const e=S.us[i];if(!e||e.hp<=0||e.ld)continue;
  const key=Math.floor(e.x/FOE_CELL)+','+Math.floor(e.y/FOE_CELL);
  let bin=FOE_BUCKETS.get(key);
  if(!bin){bin=FOE_BUCKET_POOL.pop()||[];FOE_BUCKETS.set(key,bin)}
  bin.epoch=foeGridEpoch;bin.push(i)
 }
 for(const [key,bin]of FOE_BUCKETS)if(bin.epoch!==foeGridEpoch)FOE_BUCKETS.delete(key);
 foeGridDirty=false
}
function nearestFoeUnit(u,r){
 if(foeGridDirty)rebuildFoeGrid();
 let b=null,bd=r,bi=Infinity;
 /* One-cell margin tolerates units crossing a bucket boundary during this fixed step. */
 const minX=Math.floor((u.x-r)/FOE_CELL)-1,maxX=Math.floor((u.x+r)/FOE_CELL)+1;
 const minY=Math.floor((u.y-r)/FOE_CELL)-1,maxY=Math.floor((u.y+r)/FOE_CELL)+1;
 for(let cy=minY;cy<=maxY;cy++)for(let cx=minX;cx<=maxX;cx++){
  const bin=FOE_BUCKETS.get(cx+','+cy);if(!bin)continue;
  for(const i of bin){
   const e=S.us[i];
   if(!e||!isHostile(u.t,e.t)||e.hp<=0||e.ld)continue;
   const d=Math.hypot(e.x-u.x,e.y-u.y);
   if(d<bd||(d===bd&&d<r&&i<bi)){bd=d;b=e;bi=i}
  }
 }
 return b
}
function foe(u,r){
 let b=null,bd=r;
 if(U[u.k]?.sg){
  for(const q of S.bs)if(isHostile(u.t,q.t)&&q.hp>0){const d=d2(u.x,u.y,q);if(d<bd){bd=d;b=q}}
  if(b)return b
 }
 b=nearestFoeUnit(u,r);if(b)return b;
 for(const q of S.bs)if(isHostile(u.t,q.t)&&q.hp>0){const d=d2(u.x,u.y,q);if(d<bd){bd=d;b=q}}
 return b
}
/* ===== ECONOMY / UNIT BEHAVIOUR ===== */
function findNode(u,k,r=16){let b=null,bd=r;for(const n of S.nodes)if(n.k===k&&n.amt>0&&!!n.fi===!!u.sh&&(!n.trap||n.t===u.t)){const d=Math.hypot(n.x-u.x,n.y-u.y);if(d<bd){bd=d;b=n}}return b}
function dropoffKey(q){return [q.t,q.k,q.x,q.y].join(':')}
function dropoffCompatible(u,q){return q.t===u.t&&q.hp>0&&q.done&&(u.sh?q.k==='dock':q.k==='tc'||(q.k==='lumber'&&u.ct==='w')||(q.k==='mine'&&(u.ct==='g'||u.ct==='s'))||(q.k==='mill'&&u.ct==='f'))}
function skipDropoff(u,q){if(!u||!q)return;const key=dropoffKey(q);if(!Array.isArray(u.dropSkipKeys))u.dropSkipKeys=[];if(!u.dropSkipKeys.includes(key)){if(u.dropSkipKeys.length>=32)u.dropSkipKeys.shift();u.dropSkipKeys.push(key)}}
function findDropoffRoute(u){
 const compatible=S.bs.filter(q=>dropoffCompatible(u,q)).sort((a,b)=>d2(u.x,u.y,a)-d2(u.x,u.y,b));
 if(!compatible.length)return null;
 const live=new Set(compatible.map(dropoffKey));
 u.dropSkipKeys=(Array.isArray(u.dropSkipKeys)?u.dropSkipKeys:[]).filter(key=>live.has(key)).slice(-32);
 let candidates=compatible.filter(q=>!u.dropSkipKeys.includes(dropoffKey(q)));
 if(!candidates.length){u.dropSkipKeys=[];candidates=compatible.slice()}
 candidates.sort((a,b)=>(dropoffKey(a)===u.dropKey?-1:dropoffKey(b)===u.dropKey?1:0)||d2(u.x,u.y,a)-d2(u.x,u.y,b));
 let failed=0;
 for(const q of candidates){
  const route=path(u,goalNear(q,1));
  if(route&&route.length)return {b:q,route};
  skipDropoff(u,q);
  if(++failed>=2)break;
 }
 return null;
}
function deployFishTrap(ships){let made=0;for(const u of ships){if(!u||u.k!=='fish'||u.hp<=0||u.ld||!S.res[u.t]||S.res[u.t].w<100)continue;let spot=null;for(let r=1;r<=4&&!spot;r++)for(let y=Math.max(1,(u.y|0)-r);y<=Math.min(H-2,(u.y|0)+r)&&!spot;y++)for(let x=Math.max(1,(u.x|0)-r);x<=Math.min(W-2,(u.x|0)+r);x++){const i=y*W+x;if(S.wt[i]===1&&!S.nd[i]&&!S.g[i]&&Math.hypot(x+.5-u.x,y+.5-u.y)<=4){spot={x,y,i};break}}if(!spot)continue;S.res[u.t].w-=100;const n={k:'f',x:spot.x,y:spot.y,s:1,amt:900,fi:1,trap:1,t:u.t};S.nodes.push(n);S.nd[spot.i]=n;made++;}if(made)note('Fish trap deployed ('+made+'; -'+made*100+' wood)');else note('Need 100 wood per trap and an empty nearby water tile');return made}
function killNode(n){if(!n||!S.nodes.includes(n))return false;const i=n.y*W+n.x;if(S.nd[i]===n){S.nd[i]=null;S.g[i]=0}S.nodes=S.nodes.filter(m=>m!==n);return true}
function upU(u,dt){const d=U[u.k];u.cd-=dt;u.rp-=dt;let tg=u.tg;if(u.ld)return;if(u.t===0&&u.k==='vil'&&u.o==='i'&&u.autoWorker&&S.vp&&S.vp.enabled){if((u.autoTry||0)<=0){u.autoTry=3;if(assignAutoVillager(u))return}else u.autoTry-=dt}if(u.retreating){const shelter=S.bs.find(b=>b===u.retreatTarget&&b.t===u.t&&b.hp>0&&b.done&&(b.k==='tc'||b.k==='castle'))||S.bs.filter(b=>b.t===u.t&&b.done&&b.hp>0&&(b.k==='tc'||b.k==='castle')).sort((a,b)=>d2(u.x,u.y,a)-d2(u.x,u.y,b))[0];if(!shelter){u.retreating=false;u.retreatTarget=null;u.retreatRestUntil=0;u.tg=null;u.p=[];u.o='i'}else{u.retreatTarget=shelter;if(d2(u.x,u.y,shelter)<=1.3){u.p=[];u.o='i';// Shelter proximity alone does not heal military units. Monks and unit-specific abilities use their own rules.
if(u.hp>=mhp(u)*.65||S.t>=(u.retreatRestUntil||(u.retreatRestUntil=S.t+8))){u.retreating=false;u.retreatTarget=null;u.retreatRestUntil=0;u.tg=null}}else{if((!u.p.length||u.rp<=0)&&S.t>=(u.retreatRouteRetryAt||0)){u.p=path(u,goalNear(shelter,1))||[];u.rp=1;u.retreatRouteRetryAt=S.t+(u.p.length?1:5)}if(u.p.length)walk(u,dt);return}if(u.retreating)return}}if((u.k==='cart'||u.k==='cog')&&u.o!=='B'){if(u.tradePaused){u.o='i';u.p=[];u.rp=0;return}if(u.manualTradeMove&&u.o==='m'){if(walk(u,dt)){u.o='i';u.manualTradeMove=false;u.tradeFromKey=null;u.tradeDestKey=null;u.tradeReturning=false;u.tradeCargo=0;u.tradeFleeing=false}return}u.manualTradeMove=false;tickTrader(u,dt);return}if(u.k==='bers'&&u.hp<mhp(u))u.hp=Math.min(mhp(u),u.hp+.5*dt);
if(u.k==='mon'&&(u.hc=(u.hc||0)-dt)<=0){u.hc=1;for(const e of S.us)if(e.t===u.t&&e.hp<mhp(e)&&Math.hypot(e.x-u.x,e.y-u.y)<4)e.hp=Math.min(mhp(e),e.hp+4)}
if(u.o==='F'||u.o==='G'){const target=u.tg;if(!target||target.hp<=0||(!U[target.k]&&!target.q)||(target.q&&!target.done)||(target.t!==u.t&&diplomacyRelation(u.t,target.t)!=='ally')||!!U[u.k]?.sh!==!!(U[target.k]&&U[target.k].sh)){u.o='i';u.tg=null;u.guardTarget=null;u.p=[];return}if(u.o==='G'&&u.st!==4){const e=foe(u,6);if(e&&e!==target&&d2(target.x,target.y,e)<=5){u.guardTarget=target;u.o='a';u.tg=e;u.p=[];return}}const spacing=u.o==='F'?1.25:2,dist=d2(u.x,u.y,target);if(dist<=spacing){u.p=[];return}if(!u.p.length||u.rp<=0){u.p=path(u,goalNear(target,spacing))||[];u.rp=.6}if(u.p.length)walk(u,dt);return}if(u.o==='i'){if(u.as&&(u.sa=(u.sa||0)-dt)<=0){u.sa=1;const x=2+S.r()*(W-4),y=2+S.r()*(H-4),p=path(u,gp(x,y,2.5));if(p){u.o='m';u.p=p}}if(u.k==='mon'&&u.t>0&&(u.sc=(u.sc||0)-dt)<=0){u.sc=1;const e=u.st===4?null:foe(u,9);if(e&&!e.q){u.o='v';u.tg=e;u.p=[]}else{const rl=S.rel.find(x=>!x.c&&!x.m);if(rl){u.o='r';u.tg=rl;u.p=[]}}}if(u.k!=='vil'&&u.k!=='mon'&&u.k!=='fish'&&u.k!=='trn'&&u.k!=='king'&&u.k!=='cart'&&u.k!=='cog'&&(u.sc=(u.sc||0)-dt)<=0){u.sc=.5;const sr=[7,4,d.rng,0,0][u.st|0],e=sr>0?foe(u,sr):null;if(e){u.o='a';u.tg=e;u.p=[]}}return}
if(u.o==='m'){if(walk(u,dt))u.o='i';return}
if(u.o==='B'){if(!tg||tg.hp<=0||tg.t!==u.t&&diplomacyRelation(u.t,tg.t)!=='ally'||tg.q&&!tg.done||(tg.q?!GAR[tg.k]:!U[tg.k]?.cap)||!!u.sh||(U[tg.k]?.cap&&u.t!==tg.t)||(tg.cg||[]).length>=(tg.q?GAR[tg.k]:U[tg.k].cap)||u===tg||u.ld){u.o='i';u.tg=null;u.p=[];u.rp=0;return}if(tg.q?d2(u.x,u.y,tg)<=1.4:Math.hypot(tg.x-u.x,tg.y-u.y)<=2){u.ld=tg;(tg.cg=tg.cg||[]).push(u);u.ut=null;u.tradeFromKey=null;u.tradeDestKey=null;u.tradeReturning=false;u.tradeCargo=0;u.tradePaused=false;u.manualTradeMove=false;u.tradeFleeing=false;u.x=tg.x+(tg.s||0)/2;u.y=tg.y+(tg.s||0)/2;u.o='i';u.p=[];u.rp=0;return}
if(!u.p.length||u.rp<=0){const p=path(u,goalNear(tg,1.7));u.rp=.8;if(!p){u.o='i';u.tg=null;u.p=[];u.rp=0;if(u.t===0)note('No route to board that transport');return}u.p=p}walk(u,dt);return}
if(u.o==='U'){const q=u.ut;if(u.k!=='trn'||!Array.isArray(q)||q.length!==2||!q.every(Number.isFinite)||q[0]<0||q[1]<0||q[0]>=W||q[1]>=H||S.wt[(q[1]|0)*W+(q[0]|0)]===1||!u.cg||!u.cg.some(c=>c&&c.hp>0&&c.ld===u)){u.o='i';u.ut=null;u.p=[];u.rp=0;return}if((!u.p.length||u.rp<=0)&&S.t>=(u.unloadRouteRetryAt||0)){const p=path(u,gp(q[0],q[1],3));u.rp=1;u.unloadRouteRetryAt=S.t+2;if(!p){u.o='i';u.ut=null;u.p=[];u.rp=0;if(u.t===0)note('Transport cannot reach that landing area');return}u.p=p}
if(!u.p.length&&S.t<(u.unloadRouteRetryAt||0))return;if(walk(u,dt)){const cg=(u.cg||[]).filter(c=>c&&c.hp>0&&c.ld===u);let unloaded=0;const occupied=new Set(S.us.filter(v=>v.hp>0&&!v.ld).map(v=>(v.y|0)*W+(v.x|0)));for(const c of cg){let sp=null,best=Infinity;for(let r=1;r<=4;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=(u.x|0)+dx,y=(u.y|0)+dy;if(x>0&&y>0&&x<W-1&&y<H-1&&!S.g[y*W+x]&&S.wt[y*W+x]!==1&&!S.nd[y*W+x]&&!occupied.has(y*W+x)&&Math.hypot(x+.5-q[0],y+.5-q[1])<=5){const score=Math.hypot(x+.5-q[0],y+.5-q[1])+r*.05;if(score<best){best=score;sp=[x+.5,y+.5]}}}if(sp){occupied.add((sp[1]|0)*W+(sp[0]|0));c.x=sp[0];c.y=sp[1];c.ld=null;c.o='i';c.tg=null;c.ut=null;c.p=[];c.rp=0;unloaded++}}u.cg=cg.filter(c=>c.ld===u&&c.hp>0);u.o='i';u.ut=null;u.p=[];u.rp=0;if(u.t===0&&cg.length&&!unloaded)note('No safe shore to unload; move closer to land');else if(u.t===0&&u.cg.length)note('Some passengers could not disembark');else if(u.t===0&&unloaded)note('Passengers unloaded: '+unloaded)}return}
if(u.o==='rep'){if(!tg||tg.hp<=0||(tg.t!==u.t&&diplomacyRelation(u.t,tg.t)!=='ally')||!tg.sh||tg.hp>=mhp(tg)){u.o='i';u.tg=null;return}if(d2(u.x,u.y,tg)<=1.5){u.p=[];tg.hp=Math.min(mhp(tg),tg.hp+mhp(tg)*dt/40);if(tg.hp>=mhp(tg)){u.o='i';u.tg=null;if(u.t===0)note('Ship repaired')}}else{if(!u.p.length||u.rp<=0){const p=path(u,goalNear(tg,1.2));u.rp=1;if(!p){u.o='i';u.tg=null;return}u.p=p}walk(u,dt)}return}
if(u.o==='v'){if(!tg||tg.hp<=0||tg.t===u.t||tg.q){u.o='i';u.tg=null;return}
if(Math.hypot(tg.x-u.x,tg.y-u.y)<=5){u.p=[];if(u.cd<=0){u.cv=(u.cv||0)+dt;if(u.cv>=3){u.cv=0;u.cd=8;fx.push({x:tg.x,y:tg.y,l:.5,k:'p'});if(S.r()<.7){tg.t=u.t;tg.o='i';tg.p=[];tg.tg=null;tg.car=0;if(tg.rel){tg.rel.c=null;tg.rel=null}note((u.t===0?'Converted enemy ':'Your ')+U[tg.k].n+(u.t===0?'!':' was converted!'))}u.o='i'}}}
else{if(!u.p.length||u.rp<=0){const p=path(u,goalNear(tg,4.5));u.rp=.7;if(!p){u.o='i';return}u.p=p}walk(u,dt)}return}
if(u.o==='r'){if(!u.rel){if(!tg||!tg.rl||tg.c||tg.m){u.o='i';u.tg=null;return}if(Math.hypot(tg.x-u.x,tg.y-u.y)<=1){tg.c=u;u.rel=tg;return}
if(!u.p.length||u.rp<=0){const p=path(u,goalNear(tg,.8));u.rp=1;if(!p){u.o='i';return}u.p=p}walk(u,dt);return}
let mb=null,bd=1e9;for(const q of S.bs)if(q.t===u.t&&q.done&&q.k==='monastery'){const d=d2(u.x,u.y,q);if(d<bd){bd=d;mb=q}}
if(!mb){u.o='i';return}if(bd<=1.3){u.rel.c=null;u.rel.m=mb;u.rel=null;u.o='i';if(u.t===0)note('Relic garrisoned: +0.5 gold/s');return}
if(!u.p.length||u.rp<=0){const p=path(u,goalNear(mb,1));u.rp=1;if(!p){u.o='i';return}u.p=p}walk(u,dt);return}
if(u.o==='p'){const e=u.st===4?null:foe(u,6);if(e){u.o='a';u.tg=e;u.p=[];return}const pt=u.pt;if(!pt){u.o='i';return}
if(!u.p.length||u.rp<=0){const g=pt.to?pt.b:pt.a,p=path(u,gp(g[0],g[1],1.2));u.rp=2;if(!p){u.o='i';return}u.p=p}if(walk(u,dt)){if(pt.once){u.o='i';u.pt=null}else{pt.to^=1;u.p=[]}}return}
if(u.o==='a'){if(!tg||tg.hp<=0||tg.t===u.t){const guard=u.guardTarget&&u.guardTarget.hp>0?u.guardTarget:null;u.o=guard?'G':u.pt?'p':'i';u.tg=guard;u.guardTarget=null;u.p=[];return}
if(u.k!=='vil'&&tg.q&&(u.ac=(u.ac||0)-dt)<=0){u.ac=.6;const e=foe(u,4);if(e&&!e.q)u.tg=tg=e}
const dist=d2(u.x,u.y,tg),minR=d.minR||0;
if(minR&&dist<minR){if(!u.p.length||u.rp<=0){const p=path(u,goalNear(tg,minR+.5));u.rp=.7;if(!p){u.o='i';return}u.p=p}walk(u,dt);return}
if(dist<=d.rng){u.p=[];if(u.cd<=0){hit(u,tg);u.cd=d.cd}}
else if(u.st===2){u.o='i';u.tg=null}else{if(!u.p.length||u.rp<=0){const p=path(u,goalNear(tg,d.rng-(d.rng>2?.4:.1)));u.rp=.7;if(!p){u.o='i';return}u.p=p}walk(u,dt)}return}
if(u.o==='g'){
if(u.ret){
 const b=S.bs.find(q=>dropoffKey(q)===u.dropKey&&dropoffCompatible(u,q));
 if(b&&d2(u.x,u.y,b)<=1.1){S.res[u.t][u.ct]+=u.car;if(u.t===0)S.pl.gath+=u.car;u.car=0;u.ret=0;u.p=[];u.dropKey='';u.dropRetry=0;return}
 if(!b||!u.p.length||u.rp<=0){
  if((u.dropRetry||0)>0){u.dropRetry-=dt;return}
  const dest=findDropoffRoute(u);
  if(!dest){u.dropKey='';u.p=[];u.dropRetry=3;return}
  u.dropKey=dropoffKey(dest.b);u.p=dest.route;u.rp=1;u.dropRetry=0;
 }
 walk(u,dt);return
}
if(!tg||tg.amt<=0||S.nd[tg.y*W+tg.x]!==tg||!!tg.fi!==!!u.sh||tg.trap&&tg.t!==u.t){const a=u.autoWorker&&u.t===0?findReachableAutoNode(u,u.ct,36):null,n=a?a.n:(!u.autoWorker?findNode(u,u.ct):null);if(n){u.tg=n;u.p=a?a.route:[];u.rp=a?1:0}else if(u.car>0){u.ret=1;u.p=[]}else u.o='i';return}
if(d2(u.x,u.y,tg)<=1.1){const g=Math.min(tg.amt,GR*gm(u,tg)*(tg.an?(S.tech[u.t].hunt?2.2:1.5):1)*dt);tg.amt-=g;u.car+=g;u.ct=tg.k;if(gt>(u.sn||0)){u.sn=gt+.7+Math.random()*.5;if(tg.k==='w')sfx('chop',u.x,u.y);else if(tg.k==='g'||tg.k==='s')sfx('mine',u.x,u.y);else if(tg.k==='f'||tg.k==='b'||tg.k==='d')sfx('harvest',u.x,u.y)}if(tg.amt<=0){if(tg.trap){tg.amt=900;if(u.t===0)note('Fish trap replenished')}else if(tg.fm){tg.amt=0;if(u.t===0)note('Farm exhausted; awaiting owner 60 wood to reseed')}else{killNode(tg);if(u.t===0)note(NM[tg.k]+' depleted')}}if(u.car>=gatherCapacity(u)){u.ret=1;u.p=[]}}
else{if(!u.p.length||u.rp<=0){const p=path(u,goalNear(tg,1));u.rp=1;if(!p){if(u.t===0&&u.autoWorker)skipAutoNode(u,tg);u.o='i';if(u.t===0)note('No route to resource');return}u.p=p}walk(u,dt)}return}
if(u.o==='b'){if(!tg||tg.hp<=0||(tg.t!==u.t&&diplomacyRelation(u.t,tg.t)!=='ally')||(tg.done&&tg.hp>=tg.mh)){u.o='i';u.tg=null;if(tg&&tg.done&&tg.hp>0){const ak={lumber:'w',mine:'g',mill:'f'}[tg.k],n=ak&&findNode(u,ak,16);if(n){u.o='g';u.tg=n;u.ct=n.k;u.p=[];u.ret=0}}return}
if(d2(u.x,u.y,tg)<=1.1){if(tg.done)tg.hp=Math.min(tg.mh,tg.hp+tg.mh*dt/(S.tech[u.t].crane?32:40));else{const buildRate=S.tech[u.t].crane?1.2:1;tg.pr+=dt*buildRate;if(gt>(u.sn||0)){u.sn=gt+.8+Math.random()*.4;sfx('hammer',u.x,u.y)}tg.hp=Math.min(tg.mh,tg.mh*tg.pr/B[tg.k].bt+1);
if(tg.pr>=B[tg.k].bt){tg.done=true;tg.hp=tg.mh;sfx('built',tg.x+tg.s/2,tg.y+tg.s/2);if(tg.t===0){S.pl.bl++;note(B[tg.k].n+' complete')}}}}
else{if(!u.p.length||u.rp<=0){const p=path(u,goalNear(tg,1));u.rp=1;if(!p){u.o='i';return}u.p=p}walk(u,dt)}}}
function spawnPos(b){const occupied=new Set();for(const u of S.us)if(u.hp>0&&!u.ld&&Number.isFinite(u.x)&&Number.isFinite(u.y)){const x=Math.floor(u.x),y=Math.floor(u.y);if(Math.abs(u.x-(x+.5))<.35&&Math.abs(u.y-(y+.5))<.35)occupied.add(y*W+x)}for(let i=-1;i<=b.s;i++)for(const[x,y]of[[b.x+i,b.y-1],[b.x+i,b.y+b.s],[b.x-1,b.y+i],[b.x+b.s,b.y+i]]){if(x<0||y<0||x>=W||y>=H)continue;const ix=y*W+x;if(!(b.k==='dock'?(S.wt[ix]===1||S.wt[ix]===2)&&!S.nd[ix]&&!S.g[ix]:!S.g[ix]&&S.wt[ix]!==1&&!S.nd[ix]))continue;if(occupied.has(ix))continue;return[x+.5,y+.5]}return null}
function research(b,k){if(!b||b.hp<=0||!b.done||!S||!Number.isInteger(b.t)||!S.tech[b.t]||!B[b.k])return false;const t=b.t;if(b.q&&b.q.length){if(!t)note('Finish or cancel training before researching');return false}if(b.rs){if(!t)note('Already researching here');return false}if(S.bs.some(x=>x!==b&&x.t===t&&x.hp>0&&x.rs&&x.rs.k===k)){if(!t)note(k==='age'?'Age advance already in progress':'Technology already being researched');return false}let d;
if(k==='age'){if(b.k!=='tc'){if(!t)note('Advance Age requires a Town Centre');return false}const g=AG[S.age[t]+1];if(!g){if(!t)note('Already Imperial Age');return false}const built=[...new Set(S.bs.filter(x=>x.t===t&&x.done&&x.hp>0&&g.needs.includes(x.k)&&B[x.k]&&(B[x.k].age||0)===S.age[t]).map(x=>x.k))];if(built.length<2){const missing=g.needs.map(k=>B[k]?.n||k).filter((n,i)=>!built.includes(g.needs[i]));if(!t)note('Needs 2 different current-age buildings ('+built.length+'/2)');return false}d=g}
else{d=TE[k];if(!d||!Array.isArray(B[b.k].rs)||!B[b.k].rs.includes(k)){if(!t)note('Research unavailable at this building');return false}if(S.tech[t][k]||d.age>S.age[t]||(d.pre&&!S.tech[t][d.pre])){if(!t)note('Locked');return false}}
if(!can(t,d.cost)){if(!t)note('Not enough resources');return false}pay(t,d.cost);b.rs={k,t:d.t};return true}
const MILITARY_PRODUCTION_BUILDINGS=new Set(['bar','rng','stable','siege','castle','monastery','dock']);
function trainRate(b,k){return S.tech[b.t]&&S.tech[b.t].cons&&MILITARY_PRODUCTION_BUILDINGS.has(b.k)&&!['vil','cart','fish','trn','cog'].includes(k)?4/3:1}
function upB(b,dt){if(!b||!b.done||b.hp<=0||!Number.isFinite(dt)||dt<=0)return;
if(b.k==='monastery')S.res[b.t].g+=S.rel.filter(q=>q.m===b).length*.5*dt;const ak=B[b.k].atk;if(ak){b.cd=(b.cd||0)-dt;if(b.cd<=0){const o={k:ak,t:b.t,x:b.x+b.s/2,y:b.y+b.s/2},e=foe(o,U[ak].rng);if(e&&!e.q){const na=1+(S.tech[b.t].ys?1:0)+Math.min(8,(b.cg||[]).filter(c=>U[c.k].dmg>3).length);for(let q=0;q<na;q++)S.pj.push({x:o.x,y:o.y,t:e,a:{k:ak,t:b.t}});sfx('bow',o.x,o.y);b.cd=U[ak].cd}}}
if(b.rs){b.rs.t-=dt;if(b.rs.t<=0){const k=b.rs.k;b.rs=null;if(k==='age'){S.age[b.t]++;if(b.t===0){note(AG[S.age[0]].n+' reached!');rumble(500,.7,.7);{const tc0=S.bs.find(x=>x.t===0&&x.k==='tc');if(tc0)emit('spark',tc0.x+1.5,tc0.y+1.5,40,{s:4,vz:5,l:1.2,c:'#f2c14e',r:2.4})}if(b.t===0)sfx('age')}}else{const T0=S.tech[b.t],e=TE[k];T0[k]=1;if(['coll','plow','crop'].includes(k)){const add=k==='coll'?75:k==='plow'?125:175;for(const n of S.nodes)if(n.k==='f'&&n.fm&&n.t===b.t&&S.nd[n.y*W+n.x]===n)n.amt+=add}if(e.hpb){T0.hpb=T0.hpb||{};for(const q in e.hpb){T0.hpb[q]=(T0.hpb[q]||0)+e.hpb[q];for(const x of S.us)if(x.t===b.t&&x.k===q&&x.hp>0)x.hp+=e.hpb[q]}}if(e.atkb){T0.atkb=T0.atkb||{};for(const q in e.atkb)T0.atkb[q]=(T0.atkb[q]||0)+e.atkb[q]}if(k==='mas')for(const x of S.bs)if(x.t===b.t){x.mh=Math.round((x.mh||B[x.k].hp)*1.4);x.hp=Math.min(x.mh,Math.round(x.hp*1.4))}if(k==='fw')for(const x of S.bs)if(x.t===b.t&&(x.k==='wall'||x.k==='gate')){x.mh=Math.round((x.mh||B[x.k].hp)*1.8);x.hp=Math.min(x.mh,Math.round(x.hp*1.8))}if(e.fx)e.fx(b.t);if(b.t===0){note(e.n+' researched');sfx('tech')}}}}
if(!b.q.length)return;const q=b.q[0];if(!q||!U[q.k]||!Number.isFinite(q.t)){b.q.shift();return}if(!Number.isFinite(dt)||dt<=0)return;q.t-=dt*trainRate(b,q.k);if(q.t<=0){if(popOf(b.t)>=capOf(b.t)){q.t=0;return}const p=spawnPos(b);if(!p){q.t=0;return}b.q.shift();if(b.t===0)sfx('train',b.x+b.s/2,b.y+b.s/2);const nu=addU(b.t,q.k,p[0],p[1]);if(q.k==='cart'||q.k==='cog')nu.tradeFromKey=[b.t,b.k,b.x,b.y].join(':');const ry=b.rally;if(ry){if(q.k==='vil')nu.autoWorker=0;if(ry.t&&ry.t.amt>0&&q.k==='vil'){nu.o='g';nu.tg=ry.t;nu.ct=ry.t.k}else{const rp=path(nu,gp(ry.x,ry.y,1.5));if(rp){nu.o='m';nu.p=rp}}}if(b.t===0){S.pl.tr++;note(unitName(q.k,b.t)+' trained')}}}
function queuedPopulation(t){return S.bs.reduce((n,b)=>n+(b.t===t&&b.hp>0&&Array.isArray(b.q)?b.q.length:0),0)}
function train(b,k){if(!b||b.hp<=0||!b.done||!Number.isInteger(b.t)||!S||!S.tech[b.t]||!B[b.k]||!Array.isArray(B[b.k].tr)||!B[b.k].tr.includes(k)||!U[k]||!Array.isArray(b.q)||b.rs)return false;const t=b.t,d=U[k];if(d.age>S.age[t]){if(!t)note('Requires '+AG[d.age].n);return false}if(!can(t,d.cost)){if(!t)note('Not enough resources');return false}
if(popOf(t)>=capOf(t)){if(!t)note('Population cap reached - build houses');return false}if(b.q.length>=5)return false;pay(t,d.cost);b.q.push({k,t:d.t});return true}
function cancelQ(b){if(!b||b.hp<=0||!b.done||!Number.isInteger(b.t)||!S||!S.tech[b.t]||!Array.isArray(b.q)||!b.q.length)return false;const q=b.q[b.q.length-1];if(!q||!U[q.k]){b.q.pop();return false}b.q.pop();pay(b.t,U[q.k].cost,1);note('Cancelled - full refund');return true}
function okPlace(t,k,x,y){if(!S||!B[k]||!Number.isInteger(t)||!S.tech[t]||!Number.isInteger(x)||!Number.isInteger(y))return false;if(vm===6&&k==='tc')return false;const s=B[k].s;if(x<1||y<1||x+s>W-1||y+s>H-1)return false;
for(let j=0;j<s;j++)for(let i=0;i<s;i++){const n=(y+j)*W+x+i;if(S.g[n]||S.wt[n]||(t===0&&!S.ex[n]))return false}if(B[k].wat){let w=0;for(let j=-1;j<=s;j++)for(let i=-1;i<=s;i++){const X2=x+i,Y2=y+j;if((i<0||j<0||i>=s||j>=s)&&X2>=0&&Y2>=0&&X2<W&&Y2<H&&S.wt[Y2*W+X2]&&!S.nd[Y2*W+X2])w++}if(!w)return false}return true}
/* Enemy strategy and composition-aware decisions are implemented in js/ai.js. */
/* ===== SIMULATION STEP ===== */
const mv=(u,dx,dy)=>{const x=u.x+dx,y=u.y+dy;if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=W||y>=H)return;const i=(y|0)*W+(x|0);if(u.sh?S.wt[i]&&!S.nd[i]:(!S.g[i]||S.gt[i]===u.t+1)&&S.wt[i]!==1){u.x=x;u.y=y}};
/* Local spatial grid for unit separation. The old all-pairs pass compared every unit with every other unit (O(n²)); units only need checking against nearby cells. The separation radius and displacement remain unchanged. */
const SEP_GRID=new Map(),SEP_BUCKET_POOL=[];
function sep(){const us=S.us;if(us.length<=64){for(let i=0;i<us.length;i++){const a=us[i];if(a.hp<=0)continue;for(let j=i+1;j<us.length;j++){const b=us[j];if(a.ld||b.ld||a.hp<=0||b.hp<=0||Math.abs(a.x-b.x)>.5||Math.abs(a.y-b.y)>.5)continue;let dx=a.x-b.x,dy=a.y-b.y;const d=Math.hypot(dx,dy)||.01;if(d<.5){const p=(.5-d)*.25;dx/=d;dy/=d;mv(a,dx*p,dy*p);mv(b,-dx*p,-dy*p)}}}return}const grid=SEP_GRID;for(const bucket of grid.values()){bucket.length=0;SEP_BUCKET_POOL.push(bucket)}grid.clear();const gw=W*2+4,key=(x,y)=>y*gw+x;/* Return used buckets to a pool, then reuse their arrays to avoid per-tick garbage. */for(let i=0;i<us.length;i++){const a=us[i];if(a.ld||a.hp<=0)continue;const gx=Math.floor(a.x*2),gy=Math.floor(a.y*2);for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const bucket=grid.get(key(gx+ox,gy+oy));if(!bucket)continue;for(const j of bucket){const b=us[j];if(b.ld||b.hp<=0||Math.abs(a.x-b.x)>.5||Math.abs(a.y-b.y)>.5)continue;let dx=a.x-b.x,dy=a.y-b.y;const d=Math.hypot(dx,dy)||.01;if(d<.5){const p=(.5-d)*.25;dx/=d;dy/=d;mv(a,dx*p,dy*p);mv(b,-dx*p,-dy*p)}}}const k=key(gx,gy),bucket=grid.get(k);if(bucket)bucket.push(i);else{const next=SEP_BUCKET_POOL.pop()||[];next.push(i);grid.set(k,next)}}}

function WL(dt){for(const n of S.nodes)if(n.an&&(n.w=(n.w||0)-dt)<=0){n.w=3+S.r()*4;const[dx,dy]=D8[(S.r()*4)|0],x=n.x+dx,y=n.y+dy;if(x>0&&y>0&&x<W-1&&y<H-1&&!S.g[y*W+x]){S.g[n.y*W+n.x]=0;S.nd[n.y*W+n.x]=null;n.x=x;n.y=y;S.g[y*W+x]=1;S.nd[y*W+x]=n}}}
function stopSel(){for(const u of S.sel)if(!u.q){u.o='i';u.p=[];u.tg=null;u.pt=null;u.autoWorker=0;u.guardTarget=null;if(u.k==='cart'||u.k==='cog'){u.tradePaused=true;u.manualTradeMove=false;u.tradeFleeing=false;u.tradeThreatCheckAt=0}}note('Stopped')}
function regroup(){const us=S.sel.filter(u=>!u.q);if(!us.length)return;orderSel(null,us.reduce((a,u)=>a+u.x,0)/us.length,us.reduce((a,u)=>a+u.y,0)/us.length);note('Regrouping')}
function orderGuardFollow(wx,wy,kind){
 const target=pick(wx,wy),ship=!!(target&&U[target.k]&&U[target.k].sh);
 if(!target||(!U[target.k]&&!target.q)||target.hp<=0||(target.q&&!target.done)||(target.t!==0&&diplomacyRelation(0,target.t)!=='ally')){
  note('Choose a living friendly unit or completed building');return false;
 }
 const units=S.sel.filter(u=>!u.q&&u.t===0&&u.hp>0&&!u.ld&&u!==target&&u.k!=='vil'&&u.k!=='cart'&&u.k!=='cog'&&!!(U[u.k]&&U[u.k].sh)===ship);
 if(!units.length){note(ship?'Select ships to guard/follow a friendly ship':'Select military units to guard/follow a friendly unit or building');return false}
 for(const u of units){u.o=kind;u.tg=target;u.guardTarget=null;u.p=[];u.pt=null;u.as=0;u.autoWorker=0;u.rp=0}
 note((kind==='F'?'Following ':'Guarding ')+(U[target.k]?.n||B[target.k]?.n||'target')+' with '+units.length+' unit'+(units.length===1?'':'s'));
 return true;
}
function patrol(wx,wy,once){let n=0;for(const u of S.sel)if(!u.q&&u.hp>0&&!u.ld&&u.k!=='vil'&&u.k!=='fish'&&u.k!=='cart'&&u.k!=='cog'&&u.k!=='trn'&&u.k!=='mon'){u.pt={a:[u.x,u.y],b:[wx,wy],to:1,once};u.o='p';u.tg=null;u.p=[];u.rp=0;n++}if(n)note('Patrolling with '+n+' unit'+(n===1?'':'s'));else note('Select living, ungarrisoned military units or warships to patrol');return n>0}
function subg(d){const fresh=!(S.all&&S.sel.length&&S.sel.every(u=>S.all.includes(u))),base=fresh?S.sel.filter(u=>!u.q):S.all.filter(u=>u.hp>0),ks=[...new Set(base.map(u=>u.k))];if(ks.length<2)return false;if(fresh)S.si=0;S.all=base;S.si=((S.si||0)+d+ks.length+1)%(ks.length+1);S.sel=S.si?base.filter(u=>u.k===ks[S.si-1]):base;note('Group: '+(S.si?U[ks[S.si-1]].n+' x'+S.sel.length:'all '+base.length));return true}
function setStance(v){for(const u of S.sel)if(!u.q&&u.k!=='vil'){u.st=v;if(v===4&&(u.o==='a'||u.o==='v')){u.o='i';u.tg=null;u.p=[]}}note(['Aggressive','Defensive','Stand ground','Passive','No Attack'][v]+' stance');menu=null}
function unload(b){if(!b||b.hp<=0||!b.done||!Number.isInteger(b.t)||!S||!S.tech[b.t]||!B[b.k]||!Array.isArray(b.cg)||!GAR[b.k]||!b.cg.length){note('Select a living, completed garrison with units inside');return false}const cg=b.cg;for(const c of cg){let sp=null;for(let r=1;r<=5&&!sp;r++)for(let dy=-r;dy<=b.s+r&&!sp;dy++)for(let dx=-r;dx<=b.s+r&&!sp;dx++){const x=b.x+dx,y=b.y+dy;if(x>0&&y>0&&x<W-1&&y<H-1&&!S.g[y*W+x]&&!S.wt[y*W+x]&&(dx<0||dy<0||dx>=b.s||dy>=b.s))sp=[x+.5,y+.5]}if(sp){c.x=sp[0];c.y=sp[1];c.ld=null}}b.cg=cg.filter(c=>c.ld);note('Garrison unloaded');return true}
function townBell(t){
 const workers=S.us.filter(u=>u.t===t&&u.k==='vil'&&u.hp>0&&!u.ld);
 const shelters=S.bs.filter(b=>b.t===t&&b.done&&b.hp>0&&GAR[b.k]);
 const occupancy=new Map(shelters.map(b=>[b,new Set((Array.isArray(b.cg)?b.cg:[]).filter(u=>u&&u.hp>0&&u.ld===b)).size]));
 for(const v of S.us)if(v.hp>0&&v.t===t&&v.o==='B'&&occupancy.has(v.tg))occupancy.set(v.tg,occupancy.get(v.tg)+1);
 let sent=0;
 for(const u of workers){
  let shelter=null,best=Infinity;
  for(const b of shelters){
   const ownReservation=u.o==='B'&&u.tg===b?1:0;
   if((occupancy.get(b)||0)-ownReservation>=GAR[b.k])continue;
   const distance=d2(u.x,u.y,b);
   if(distance<best){best=distance;shelter=b}
  }
  if(!shelter)continue;
  if(u.o==='B'&&occupancy.has(u.tg))occupancy.set(u.tg,Math.max(0,occupancy.get(u.tg)-1));
  u.p=[];u.pt=null;u.as=0;u.o='B';u.tg=shelter;u.ut=null;
  occupancy.set(shelter,(occupancy.get(shelter)||0)+1);sent++;
 }
 if(t===0)note(sent?'Town Bell: '+sent+' villagers sent to shelter':'No available shelter space for villagers');
 return sent;
}
function gm(u,tg){const t=S.tech[u.t];let m=t.gath?1.25:1;const k=tg.k;if(k==='w'){m*=1+.2*!!t.axe+.2*!!t.saw;if(t.wd)m*=1.15}else if(k==='g')m*=1+.15*!!t.gmine+.15*!!t.mn;else if(k==='s')m*=1+.15*!!t.smine+.15*!!t.mn;else if(k==='f'&&tg.fm)m*=1+.15*!!t.fa;return m}
const mhp=u=>U[u.k].hp+(S.tech[u.t].hpb&&S.tech[u.t].hpb[u.k]||0);
/* AoE-style farm capacity upgrades add food, rather than incorrectly increasing the harvest rate. */
function farmFood(t){const q=S.tech[t]||{};return 175+(q.coll?75:0)+(q.plow?125:0)+(q.crop?175:0)}
/* Victory rules: the chosen mode (vm) is authoritative. Town Centre loss ends a skirmish only in vm 0; campaign keeps its own rules (player TC loss = defeat, enemy TC only with sc.tcw).
   Every match end goes through endGame(): defeat takes precedence over a victory recorded in the same step, and S.why names the cause for the end screen. */
function tcEnds(t){return cmp?(t.t===0||!!CAMP[cmp.i].tcw):(vm===0||vm===6)}
function endGame(res,why){if(S.over==='lose')return;if(S.over&&res==='win')return;S.over=res;S.why=why;mode='end';if(cmp&&res==='win')campMark(cmp.i);sting(res==='win');rumble(700,1,.6)}
function elim(){if(cmp)return;if(vm===0){if(!S.bs.some(b=>b.t===0&&b.k==='tc'&&b.hp>0)){endGame('lose','Your Town Centre fell');return}if(!S.bs.some(b=>b.k==='tc'&&isHostile(0,b.t)&&b.hp>0))endGame('win','All hostile Town Centres have fallen');return}if(vm===6){if(!S.bs.some(b=>b.t===0&&b.k==='tc'&&b.hp>0)){endGame('lose','Your Town Centre fell in Sudden Death');return}if(!S.bs.some(b=>b.k==='tc'&&isHostile(0,b.t)&&b.hp>0))endGame('win','All hostile Town Centres have fallen in Sudden Death');return}const alive=t=>S.bs.some(b=>b.t===t&&b.hp>0)||S.us.some(u=>u.t===t&&u.hp>0);if(!alive(0)){endGame('lose','Your kingdom has been defeated');return}if(!Array.from({length:S.teamN-1},(_,i)=>isHostile(0,i+1)&&alive(i+1)).some(Boolean))endGame('win','All hostile kingdoms have been defeated')}
function kingdomAlive(t){return S.bs.some(b=>b.t===t&&b.hp>0)||S.us.some(u=>u.t===t&&u.hp>0)}
function kingdomScore(t){
 const res=S.res[t]||{};let resources=0;for(const n of Object.values(res))resources+=Math.max(0,Number(n)||0);resources/=10;
 let units=0;for(const u of S.us)if(u.t===t&&u.hp>0){const d=U[u.k]||{};let cost=0;for(const n of Object.values(d.cost||{}))cost+=Number(n)||0;units+=Math.max(0,cost/8)*Math.max(0,Math.min(1,u.hp/Math.max(1,d.hp||u.hp||1)))}
 let buildings=0;for(const b of S.bs)if(b.t===t&&b.hp>0){const d=B[b.k]||{};let cost=0;for(const n of Object.values(d.cost||{}))cost+=Number(n)||0;buildings+=Math.max(0,cost/8)*Math.max(0,Math.min(1,b.hp/Math.max(1,b.mh||d.hp||b.hp||1)))}
 let techCount=0;for(const k in(S.tech[t]||{}))if(S.tech[t][k]===1&&k!=='hpb'&&k!=='atkb')techCount++;
 const techs=techCount*30,age=(S.age[t]||0)*150;let relicCount=0;for(const r of S.rel)if(r.m&&r.m.t===t)relicCount++;const relics=relicCount*250;
 return Math.round(resources+units+buildings+techs+age+relics);
}
function kingHillControl(dt){
 const presence=Array(S.teamN).fill(0);
 for(const u of S.us)if(u.hp>0&&!u.ld&&u.k!=='vil'&&u.k!=='cart'&&u.k!=='cog'&&!(U[u.k]&&U[u.k].sh)&&Math.hypot(u.x-W/2,u.y-H/2)<=5.2&&(u.t===0||diplomacyRelation(0,u.t)!=='neutral')){
  const faction=u.t===0||diplomacyRelation(0,u.t)==='ally'?0:u.t;presence[faction]++;
 }
 const holders=presence.flatMap((n,t)=>n>0?[t]:[]),progress=S.kh||(S.kh=Array(S.teamN).fill(0));
 if(holders.length!==1){progress.fill(0);return}
 const holder=holders[0];
 for(let t=0;t<progress.length;t++)progress[t]=t===holder?Math.min(300,(progress[t]||0)+dt):0;
 if(progress[holder]>=300)endGame(holder===0?'win':'lose',holder===0?'Your kingdom held the central hill for 5 minutes':CIV[S.civ[holder]].n+' held the central hill for 5 minutes');
}
function vict(dt){if(vm===5){kingHillControl(dt);return}if(vm===3){if(!S.us.some(u=>u.t===0&&u.k==='king')){endGame('lose','Your King has fallen');return}if(!Array.from({length:S.teamN-1},(_,i)=>isHostile(0,i+1)&&S.us.some(u=>u.t===i+1&&u.k==='king')).some(Boolean))endGame('win','All hostile Kings have fallen');return}if(vm===4){const limit=scoreLimit;if(S.t<limit)return;if(!kingdomAlive(0)){endGame('lose','Your kingdom was eliminated before the score limit');return}const ranked=Array.from({length:S.teamN},(_,t)=>({t,score:kingdomScore(t)})).filter(q=>q.t===0||(isHostile(0,q.t)&&kingdomAlive(q.t))).sort((a,b)=>b.score-a.score);if(!ranked.length){endGame('lose','No kingdom survived the time limit');return}const leaders=ranked.filter(q=>q.score===ranked[0].score);if(leaders.length>1){endGame('draw','Draw at the '+Math.round(scoreLimit/60)+'-minute score limit: '+leaders.map(q=>CIV[S.civ[q.t]].n).join(' and ')+' tied on '+leaders[0].score+' points');return}const winner=ranked[0];endGame(winner.t===0?'win':'lose',CIV[S.civ[winner.t]].n+' wins on score at the '+Math.round(scoreLimit/60)+'-minute time limit ('+winner.score+' points)');return}const v=S.vc||(S.vc=Array(S.teamN).fill(0));for(let t=0;t<S.teamN;t++){if(t>0&&!isHostile(0,t)){v[t]=0;continue}let ok=false;if(vm===1)ok=S.bs.some(b=>b.t===t&&b.k==='wonder'&&b.done);else if(vm===2)ok=S.rel.length>0&&S.rel.every(r=>r.m&&r.m.t===t&&r.m.done);v[t]=ok?v[t]+dt:0;if(v[t]>=(vm===1?300:240)){endGame(t===0?'win':'lose',(t===0?'You':'A hostile kingdom')+(vm===1?' held a Wonder for 5 minutes':' held every relic for 4 minutes'));return}}}

function step(dt){foeGridDirty=true;S.t+=dt;for(const n of S.nodes)if(n&&n.fm&&n.amt<=0&&Number.isInteger(n.t)&&S.res[n.t]&&S.res[n.t].w>=60){S.res[n.t].w-=60;n.amt=farmFood(n.t);if(n.t===0)note('Farm reseeded (-60 wood)')}for(const u of S.us)upU(u,dt);sep();WL(dt);if(cmp)cmpTick(dt);if(vm)vict(dt);if(!cmp&&S.vt%30===0)elim();if(S.vt%150===0){for(const q of S.px)for(const k in q)q[k]+=q[k]<100?1:q[k]>100?-1:0;if(menu&&menu.items)for(const r of menu.items)if(r.up)r.up()}for(const q of S.rel){if(q.c){if(q.c.hp<=0)q.c=null;else{q.x=q.c.x;q.y=q.c.y}}if(q.m&&q.m.hp<=0){q.x=q.m.x+1;q.y=q.m.y+1;q.m=null}}
for(const s of S.us)if(s.cg&&s.cg.length){if(s.hp<=0)s.cg.forEach(c=>c.hp=0);else s.cg.forEach(c=>{c.x=s.x;c.y=s.y})}for(const b of S.bs)upB(b,dt);pjs(dt);if(!(cmp&&CAMP[cmp.i].noai))ai(dt);
for(const f of fx)f.l-=dt;compactPositive(fx,'l');compactPositive(S.us,'hp');compactPositive(S.bs,'hp');compactPositive(S.sel,'hp');
if(++S.vt%30===0)S.scoreCache=Array.from({length:S.teamN},(_,t)=>kingdomScore(t));if(S.vt%6===0){fog();if(S.vt%(W*H>20000?24:W*H>9000?12:6)===0)mmUp()}}
