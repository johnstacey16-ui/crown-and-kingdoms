const DIPLOMACY_STATES=['enemy','neutral','ally'];
function createDiplomacy(n,source=null){
 const d=Array.from({length:n},(_,a)=>Array.from({length:n},(_,b)=>a===b?'self':'enemy'));
 if(Array.isArray(source))for(let a=0;a<n;a++)for(let b=a+1;b<n;b++){
  const ab=source[a]&&source[a][b],ba=source[b]&&source[b][a];
  const rel=DIPLOMACY_STATES.includes(ab)?ab:DIPLOMACY_STATES.includes(ba)?ba:'enemy';
  d[a][b]=d[b][a]=rel;
 }
 return d;
}
function diplomacyRelation(a,b){if(a===b)return 'self';return S&&S.dip&&S.dip[a]&&S.dip[a][b]||'enemy'}
function isHostile(a,b){return a!==b&&diplomacyRelation(a,b)==='enemy'}
function relationLabel(r){return r==='ally'?'Ally':r==='neutral'?'Neutral':r==='self'?'Self':'Enemy'}
function setDiplomacy(a,b,rel){
 if(!S||!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>=S.teamN||b>=S.teamN||a===b||!DIPLOMACY_STATES.includes(rel))return false;
 S.dip[a][b]=S.dip[b][a]=rel;
 if(rel!=='enemy')for(const u of S.us)if((u.o==='a'||u.o==='v')&&u.tg&&Number.isInteger(u.tg.t)&&((u.t===a&&u.tg.t===b)||(u.t===b&&u.tg.t===a))){const guard=u.guardTarget&&u.guardTarget.hp>0?u.guardTarget:null;u.o=guard?'G':'i';u.tg=guard;u.guardTarget=null;u.p=[]}
 if(a===0||b===0)note('Diplomacy: Kingdom '+((a===0?b:a)+1)+' is now '+relationLabel(rel)+(rel==='ally'?' — shared vision enabled':rel==='neutral'?' — shared vision ended':' — shared vision ended'));
 return true;
}
function rotateDiplomacy(a,b,dir){
 const i=DIPLOMACY_STATES.indexOf(diplomacyRelation(a,b)),step=dir<0?2:1;
 return setDiplomacy(a,b,DIPLOMACY_STATES[(Math.max(0,i)+step)%DIPLOMACY_STATES.length]);
}
function diplomacyMenuItems(){
 if(!S||cmp)return [];
 const items=[];
 for(let t=1;t<S.teamN;t++)if(S.bs.some(b=>b.t===t&&b.hp>0)||S.us.some(u=>u.t===t&&u.hp>0))
  items.push({n:'Diplomacy: Kingdom '+(t+1),v:()=>relationLabel(diplomacyRelation(0,t)),l:()=>rotateDiplomacy(0,t,-1),r:()=>rotateDiplomacy(0,t,1),a:()=>rotateDiplomacy(0,t,1)});
 return items;
}
const TRIBUTE_RESOURCES=[{k:'f',n:'Food'},{k:'w',n:'Wood'},{k:'g',n:'Gold'},{k:'s',n:'Stone'}];
const TRIBUTE_AMOUNTS=[100,250,500,1000];
let tributeResource=0,tributeAmount=0;
function sendTribute(from,to,resourceIndex,amount=100){
 if(!S||!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=S.teamN||to>=S.teamN||from===to)return false;
 const resource=TRIBUTE_RESOURCES[resourceIndex];
 if(!resource||!Number.isInteger(amount)||amount<=0)return false;
 if(diplomacyRelation(from,to)!=='ally'){if(from===0)note('Tribute requires an alliance');return false}
 if(!S.res[from]||!S.res[to]||S.res[from][resource.k]<amount){if(from===0)note('Not enough '+resource.n+' for tribute');return false}
 S.res[from][resource.k]-=amount;S.res[to][resource.k]+=amount;
 if(from===0)note('Sent '+amount+' '+resource.n+' to Kingdom '+(to+1));
 return true;
}
function tributeMenuItems(){
 if(!S||cmp)return [];
 const allies=[];
 for(let t=1;t<S.teamN;t++)if(diplomacyRelation(0,t)==='ally'&&(S.bs.some(b=>b.t===t&&b.hp>0)||S.us.some(u=>u.t===t&&u.hp>0)))allies.push(t);
 if(!allies.length)return [];
 const items=[
  {n:'Tribute resource',v:()=>TRIBUTE_RESOURCES[tributeResource].n,l:()=>{tributeResource=(tributeResource+TRIBUTE_RESOURCES.length-1)%TRIBUTE_RESOURCES.length},r:()=>{tributeResource=(tributeResource+1)%TRIBUTE_RESOURCES.length},a:()=>{tributeResource=(tributeResource+1)%TRIBUTE_RESOURCES.length}},
  {n:'Tribute amount',v:()=>TRIBUTE_AMOUNTS[tributeAmount],l:()=>{tributeAmount=(tributeAmount+TRIBUTE_AMOUNTS.length-1)%TRIBUTE_AMOUNTS.length},r:()=>{tributeAmount=(tributeAmount+1)%TRIBUTE_AMOUNTS.length},a:()=>{tributeAmount=(tributeAmount+1)%TRIBUTE_AMOUNTS.length}}
 ];
 for(const t of allies)items.push({n:'Send tribute: Kingdom '+(t+1),v:()=>TRIBUTE_RESOURCES[tributeResource].n+' / '+TRIBUTE_AMOUNTS[tributeAmount],a:()=>sendTribute(0,t,tributeResource,TRIBUTE_AMOUNTS[tributeAmount])});
 return items;
}
