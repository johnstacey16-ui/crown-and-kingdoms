/* Building spawn positions and training-rate policy; unchanged classic-script declarations extracted from simulation.js. */
function spawnPos(b){const occupied=new Set();for(const u of S.us)if(u.hp>0&&!u.ld&&Number.isFinite(u.x)&&Number.isFinite(u.y)){const x=Math.floor(u.x),y=Math.floor(u.y);if(Math.abs(u.x-(x+.5))<.35&&Math.abs(u.y-(y+.5))<.35)occupied.add(y*W+x)}for(let i=-1;i<=b.s;i++)for(const[x,y]of[[b.x+i,b.y-1],[b.x+i,b.y+b.s],[b.x-1,b.y+i],[b.x+b.s,b.y+i]]){if(x<0||y<0||x>=W||y>=H)continue;const ix=y*W+x;if(!(b.k==='dock'?(S.wt[ix]===1||S.wt[ix]===2)&&!S.nd[ix]:!S.g[ix]&&S.wt[ix]!==1&&!S.nd[ix]))continue;if(occupied.has(ix))continue;return[x+.5,y+.5]}return null}
const MILITARY_PRODUCTION_BUILDINGS=new Set(['bar','rng','stable','siege','castle','monastery','dock']);
/* Faction team bonuses are defined with CIV, not duplicated in the simulation.
 * Apply each allied civilization once, even when several allies choose it.
 * Resolve on every queue tick so diplomacy changes and restored saves agree. */
function civilizationTeamWorkRate(b,kind='train',researchKey=null){
 if(!S||!Array.isArray(S.civ)||!Number.isInteger(b?.t)||b.t<0||b.t>=S.civ.length)return 1;
 let rate=1;
 for(const id of alliedCivilizationIds(b.t)){
  const civ=CIV[id];
  if(!civ)continue;
  const buildingRate=civ.teamWork?.[b.k];
  if(Number.isFinite(buildingRate)&&buildingRate>0)rate*=buildingRate;
  if(kind==='research'&&researchKey!=='age'&&Number.isFinite(civ.teamResearch)&&civ.teamResearch>0)
   rate*=civ.teamResearch;
 }
 return rate;
}
function trainRate(b,k){const tech=S.tech[b.t]||{},conscription=tech.cons&&MILITARY_PRODUCTION_BUILDINGS.has(b.k)&&!['vil','cart','fish','trn','cog'].includes(k)?4/3:1;const cuman=S.civ?.[b.t]===31&&tech.ut31&&['scout','cavarch','steppe'].includes(k)?1.5:1;
 return conscription*cuman*(b.k==='bar'&&tech.perfusion?2:1)*civilizationTeamWorkRate(b,'train',k)}

/* Shared rally dispatch for newly trained workers, merchants and military.
 * Resource work and explicit trade keep their normal route/retry policies. */
function applyProductionRally(u,rally,producer=null){
 if(!rally)return;
 if(u.k==='vil')u.autoWorker=0;
 u.o='i';u.p=[];u.tg=null;u.ct=null;u.ret=0;
 const merchant=u.k==='cart'||u.k==='cog';
 if(merchant&&assignTradeRoute(u,rally.t,producer))return;
 const n=rally.t,worker=n&&((u.k==='vil'&&!n.fi)||(u.k==='fish'&&n.fi&&n.k==='f'));
 if(worker&&n.amt>0&&S.nd[n.y*W+n.x]===n&&knownResource(u,n)&&
   (!n.fm||n.t===u.t)&&(!n.trap||n.t===u.t)){
  u.o='g';u.tg=n;u.ct=n.k;return;
 }
 const route=path(u,gp(rally.x,rally.y,1.5));
 if(route){u.o='m';u.p=route;if(merchant){u.tradePaused=false;u.manualTradeMove=true}}
 else if(merchant)u.tradePaused=true;
}

/* Construction placement and occupied-ground protection, unchanged from simulation.js. */
function okPlace(t,k,x,y){if(!S||!B[k]||!Number.isInteger(t)||!S.tech[t]||!Number.isInteger(x)||!Number.isInteger(y))return false;if(vm===6&&k==='tc')return false;
if(typeof civilizationBuildingAllowed==='function'&&!civilizationBuildingAllowed(k,t))return false;
if(B[k].pop&&popOf(t)+B[k].pop>capOf(t))return false;const s=B[k].s;if(x<1||y<1||x+s>W-1||y+s>H-1)return false;
// A solid foundation or farm would strand any unit already on these tiles:
// pathfinding and movement correctly reject a blocked starting tile.
for(const u of S.us||[])if(u&&u.hp>0&&!u.ld&&u.x>=x&&u.x<x+s&&u.y>=y&&u.y<y+s)return false;
for(let j=0;j<s;j++)for(let i=0;i<s;i++){const n=(y+j)*W+x+i;if(S.g[n]||S.wt[n]||(t===0&&!S.ex[n]))return false}if(B[k].wat){let w=0;for(let j=-1;j<=s;j++)for(let i=-1;i<=s;i++){const X2=x+i,Y2=y+j;if((i<0||j<0||i>=s||j>=s)&&X2>=0&&Y2>=0&&X2<W&&Y2<H&&S.wt[Y2*W+X2]&&!S.nd[Y2*W+X2])w++}if(!w)return false}return true}
