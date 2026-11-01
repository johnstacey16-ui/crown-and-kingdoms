/* Building spawn positions and training-rate policy; unchanged classic-script declarations extracted from simulation.js. */
function spawnPos(b){const occupied=new Set();for(const u of S.us)if(u.hp>0&&!u.ld&&Number.isFinite(u.x)&&Number.isFinite(u.y)){const x=Math.floor(u.x),y=Math.floor(u.y);if(Math.abs(u.x-(x+.5))<.35&&Math.abs(u.y-(y+.5))<.35)occupied.add(y*W+x)}for(let i=-1;i<=b.s;i++)for(const[x,y]of[[b.x+i,b.y-1],[b.x+i,b.y+b.s],[b.x-1,b.y+i],[b.x+b.s,b.y+i]]){if(x<0||y<0||x>=W||y>=H)continue;const ix=y*W+x;if(!(b.k==='dock'?(S.wt[ix]===1||S.wt[ix]===2)&&!S.nd[ix]:!S.g[ix]&&S.wt[ix]!==1&&!S.nd[ix]))continue;if(occupied.has(ix))continue;return[x+.5,y+.5]}return null}
const MILITARY_PRODUCTION_BUILDINGS=new Set(['bar','rng','stable','siege','castle','monastery','dock']);
function trainRate(b,k){return S.tech[b.t]&&S.tech[b.t].cons&&MILITARY_PRODUCTION_BUILDINGS.has(b.k)&&!['vil','cart','fish','trn','cog'].includes(k)?4/3:1}

/* Construction placement and occupied-ground protection, unchanged from simulation.js. */
function okPlace(t,k,x,y){if(!S||!B[k]||!Number.isInteger(t)||!S.tech[t]||!Number.isInteger(x)||!Number.isInteger(y))return false;if(vm===6&&k==='tc')return false;const s=B[k].s;if(x<1||y<1||x+s>W-1||y+s>H-1)return false;
// A solid foundation or farm would strand any unit already on these tiles:
// pathfinding and movement correctly reject a blocked starting tile.
for(const u of S.us||[])if(u&&u.hp>0&&!u.ld&&u.x>=x&&u.x<x+s&&u.y>=y&&u.y<y+s)return false;
for(let j=0;j<s;j++)for(let i=0;i<s;i++){const n=(y+j)*W+x+i;if(S.g[n]||S.wt[n]||(t===0&&!S.ex[n]))return false}if(B[k].wat){let w=0;for(let j=-1;j<=s;j++)for(let i=-1;i<=s;i++){const X2=x+i,Y2=y+j;if((i<0||j<0||i>=s||j>=s)&&X2>=0&&Y2>=0&&X2<W&&Y2<H&&S.wt[Y2*W+X2]&&!S.nd[Y2*W+X2])w++}if(!w)return false}return true}
