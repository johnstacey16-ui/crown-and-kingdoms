/* Crown & Kingdoms — farm occupancy, resource selection, depots and fish traps.
 * Classic browser script declarations, loaded before js/simulation.js.
 * Function bodies are extracted unchanged; current-build economy and AI callers
 * continue using these same global names. */
/* Source-identical baseline resource gather rates and carry capacity. */
function resourceGatherRate(n){
 if(n.fi)return .43;
 if(n.k==='w')return .39;
 if(n.k==='g')return .38;
 if(n.k==='s')return .36;
 if(n.k==='f')return n.fm?.32:n.an?.41:.31;
 return GR;
}
function baseGatherRate(u,n){return u.k==='vil'||n.fi?resourceGatherRate(n):GR}
function gatherCapacity(u){const tech=S.tech[u.t]||{},hunt=u.k==='vil'&&!!u.tg?.an;return (hunt?35:CAP)+(tech.carry?5:0)+(u.k==='vil'&&tech.wheel?(hunt?9:3):0)+(u.k==='vil'&&tech.handcart?(hunt?22:7):0)+
 (S.civ?.[u.t]===37&&(u.k==='fish'||u.k==='vil'&&u.tg?.k==='f'&&!u.tg?.fm)?15:0)}

function farmAvailableTo(u,n){
 if(!n?.fm)return true;
 if(!u||u.k!=='vil'||!Number.isInteger(n.t)||n.t!==u.t)return false;
 const workers=Array.isArray(S?.us)?S.us:[],at=workers.indexOf(u);
 return !workers.some((v,i)=>v&&v!==u&&v.k==='vil'&&v.hp>0&&!v.ld&&!v.retreating&&v.o==='g'&&v.tg===n&&(at<0||i<at));
}
// A farm has one owner, including on a return trip; other sites have
// capacity based on genuinely reachable adjacent approach spaces.
function resourceApproachCapacity(n,u){
 if(n.fm)return 1;
 let slots=0;
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
  if(!dx&&!dy)continue;
  const x=n.x+dx,y=n.y+dy;
  if(x<0||y<0||x>=W||y>=H)continue;
  const i=y*W+x;
  if(u.sh?S.wt[i]>0&&!S.nd?.[i]:S.wt[i]!==1&&!S.g?.[i])slots++;
 }
 return Math.max(1,slots);
}
function resourceClaimCount(n,u){
 let count=0;
 for(const v of S.us||[])if(v&&v!==u&&v.hp>0&&!v.ld&&!v.retreating&&v.o==='g'&&v.tg===n&&!!v.sh===!!u.sh)count++;
 return count;
}
function resourceHasWorksite(u,n){
 return !!(u&&n&&n.amt>0&&(n.fm?farmAvailableTo(u,n):resourceClaimCount(n,u)<resourceApproachCapacity(n,u)));
}
function knownResource(u,n){
 return !!(u&&n&&(u.t!==0||S.ex?.[n.y*W+n.x]));
}
function findNode(u,k,r=16){if(!S||!u||!Number.isFinite(u.x)||!Number.isFinite(u.y)||!Number.isFinite(r)||r<=0)return null;let b=null,bd2=r*r;for(const n of S.nodes)if(n&&n.k===k&&n.amt>0&&!n.an&&!!n.fi===!!u.sh&&(!n.trap||n.t===u.t)&&knownResource(u,n)&&resourceHasWorksite(u,n)&&Number.isInteger(n.x)&&Number.isInteger(n.y)&&n.x>=0&&n.y>=0&&n.x<W&&n.y<H&&(u.sh||S.wt[n.y*W+n.x]!==1)){const dx=n.x-u.x,dy=n.y-u.y,d2=dx*dx+dy*dy;if(d2<bd2){bd2=d2;b=n}}return b}
function dropoffKey(q){return [q.t,q.k,q.x,q.y].join(':')}
function dropoffCompatible(u,q){return q.t===u.t&&q.hp>0&&q.done&&Number.isFinite(q.x)&&Number.isFinite(q.y)&&q.x>=0&&q.y>=0&&q.x<W&&q.y<H&&(u.sh?q.k==='dock':q.k==='tc'||(q.k==='mule'&&(u.ct==='w'||u.ct==='g'||u.ct==='s'||
 (u.ct==='f'&&u.tg?.an)))||(q.k==='lumber'&&u.ct==='w')||(q.k==='mine'&&(u.ct==='g'||u.ct==='s'))||((q.k==='mill'||q.k==='folwark')&&u.ct==='f'))}
