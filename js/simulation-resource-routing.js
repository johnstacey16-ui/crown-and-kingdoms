/* Crown & Kingdoms — farm occupancy, resource selection, depots and fish traps.
 * Classic browser script declarations, loaded before js/simulation.js.
 * Function bodies are extracted unchanged; current-build economy and AI callers
 * continue using these same global names. */
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
function dropoffCompatible(u,q){return q.t===u.t&&q.hp>0&&q.done&&Number.isFinite(q.x)&&Number.isFinite(q.y)&&q.x>=0&&q.y>=0&&q.x<W&&q.y<H&&(u.sh?q.k==='dock':q.k==='tc'||(q.k==='lumber'&&u.ct==='w')||(q.k==='mine'&&(u.ct==='g'||u.ct==='s'))||(q.k==='mill'&&u.ct==='f'))}
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
