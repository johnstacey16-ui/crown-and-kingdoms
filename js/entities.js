/* Crown & Kingdoms — world entity factories. Loaded after shared state and kingdom helpers. */
'use strict';
/* Stable IDs are never list indexes: S.us/S.bs compact dead objects and resource lists can be reordered. The
 * counter is seeded by newGame or recovered from validated current saves. */
function nextNetworkEntityId(kind){
  if(!Number.isSafeInteger(S.netNext)||S.netNext<1)S.netNext=1;
  if(S.netNext>=1000000000000)throw Error('Network entity ID capacity exhausted');
  return kind+(S.netNext++);
}
function addN(k,x,y,amt,fm){x|=0;y|=0;if(x<1||y<1||x>=W-1||y>=H-1||S.g[y*W+x]||S.wt[y*W+x])return null;const n={netId:nextNetworkEntityId('n'),k,x,y,s:1,amt,fm};S.nodes.push(n);S.nd[y*W+x]=n;S.g[y*W+x]=1;return n}
/* One stat calculation for construction and researched upgrades. Additive
 * Hoardings HP must not be multiplied by later Masonry or Architecture. */
function buildingMaxHP(team,kind,techs=S.tech){
 const tech=techs[team]||{},wall=kind==='wall'||kind==='gate';
 return Math.round(B[kind].hp*(tech.mas?1.4:1)*(tech.bz?1.15:1)*
  (tech.fw&&wall?1.8:1)*(tech.arch?1.1:1)*
  (tech.ut10&&(wall||kind==='tower')?1.5:1))+
  (tech.hoardings&&kind==='castle'?1000:0);
}
function refreshResearchedBuildingHP(team,key){
 const prior={...S.tech[team]};delete prior[key];
 const before=[];before[team]=prior;
 for(const b of S.bs)if(b.t===team&&b.hp>0){
  const oldStandard=buildingMaxHP(team,b.k,before),newStandard=buildingMaxHP(team,b.k);
  if(oldStandard===newStandard)continue;
  const previous=b.mh||B[b.k].hp;
  // Campaign structures may intentionally have custom HP. Preserve that
  // scenario scaling while keeping the additive Castle upgrade separate.
  const oldFlat=prior.hoardings&&b.k==='castle'?1000:0;
  const newFlat=S.tech[team].hoardings&&b.k==='castle'?1000:0;
  const next=previous===oldStandard?newStandard:
   Math.round((previous-oldFlat)*(newStandard-newFlat)/(oldStandard-oldFlat))+newFlat;
  b.mh=next;
  b.hp=Math.min(next,key==='hoardings'?b.hp+next-previous:Math.round(b.hp*next/previous));
 }
}
function addB(t,k,x,y,done){const d=B[k],mh0=buildingMaxHP(t,k),b={netId:nextNetworkEntityId('b'),t,k,x,y,s:d.s,hp:done?mh0:1,mh:mh0,pr:done?d.bt:0,done:!!done,q:[]};S.bs.push(b);
 if(done&&k==='tc'&&S.civ?.[t]===32&&S.res?.[t]){
  S.res[t].f+=100;b.lithFoodGranted=true;
 }
 for(let j=0;j<b.s;j++)for(let i=0;i<b.s;i++)S.g[(y+j)*W+x+i]=1;if(k==='gate')S.gt[y*W+x]=t+1;
 if(done&&k==='fchurch'&&typeof grantArmenianFirstChurchRelic==='function')grantArmenianFirstChurchRelic(b);
 return b}
function addU(t,k,x,y){const u={netId:nextNetworkEntityId('u'),t,k,x,y,hp:U[k].hp+(S.tech[t].hpb&&S.tech[t].hpb[k]||0),sh:U[k].sh,cg:U[k].cap?[]:undefined,o:'i',p:[],cd:0,rp:S.r()*.5,car:0,ct:null,tg:null,ret:0,autoWorker:0};if(k==='coust')u.chargeReadyAt=S.t+35;if(S.civ?.[t]===40&&['mil','knight','centurion','legionary'].includes(k))u.romanChargeReadyAt=S.t+20;if(k==='urumi')u.urumiReadyAt=S.t+15;if(k==='shrivamsha'){u.dodgeCharges=5;u.dodgeRechargeAt=S.t+4}S.us.push(u);if(k==='vil'&&t===0&&S.vp&&S.vp.enabled)assignAutoVillager(u);return u}

/* Generated forests/deposits may be created in bulk rather than through addN.
 * Bind them once before a live match; IDs never depend on compacted array indices. */
function ensureResourceIds(){
 if(!Number.isSafeInteger(S.netNext)||S.netNext<1)S.netNext=1;
 const seen=new Set();
 for(const n of S.nodes){
  if(typeof n.netId==='string'&&/^n[1-9][0-9]{0,11}$/.test(n.netId)&&!seen.has(n.netId)){
   seen.add(n.netId);S.netNext=Math.max(S.netNext,Number(n.netId.slice(1))+1);
  }else n.netId=null;
 }
 for(const n of S.nodes)if(!n.netId){n.netId=nextNetworkEntityId('n');seen.add(n.netId)}
}
