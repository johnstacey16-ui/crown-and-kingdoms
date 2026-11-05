// Scripted-player construction only; executes inside the production game VM.
// Share this exact helper between playthroughs and behavioural legality tests.
export const campaignConstruction = `
function createCampaignBuilder(tc) {
  const orders = [];
  const placeBuilding = (kind, count = 1, chain = new Set()) => {
    if (!B[kind] || !Number.isInteger(count) || count < 1 || chain.has(kind)) return false;
    // Serial construction avoids placing several foundations across the same
    // narrow approach while other workers are travelling through it.
    if(S.bs.some(b=>b.t===0&&b.hp>0&&!b.done))return false;
    const existing = S.bs.filter(building => building.t === 0 && building.k === kind && building.hp > 0);
    if (existing.length >= count || existing.some(building => !building.done)) return true;
    if ((B[kind].age || 0) > S.age[0]) return false;
    const required = kind === 'farm' ? 'mill' : B[kind].req;
    const prerequisite = required && S.bs.find(b => b.t === 0 && b.k === required && b.hp > 0 && b.done);
    if (required && !prerequisite) {
      // Build the real dependency first; incomplete, hostile and dead
      // foundations never unlock the requested building or spend its cost.
      return placeBuilding(required, 1, new Set([...chain, kind]));
    }
    // Use the live player menu policy, including age, Wonder and mode locks.
    if (bLock(kind) || !can(0, B[kind].cost)) return false;
    const workers = S.us.filter(unit => unit && unit.t === 0 && unit.k === 'vil' && unit.hp > 0 && !unit.ld);
    const available = workers.filter(unit => unit.o !== 'b' || !unit.tg || unit.tg.done);
    available.sort((a, b) => Math.hypot(a.x - (tc.x + tc.s / 2), a.y - (tc.y + tc.s / 2)) - Math.hypot(b.x - (tc.x + tc.s / 2), b.y - (tc.y + tc.s / 2)));
    let worker = null, site = null;
    const water=kind==='dock'?campaignWaterRegions():null;
    const originX = Math.floor(tc.x + tc.s / 2), originY = Math.floor(tc.y + tc.s / 2);
    const dockSites=[];
    if(water){
      for(let y=1;y<H-B[kind].s;y++)for(let x=1;x<W-B[kind].s;x++){
        const radius=Math.max(Math.abs(x-originX),Math.abs(y-originY));
        if(radius>=3&&campaignDockAccess(x,y,B[kind].s,water,4)&&okPlace(0,kind,x,y))dockSites.push({x,y,radius});
      }
      dockSites.sort((a,b)=>a.radius-b.radius||a.y-b.y||a.x-b.x);
    }
    for(const candidateWorker of available){
      if(water){
        for(const candidate of dockSites)if(path(candidateWorker,goalNear({...candidate,s:B[kind].s},1))){site=[candidate.x,candidate.y];break}
      }else{
        for (let radius = 3; radius <= 18 && !site; radius++) {
          for (let dy = -radius; dy <= radius && !site; dy++) for (let dx = -radius; dx <= radius && !site; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
            const x = originX + dx, y = originY + dy;
            const candidate = { x, y, s: B[kind].s };
            if (okPlace(0, kind, x, y) && path(candidateWorker, goalNear(candidate, 1))) site = [x, y];
          }
        }
      }
      if(site){worker=candidateWorker;break}
    }
    if (!site) return false;
    pay(0, B[kind].cost);
    const building = addB(0, kind, site[0], site[1], false);
    worker.o = 'b'; worker.tg = building; worker.p = []; worker.rp = 0;
    orders.push({kind, time: S.t, prerequisite: required || null,
      prerequisiteId: prerequisite ? prerequisite.netId : null});
    return true;
  };
  return {place: placeBuilding, orders};
}
`;
