/* Crown & Kingdoms — authoritative in-simulation command adapter.
 * This is intentionally NOT connected to Supabase Broadcast. A remote packet
 * must first pass independently authenticated sender binding and the host's
 * CK_SIM_SYNC.createCommandHost() queue before execute() is called.
 * The authenticated battlefield uses this adapter; legacy rooms remain markers only.
 */
(function (root) {
  'use strict';
  const STANCES = Object.freeze({
    aggressive: 0, defensive: 1, 'stand-ground': 2, passive: 3, 'no-attack': 4
  });
  function militaryUnit(unit) {
    return !!unit && unit.hp > 0 && !unit.ld && !!U[unit.k] &&
      !['vil','fish','cart','cog','trn','mon','king'].includes(unit.k);
  }

  // Team-relative sight is calculated from the authoritative world. Never use
  // S.vs/S.ex here: those legacy arrays belong to the solo team-zero camera.
  function visibility(world, team, width, height) {
    if (!world || !Number.isInteger(team) || team < 0 || team >= world.teamN ||
        !Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 ||
        width > 1024 || height > 1024 || !Array.isArray(world.us) || !Array.isArray(world.bs))
      throw Error('Invalid team visibility');
    const cells = new Uint8Array(width * height);
    const shares = t => t === team || world.dip?.[team]?.[t] === 'ally';
    function reveal(e, radius) {
      if (!e || !(e.hp > 0) || e.ld || !shares(e.t) ||
          !Number.isFinite(e.x) || !Number.isFinite(e.y)) return;
      const size = Number.isFinite(e.s) ? e.s : 0;
      const cx = Math.floor(e.x + size/2), cy = Math.floor(e.y + size/2);
      if (cx < 0 || cy < 0 || cx >= width || cy >= height) return;
      for (let y = Math.max(0,cy-radius); y <= Math.min(height-1,cy+radius); y++)
        for (let x = Math.max(0,cx-radius); x <= Math.min(width-1,cx+radius); x++)
          if ((x-cx)**2+(y-cy)**2 <= radius*radius) cells[y*width+x] = 1;
    }
    for (const u of world.us) reveal(u,8+arrowSightBonus(u));
    for (const b of world.bs) reveal(b,(b?.k === 'tc' ? 11 : b?.k === 'outpost' ? 14 : 8)+arrowSightBonus(b));
    return cells;
  }
  function inSight(entity, cells, width, height) {
    if (!entity || !(entity.hp > 0) || entity.ld || !Number.isFinite(entity.x) || !Number.isFinite(entity.y)) return false;
    const size = Number.isFinite(entity.s) && entity.s > 0 ? entity.s : 0;
    const right = size ? Math.ceil(entity.x+size)-1 : Math.floor(entity.x);
    const bottom = size ? Math.ceil(entity.y+size)-1 : Math.floor(entity.y);
    for (let y = Math.max(0,Math.floor(entity.y)); y <= Math.min(height-1,bottom); y++)
      for (let x = Math.max(0,Math.floor(entity.x)); x <= Math.min(width-1,right); x++)
        if (cells[y*width+x]) return true;
    return false;
  }
  function buildingOptions(world, team, building) {
    if (!building || building.t !== team || building.hp <= 0 || !building.done ||
        !world.bs.includes(building) || !B[building.k]) return [];
    const options = [], definition = B[building.k], tech = world.tech?.[team] || {};
    const training = definition.tr || [];
    for (const kind of training) if (U[kind]) options.push({type:'train',value:kind,
      label:unitName(kind,team),cost:{...U[kind].cost},locked:U[kind].age > world.age[team] ? 'Requires '+AG[U[kind].age].n : ''});
    const research = definition.rs || [];
    if (building.k === 'tc' && AG[world.age[team]+1]) {
      const age = AG[world.age[team]+1];
      options.push({type:'research',value:'age',label:'Advance: '+age.n,cost:{...age.cost},locked:ageRequirements(team,world).ready?'':'Requires two different current-age buildings'+(age.single?' or one Castle':'')});
    }
    for (const key of research) if (TE[key]) {
      const entry = TE[key];
      options.push({type:'research',value:key,label:entry.n,cost:{...entry.cost},
        locked:tech[key] ? 'Researched' : entry.age > world.age[team] ? 'Requires '+AG[entry.age].n :
          entry.pre && !tech[entry.pre] ? 'Requires '+TE[entry.pre].n : ''});
    }
    if (GAR[building.k] && (building.cg || []).some(u=>u.hp>0&&u.ld===building&&u.t===team))
      options.push({type:'unload',label:'Unload garrison',cost:{},locked:''});
    return options;
  }
  function unitOptions(world,team,unit) {
    if (!unit || unit.t!==team || unit.hp<=0 || unit.ld || !world.us.includes(unit) || !U[unit.k]) return [];
    const options=[{type:'stop',label:'Stop',cost:{},locked:''}];
    if (!U[unit.k].sh) options.push({type:'garrison',label:'Garrison / board transport',targeted:true,cost:{},locked:''});
    if (unit.k==='vil' || U[unit.k].sh) options.push({type:'repair',label:unit.k==='vil'?'Repair / finish building or ship':'Repair ship',targeted:true,cost:{},locked:''});
    if (unit.k==='trn' && (unit.cg||[]).some(u=>u.hp>0&&u.ld===unit&&u.t===team))
      options.push({type:'disembark',label:'Unload at shore',targeted:true,cost:{},locked:''});
    if (militaryUnit(unit)) options.push(
      {type:'patrol',label:'Patrol',targeted:true,cost:{},locked:''},
      {type:'attack-move',label:'Attack Move',targeted:true,cost:{},locked:''});
    return options;
  }

  const BUILD_PAGES = Object.freeze([
    Object.freeze(['house','farm','lumber','mine','mill','market','dock','palisade','wall','gate','outpost']),
    Object.freeze(['bar','rng','stable','siege','smith','univ','castle','tower','monastery','wonder'])
  ]);
  function buildOptions(world,team) {
    return BUILD_PAGES.map(page=>page.map(kind=>{
      const d=B[kind],req=kind==='farm'?'mill':d.req;
      const locked=kind==='wonder'&&vm!==1?'Wonder victory is off':
        d.age>world.age[team]?'Requires '+AG[d.age].n:
        req&&!world.bs.some(b=>b.t===team&&b.k===req&&b.hp>0&&b.done)?'Requires '+B[req].n:'';
      return {type:'build',value:kind,label:d.n,cost:{...d.cost},size:d.s,locked};
    }));
  }
  function construct(units,order,team) {
    if(units.some(u=>u.k!=='vil'))return false;
    const option=buildOptions(S,team).flat().find(o=>o.value===order.value);
    const point=order.point;
    if(!option||option.locked||!Number.isInteger(point.x)||!Number.isInteger(point.y)||
        !can(team,option.cost)||!okPlace(team,option.value,point.x,point.y))return false;
    const sight=visibility(S,team,W,H),size=option.size;
    for(let y=point.y;y<point.y+size;y++)for(let x=point.x;x<point.x+size;x++)if(!sight[y*W+x])return false;
    const target={x:point.x,y:point.y,s:size},near=goalNear(target,1);
    const inside=(x,y)=>x>=point.x&&x<point.x+size&&y>=point.y&&y<point.y+size;
    const goal=(x,y)=>!inside(x+.5,y+.5)&&near(x,y);
    goal.hx=near.hx;goal.hy=near.hy;goal.hr=near.hr;
    const routes=units.map(u=>path(u,goal));
    if(routes.some(p=>!p||p.some(([x,y])=>inside(x,y))))return false;
    const entity=option.value==='farm'?addN('f',point.x,point.y,farmFood(team),1):addB(team,option.value,point.x,point.y,false);
    if(!entity)return false;
    if(option.value==='farm')entity.t=team;
    pay(team,option.cost);
    units.forEach((u,i)=>{
      u.o=option.value==='farm'?'g':'b';u.tg=entity;u.p=routes[i];u.pt=null;u.rp=1;
      u.as=0;u.autoWorker=0;u.guardTarget=null;u.ret=0;
      if(option.value==='farm'){u.ct='f';u.car=0;}
    });
    return true;
  }

  function lookup(id) {
    if (!root.CK_SIM_SYNC || !S) return null;
    if(root.CK_SIM_SYNC.validResourceId(id))return S.nodes.find(n=>n.netId===id)||null;
    if(!root.CK_SIM_SYNC.validId(id))return null;
    const list = id[0] === 'u' ? S.us : S.bs;
    if (!Array.isArray(list)) return null;
    return list.find(e => e && e.netId === id) || null;
  }

  function owned(order, team) {
    const objects = order.entities.map(lookup);
    if (!objects.length || objects.some((e, i) => !e || e.netId !== order.entities[i] ||
        e.t !== team || !Number.isFinite(e.hp) || e.hp <= 0)) return null;
    return objects;
  }

  function activeUnits(objects) {
    return objects.every(u => u.netId[0] === 'u' && !u.ld && U[u.k]);
  }
  function activeBuildings(objects) {
    return objects.length > 0 && objects.every(b => b.netId[0] === 'b' && b.done && B[b.k]);
  }

  function moveUnits(units, point, formation) {
    // Precompute every route before changing any unit command. Failed
    // all-member orders cannot strand a partly updated selection.
    const routes = [];
    const destinations = new Map();
    if (formation) for (const group of [units.filter(u=>!U[u.k].sh),units.filter(u=>U[u.k].sh)]) {
      if (!group.length) continue;
      const x=group.reduce((sum,u)=>sum+u.x,0)/group.length;
      const y=group.reduce((sum,u)=>sum+u.y,0)/group.length;
      const slots=formationSlots(group,x,y,formation==='split'?5:1);
      group.forEach((u,i)=>{const [dx,dy]=slots(i);destinations.set(u,{x:x+dx,y:y+dy,cx:x,cy:y});});
    }
    for (const u of units) {
      const goal=destinations.get(u)||point;
      const distance = Math.hypot(u.x - goal.x, u.y - goal.y);
      const route = formation ? path(u,gp(goal.x,goal.y,.8)) || path(u,gp(goal.x,goal.y,2)) ||
        path(u,gp(goal.cx,goal.cy,.8)) || path(u,gp(goal.cx,goal.cy,2)) :
        distance <= 1 ? [] : path(u, gp(goal.x, goal.y, 1));
      if (!route && (formation || distance > 1)) return false;
      routes.push(route || []);
    }
    units.forEach((u, i) => {
      u.o = routes[i].length ? 'm' : 'i';
      u.p = routes[i].slice();
      u.pt = null;
      u.tg = null;
      u.as = 0;
      u.autoWorker = 0;
      u.guardTarget = null;
      u.rp = 1;
      if (formation) u.netFormation = formation;
      if (u.k === 'cart' || u.k === 'cog') {
        u.manualTradeMove = true;
        u.tradePaused = false;
      }
    });
    return true;
  }

  function execute(order, team, frame) {
    // This is a production simulation adapter, not a trust boundary. The
    // createCommandHost inbox rechecks the sender, frame and ownership first.
    if (!S || mode !== 'play' || !root.CK_SIM_SYNC ||
        !Number.isSafeInteger(frame) || frame < 0 ||
        !Number.isInteger(team) || team < 0 || team >= S.teamN ||
        !root.CK_SIM_SYNC.validOrder(order, W) ||
        !Number.isInteger(W) || H !== W) return false;
    const entities = owned(order, team);
    if (!entities) return false;


    if (order.type === 'unload') {
      // One garrison per order: no partial multi-building mutation on failure.
      if (entities.length!==1 || !activeBuildings(entities) || !GAR[entities[0].k]) return false;
      const b=entities[0];
      // Reject corrupt/foreign manifests rather than silently discarding passengers.
      if (!Array.isArray(b.cg) || !b.cg.length || new Set(b.cg).size!==b.cg.length ||
          b.cg.some(u=>!S.us.includes(u)||u.hp<=0||u.ld!==b||u.t!==team||!U[u.k]||U[u.k].sh)) return false;
      return unload(b) === true;
    }

    if (order.type === 'train' || order.type === 'research' ||
        order.type === 'rally' || order.type === 'cancel') {
      if (!activeBuildings(entities) || order.type !== 'train' && entities.length !== 1) return false;
      const b = entities[0];
      if (order.type === 'train') {
        const count = Object.hasOwn(order, 'count') ? order.count : 1;
        const buildings = entities.filter(b => Array.isArray(b.q) && !b.rs &&
          Array.isArray(B[b.k].tr) && B[b.k].tr.includes(order.value));
        let queued = 0;
        // Match solo batching: each accepted unit pays its own cost and
        // reserves population/queue space. Stop at the first rejected unit.
        for (let i = 0; i < count; i++) {
          // Stable ties follow selection order, just as trainSelection() does.
          const ordered = buildings.slice().sort((a, b) => a.q.length - b.q.length);
          if (!ordered.some(building => train(building, order.value) === true)) break;
          queued++;
        }
        return queued > 0;
      }
      if (order.type === 'research') return research(b, order.value) === true;
      if (order.type === 'cancel') return cancelQ(b) === true;
      if (!Array.isArray(B[b.k].tr) || !B[b.k].tr.length || order.target != null)
        return false;
      b.rally = { x: order.point.x, y: order.point.y, t: null };
      return true;
    }

    if (!activeUnits(entities)) return false;
    if (order.type === 'formation') {
      if (entities.some(u=>!militaryUnit(u)||!Number.isFinite(u.x)||!Number.isFinite(u.y)||
          u.x<0||u.y<0||u.x>=W||u.y>=H)) return false;
      return moveUnits(entities,null,order.value);
    }


    if (order.type === 'garrison' || order.type === 'repair') {
      const target=lookup(order.target),building=target&&S.bs.includes(target);
      if (!target || target.hp<=0 || target.ld || entities.includes(target) ||
          !inSight(target,visibility(S,team,W,H),W,H) ||
          (target.t!==team && S.dip?.[team]?.[target.t]!=='ally')) return false;
      if (order.type==='garrison') {
        const capacity=building ? (target.done&&GAR[target.k]) : (target.t===team&&U[target.k]?.cap);
        const cargo=target.cg||[];
        if (!capacity || !Array.isArray(cargo) || new Set(cargo).size!==cargo.length ||
            cargo.some(u=>!S.us.includes(u)||u.hp<=0||u.ld!==target||u.t!==target.t||!U[u.k]||U[u.k].sh) ||
            cargo.length+entities.length>capacity || entities.some(u=>U[u.k].sh) ||
            (building && target.t!==team)) return false;
        // Allied garrison sharing is deliberately unavailable until unload ownership
        // and passenger restoration are modeled across different owners.
      } else {
        if (building ? entities.some(u=>u.k!=='vil') || target.done&&target.hp>=target.mh :
            !U[target.k]?.sh || target.hp>=mhp(target) || entities.some(u=>u.k!=='vil'&&!U[u.k].sh)) return false;
      }
      const reach=order.type==='garrison'?(building?1.3:1.7):building?1:1.2;
      const routes=entities.map(u=>path(u,goalNear(target,reach)));
      if (routes.some(route=>!route)) return false;
      entities.forEach((u,i)=>{
        u.o=order.type==='garrison'?'B':building?'b':'rep';u.tg=target;u.p=routes[i];u.rp=1;
        u.pt=null;u.as=0;u.autoWorker=0;u.guardTarget=null;u.ret=0;
        u.retreating=false;u.retreatTarget=null;u.retreatRestUntil=0;u.retreatRouteRetryAt=0;
        u.ut=null;u.unloadBeach=null;u.unloadRouteRetryAt=0;
      });
      return true;
    }
    if (order.type==='disembark') {
      const sight=visibility(S,team,W,H),point=order.point;
      if (!sight[Math.floor(point.y)*W+Math.floor(point.x)] || S.wt[Math.floor(point.y)*W+Math.floor(point.x)]===1 ||
          entities.some(u=>u.k!=='trn'||!Array.isArray(u.cg)||!u.cg.length||new Set(u.cg).size!==u.cg.length||
            u.cg.some(c=>!S.us.includes(c)||c.hp<=0||c.ld!==u||c.t!==team||!U[c.k]||U[c.k].sh))) return false;
      const landings=entities.map(u=>transportLandingRoute(u,point.x,point.y));
      if (landings.some(landing=>!landing?.route?.length)) return false;
      entities.forEach((u,i)=>{
        u.o='U';u.tg=null;u.pt=null;u.as=0;u.autoWorker=0;u.guardTarget=null;
        u.ut=[point.x,point.y];u.unloadBeach=landings[i].beach.slice();u.p=landings[i].route;u.rp=1;u.unloadRouteRetryAt=0;
        u.retreating=false;u.retreatTarget=null;u.retreatRestUntil=0;u.retreatRouteRetryAt=0;
      });
      return true;
    }

    if (order.type === 'gather') {
      const node=lookup(order.target),sight=visibility(S,team,W,H);
      if(!node||!(node.amt>0)||!Number.isInteger(node.x)||!Number.isInteger(node.y)||
          node.x<0||node.y<0||node.x>=W||node.y>=H||S.nd[node.y*W+node.x]!==node||
          !sight[node.y*W+node.x]||node.fm&&Number.isInteger(node.t)&&node.t!==team||
          entities.some(u=>!(u.k==='vil'&&!node.fi||u.k==='fish'&&node.fi)))return false;
      const routes=entities.map(u=>path(u,goalNear(node,1)));
      if(routes.some(route=>!route))return false;
      entities.forEach((u,i)=>{
        if(u.ct!==node.k)u.car=0;
        u.o='g';u.tg=node;u.ct=node.k;u.ret=0;u.p=routes[i];u.rp=1;
        u.pt=null;u.as=0;u.autoWorker=0;u.guardTarget=null;
      });
      return true;
    }
    if (order.type === 'build') return construct(entities,order,team);
    if (order.type === 'stop') {
      for (const u of entities) {
        u.o = 'i'; u.p = []; u.tg = null; u.pt = null; u.rp = 0;
        u.as = 0; u.autoWorker = 0; u.guardTarget = null; u.ret = 0;
        u.retreating = false; u.retreatTarget = null;
        u.retreatRestUntil = 0; u.retreatRouteRetryAt = 0;
        u.ut = null; u.unloadBeach = null; u.unloadRouteRetryAt = 0;
        if (u.k === 'cart' || u.k === 'cog') {
          u.tradePaused = true; u.manualTradeMove = false;
        }
      }
      return true;
    }
    if (order.type === 'move') return moveUnits(entities, order.point);
    if (order.type === 'attack-move' || order.type === 'patrol') {
      if (entities.some(u => !militaryUnit(u) || !Number.isFinite(u.x) || !Number.isFinite(u.y) ||
          u.x<0 || u.y<0 || u.x>=W || u.y>=H)) return false;
      // Resolve every outbound route before replacing any existing order.
      // Sight is not required for a ground destination; entity attacks still
      // require authoritative current sight in the separate attack branch.
      const routes=entities.map(u=>path(u,gp(order.point.x,order.point.y,1.2)));
      if (routes.some(route=>!route)) return false;
      entities.forEach((u,i)=>{
        u.pt = { a: [u.x, u.y], b: [order.point.x, order.point.y], to: 1, once: order.type==='attack-move' };
        u.o = 'p'; u.tg = null; u.p = routes[i].slice(); u.rp = 2;
        u.as = 0; u.autoWorker = 0; u.guardTarget = null; u.ret = 0;
        u.retreating = false; u.retreatTarget = null;
        u.retreatRestUntil = 0; u.retreatRouteRetryAt = 0;
        u.ut = null; u.unloadBeach = null; u.unloadRouteRetryAt = 0;
      });
      return true;
    }
    if (order.type === 'attack') {
      const target = lookup(order.target);
      if (!target || target.hp <= 0 || target.ld || !isHostile(team, target.t) ||
          !inSight(target,visibility(S,team,W,H),W,H) ||
          entities.some(u => u.st === 4 || !U[u.k] || !(U[u.k].dmg > 0)))
        return false;
      for (const u of entities) {
        u.o = 'a'; u.tg = target; u.p = []; u.pt = null; u.rp = 0;
        u.as = 0; u.autoWorker = 0; u.guardTarget = null;
      }
      return true;
    }
    if (order.type === 'stance') {
      if (!Object.prototype.hasOwnProperty.call(STANCES, order.value) ||
          entities.some(u => u.k === 'vil')) return false;
      const stance = STANCES[order.value];
      for (const u of entities) {
        u.st = stance;
        if (stance === 4 && (u.o === 'a' || u.o === 'v')) {
          u.o = 'i'; u.tg = null; u.p = [];
        }
      }
      return true;
    }
    return false;
  }

  root.CK_GAME_COMMANDS = Object.freeze({
    lookup, visibility, inSight, buildingOptions, unitOptions, buildOptions, militaryUnit,
    execute,
    implementedTypes: Object.freeze([
      'garrison', 'repair', 'unload', 'disembark', 'gather', 'build', 'move', 'stop', 'attack-move', 'attack', 'train', 'research', 'rally', 'stance', 'cancel', 'formation'
    ])
  });
})(typeof window !== 'undefined' ? window : globalThis);


