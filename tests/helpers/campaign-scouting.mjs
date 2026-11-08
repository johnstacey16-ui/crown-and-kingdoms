// Scripted-player reconnaissance uses ordinary movement and fog. It never
// reads hidden map cells or reveals territory directly, and cannot build a Dock.
export const campaignScouting = `
function campaignScoutCauseway(state){
 if(!state||!cmp||cmp.i!==16||S.over||S.bs.some(b=>b&&b.t===0&&b.k==='dock'&&b.hp>0))return false;
 const active=u=>u&&u.t===0&&u.k==='knight'&&u.hp>0&&!u.ld;
 const scout=S.us.find(u=>active(u)&&u.netId===state.id)||S.us.find(active);
 if(!scout||scout.o==='a'||scout.o==='G'||scout.o==='B'||(scout.o==='m'&&scout.p?.length)||S.t<(state.retryAt||0))return false;
 // Follow the player-side bank of the *known* Causeway layout. Candidate
 // destinations are approximate; path() alone decides which ground is legal.
 // We do not inspect S.wt, S.ex, enemy positions or unrevealed Dock sites.
 const rows=[.78,.63,.48,.34,.23];
 for(let n=0;n<rows.length;n++){
  const index=((state.waypoint||0)+n)%rows.length,y=Math.round(H*rows[index]);
  const river=W*.38+y*.24+Math.sin(y*.055)*2.2+Math.sin(y*.13)*.8;
  for(const setback of [6,8,10,4]){
   const x=Math.round(river-setback);
   if(x<1||y<1||x>=W-1||y>=H-1)continue;
   const route=path(scout,gp(x+.5,y+.5,1.3));
   if(!route||route.length<2)continue;
   scout.o='m';scout.tg=null;scout.p=route;scout.rp=1;
   state.id=scout.netId;state.orders=(state.orders||0)+1;
   state.waypoint=(index+1)%rows.length;state.retryAt=S.t+6;
   return true;
  }
 }
 state.retryAt=S.t+12;
 return false;
}
`;
