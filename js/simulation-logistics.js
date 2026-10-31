/* Existing transport landing and trade route logic, moved without edits.
 * Loaded before simulation.js; no unit, save or command semantics changed. */
// Find accessible water staging beside a free beach with one multi-goal A* search.
function transportLandingRoute(u,x,y){
 if(!S||!u||u.k!=='trn'||!Number.isFinite(u.x)||!Number.isFinite(u.y)||!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>=W||y>=H)return null;
 /* Only units in the landing search square can block a candidate beach tile. */
 const occupied=new Set(),minX=Math.max(0,(x|0)-5),maxX=Math.min(W-1,(x|0)+5),minY=Math.max(0,(y|0)-5),maxY=Math.min(H-1,(y|0)+5);
 for(const v of S.us)if(v&&v.hp>0&&!v.ld&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&v.x>=minX&&v.x<maxX+1&&v.y>=minY&&v.y<maxY+1)occupied.add((v.y|0)*W+(v.x|0));
 const staging=new Map();
 for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){
  const bx=(x|0)+dx,by=(y|0)+dy;
  if(bx<=0||by<=0||bx>=W-1||by>=H-1)continue;
  const offsetX=bx+.5-x,offsetY=by+.5-y,idx=by*W+bx,dist2=offsetX*offsetX+offsetY*offsetY;
  if(dist2>25||S.g[idx]||S.nd[idx]||S.wt[idx]===1||occupied.has(idx))continue;
  for(let dir=0;dir<8;dir++){
   const direction=D8[dir],ox=direction[0],oy=direction[1],sx=bx+ox,sy=by+oy;
   if(sx<0||sy<0||sx>=W||sy>=H)continue;
   const si=sy*W+sx;
   if(S.wt[si]!==1||S.nd[si])continue;
   if(ox&&oy&&(S.wt[by*W+sx]!==1||S.wt[sy*W+bx]!==1||S.nd[by*W+sx]||S.nd[sy*W+bx]))continue;
   const prev=staging.get(si);
   if(!prev||dist2<prev.dist2)staging.set(si,{bx,by,dist2});
  }
 }
 if(!staging.size)return null;
 const goal=(a,b)=>staging.has(b*W+a);
 goal.hx=x;goal.hy=y;goal.hr=7;
 const route=path(u,goal);
 if(!route||!route.length)return null;
 const end=route[route.length-1],tile=staging.get((end[1]|0)*W+(end[0]|0));
 return tile?{route,beach:[tile.bx,tile.by]}:null;
}
function tickTrader(u,dt){
 const endpoint=u.k==='cog'?'dock':'market',keyOf=b=>[b.t,b.k,b.x,b.y].join(':');
 // AoE2 DE Xbox fidelity: trade units follow their assigned routes; they do not
 // autonomously flee enemy forces or choose a new escape destination.
 let src=u.tradeFromKey?S.bs.find(b=>keyOf(b)===u.tradeFromKey&&b.t===u.t&&b.k===endpoint&&b.done&&b.hp>0):null;
 if(!src){
  // A lost home depot must not silently reassign the player's trade route.
  if(u.t===0){u.tradePaused=true;u.tradeFromKey=null;u.tradeDestKey=null;u.tradeReturning=false;u.tradeCargo=0;u.o='i';u.p=[];u.rp=0;return}
  if((u.tradeSourceWait||0)>0){u.tradeSourceWait=Math.max(0,u.tradeSourceWait-dt);u.o='i';u.p=[];u.rp=0;return}
  const footprintSq=b=>{const sz=b.s||0,dx=Math.max(b.x-u.x,0,u.x-(b.x+sz)),dy=Math.max(b.y-u.y,0,u.y-(b.y+sz));return dx*dx+dy*dy};
  const sources=S.bs.filter(b=>b.t===u.t&&b.k===endpoint&&b.done&&b.hp>0).map(b=>({b,dist2:footprintSq(b)})).sort((a,b)=>a.dist2-b.dist2);
  src=null;
  for(let i=0;i<Math.min(24,sources.length);i++){const depot=sources[i].b;if(path(u,goalNear(depot,1))){src=depot;break}}
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
  /* Filter threats once per trade route selection, and use squared corridor checks. */
  const threats=S.us.filter(e=>e&&e.hp>0&&!e.ld&&isHostile(u.t,e.t)&&U[e.k]?.dmg>0&&!!U[e.k].sh===!!U[u.k].sh);
  const candidates=S.bs.filter(b=>{const dx=b.x-src.x,dy=b.y-src.y;return b.done&&b.hp>0&&b.k===endpoint&&Number.isInteger(b.t)&&b.t>=0&&b.t<S.teamN&&b.t!==u.t&&!isHostile(u.t,b.t)&&dx*dx+dy*dy>=36}).map(b=>{
   const dx=b.x-src.x,dy=b.y-src.y,denom=dx*dx+dy*dy,distance=Math.sqrt(denom);
   let danger=0;
   for(const e of threats){
    const fraction=Math.max(0,Math.min(1,((e.x-src.x)*dx+(e.y-src.y)*dy)/denom));
    const ox=e.x-(src.x+fraction*dx),oy=e.y-(src.y+fraction*dy);
    if(ox*ox+oy*oy<49)danger++;
   }
   return {b,score:distance-danger*12}
  }).sort((a,b)=>b.score-a.score);
  dest=null;for(let i=0;i<Math.min(24,candidates.length);i++){const candidate=candidates[i];if(path(u,goalNear(candidate.b,1))){dest=candidate.b;break}}
  if(!dest){u.trWait=6;u.o='i';u.p=[];u.rp=0;return}
  u.tradeDestKey=keyOf(dest);u.trWait=0;
 }
 const goal=u.tradeReturning?src:dest;
 if(d2(u.x,u.y,goal)<=1.1){
  u.p=[];u.rp=0;
  if(u.tradeReturning){const earned=Number.isSafeInteger(u.tradeCargo)&&u.tradeCargo>0?u.tradeCargo:0,bank=S.res[u.t];if(earned&&bank&&Number.isFinite(bank.g)&&bank.g>=0&&bank.g<=Number.MAX_SAFE_INTEGER-earned){bank.g+=earned;if(u.t===0)note(U[u.k].n+' delivered +'+earned+' gold')}u.tradeCargo=0;u.tradeReturning=false;u.tradeSourceWait=0;}
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
