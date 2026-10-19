// A bounded scripted opponent, not a replacement for the production enemy AI.
// Uses paid construction/training/research and normal player gather/attack orders.
export const scriptedPlayer = `
let playerNextOrder=0;
const playerStats={trained:0,buildOrders:0,ageOrders:0,attackOrders:0};
function scriptedPlayerTick(){
 if(S.t<playerNextOrder)return;playerNextOrder=S.t+3;
 const bs=S.bs.filter(b=>b.t===0&&b.hp>0),workers=S.us.filter(u=>u.t===0&&u.k==='vil'&&u.hp>0&&!u.ld),tc=bs.find(b=>b.k==='tc'&&b.done);
 if(!tc)return;
 const count=k=>bs.filter(b=>b.k===k).length;
 const build=k=>{const before=S.bs.length;aiBuild(workers,k,0);if(S.bs.length>before)playerStats.buildOrders++};
 if(popOf(0)+4>=capOf(0)&&!bs.some(b=>b.k==='house'&&!b.done))build('house');
 for(const k of ['lumber','mill','mine'])if(!count(k)){build(k);break}
 if(S.age[0]>=1){
  if(!count('bar'))build('bar');else if(!count('rng'))build('rng');
  if(S.age[0]>=2&&!count('siege'))build('siege');
 }
 if(!tc.rs&&!tc.q.length){
  if(workers.length>=18&&research(tc,'age'))playerStats.ageOrders++;
  else if(workers.length<(S.age[0]?28:18)&&train(tc,'vil'))playerStats.trained++;
 }
 const army=S.us.filter(u=>u.t===0&&u.hp>0&&!u.ld&&U[u.k]?.dmg>0&&!['vil','king','cart','cog'].includes(u.k));
 for(const b of bs)if(b.done&&!b.rs&&!b.q.length){
  const kind=b.k==='bar'?'spear':b.k==='rng'?'arc':b.k==='siege'?'ram':null;
  if(kind&&army.length<40&&train(b,kind))playerStats.trained++;
 }
 // Reassign only idle/empty-handed workers; carried resources are never discarded.
 const desired={f:.45,w:.35,g:.20};const assigned={f:0,w:0,g:0};
 for(const u of workers)if(u.o==='g'&&u.ct in assigned)assigned[u.ct]++;
 for(const u of workers){
  if(u.o!=='i'&&!(u.o==='g'&&!u.car&&!u.ret))continue;
  const k=Object.keys(desired).sort((a,b)=>(assigned[a]/Math.max(1,workers.length)-desired[a])-(assigned[b]/Math.max(1,workers.length)-desired[b]))[0];
  if(u.o==='g'&&(u.ct===k||assigned[u.ct]<=Math.ceil((desired[u.ct]||0)*workers.length)))continue;
  let nodes=S.nodes.filter(n=>n.k===k&&n.amt>0&&!n.an&&!n.fi&&Math.hypot(n.x-tc.x,n.y-tc.y)<30).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y));
  if(k==='f'&&(!nodes.length||nodes[0].fm&&S.nodes.filter(n=>n.fm&&n.t===0&&n.amt>0).length<Math.ceil(workers.length*.5))&&can(0,B.farm.cost)){
   farm:for(let r=4;r<=10;r++)for(let dx=-r;dx<=r;dx++)for(const dy of [-r,r]){const x=tc.x+dx,y=tc.y+dy;if(!okPlace(0,'farm',x,y)||!path(u,gp(x+.5,y+.5,1.5)))continue;const n=addN('f',x,y,farmFood(0),1);if(n){n.t=0;pay(0,B.farm.cost);nodes=[n,...nodes];playerStats.buildOrders++;break farm}}
  }
  for(const n of nodes.slice(0,6))if(path(u,goalNear(n,1))){if(u.o==='g'&&u.ct in assigned)assigned[u.ct]--;S.sel=[u];orderSel(n,n.x+.5,n.y+.5);assigned[k]++;break}
 }
 const threat=S.us.find(u=>u.t===1&&u.hp>0&&!u.ld&&d2(u.x,u.y,tc)<16);
 // The scripted attacker knows the opposing capital location; no fog/UI acceptance is claimed.
 const target=threat||(army.length>=16?S.bs.find(b=>b.t===1&&b.k==='tc'&&b.hp>0):null);
 if(target){const ready=army.filter(u=>u.o!=='a'||u.tg!==target);if(ready.length){S.sel=ready;orderSel(target,target.x+(target.s||0)/2,target.y+(target.s||0)/2);playerStats.attackOrders++}}
 S.sel=[];
}
`;
