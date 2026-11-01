/* Crown & Kingdoms — canonical per-unit order state machine.
 * Preserved source-identical from simulation.js. Loaded before gameplay ticks;
 * Xbox controls, authenticated multiplayer, AI and replay keep global upU.
 */
function upU(u,dt){const d=U[u.k];u.cd-=dt;u.rp-=dt;if(u.o!=='a'&&u.wind>0){u.wind=0;u.windTarget=null}let tg=u.tg;if(u.k==='mon'){u.faith=Math.min(100,(u.faith??100)+dt*1.6*(S.tech[u.t].illumination?2:1));if(u.o!=='v')resetConversion(u);}if(u.ld)return;if(u.t===0&&u.k==='vil'&&u.o==='i'&&u.autoWorker&&S.vp&&S.vp.enabled){if((u.autoTry||0)<=0){u.autoTry=3;if(assignAutoVillager(u))return}else u.autoTry-=dt}if(u.retreating){const shelter=S.bs.find(b=>b===u.retreatTarget&&b.t===u.t&&b.hp>0&&b.done&&(b.k==='tc'||b.k==='castle'))||S.bs.filter(b=>b.t===u.t&&b.done&&b.hp>0&&(b.k==='tc'||b.k==='castle')).sort((a,b)=>d2(u.x,u.y,a)-d2(u.x,u.y,b))[0];if(!shelter){u.retreating=false;u.retreatTarget=null;u.retreatRestUntil=0;u.tg=null;u.p=[];u.o='i'}else{u.retreatTarget=shelter;if(d2(u.x,u.y,shelter)<=1.3){u.p=[];u.o='i';// Shelter proximity alone does not heal military units. Monks and unit-specific abilities use their own rules.
if(u.hp>=mhp(u)*.65||S.t>=(u.retreatRestUntil||(u.retreatRestUntil=S.t+8))){u.retreating=false;u.retreatTarget=null;u.retreatRestUntil=0;u.tg=null}}else{if((!u.p.length||u.rp<=0)&&S.t>=(u.retreatRouteRetryAt||0)){u.p=path(u,goalNear(shelter,1))||[];u.rp=1;u.retreatRouteRetryAt=S.t+(u.p.length?1:5)}if(u.p.length)walk(u,dt);return}if(u.retreating)return}}if((u.k==='cart'||u.k==='cog')&&u.o!=='B'&&u.o!=='rep'){if(u.tradePaused){u.o='i';u.p=[];u.rp=0;return}if(u.manualTradeMove&&u.o==='m'){if(walk(u,dt)){u.o='i';u.manualTradeMove=false;u.tradeFromKey=null;u.tradeDestKey=null;u.tradeReturning=false;u.tradeCargo=0;}return}u.manualTradeMove=false;tickTrader(u,dt);return}if(u.k==='bers'&&u.hp<mhp(u))u.hp=Math.min(mhp(u),u.hp+.5*dt);
if(u.k==='mon'&&(u.hc=(u.hc||0)-dt)<=0){u.hc=1;for(const e of S.us)if(e!==u&&e.t===u.t&&e.hp>0&&!e.ld){const dx=e.x-u.x,dy=e.y-u.y;if(dx*dx+dy*dy>=16)continue;const max=mhp(e);if(e.hp<max)e.hp=Math.min(max,e.hp+4)}}
if(u.k==='mon'&&u.o==='a'){const target=u.tg;if(!beginConversion([u],target)){u.o='i';u.tg=null;u.p=[];}return;}
if(u.o==='F'||u.o==='G'){const target=u.tg;if(!target||target.hp<=0||(!U[target.k]&&!target.q)||(target.q&&!target.done)||(target.t!==u.t&&diplomacyRelation(u.t,target.t)!=='ally')||!!U[u.k]?.sh!==!!(U[target.k]&&U[target.k].sh)){u.o='i';u.tg=null;u.guardTarget=null;u.p=[];return}if(u.o==='G'&&u.st!==4){const e=foe(u,6);if(e&&e!==target&&d2(target.x,target.y,e)<=5){u.guardTarget=target;u.o='a';u.tg=e;u.p=[];return}}const spacing=u.o==='F'?1.25:2,dist=d2(u.x,u.y,target);if(dist<=spacing){u.p=[];return}if(!u.p.length||u.rp<=0){u.p=path(u,goalNear(target,spacing))||[];u.rp=.6}if(u.p.length)walk(u,dt);return}if(u.o==='i'){if(u.as&&(u.sa=(u.sa||0)-dt)<=0){u.sa=1;const x=2+S.r()*(W-4),y=2+S.r()*(H-4),p=path(u,gp(x,y,2.5));if(p){u.o='m';u.p=p}}if(u.k==='mon'&&u.t>0&&(u.sc=(u.sc||0)-dt)<=0){u.sc=1;const e=u.st===4?null:S.us.find(e=>canConvert(u,e)&&d2(u.x,u.y,e)<=conversionRange(u,e));if(e){beginConversion([u],e)}else{const rl=S.rel.find(x=>!x.c&&!x.m);if(rl){u.o='r';u.tg=rl;u.p=[]}}}if(u.k!=='vil'&&u.k!=='mon'&&u.k!=='fish'&&u.k!=='trn'&&u.k!=='king'&&u.k!=='cart'&&u.k!=='cog'&&(u.sc=(u.sc||0)-dt)<=0){u.sc=.5;const sr=[Math.max(7,attackRange(u)),4,attackRange(u),0,0][u.st|0],e=sr>0?foe(u,sr):null;if(e){u.o='a';u.tg=e;u.p=[]}}return}
if(u.o==='m'){if(walk(u,dt))u.o='i';return}
if(u.o==='B'){if(!tg||tg.hp<=0||tg.t!==u.t&&diplomacyRelation(u.t,tg.t)!=='ally'||tg.q&&!tg.done||(tg.q?!GAR[tg.k]:!U[tg.k]?.cap)||!!u.sh||(U[tg.k]?.cap&&u.t!==tg.t)||(tg.cg||[]).length>=(tg.q?GAR[tg.k]:U[tg.k].cap)||u===tg||u.ld){u.o='i';u.tg=null;u.p=[];u.rp=0;return}if(tg.q?d2(u.x,u.y,tg)<=1.4:Math.hypot(tg.x-u.x,tg.y-u.y)<=2){u.ld=tg;(tg.cg=tg.cg||[]).push(u);u.ut=null;u.tradeFromKey=null;u.tradeDestKey=null;u.tradeReturning=false;u.tradeCargo=0;u.tradePaused=false;u.manualTradeMove=false;u.x=tg.x+(tg.s||0)/2;u.y=tg.y+(tg.s||0)/2;u.o='i';u.p=[];u.rp=0;return}
if(!u.p.length||u.rp<=0){const p=path(u,goalNear(tg,tg.q?1.3:1.7));u.rp=.8;if(!p){u.o='i';u.tg=null;u.p=[];u.rp=0;if(u.t===0)note('No route to board that transport');return}u.p=p}walk(u,dt);return}
if(u.o==='U'){
 // Keep manifests consistent with living passengers actually aboard this ship.
 if(!Array.isArray(u.cg))u.cg=[];
 u.cg=u.cg.filter(c=>c&&c.hp>0&&c.ld===u&&c.t===u.t&&U[c.k]&&!U[c.k].sh);
 const q=u.ut;
 const cancel=(message)=>{u.o='i';u.ut=null;u.unloadBeach=null;u.p=[];u.rp=0;u.unloadRouteRetryAt=0;if(message&&u.t===0)note(message)};
 if(u.k!=='trn'||!Number.isFinite(u.x)||!Number.isFinite(u.y)||!Array.isArray(q)||q.length!==2||!q.every(Number.isFinite)||q[0]<0||q[1]<0||q[0]>=W||q[1]>=H||S.wt[(q[1]|0)*W+(q[0]|0)]===1||!u.cg.length){cancel();return}
 if(!Array.isArray(u.p))u.p=[];
 const beach=u.unloadBeach;
 if(!Array.isArray(beach)||beach.length!==2||!beach.every(Number.isFinite)){
  u.unloadBeach=null;u.p=[];u.rp=0;
 }
 if((!u.p.length||u.rp<=0)&&S.t>=(u.unloadRouteRetryAt||0)){
  const landing=transportLandingRoute(u,q[0],q[1]);
  u.unloadRouteRetryAt=S.t+2;
  if(!landing){cancel('Transport cannot reach a free landing beach');return}
  u.unloadBeach=landing.beach;u.p=landing.route;u.rp=1;
 }
 if(!u.p.length)return;
 if(!walk(u,dt))return;
 const cg=u.cg,occupied=new Set(S.us.filter(v=>v&&v.hp>0&&!v.ld&&Number.isFinite(v.x)&&Number.isFinite(v.y)).map(v=>(v.y|0)*W+(v.x|0)));
 const shore=u.unloadBeach,spots=[];
 if(!Array.isArray(shore)||shore.length!==2||!shore.every(Number.isFinite)){u.p=[];u.rp=0;u.unloadRouteRetryAt=0;return}
 // Collect all valid shore tiles once, then assign distinct positions to passengers.
 for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
  const x=(u.x|0)+dx,y=(u.y|0)+dy;
  if(x<=0||y<=0||x>=W-1||y>=H-1)continue;
  const idx=y*W+x;
  if(S.g[idx]||S.nd[idx]||S.wt[idx]===1||occupied.has(idx))continue;
  if(Math.hypot(x+.5-q[0],y+.5-q[1])>5||Math.hypot(x+.5-u.x,y+.5-u.y)>4||Math.hypot(x-shore[0],y-shore[1])>3)continue;
  if(!D8.some(([ax,ay])=>{const nx=x+ax,ny=y+ay;return nx>=0&&ny>=0&&nx<W&&ny<H&&S.wt[ny*W+nx]===1&&!S.nd[ny*W+nx]}))continue;
  spots.push({x,y,idx,score:Math.hypot(x+.5-q[0],y+.5-q[1])+Math.hypot(x+.5-u.x,y+.5-u.y)*.15});
 }
 spots.sort((a,b)=>a.score-b.score);
 let unloaded=0;
 for(const c of cg){
  const sp=spots[unloaded];
  if(!sp)break;
  c.x=sp.x+.5;c.y=sp.y+.5;c.ld=null;c.o='i';c.tg=null;c.ut=null;c.p=[];c.rp=0;c.pt=null;c.as=0;
  unloaded++;
 }
 u.cg=cg.filter(c=>c.ld===u&&c.hp>0);
 cancel();
 if(u.t===0)note(unloaded?(u.cg.length?'Passengers unloaded: '+unloaded+'; '+u.cg.length+' still aboard':'Passengers unloaded: '+unloaded):'No safe shore to unload; move closer to land');
 return;
}
if(u.o==='rep'){if(!tg||tg.hp<=0||(tg.t!==u.t&&diplomacyRelation(u.t,tg.t)!=='ally')||!tg.sh||tg.hp>=mhp(tg)){u.o='i';u.tg=null;return}if(d2(u.x,u.y,tg)<=1.5){u.p=[];tg.hp=Math.min(mhp(tg),tg.hp+mhp(tg)*dt/40);if(tg.hp>=mhp(tg)){u.o='i';u.tg=null;if(u.t===0)note('Ship repaired')}}else{if(!u.p.length||u.rp<=0){const p=path(u,goalNear(tg,1.2));u.rp=1;if(!p){u.o='i';u.tg=null;return}u.p=p}walk(u,dt)}return}
if(u.o==='v'){tickConversion(u,dt);return}
if(u.o==='r'){if(!u.rel){if(!tg||!tg.rl||tg.c||tg.m){u.o='i';u.tg=null;return}if(Math.hypot(tg.x-u.x,tg.y-u.y)<=1){tg.c=u;u.rel=tg;return}
if(!u.p.length||u.rp<=0){const p=path(u,goalNear(tg,.8));u.rp=1;if(!p){u.o='i';return}u.p=p}walk(u,dt);return}
let mb=null,bd=1e9;for(const q of S.bs)if(q.t===u.t&&q.done&&q.k==='monastery'){const d=d2(u.x,u.y,q);if(d<bd){bd=d;mb=q}}
if(!mb){u.o='i';return}if(bd<=1.3){u.rel.c=null;u.rel.m=mb;u.rel=null;u.o='i';if(u.t===0)note('Relic garrisoned: +0.5 gold/s');return}
if(!u.p.length||u.rp<=0){const p=path(u,goalNear(mb,1));u.rp=1;if(!p){u.o='i';return}u.p=p}walk(u,dt);return}
if(u.o==='p'){const e=u.st===4?null:foe(u,6);if(e){u.o='a';u.tg=e;u.p=[];return}const pt=u.pt;if(!pt){u.o='i';return}
if(!u.p.length||u.rp<=0){const g=pt.to?pt.b:pt.a,p=path(u,gp(g[0],g[1],1.2));u.rp=2;if(!p){u.o='i';return}u.p=p}if(walk(u,dt)){if(pt.once){u.o='i';u.pt=null}else{pt.to^=1;u.p=[]}}return}
if(u.o==='a'){if(!tg||tg.hp<=0||tg.t===u.t){const guard=u.guardTarget&&u.guardTarget.hp>0?u.guardTarget:null;u.o=guard?'G':u.pt?'p':'i';u.tg=guard;u.guardTarget=null;u.p=[];return}
if(u.k!=='vil'&&tg.q&&(u.ac=(u.ac||0)-dt)<=0){u.ac=.6;const e=foe(u,4);if(e&&!e.q)u.tg=tg=e}
const dist=d2(u.x,u.y,tg),minR=d.minR||0,range=attackRange(u);
if(u.wind>0&&(u.windTarget!==tg.netId||dist>range||minR&&dist<minR)){u.wind=0;u.windTarget=null}
if(minR&&dist<minR){if(!u.p.length||u.rp<=0){const p=path(u,goalNear(tg,minR+.5));u.rp=.7;if(!p){u.o='i';return}u.p=p}walk(u,dt);return}
if(dist<=range){u.p=[];
 if(u.wind>0){
  u.wind=Math.max(0,u.wind-dt);
  if(u.wind===0){u.windTarget=null;hit(u,tg);u.cd=Math.max(0,attackReload(u)-(d.delay||0))}
 }else if(u.cd<=0){
  if(d.delay){u.wind=d.delay;u.windTarget=tg.netId||null}
  else{hit(u,tg);u.cd=attackReload(u)}
 }
}
else if(u.st===2){u.o='i';u.tg=null}else{if(!u.p.length||u.rp<=0){const p=path(u,goalNear(tg,range-(range>2?.4:.1)));u.rp=.7;if(!p){u.o='i';return}u.p=p}walk(u,dt)}return}
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
if(!tg||tg.amt<=0||S.nd[tg.y*W+tg.x]!==tg||!!tg.fi!==!!u.sh||tg.trap&&tg.t!==u.t||!resourceHasWorksite(u,tg)){const a=u.autoWorker&&u.t===0?findReachableAutoNode(u,u.ct,36):null,n=a?a.n:(!u.autoWorker?findNode(u,u.ct):null);if(n){u.tg=n;u.p=a?a.route:[];u.rp=a?1:0}else if(u.car>0){u.ret=1;u.p=[]}else{u.o='i';u.tg=null;u.p=[]}return}
if(d2(u.x,u.y,tg)<=1.1){u.p=[];u.rp=0;const g=Math.min(tg.amt,baseGatherRate(u,tg)*gm(u,tg)*(tg.an&&S.tech[u.t]?.hunt?1.4:1)*dt);tg.amt-=g;u.car+=g;u.ct=tg.k;if(gt>(u.sn||0)){u.sn=gt+.7+Math.random()*.5;if(tg.k==='w')sfx('chop',u.x,u.y);else if(tg.k==='g'||tg.k==='s')sfx('mine',u.x,u.y);else if(tg.k==='f'||tg.k==='b'||tg.k==='d')sfx('harvest',u.x,u.y)}if(tg.amt<=0){if(tg.trap){tg.amt=900;if(u.t===0)note('Fish trap replenished')}else if(tg.fm){tg.amt=0;if(u.t===0)note('Farm exhausted; awaiting owner 60 wood to reseed')}else{killNode(tg);if(u.t===0)note(NM[tg.k]+' depleted')}}if(u.car>=gatherCapacity(u)){u.ret=1;u.p=[]}}
else{if(!u.p.length||u.rp<=0){const p=path(u,goalNear(tg,1));u.rp=1;if(!p){if(u.t===0&&u.autoWorker)skipAutoNode(u,tg);u.o='i';if(u.t===0)note('No route to resource');return}u.p=p}walk(u,dt)}return}
if(u.o==='b'){if(!tg||tg.hp<=0||(tg.t!==u.t&&diplomacyRelation(u.t,tg.t)!=='ally')||(tg.done&&tg.hp>=tg.mh)){u.o='i';u.tg=null;if(tg&&tg.done&&tg.hp>0){const ak={lumber:'w',mine:'g',mill:'f'}[tg.k],n=ak&&findNode(u,ak,16);if(n){u.o='g';u.tg=n;u.ct=n.k;u.p=[];u.ret=0}}return}
if(d2(u.x,u.y,tg)<=1.1){u.p=[];u.rp=0;if(tg.done)tg.hp=Math.min(tg.mh,tg.hp+tg.mh*dt/(S.tech[u.t].crane?32:40));else{const buildRate=S.tech[u.t].crane?1.2:1;tg.pr+=dt*buildRate;if(gt>(u.sn||0)){u.sn=gt+.8+Math.random()*.4;sfx('hammer',u.x,u.y)}tg.hp=Math.min(tg.mh,tg.mh*tg.pr/B[tg.k].bt+1);
if(tg.pr>=B[tg.k].bt){tg.done=true;tg.hp=tg.mh;sfx('built',tg.x+tg.s/2,tg.y+tg.s/2);if(tg.t===0){S.pl.bl++;note(B[tg.k].n+' complete')}}}}
else{if(!u.p.length||u.rp<=0){const p=path(u,goalNear(tg,1));u.rp=1;if(!p){u.o='i';return}u.p=p}walk(u,dt)}}}