function skipDropoff(u,q){if(!u||!q)return;const key=dropoffKey(q);if(!Array.isArray(u.dropSkipKeys))u.dropSkipKeys=[];if(!u.dropSkipKeys.includes(key)){if(u.dropSkipKeys.length>=32)u.dropSkipKeys.shift();u.dropSkipKeys.push(key)}}
function findDropoffRoute(u){
 if(!S||!u||!Number.isFinite(u.x)||!Number.isFinite(u.y)||u.x<0||u.y<0||u.x>=W||u.y>=H)return null;
 const compatible=S.bs.filter(q=>dropoffCompatible(u,q));
 if(!compatible.length)return null;
 /* Cache destination keys and distances once per routing attempt, not per sort comparison. */
 const info=new Map(),live=new Set();
 for(const q of compatible){
  const key=dropoffKey(q),sz=q.s||0,dx=Math.max(q.x-u.x,0,u.x-(q.x+sz)),dy=Math.max(q.y-u.y,0,u.y-(q.y+sz));
  info.set(q,{key,dist2:dx*dx+dy*dy});live.add(key)
 }
 u.dropSkipKeys=(Array.isArray(u.dropSkipKeys)?u.dropSkipKeys:[]).filter(key=>live.has(key)).slice(-32);
 const skipped=new Set(u.dropSkipKeys);
 let candidates=compatible.filter(q=>!skipped.has(info.get(q).key));
 if(!candidates.length){u.dropSkipKeys=[];candidates=compatible.slice()}
 candidates.sort((a,b)=>Number(info.get(b).key===u.dropKey)-Number(info.get(a).key===u.dropKey)||info.get(a).dist2-info.get(b).dist2);
 let failed=0;
 for(const q of candidates){
  const route=path(u,goalNear(q,1));
  if(route&&route.length)return {b:q,route};
  skipDropoff(u,q);
  if(++failed>=6)break;
 }
 return null;
}
function deployFishTrap(ships){let made=0;for(const u of ships){if(!u||u.k!=='fish'||u.hp<=0||u.ld||!S.res[u.t]||S.res[u.t].w<100)continue;let spot=null;for(let r=1;r<=4&&!spot;r++)for(let y=Math.max(1,(u.y|0)-r);y<=Math.min(H-2,(u.y|0)+r)&&!spot;y++)for(let x=Math.max(1,(u.x|0)-r);x<=Math.min(W-2,(u.x|0)+r);x++){const i=y*W+x;if(S.wt[i]===1&&!S.nd[i]&&(x+.5-u.x)**2+(y+.5-u.y)**2<=16){spot={x,y,i};break}}if(!spot)continue;S.res[u.t].w-=100;const n={k:'f',x:spot.x,y:spot.y,s:1,amt:900,fi:1,trap:1,t:u.t};S.nodes.push(n);S.nd[spot.i]=n;made++;}if(made)note('Fish trap deployed ('+made+'; -'+made*100+' wood)');else note('Need 100 wood per trap and an empty nearby water tile');return made}
function killNode(n){if(!n||!S.nodes.includes(n))return false;const i=n.y*W+n.x;if(S.nd[i]===n){S.nd[i]=null;S.g[i]=0}S.nodes=S.nodes.filter(m=>m!==n);return true}

/* Wildlife position and resource-node occupancy tick, source-identical. */
function WL(dt){for(const n of S.nodes)if(n.an&&(n.w=(n.w||0)-dt)<=0){n.w=3+S.r()*4;const[dx,dy]=D8[(S.r()*4)|0],x=n.x+dx,y=n.y+dy;if(x>0&&y>0&&x<W-1&&y<H-1&&!S.g[y*W+x]){S.g[n.y*W+n.x]=0;S.nd[n.y*W+n.x]=null;n.x=x;n.y=y;S.g[y*W+x]=1;S.nd[y*W+x]=n}}}

/* Folwark grants food when a newly purchased, owned farm is placed nearby.
 * The one-off claim is part of the farm state, so save/load cannot mint twice. */
