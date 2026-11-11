function mkTrades(){const rows=[],upd=()=>rows.forEach(r=>r.up());for(const k of['f','w','s'])for(const md of['sell','buy']){const it={lk:'',c:{},l:'',up:()=>{const p=S.px[0][k];it.l=md==='sell'?'Sell 100 '+RN[k]+' for '+Math.round(p*.7)+' Gold (next '+Math.round(Math.max(25,p-3)*.7)+')':'Buy 100 '+RN[k]+' for '+Math.round(p*1.3)+' Gold (next '+Math.round(Math.min(400,p+3)*1.3)+')';it.c=md==='sell'?{[k]:100}:{g:Math.round(p*1.3)}},fn:()=>{trade(0,k,md);upd()}};rows.push(it)}upd();return rows}
function trade(t,k,md){if(!S||!Number.isInteger(t)||!S.px?.[t]||!S.res?.[t]||!['f','w','s'].includes(k)||!['buy','sell'].includes(md))return false;const q=S.px[t],p=q[k],R2=S.res[t];if(!Number.isFinite(p)||p<25||p>400||!Number.isFinite(R2.g)||!Number.isFinite(R2[k])||R2.g<0||R2[k]<0)return false;const gold=md==='sell'?Math.round(p*.7):Math.round(p*1.3);if(!Number.isSafeInteger(gold)||R2.g>Number.MAX_SAFE_INTEGER||R2[k]>Number.MAX_SAFE_INTEGER||md==='sell'&&R2.g>Number.MAX_SAFE_INTEGER-gold||md==='buy'&&R2[k]>Number.MAX_SAFE_INTEGER-100)return false;if(md==='sell'){if(R2[k]<100){if(!t)note('Not enough '+RN[k]);return false;}R2[k]-=100;R2.g+=gold;q[k]=Math.max(25,p-3)}else{const c=gold;if(R2.g<c){if(!t)note('Not enough Gold');return false;}R2.g-=c;R2[k]+=100;q[k]=Math.min(400,p+3)}if(!t)note('Traded');return true}

/* Shared economy ledger and population capacity helpers. Keep the same
 * reserved-population, payment and cost-label semantics as the engine. */
const capOf=t=>Math.min(popLimit,10+5*S.bs.filter(b=>b&&b.t===t&&b.done&&b.hp>0&&(b.k==='house'||b.k==='folwark'&&S.civ?.[t]===35)).length+
 (typeof alliedCivilizationIds==='function'&&typeof CIV!=='undefined'&&
  alliedCivilizationIds(t).some(id=>CIV[id]?.teamDockPopulation===5)?
  5*S.bs.filter(b=>b&&b.t===t&&b.done&&b.hp>0&&b.k==='dock').length:0));
// Training reserves slots; spawning tests living units so its own reservation cannot block completion.
const livePopulation=t=>S.us.reduce((n,u)=>n+(u&&u.t===t&&u.hp>0?1:0),0)+(S.bs?.reduce((n,b)=>n+(b&&b.t===t&&b.hp>0&&b.k==='feitoria'?20:0),0)||0);
const popOf=t=>livePopulation(t)+queuedPopulation(t);
const can=(t,c)=>Object.keys(c).every(k=>S.res[t][k]>=c[k]),pay=(t,c,m=-1)=>{for(const k in c)S.res[t][k]+=m*c[k]};
const cs=c=>Object.entries(c).map(([k,v])=>v+k.toUpperCase()).join(' ')||'free';
