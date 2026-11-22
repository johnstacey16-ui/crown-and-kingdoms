/* Team-relative battlefield projection: owned selection, visible opponents,
 * terrain sight, projectiles and relics. Never mutates simulation entities.
 * This module loads after authenticated network commands, before the canvas map.
 */
(function(root){
  'use strict';
  function project(world,team,width,height) {
    if(!world||!Number.isInteger(team)||team<0||team>=world.teamN||
      !Number.isInteger(width)||width<1||!Number.isInteger(height)||height<1)throw Error('Invalid unit map');
    const position=e=>Number.isFinite(e.x)&&Number.isFinite(e.y)&&e.x>=0&&e.y>=0&&e.x<width&&e.y<height;
    // Owned selection data and a separate current-sight battlefield projection.
    // No shared solo fog or mutable simulation objects enter the UI.
    const sight=root.CK_GAME_COMMANDS?.visibility?.(world,team,width,height);
    // Pose is a copied visual description. Rendering must never write facing or
    // animation fields into deterministic simulation entities.
    const pose=e=>{
      const visual=unitVisualPose(e,world.t);
      if(typeof eliteUniqueUnitUpgrade==='function'&&eliteUniqueUnitUpgrade(e.k,e.t,world))visual.elite=true;
      return visual;
    };
    const architecture=b=>Number.isInteger(world.age?.[b.t])&&world.age[b.t]>=0&&world.age[b.t]<4?{architectureAge:world.age[b.t]}:{};
    const construction=b=>({...architecture(b),...(b.k==='mule'&&typeof muleCartVisualPose==='function'?{pose:muleCartVisualPose(b,world.t)}:{}),complete:!!b.done,progress:b.done?1:
      Math.max(0,Math.min(1,Number.isFinite(b.pr)&&B[b.k]?.bt>0?b.pr/B[b.k].bt:0))});
    const view={width,height,team,
      units:world.us.filter(u=>u&&u.t===team&&u.hp>0&&!u.ld&&position(u)).map(u=>({id:u.netId,kind:u.k,x:u.x,y:u.y,idle:u.o==='i',...(sight?{team:u.t,military:!!root.CK_GAME_COMMANDS.militaryUnit?.(u),formation:u.netFormation==='split'?'split':'line',pose:pose(u),...(u.k==='mon'?{faith:Math.max(0,Math.min(100,u.faith??100))}:{}),commands:root.CK_GAME_COMMANDS.unitOptions(world,team,u),passengers:(u.cg||[]).filter(c=>c.hp>0&&c.ld===u&&c.t===team).length}:{})})),
      buildings:world.bs.filter(b=>b&&b.t===team&&b.hp>0&&position(b)).map(b=>({id:b.netId,kind:b.k,x:b.x,y:b.y,size:b.s||1,
        rallyable:!!b.done&&(sight?root.CK_GAME_COMMANDS.buildingOptions(world,team,b).some(o=>o.type==='train'):b.k==='tc'),
        ...(sight?{team:b.t,...construction(b),passengers:(b.cg||[]).filter(c=>c.hp>0&&c.ld===b&&c.t===team).length,selectable:!!b.done,label:B[b.k]?.n||b.k,commands:root.CK_GAME_COMMANDS.buildingOptions(world,team,b)}:{}),
        rally:b.rally&&position(b.rally)?{x:b.rally.x,y:b.rally.y}:null}))};
    if(sight){
      const visible=e=>root.CK_GAME_COMMANDS.inSight(e,sight,width,height);
      const details=e=>({id:e.netId,kind:e.k,team:e.t,x:e.x,y:e.y,size:e.s||0,...(e.s?construction(e):{pose:pose(e)}),
        hp:e.hp,maxHp:e.mh||Math.max(e.hp,(U[e.k]?.hp||e.hp)+(world.tech?.[e.t]?.hpb?.[e.k]||0)),
        label:e.s?(B[e.k]?.n||e.k):(U[e.k]?.n||e.k),hostile:world.dip?.[team]?.[e.t]!=='neutral'&&world.dip?.[team]?.[e.t]!=='ally'});
      view.battlefield={time:Number.isFinite(world.t)?world.t:0,visible:[],tiles:[],enemies:[],allies:[],health:{},attackers:[],builders:[],gatherers:{},construction:root.CK_GAME_COMMANDS.buildOptions(world,team),paths:{},projectiles:[],relics:[]};
      const field=view.battlefield;
      for(let i=0;i<sight.length;i++)if(sight[i]){
        field.visible.push(i);
        const node=world.nd?.[i];
        field.tiles.push({index:i,water:world.wt?.[i]===1?1:world.wt?.[i]===2?2:0,elevation:world.el?.[i]||0,
          node:node&&node.amt>0&&['w','f','g','s'].includes(node.k)?{id:node.netId,owner:node.t,kind:node.k,amount:node.amt,fish:!!node.fi,farm:!!node.fm,animal:!!node.an,trap:!!node.trap}:null});
      }
      for(const e of [...world.us,...world.bs])if(e&&e.hp>0&&position(e)&&!e.ld){
        if(e.t===team){field.health[e.netId]={hp:e.hp,maxHp:e.mh||Math.max(e.hp,(U[e.k]?.hp||e.hp)+(world.tech?.[e.t]?.hpb?.[e.k]||0))};
          const destination=e.p?.at(-1);if(destination&&Number.isFinite(destination[0])&&Number.isFinite(destination[1]))field.paths[e.netId]={x:destination[0],y:destination[1]};
          if(!e.s&&e.k==='vil')field.builders.push(e.netId);
          if(!e.s&&(e.k==='vil'||e.k==='fish'))field.gatherers[e.netId]=e.k;
          if(!e.s&&U[e.k]?.dmg>0&&e.st!==4)field.attackers.push(e.netId);
        }else if(visible(e)){
          (world.dip?.[team]?.[e.t]==='ally'?field.allies:field.enemies).push(details(e));
        }
      }
    }
    if(sight)for(const q of world.rel||[]){
      const point=q.c||q;
      if(!q.m&&position(point)&&(!q.c||(point.hp>0&&!point.ld))&&sight[Math.floor(point.y)*width+Math.floor(point.x)])view.battlefield.relics.push({x:point.x,y:point.y,carried:!!q.c});
    }
    if(sight)for(const p of world.pj||[])if(p&&!p.dead&&position(p)&&sight[Math.floor(p.y)*width+Math.floor(p.x)])view.battlefield.projectiles.push({x:p.x,y:p.y,
      style:typeof projectileVisualStyle==='function'?projectileVisualStyle(p.a?.k):'arrow',heading:typeof projectileVisualHeading==='function'?projectileVisualHeading(p):null});
    return view;
  }
  root.CK_UNIT_PROJECTION=Object.freeze({project});
})(typeof window!=='undefined'?window:globalThis);