/* Gurjara Mills hold a finite number of actual sheep resource nodes.
 * The transfer removes a node from the map and persists in the building;
 * no resource is earned simply by issuing a command. */
function garrisonLivestockMill(b){
 if(!b||!S?.bs?.includes(b)||b.k!=='mill'||!b.done||b.hp<=0||
   !Number.isInteger(b.t)||S.civ?.[b.t]!==39||
   !Number.isInteger(W)||!Array.isArray(S.nodes)||!Array.isArray(S.nd))return false;
 const held=Number.isInteger(b.livestockCount)?b.livestockCount:0;
 if(held<0||held>=5)return false;
 const eligible=S.nodes.filter(n=>n&&n.herdable===1&&n.k==='f'&&n.amt>0&&
   Number.isInteger(n.x)&&Number.isInteger(n.y)&&n.x>=0&&n.y>=0&&n.x<W&&n.y<H&&
   S.nd[n.y*W+n.x]===n&&
   Math.hypot(n.x+.5-(b.x+b.s/2),n.y+.5-(b.y+b.s/2))<=10)
  .sort((a,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(c.x-b.x,c.y-b.y)||
    a.y-c.y||a.x-c.x);
 if(!eligible.length)return false;
 const sheep=eligible[0],i=S.nodes.indexOf(sheep);
 if(i<0)return false;
 S.nd[sheep.y*W+sheep.x]=null;
 S.nodes.splice(i,1);b.livestockCount=held+1;
 return true;
}
function grantFolwarkFarmFood(farm,team){
 if(!farm||farm.k!=='f'||!farm.fm||farm.t!==team||farm.folwarkClaimed||
   S?.civ?.[team]!==35||!S.res?.[team]||S.nd?.[farm.y*W+farm.x]!==farm)return 0;
 const eligible=S.bs?.some(b=>b&&b.t===team&&b.k==='folwark'&&b.done&&b.hp>0&&
  Math.hypot(farm.x+.5-(b.x+b.s/2),farm.y+.5-(b.y+b.s/2))<=6);
 if(!eligible)return 0;
 const food=Math.max(0,Math.round((farm.amt||0)*.10));
 farm.folwarkClaimed=1;
 S.res[team].f+=food;
 return food;
}
/* Gathering multipliers and upgraded farm capacity, preserved from simulation.js. */
function gm(u,tg){const t=S.tech[u.t];let m=(t.gath?1.25:1)*(typeof georgianChurchWorkRate==='function'?georgianChurchWorkRate(u):1);const k=tg.k,armenian=S.civ?.[u.t]===41;if(k==='w'){m*=1+(armenian?.28:.2)*!!t.axe+(armenian?.28:.2)*!!t.saw;if(t.wd)m*=1.15}else if(k==='g')m*=1+(armenian?.21:.15)*!!t.gmine+.15*!!t.mn;else if(k==='s')m*=1+(armenian?.21:.15)*!!t.smine+.15*!!t.mn;else if(k==='f'&&tg.fm)m*=1+.15*!!t.fa;
 if(u.k==='vil'&&S.civ?.[u.t]===40)m*=1.05;
 return m}
/* AoE-style farm capacity upgrades add food, rather than incorrectly increasing the harvest rate. */
function farmFood(t){const q=S.tech[t]||{};return 175+(q.coll?75:0)+(q.plow?125:0)+(q.crop?175:0)}

/* Mountain Royals Mule Cart: genuine mobile 1×1 building, not Trade Cart.
 * Grid occupancy and deterministic movement travel with the saved building ID.
 * Research pauses movement; manual orders override automatic resource chasing. */
function muleCartTileFree(b,x,y){
 if(!S||!Number.isInteger(x)||!Number.isInteger(y)||x<1||y<1||x>=W-1||y>=H-1)return false;
 const i=y*W+x;
 return S.wt[i]!==1&&!S.g[i]&&!S.nd[i]&&
  !S.us.some(u=>u&&u.hp>0&&!u.ld&&Math.floor(u.x)===x&&Math.floor(u.y)===y);
}
function muleCartRoute(b,x,y){
 if(!b||!Number.isInteger(b.x)||!Number.isInteger(b.y)||!muleCartTileFree(b,x,y))return null;
 const start=b.y*W+b.x,held=S.g[start];S.g[start]=0;
 let route;
 try{route=path({t:b.t,x:b.x+.5,y:b.y+.5,sh:false},gp(x+.5,y+.5,.6))}
 finally{S.g[start]=held}
 if(!Array.isArray(route)||!route.length||route.length>W*H)return null;
 return route.map(p=>[Math.floor(p[0]),Math.floor(p[1])]);
}
function orderMuleCart(b,x,y,automatic=false){
 if(!S?.bs?.includes(b)||b.k!=='mule'||b.hp<=0||!b.done||
  ![41,42].includes(S.civ?.[b.t])||!Number.isInteger(x)||!Number.isInteger(y))return false;
 if(b.x===x&&b.y===y){b.mulePath=[];b.muleProgress=0;b.muleAuto=!!automatic;return true}
 const route=muleCartRoute(b,x,y);
 if(!route)return false;
 b.mulePath=route;b.muleProgress=0;b.muleAuto=!!automatic;
 return true;
}
function tickMuleCarts(dt){
 if(!S||!Number.isFinite(dt)||dt<=0)return;
 for(const b of S.bs){
  if(!b||b.k!=='mule'||!b.done||b.hp<=0)continue;
  const route=b.mulePath;
  if(Array.isArray(route)&&route.length){
   if(b.rs)continue;
   b.muleProgress=Math.min(8,Math.max(0,(b.muleProgress||0)+dt*.8));
   // Max four grid moves per tick after an interrupted browser frame.
   for(let steps=0;steps<4&&route.length;steps++){
    const [nx,ny]=route[0],cost=nx!==b.x&&ny!==b.y?Math.SQRT2:1;
    if(b.muleProgress<cost)break;
    if(Math.abs(nx-b.x)>1||Math.abs(ny-b.y)>1||!muleCartTileFree(b,nx,ny)){
     b.mulePath=[];b.muleProgress=0;break;
    }
    S.g[b.y*W+b.x]=0;b.x=nx;b.y=ny;S.g[b.y*W+b.x]=1;
    route.shift();b.muleProgress-=cost;
   }
   continue;
  }
  if(b.muleAuto===false||b.rs)continue;
  b.muleCheck=(b.muleCheck||0)-dt;
  if(b.muleCheck>0)continue;
  b.muleCheck=7;
  // Stay at a viable deposit; relocate only after its nearby resources run out.
  const usable=n=>n&&n.amt>0&&!n.fi&&!n.fm&&
   (n.k==='w'||n.k==='g'||n.k==='s'||n.k==='f'&&n.an)&&
   Number.isInteger(n.x)&&Number.isInteger(n.y);
  if(S.nodes.some(n=>usable(n)&&Math.hypot(n.x-b.x,n.y-b.y)<=2.5))continue;
  const nearby=S.nodes.filter(n=>usable(n)&&Math.hypot(n.x-b.x,n.y-b.y)<=9)
    .sort((a,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(c.x-b.x,c.y-b.y)||a.y-c.y||a.x-c.x);
  let moved=false;
  for(const n of nearby.slice(0,8)){
   const sites=[];
   for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
    if(!dx&&!dy)continue;
    const x=n.x+dx,y=n.y+dy;
    if(muleCartTileFree(b,x,y))sites.push([x,y]);
   }
   sites.sort((a,c)=>Math.hypot(a[0]-b.x,a[1]-b.y)-Math.hypot(c[0]-b.x,c[1]-b.y));
   for(const [x,y] of sites.slice(0,8))
    if(orderMuleCart(b,x,y,true)){moved=true;break}
   if(moved)break;
  }
 }
}

/* Shared unit-like cart actions; the building keeps its occupancy on stop. */
function stopMuleCart(b){
 if(!S?.bs?.includes(b)||b.k!=='mule'||!b.done||b.hp<=0)return false;
 b.mulePath=[];b.muleProgress=0;b.muleAuto=false;return true;
}
function resumeMuleCart(b){
 if(!S?.bs?.includes(b)||b.k!=='mule'||!b.done||b.hp<=0)return false;
 b.mulePath=[];b.muleProgress=0;b.muleAuto=true;b.muleCheck=0;return true;
}
