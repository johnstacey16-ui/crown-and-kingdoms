/* Shared victory, elimination, score and hill rules. Classic script declarations stay globally callable; keep this before simulation.js. */
/* Victory rules: the chosen mode (vm) is authoritative. Town Centre loss ends a skirmish only in vm 0; campaign keeps its own rules (player TC loss = defeat, enemy TC only with sc.tcw).
   Every match end goes through endGame(): defeat takes precedence over a victory recorded in the same step, and S.why names the cause for the end screen. */
function tcEnds(t){return cmp?(t.t===0||!!CAMP[cmp.i].tcw):(vm===0||vm===6)}
function endGame(res,why){if(S.over==='lose')return;if(S.over&&res==='win')return;S.over=res;S.why=why;mode='end';if(cmp&&res==='win')campMark(cmp.i);sting(res==='win');rumble(700,1,.6)}
function elim(){if(cmp)return;if(vm===0){if(!S.bs.some(b=>b.t===0&&b.k==='tc'&&b.hp>0)){endGame('lose','Your Town Centre fell');return}if(!S.bs.some(b=>b.k==='tc'&&isHostile(0,b.t)&&b.hp>0))endGame('win','All hostile Town Centres have fallen');return}if(vm===6){if(!S.bs.some(b=>b.t===0&&b.k==='tc'&&b.hp>0)){endGame('lose','Your Town Centre fell in Sudden Death');return}if(!S.bs.some(b=>b.k==='tc'&&isHostile(0,b.t)&&b.hp>0))endGame('win','All hostile Town Centres have fallen in Sudden Death');return}const alive=t=>S.bs.some(b=>b.t===t&&b.hp>0)||S.us.some(u=>u.t===t&&u.hp>0);if(!alive(0)){endGame('lose','Your kingdom has been defeated');return}if(!Array.from({length:S.teamN-1},(_,i)=>isHostile(0,i+1)&&alive(i+1)).some(Boolean))endGame('win','All hostile kingdoms have been defeated')}
function kingdomAlive(t){return S.bs.some(b=>b.t===t&&b.hp>0)||S.us.some(u=>u.t===t&&u.hp>0)}
function kingdomScore(t){
 const res=S.res[t]||{};let resources=0;for(const n of Object.values(res))resources+=Math.max(0,Number(n)||0);resources/=10;
 let units=0;for(const u of S.us)if(u.t===t&&u.hp>0){const d=U[u.k]||{};let cost=0;for(const n of Object.values(d.cost||{}))cost+=Number(n)||0;units+=Math.max(0,cost/8)*Math.max(0,Math.min(1,u.hp/Math.max(1,d.hp||u.hp||1)))}
 let buildings=0;for(const b of S.bs)if(b.t===t&&b.hp>0){const d=B[b.k]||{};let cost=0;for(const n of Object.values(d.cost||{}))cost+=Number(n)||0;buildings+=Math.max(0,cost/8)*Math.max(0,Math.min(1,b.hp/Math.max(1,b.mh||d.hp||b.hp||1)))}
 let techCount=0;for(const k in(S.tech[t]||{}))if(S.tech[t][k]===1&&k!=='hpb'&&k!=='atkb')techCount++;
 const techs=techCount*30,age=(S.age[t]||0)*150;let relicCount=0;for(const r of S.rel)if(r.m&&r.m.t===t)relicCount++;const relics=relicCount*250;
 return Math.round(resources+units+buildings+techs+age+relics);
}
function kingHillControl(dt){
 const presence=Array(S.teamN).fill(0);
 for(const u of S.us)if(u.hp>0&&!u.ld&&u.k!=='vil'&&u.k!=='cart'&&u.k!=='cog'&&!(U[u.k]&&U[u.k].sh)&&Math.hypot(u.x-W/2,u.y-H/2)<=5.2&&(u.t===0||diplomacyRelation(0,u.t)!=='neutral')){
  const faction=u.t===0||diplomacyRelation(0,u.t)==='ally'?0:u.t;presence[faction]++;
 }
 const holders=presence.flatMap((n,t)=>n>0?[t]:[]),progress=S.kh||(S.kh=Array(S.teamN).fill(0));
 if(holders.length!==1){progress.fill(0);return}
 const holder=holders[0];
 for(let t=0;t<progress.length;t++)progress[t]=t===holder?Math.min(300,(progress[t]||0)+dt):0;
 if(progress[holder]>=300)endGame(holder===0?'win':'lose',holder===0?'Your kingdom held the central hill for 5 minutes':CIV[S.civ[holder]].n+' held the central hill for 5 minutes');
}
function vict(dt){if(vm===5){kingHillControl(dt);return}if(vm===3){if(!S.us.some(u=>u.t===0&&u.k==='king')){endGame('lose','Your King has fallen');return}if(!Array.from({length:S.teamN-1},(_,i)=>isHostile(0,i+1)&&S.us.some(u=>u.t===i+1&&u.k==='king')).some(Boolean))endGame('win','All hostile Kings have fallen');return}if(vm===4){const limit=scoreLimit;if(S.t<limit)return;if(!kingdomAlive(0)){endGame('lose','Your kingdom was eliminated before the score limit');return}const ranked=Array.from({length:S.teamN},(_,t)=>({t,score:kingdomScore(t)})).filter(q=>q.t===0||(isHostile(0,q.t)&&kingdomAlive(q.t))).sort((a,b)=>b.score-a.score);if(!ranked.length){endGame('lose','No kingdom survived the time limit');return}const leaders=ranked.filter(q=>q.score===ranked[0].score);if(leaders.length>1){endGame('draw','Draw at the '+Math.round(scoreLimit/60)+'-minute score limit: '+leaders.map(q=>CIV[S.civ[q.t]].n).join(' and ')+' tied on '+leaders[0].score+' points');return}const winner=ranked[0];endGame(winner.t===0?'win':'lose',CIV[S.civ[winner.t]].n+' wins on score at the '+Math.round(scoreLimit/60)+'-minute time limit ('+winner.score+' points)');return}const v=S.vc||(S.vc=Array(S.teamN).fill(0));for(let t=0;t<S.teamN;t++){if(t>0&&!isHostile(0,t)){v[t]=0;continue}let ok=false;if(vm===1)ok=S.bs.some(b=>b.t===t&&b.k==='wonder'&&b.done);else if(vm===2)ok=S.rel.length>0&&S.rel.every(r=>r.m&&r.m.t===t&&r.m.done);v[t]=ok?v[t]+dt:0;if(v[t]>=(vm===1?300:240)){endGame(t===0?'win':'lose',(t===0?'You':'A hostile kingdom')+(vm===1?' held a Wonder for 5 minutes':' held every relic for 4 minutes'));return}}}
