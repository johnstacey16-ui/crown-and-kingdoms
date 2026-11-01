/* Crown & Kingdoms — production queues, training payment and refunds.
 * Classic browser declarations loaded directly before js/simulation.js.
 * Queue rules are moved unchanged and keep current-build save/load contracts. */
function queuedPopulation(t){return S.bs.reduce((n,b)=>n+(b&&b.t===t&&b.hp>0&&Array.isArray(b.q)?b.q.length:0),0)}
function train(b,k){if(!b||b.hp<=0||!b.done||!Number.isInteger(b.t)||!S||!S.tech[b.t]||!B[b.k]||!Array.isArray(B[b.k].tr)||!trOf(b).includes(k)||!U[k]||!Array.isArray(b.q)||b.rs)return false;const t=b.t,d=U[k];if(d.age>S.age[t]){if(!t)note('Requires '+AG[d.age].n);return false}if(!can(t,d.cost)){if(!t)note('Not enough resources');return false}
if(popOf(t)>=capOf(t)){if(!t)note('Population cap reached - build houses');return false}if(b.q.length>=5)return false;pay(t,d.cost);b.q.push({k,t:k==='skirm'&&S.tech[t]?.elsk?22:d.t});return true}
function cancelQ(b){if(!b||b.hp<=0||!b.done||!Number.isInteger(b.t)||!S||!S.tech[b.t]||!Array.isArray(b.q)||!b.q.length)return false;const q=b.q[b.q.length-1];if(!q||!U[q.k]){b.q.pop();return false}b.q.pop();pay(b.t,U[q.k].cost,1);note('Cancelled - full refund');return true}
