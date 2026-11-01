/* Crown & Kingdoms — age requirements, per-team research costs and research orders.
 * Original classic-script declarations, unchanged; loaded before simulation.js.
 * Building completion/research effects remain with upB in simulation.js. */
function ageRequirements(t,world=S){
 const g=AG[world.age[t]+1];if(!g)return {ready:false,count:0};
 const completed=world.bs.filter(b=>b.t===t&&b.done&&b.hp>0);
 const count=new Set(completed.filter(b=>g.needs.includes(b.k)).map(b=>b.k)).size;
 return {ready:count>=2||!!(g.single&&completed.some(b=>b.k===g.single)),count};
}
/* Spanish civilization bonus (DE): Blacksmith technologies cost no gold.
 * Keep the base TE catalogue immutable and calculate costs separately for each
 * owning team, so player, AI, synchronized command menus and payment agree.
 */
function researchCost(b,k,civs=S?.civ){
 const cost=TE[k]?.cost||{},index=civs?.[b?.t];
 return b?.k==='smith'&&Number.isInteger(index)&&CIV[index]?.n==='Spanish'&&cost.g
  ?{...cost,g:0}:cost;
}
function research(b,k){if(!b||b.hp<=0||!b.done||!S||!Number.isInteger(b.t)||!S.tech[b.t]||!B[b.k])return false;const t=b.t;if(b.q&&b.q.length){if(!t)note('Finish or cancel training before researching');return false}if(b.rs){if(!t)note('Already researching here');return false}if(S.bs.some(x=>x!==b&&x.t===t&&x.hp>0&&x.rs&&x.rs.k===k)){if(!t)note(k==='age'?'Age advance already in progress':'Technology already being researched');return false}let d;
if(k==='age'){if(b.k!=='tc'){if(!t)note('Advance Age requires a Town Centre');return false}const g=AG[S.age[t]+1];if(!g){if(!t)note('Already Imperial Age');return false}const gate=ageRequirements(t);if(!gate.ready){if(!t)note('Needs 2 different current-age buildings ('+gate.count+'/2)'+(g.single?' or a completed Castle':''));return false}d=g}
else{d=TE[k];if(!d||!Array.isArray(B[b.k].rs)||!rsOf(b).includes(k)){if(!t)note('Research unavailable at this building');return false}if(S.tech[t][k]||d.age>S.age[t]||(d.pre&&!S.tech[t][d.pre])){if(!t)note('Locked');return false}}
if(k!=='age'&&b.k==='smith')d={...d,cost:researchCost(b,k)};
if(!can(t,d.cost)){if(!t)note('Not enough resources');return false}pay(t,d.cost);b.rs={k,t:d.t};return true}
