/* Crown & Kingdoms — production queues, training payment and refunds.
 * Classic browser declarations loaded directly before js/simulation.js.
 * Queue rules are moved unchanged and keep current-build save/load contracts. */
function queuedPopulation(t){return S.bs.reduce((n,b)=>n+(b&&b.t===t&&b.hp>0&&Array.isArray(b.q)?b.q.length:0),0)}
function train(b,k){if(!b||b.hp<=0||!b.done||!Number.isInteger(b.t)||!S||!S.tech[b.t]||!B[b.k]||!Array.isArray(B[b.k].tr)||!trOf(b).includes(k)||!U[k]||!Array.isArray(b.q)||b.rs)return false;const t=b.t,d=U[k];if(d.age>S.age[t]){if(!t)note('Requires '+AG[d.age].n);return false}if(!can(t,d.cost)){if(!t)note('Not enough resources');return false}
if(popOf(t)>=capOf(t)){
 if(!t){
  const population=popOf(t),capacity=capOf(t);
  if(typeof popLimit==='number'&&Number.isFinite(popLimit)&&population>=popLimit)
   note('Population limit reached ('+population+'/'+popLimit+')');
  else{
   const houses=Math.ceil((population+1-capacity)/5);
   note('Population full ('+population+'/'+capacity+'): build '+houses+' House'+(houses===1?'':'s'));
  }
 }
 return false;
}if(b.q.length>=5)return false;pay(t,d.cost);b.q.push({k,t:k==='skirm'&&S.tech[t]?.elsk?22:d.t});return true}
function cancelQ(b){if(!b||b.hp<=0||!b.done||!Number.isInteger(b.t)||!S||!S.tech[b.t]||!Array.isArray(b.q)||!b.q.length)return false;const q=b.q[b.q.length-1];if(!q||!U[q.k]){b.q.pop();return false}b.q.pop();pay(b.t,U[q.k].cost,1);note('Cancelled - full refund');return true}

// Presentation-only explanation for a completed queue head. The same live
// capacity and exit checks used by upB are read without advancing the queue.
function productionQueueWait(b){
 const q=b?.q?.[0];
 if(!b?.done||!(b.hp>0)||!Number.isInteger(b.t)||!S?.tech?.[b.t]||!q||!U[q.k]||!Number.isFinite(q.t)||q.t>0)return null;
 const live=livePopulation(b.t);
 if(typeof popLimit==='number'&&Number.isFinite(popLimit)&&live>=popLimit)return {label:'Population limit',hint:'The match population limit has been reached.'};
 if(live>=capOf(b.t))return {label:'Housing needed',hint:'Build Houses to continue training.'};
 return spawnPos(b)?null:{label:'Exit blocked',hint:'Clear space around this building to release trained units.'};
}
