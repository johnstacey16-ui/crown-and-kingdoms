/* Team-relative battlefield projection, animated original atlas art and authenticated controls. */
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
    const pose=e=>unitVisualPose(e,world.t);
    const architecture=b=>(b.k==='house'||b.k==='tc')&&Number.isInteger(world.age?.[b.t])&&world.age[b.t]>=0&&world.age[b.t]<4?{architectureAge:world.age[b.t]}:{};
    const construction=b=>({...architecture(b),complete:!!b.done,progress:b.done?1:
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
        field.tiles.push({index:i,water:world.wt?.[i]===1?1:world.wt?.[i]===2?2:0,
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
    if(sight)for(const p of world.pj||[])if(p&&position(p)&&sight[Math.floor(p.y)*width+Math.floor(p.x)])view.battlefield.projectiles.push({x:p.x,y:p.y});
    return view;
  }
  function create({canvas,description,submit,leave,stopButton,previousButton,nextButton,townButton,nameOf=()=> 'unit',now=()=>Date.now()}) {
    const context=canvas.getContext('2d');
    if(!context)throw Error('Unit map canvas unavailable');
    let view=null,selected=null,selection=[],cursor=null,enabled=false,wheel=false,wheelIndex=0,buildPage=0,placement=null,targetAction=null,lastTap=null,aGesture=null,blockedA=false,yGesture=null;
    const terrainMemory=new Map();
    let groups=Array.from({length:8},()=>[]),groupWheel=null,availableIds=new Set(),camera=null,overview=false,overviewOrigin=null;
    const selectable=b=>b.rallyable||b.selectable;
    const isBuilding=id=>view?.buildings.some(b=>b.id===id&&selectable(b));
    function options(){
      const b=view?.buildings.find(b=>b.id===selected);
      if(b)return b.commands||[{type:'train',value:'vil',label:'Train villager',cost:{},locked:''}];
      if(view?.battlefield&&selection.length){
        const units=selection.map(id=>view.units.find(u=>u.id===id));
        const commands=(units[0]?.commands||[]).filter(option=>units.every(u=>u?.commands?.some(o=>o.type===option.type)));
        if(selection.every(id=>view.battlefield.builders.includes(id)))return buildPage===0?view.battlefield.construction[0].concat(commands):view.battlefield.construction[1];
        return commands;
      }
      return selection.length?[{type:'stop',label:'Stop',cost:{},locked:''}]:[];
    }
    function cancelGesture(){if(aGesture)blockedA=true;aGesture=null;lastTap=null;}
    function viewport(){
      if(!view)return null;
      const zoom=overview?1:camera?.zoom||1,width=view.width/zoom,height=view.height/zoom;
      return Object.freeze({x:overview?0:(camera?.x??view.width/2)-width/2,y:overview?0:(camera?.y??view.height/2)-height/2,width,height,zoom,overview});
    }
    function clampCamera(){
      if(!camera||!view)return;
      const halfW=view.width/camera.zoom/2,halfH=view.height/camera.zoom/2;
      camera.x=halfW*2>=view.width?view.width/2:Math.max(halfW,Math.min(view.width-halfW,camera.x));
      camera.y=halfH*2>=view.height?view.height/2:Math.max(halfH,Math.min(view.height-halfH,camera.y));
    }
    function closeOverview(){overview=false;if(overviewOrigin)cursor=overviewOrigin;overviewOrigin=null;}
    function focusView(point){
      if(!view||!Number.isFinite(point?.x)||!Number.isFinite(point?.y))return;
      overview=false;overviewOrigin=null;camera={x:point.x,y:point.y,zoom:camera?.zoom||1};clampCamera();cursor={x:point.x,y:point.y};
      cancelGesture();cancelShortcut();
    }
    function followCursor(){
      if(!camera||overview||!cursor||camera.zoom===1)return;
      const v=viewport(),mx=v.width*.12,my=v.height*.12;
      if(cursor.x<v.x+mx)camera.x-=v.x+mx-cursor.x;
      if(cursor.x>v.x+v.width-mx)camera.x+=cursor.x-(v.x+v.width-mx);
      if(cursor.y<v.y+my)camera.y-=v.y+my-cursor.y;
      if(cursor.y>v.y+v.height-my)camera.y+=cursor.y-(v.y+v.height-my);
      clampCamera();
    }
    function onScreen(entity){const v=viewport(),size=entity.size||0;return entity.x+size>=v.x&&entity.y+size>=v.y&&entity.x<v.x+v.width&&entity.y<v.y+v.height;}
    function availableGroup(ids){return [...new Set(ids)].filter(id=>availableIds.has(id));}
    function closeGroup(){groupWheel=null;}
    function recallGroup(slot){
      const ids=availableGroup(groups[slot]);
      if(ids.length){setSelection(ids);description.textContent='Group '+(slot+1)+' selected ('+ids.length+').';}
      else description.textContent='Group '+(slot+1)+' has no available members.';
    }
    function drawGroups(){
      const active=groupWheel?.slot??-1;
      context.fillStyle='rgba(6,12,20,.96)';context.beginPath();context.arc(340,340,236,0,Math.PI*2);context.fill();
      context.strokeStyle='#c9a24a';context.lineWidth=2;context.stroke();
      for(let slot=0;slot<8;slot++){
        const angle=slot*Math.PI/4-Math.PI/2,x=340+Math.cos(angle)*160,y=340+Math.sin(angle)*160;
        const count=availableGroup(groups[slot]).length;
        context.fillStyle=slot===active?'#765a26':'#182c40';context.beginPath();context.arc(x,y,43,0,Math.PI*2);context.fill();
        context.strokeStyle=slot===active?'#ffe4a2':'#77919f';context.stroke();
        context.fillStyle='#fff1ce';context.textAlign='center';context.font='17px system-ui';context.fillText('Group '+(slot+1),x,y-5);
        context.fillStyle=count?'#b9ddcd':'#a6b2bd';context.font='14px system-ui';context.fillText(String(count)+' available',x,y+17);
      }
      context.textAlign='center';context.fillStyle='#fff1ce';context.font='20px system-ui';context.fillText('Control groups',340,319);
      context.font='14px system-ui';context.fillText('Left stick: choose slot',340,345);context.fillText('X: assign selection',340,366);
      context.fillText('Y: focus group',340,387);context.fillText('Release LB: recall · B: cancel',340,408);
    }
    function militarySelection(){return selection.length>=2&&selection.every(id=>view?.units.some(u=>u.id===id&&u.military));}
    function cancelShortcut(){yGesture=null;}
    function setSelection(ids){const next=[...new Set(ids)],changed=next.length!==selection.length||next.some((id,i)=>id!==selection[i]);selection=next;selected=selection[0]||null;if(changed){closeGroup();cancelShortcut();wheelIndex=0;buildPage=0;placement=null;targetAction=null;}}
    canvas.width=canvas.height=680;canvas.tabIndex=0;
    canvas.setAttribute('aria-label','Your kingdom unit map. Left stick pans the camera; right stick up/down zooms. Tap A to select or order; hold A and drag with the left stick for a selection box. Double A on a unit or completed town centre selects your visible eligible entities of that type. Hold LT to add units or boxes to selection. D-pad Up selects an idle villager, Right support, Down a town centre, Left military. Hold LB and choose a slot with the left stick; X assigns selection, Y focuses the group and releasing LB recalls it. RB opens the expanded minimap; Y focuses its cursor. Hold RT for the command menu and press A to confirm; at a town centre, LT+A requests five villagers. Y switches a selected military group between Line and Split. B cancels a box, clears selection or closes the command menu.');
    canvas.style.cssText='display:block;width:min(100%,680px);height:auto;aspect-ratio:1;border:2px solid #c9a24a;background:#090d16;touch-action:manipulation';
    function drawTerrain(sx,sy){
      const field=view.battlefield,visible=new Set(field.visible),v=viewport();
      const resolution=terrainBlendResolution(Math.max(sx,sy)*v.zoom);
      const left=Math.floor(v.x)-4,right=Math.ceil(v.x+v.width)+4,top=Math.floor(v.y)-4,bottom=Math.ceil(v.y+v.height)+4;
      // Only tiles previously seen by this player enter this local art cache.
      // It contains terrain/resources, never remembered enemy positions.
      const rememberedKind=(x,y)=>{
        const tile=terrainMemory.get(y*view.width+x);if(!tile)return -1;
        if(tile.water)return tile.water===1?2:3;
        const coastal=(x>0&&terrainMemory.get(tile.index-1)?.water===1)||(x<view.width-1&&terrainMemory.get(tile.index+1)?.water===1)||(y>0&&terrainMemory.get(tile.index-view.width)?.water===1)||(y<view.height-1&&terrainMemory.get(tile.index+view.width)?.water===1);
        return coastal?3:hsh(x>>2,y>>2)<.1?1:0;
      };
      for(const tile of terrainMemory.values()){
        const x=tile.index%view.width,y=Math.floor(tile.index/view.width),px=x*sx,py=y*sy;
        if(x<left||x>right||y<top||y>bottom)continue;
        const grain=((tile.index*2654435761)>>>28)%3;
        context.fillStyle=tile.water===1?['#234f65','#28596b','#2b5c70'][grain]:
          tile.water===2?'#719b91':['#526b3d','#586f42','#5d7446'][grain];
        if(!paintTerrain(context,rememberedKind(x,y),x,y,px,py,sx+.3,sy+.3,false,terrainNeighborKinds(x,y,rememberedKind,view.width,view.height),resolution))context.fillRect(px,py,sx+.3,sy+.3);
        if(tile.water&&sx>=5){
          context.strokeStyle=tile.water===2?'rgba(230,226,177,.3)':'rgba(163,221,227,.22)';
          const ripple=tile.water===1?Math.sin(field.time*.8+x*.7+y)*sy*.08:0;
          context.lineWidth=.7;context.beginPath();context.moveTo(px+sx*.2,py+sy*.55+ripple);
          context.lineTo(px+sx*.7,py+sy*.55+ripple);context.stroke();
        }
        const n=tile.node;
        if(n&&sx>=3){
          const environmentArt=typeof paintedEnvironmentFrame==='function'?paintedEnvironmentFrame({k:n.kind,x,y,an:n.animal,fi:n.fish,fm:n.farm,trap:n.trap},field.time):null;
          const resourceArt=environmentArt||(typeof paintedResourceFrame==='function'?paintedResourceFrame(n.kind,x,y,n.animal||n.fish||n.farm||n.trap,n.amount):null);
          if(resourceArt){const f=resourceArt.f,width=Math.min(Math.max(10,sx*(n.kind==='w'?1.9:1.25)),(n.kind==='w'?Math.max(20,sy*3):Infinity)*f.w/f.h),sc=width/(resourceArt.referenceWidth||f.w),cached=paintedNodeTexture(resourceArt,54);
            if(cached)context.drawImage(cached,px+sx/2-f.ax*sc,py+sy-f.ay*sc,f.w*sc,f.h*sc);
            else context.drawImage(resourceArt.img,f.x,f.y,f.w,f.h,px+sx/2-f.ax*sc,py+sy-f.ay*sc,f.w*sc,f.h*sc);
          }else if(n.kind==='w'&&typeof ASSET!=='undefined'&&ASSET.n&&assetFrame('node_tree',0,0,0,0)){const art=assetFrame('node_tree',0,0,0,0),f=art.f,sc=Math.max(15,sx*2)/f.w;context.drawImage(art.img,f.x,f.y,f.w,f.h,px+sx/2-f.ax*sc,py+sy-f.ay*sc,f.w*sc,f.h*sc);}else if(n.kind==='w'){
            context.fillStyle='#392f22';context.fillRect(px+sx*.45,py+sy*.4,Math.max(1,sx*.13),sy*.6);
            context.fillStyle=grain?'#254b32':'#31583a';context.beginPath();
            context.arc(px+sx*.5,py+sy*.3,Math.max(2,sx*.48),0,Math.PI*2);context.fill();
            context.fillStyle='#49764a';context.beginPath();context.arc(px+sx*.32,py+sy*.16,Math.max(1,sx*.22),0,Math.PI*2);context.fill();
          }else if(n.farm){
            context.fillStyle='#9a7844';context.fillRect(px,py,sx,sy);
            context.strokeStyle='#c6ac67';context.lineWidth=.8;
            for(let row=1;row<4;row++){context.beginPath();context.moveTo(px+sx*.1,py+sy*row/4);context.lineTo(px+sx*.9,py+sy*row/4);context.stroke();}
          }else if(n.fish){
            context.strokeStyle='#a8d8d3';context.lineWidth=1;context.beginPath();
            context.moveTo(px+sx*.2,py+sy*.6);context.lineTo(px+sx*.65,py+sy*.35);context.stroke();
          }else{
            context.fillStyle=n.kind==='g'?'#d4b762':n.kind==='s'?'#a2aaa0':'#b36554';
            context.beginPath();context.moveTo(px+sx*.1,py+sy*.8);context.lineTo(px+sx*.35,py+sy*.15);
            context.lineTo(px+sx*.7,py+sy*.3);context.lineTo(px+sx*.95,py+sy*.75);context.closePath();context.fill();
          }
        }
        if(!visible.has(tile.index)){context.fillStyle='rgba(5,12,15,.65)';context.fillRect(px,py,sx+.4,sy+.4);}
      }
      for(const p of field.projectiles||[]){context.fillStyle='#ffe6a4';context.beginPath();context.arc(p.x*sx,p.y*sy,2,0,Math.PI*2);context.fill();}
      for(const id of selection){
        const point=field.paths?.[id],u=view.units.find(u=>u.id===id);
        if(point&&u){context.strokeStyle='rgba(255,233,169,.55)';context.lineWidth=1;
          context.setLineDash([3,5]);context.beginPath();context.moveTo(u.x*sx,u.y*sy);context.lineTo(point.x*sx,point.y*sy);context.stroke();context.setLineDash([]);}
      }
    }
    function drawAtlas(e,x,y,sx,sy){
      if(typeof assetFrame!=='function')return false;
      const size=e.size||0,time=view.battlefield?.time||0;
      // Preserve the actual kingdom palette for each player; relation rings
      // identify ownership without repainting the other kingdom's artwork.
      const sprite=size&&typeof paintedBuildingFrame==='function'?paintedBuildingFrame(e.kind,e.team,time,e.architectureAge):assetFrame(size?'bld_'+e.kind:e.kind,e.team,size?3:e.pose?.state||0,0,e.pose?.time??time,e.pose?.heading||0,e.pose?.phase);
      if(!sprite)return false;
      const f=sprite.f,height=size?Math.max(size*sx,size*sy)*1.7:Math.max(22,Math.min(40,sx*3.4));
      const scale=height/(sprite.referenceHeight||f.h)*(sprite.painted?1:sprite.sc||1),footX=x+size*sx/2,footY=y+(size?size*sy:2);
      context.save();
      if(size&&e.complete===false&&!sprite.painted)context.globalAlpha=.4+.45*(e.progress||0);
      try{if(sprite.painted&&!size)drawPaintedTroop(context,sprite,footX,footY,scale,e.pose?.state||0,e.pose?.time??time,Math.cos(e.pose?.heading||0)<0,e.kind,e.pose?.phase);else if(size&&typeof drawBuildingArtwork==='function')drawBuildingArtwork(context,sprite,footX,footY,scale,e.complete!==false,e.progress);else context.drawImage(sprite.img,f.x,f.y,f.w,f.h,footX-f.ax*scale,footY-f.ay*scale,f.w*scale,f.h*scale);}
      catch(_){context.restore();return false;}
      context.restore();return true;
    }
    function drawEntity(e,sx,sy,color,chosen){
      const x=e.x*sx,y=e.y*sy,size=e.size||0,unitRadius=Math.max(2.5,Math.min(5,sx*.45));
      context.fillStyle='rgba(0,0,0,.35)';
      const atlas=drawAtlas(e,x,y,sx,sy);
      if(size&&!atlas){
        const w=size*sx,h=size*sy;context.fillRect(x+2,y+3,w,h);
        context.fillStyle='#b39a70';context.fillRect(x,y,w,h);
        context.fillStyle=color;context.fillRect(x+1,y+1,Math.max(1,w-2),Math.max(1,h*.5));
        context.strokeStyle='#352d27';context.lineWidth=1;context.strokeRect(x,y,w,h);
        if(w>15){context.fillStyle='#fff1c7';context.font='bold '+Math.max(8,Math.min(12,w*.28))+'px system-ui';context.textAlign='center';context.fillText(e.kind==='tc'?'TC':e.kind.slice(0,3).toUpperCase(),x+w/2,y+h*.7);}
      }else if(!atlas){
        context.beginPath();context.ellipse(x+1,y+2,unitRadius+1,unitRadius*.65,0,0,Math.PI*2);context.fill();
        context.fillStyle=color;context.strokeStyle='#172429';context.lineWidth=1;
        if(['gal','fish','trn','cog'].includes(e.kind)){
          context.beginPath();context.moveTo(x-unitRadius,y-unitRadius*.6);context.lineTo(x+unitRadius,y-unitRadius*.6);
          context.lineTo(x+unitRadius*.65,y+unitRadius);context.lineTo(x-unitRadius*.6,y+unitRadius);context.closePath();context.fill();context.stroke();
          context.strokeStyle='#eee0ba';context.beginPath();context.moveTo(x,y+unitRadius*.5);context.lineTo(x,y-unitRadius*1.5);context.stroke();
        }else{
          context.beginPath();context.arc(x,y,unitRadius,0,Math.PI*2);context.fill();context.stroke();
          context.fillStyle=e.kind==='vil'?'#c9ae77':e.kind==='mon'?'#f3d5fa':'#edf1e5';
          context.beginPath();context.arc(x,y-unitRadius*.7,unitRadius*.43,0,Math.PI*2);context.fill();
        }
      }
      // Relation markers remain legible at strategic scale and for absent art.
      context.fillStyle=color;context.strokeStyle='#15212b';context.lineWidth=1;
      context.beginPath();context.ellipse(x+size*sx/2,y+(size?size*sy:3),Math.max(2,size?size*sx*.24:unitRadius*.7),2,0,0,Math.PI*2);context.fill();context.stroke();
      if(size&&e.complete===false){
        const w=Math.max(12,size*sx),progress=Math.max(0,Math.min(1,e.progress||0));
        context.strokeStyle='#d0ad71';context.lineWidth=1.5;context.beginPath();
        context.moveTo(x,y+size*sy);context.lineTo(x,y);context.lineTo(x+size*sx,y);context.lineTo(x+size*sx,y+size*sy);context.stroke();
        context.fillStyle='#302d27';context.fillRect(x,y+size*sy+5,w,3);
        context.fillStyle='#e5be77';context.fillRect(x,y+size*sy+5,w*progress,3);
      }
      if(size&&e.complete!==false&&e.maxHp>0&&e.hp/e.maxHp<.5){
        const phase=view.battlefield?.time||0;
        context.fillStyle='rgba(31,32,29,.5)';
        for(let i=0;i<2;i++){context.beginPath();context.arc(x+size*sx*.6+Math.sin(phase+i)*2,y-3-i*5-(phase%1)*3,2+i,0,Math.PI*2);context.fill();}
      }
      if(e.passengers>0){
        context.fillStyle='#14202d';context.fillRect(x-9,y+7,26,17);
        context.fillStyle='#ffe6a0';context.font='12px system-ui';context.textAlign='center';
        context.fillText(String(e.passengers),x+4,y+20);
      }
      if(chosen){context.strokeStyle='#ffe9a8';context.lineWidth=1.5;context.beginPath();context.ellipse(x+(size?size*sx/2:0),y+(size?size*sy/2:1),size?size*sx*.65:unitRadius+3,size?size*sy*.65:unitRadius+2,0,0,Math.PI*2);context.stroke();}
      if(Number.isFinite(e.hp)&&Number.isFinite(e.maxHp)&&e.maxHp>0&&(chosen||e.hp<e.maxHp)){
        const w=Math.max(10,size?size*sx:unitRadius*3),left=x+(size?size*sx/2:0)-w/2,top=y-(size?5:unitRadius+6);
        context.fillStyle='#172126';context.fillRect(left,top,w,3);
        context.fillStyle=e.hp/e.maxHp<.3?'#ed8b6b':'#a8d17c';context.fillRect(left,top,w*Math.max(0,Math.min(1,e.hp/e.maxHp)),3);
      }
    }
    function draw() {
      if(stopButton)stopButton.disabled=!canStop();
      for(const button of [previousButton,nextButton])if(button)button.disabled=overview||!view?.units.length;
      if(townButton)townButton.disabled=overview||!view?.buildings.some(b=>b.kind==='tc'&&b.rallyable);
      context.fillStyle='#090d16';context.fillRect(0,0,680,680);
      if(!view)return;
      const chosen=new Set(selection);
      const sx=680/view.width,sy=680/view.height,v=viewport();
      context.save();context.setTransform(v.zoom,0,0,v.zoom,-v.x*sx*v.zoom,-v.y*sy*v.zoom);
      if(view.battlefield)drawTerrain(sx,sy);
      context.strokeStyle=view.battlefield?'rgba(190,210,170,.08)':'#1b2a3f';context.lineWidth=1;
      for(let cell=0;cell<=view.width;cell+=8){context.beginPath();context.moveTo(cell*sx,0);context.lineTo(cell*sx,680);context.stroke();}
      for(let cell=0;cell<=view.height;cell+=8){context.beginPath();context.moveTo(0,cell*sy);context.lineTo(680,cell*sy);context.stroke();}
      if(view.battlefield){
        const entities=[
          ...view.battlefield.allies.map(e=>({...e,color:'#84d9bd'})),
          ...view.battlefield.enemies.map(e=>({...e,color:'#f17b6e'})),
          ...view.buildings.map(e=>({...e,...view.battlefield.health[e.id],color:'#73b4e8'})),
          ...view.units.map(e=>({...e,...view.battlefield.health[e.id],color:'#73b4e8'}))
        ];
        // Stable screen-depth ordering interleaves buildings and units from
        // both kingdoms. Team membership never determines foreground order.
        entities.sort((a,b)=>(a.y+(a.size||0))-(b.y+(b.size||0))||a.x-b.x||
          (a.id<b.id?-1:a.id>b.id?1:0));
        for(const e of entities)drawEntity(e,sx,sy,e.color,chosen.has(e.id));
        for(const relic of view.battlefield.relics||[]){
          const x=relic.x*sx,y=relic.y*sy-(relic.carried?Math.max(12,sy*1.3):0),width=Math.max(9,Math.min(24,sx*1.2));
          if(typeof drawPaintedRelic==='function'&&drawPaintedRelic(context,x,y,width))continue;
          context.fillStyle='#f2d47a';context.beginPath();context.moveTo(x,y-5);context.lineTo(x+4,y);context.lineTo(x,y+5);context.lineTo(x-4,y);context.closePath();context.fill();
        }
      }else{
        for(const b of view.buildings){context.fillStyle=chosen.has(b.id)?'#ffe78a':'#c9a24a';context.fillRect(b.x*sx,b.y*sy,b.size*sx,b.size*sy);}
        for(const u of view.units){context.fillStyle=chosen.has(u.id)?'#ffe78a':'#73c9ff';context.beginPath();context.arc(u.x*sx,u.y*sy,chosen.has(u.id)?6:4,0,Math.PI*2);context.fill();}
      }
      for(const b of view.buildings)if(b.id===selected&&b.rally){
        context.strokeStyle='#ffe78a';context.beginPath();context.moveTo((b.x+b.size/2)*sx,(b.y+b.size/2)*sy);
        context.lineTo(b.rally.x*sx,b.rally.y*sy);context.stroke();context.fillStyle='#ffe78a';context.fillRect(b.rally.x*sx-3,b.rally.y*sy-3,6,6);
      }
      if(aGesture?.box&&cursor){
        const x=Math.min(aGesture.start.x,cursor.x)*sx,y=Math.min(aGesture.start.y,cursor.y)*sy;
        const width=Math.abs(cursor.x-aGesture.start.x)*sx,height=Math.abs(cursor.y-aGesture.start.y)*sy;
        context.fillStyle='rgba(140,255,60,.12)';context.fillRect(x,y,width,height);
        context.strokeStyle='#8cff3c';context.lineWidth=2;context.setLineDash([7,5]);
        context.strokeRect(x,y,width,height);context.setLineDash([]);
      }
      if(placement&&cursor){
        const p=buildPoint(cursor),s=placement.size;context.fillStyle='rgba(236,218,150,.25)';context.fillRect(p.x*sx,p.y*sy,s*sx,s*sy);
        context.strokeStyle='#f5d58a';context.lineWidth=2;context.strokeRect(p.x*sx,p.y*sy,s*sx,s*sy);

      }
      if(cursor){
        const x=cursor.x*sx,y=cursor.y*sy;
        context.strokeStyle='#fff';context.lineWidth=2;context.beginPath();
        context.moveTo(x-7,y);context.lineTo(x+7,y);context.moveTo(x,y-7);context.lineTo(x,y+7);context.stroke();
      }
      context.restore();
      if(placement){context.fillStyle='rgba(8,16,20,.9)';context.fillRect(12,12,656,34);context.fillStyle='#ffe9b7';context.font='15px system-ui';context.textAlign='left';context.fillText(placement.label+' · A: place · LT: repeat · B: cancel',24,34);}
      if(overview){
        const w=view.width/camera.zoom,h=view.height/camera.zoom;
        context.strokeStyle='#ffe5a1';context.lineWidth=2;context.strokeRect((camera.x-w/2)*sx,(camera.y-h/2)*sy,w*sx,h*sy);
        context.fillStyle='rgba(8,16,20,.95)';context.fillRect(12,12,656,48);context.fillStyle='#ffe9b7';context.font='16px system-ui';context.textAlign='center';context.fillText('Expanded minimap · left stick: cursor · Y: focus · B / RB: close',340,41);
      }
      if(targetAction){
        context.fillStyle='rgba(9,13,22,.95)';context.fillRect(12,12,656,48);
        context.fillStyle='#fff';context.font='16px system-ui';context.textAlign='center';
        context.fillText(targetAction.label+' · A: choose target · B: cancel',340,42);
      }
      if(wheel){
        context.fillStyle='rgba(9,13,22,.95)';context.beginPath();context.arc(340,340,150,0,Math.PI*2);context.fill();
        context.strokeStyle='#c9a24a';context.lineWidth=3;context.stroke();
        context.fillStyle='#fff';context.textAlign='center';context.font='22px system-ui';
        context.fillText('Command menu',340,302);
        const items=options(),entry=items[wheelIndex%Math.max(1,items.length)];
        context.fillText(entry?.label||'No commands available',340,344);
        if(view.battlefield){
          context.font='14px system-ui';context.fillStyle=entry?.locked?'#f6aa92':'#d7c49b';
          context.fillText(entry?.locked||Object.entries(entry?.cost||{}).map(([k,v])=>v+' '+({f:'food',w:'wood',g:'gold',s:'stone'}[k]||k)).join(' · '),340,367);
          context.fillStyle='#fff';context.fillText('Left stick: choose · RT + A: confirm',340,394);
          if(entry?.type==='train')context.fillText('LT + A: train five',340,418);
          if(entry?.type==='build')context.fillText('RT + Y: economic / military buildings',340,418);
          context.fillText((wheelIndex+1)+' / '+items.length,340,440);
        }
        context.font='16px system-ui';
        if(!view.battlefield&&view.buildings.some(b=>b.id===selected&&b.rallyable)){
          context.fillText('Hold RT + A: train 1',340,374);
          context.fillText('Hold RT + LT + A: train 5',340,402);
        }else if(!view.battlefield)context.fillText('Hold RT + A: confirm',340,384);
      }
      if(!groupWheel&&!overview){context.fillStyle='#d7c49b';context.font='15px system-ui';context.textAlign='right';context.fillText('View '+v.zoom.toFixed(1)+'x · LB: Groups · RB: Map',662,664);}
      if(groupWheel)drawGroups();
      if(!groupWheel&&!overview&&militarySelection()){context.fillStyle='#ffe6a0';context.font='15px system-ui';context.textAlign='left';context.fillText('Y: Line / Split formation',18,664);}
    }
    function refresh(world,team,width,height,canCommand) {
      if(!canCommand)cancelShortcut();
      if(view&&(view.team!==team||view.width!==width||view.height!==height)){overview=false;overviewOrigin=null;camera=null;cursor=null;closeGroup();groups=Array.from({length:8},()=>[]);setSelection([]);cancelGesture();cancelShortcut();terrainMemory.clear();}
      view=project(world,team,width,height);enabled=canCommand;
      if(!camera)camera={x:width/2,y:height/2,zoom:1};
      availableIds=new Set(view.units.map(u=>u.id).concat(view.buildings.filter(selectable).map(b=>b.id)));
      if(view.battlefield)for(const tile of view.battlefield.tiles)terrainMemory.set(tile.index,tile);
      if(lastTap&&!view.units.some(u=>u.id===lastTap.id&&u.kind===lastTap.kind)&&
        !view.buildings.some(b=>b.id===lastTap.id&&b.kind===lastTap.kind&&b.rallyable))lastTap=null;
      const previousCount=selection.length;
      const blueprint=placement;
      setSelection(selection.filter(id=>view.units.some(u=>u.id===id)||view.buildings.some(b=>b.id===id&&selectable(b))));
      if(blueprint&&selection.length===previousCount&&selection.every(id=>view.battlefield?.builders.includes(id)))placement=blueprint;
      if(selected&&selection.length!==previousCount){
        const towns=view.buildings.some(b=>b.id===selected);
        description.textContent=selection.length+' '+(towns?'town centre':'unit')+(selection.length===1?' remains':'s remain')+' selected. Hold RT for commands; B deselects.';
      }
      if(!selected)wheel=false;
      if(!cursor){const first=view.units[0]||view.buildings[0];cursor=first?{x:first.x,y:first.y}:{x:width/2,y:height/2};}
      canvas.setAttribute('aria-disabled',String(!enabled));
      if(!selected)description.textContent='D-pad: Up idle villager, Right support, Down town centre, Left military. Left stick pans; right stick up/down zooms. Tap A to select or order; hold A and drag to box-select units. LT adds units or boxes; hold RT for commands. '+(view.battlefield?'Explore to reveal terrain, resources and opponents. A on a visible enemy attacks with selected units.':'Enemy positions and terrain are not shown.')+'';
      draw();
    }
    function buildPoint(point){return {x:Math.max(1,Math.min(view.width-placement.size-1,Math.round(point.x-placement.size/2))),y:Math.max(1,Math.min(view.height-placement.size-1,Math.round(point.y-placement.size/2)))}}
    function choose(point,add=false,controller=false) {
      if(groupWheel){closeGroup();cancelShortcut();cancelGesture();draw();return;}
      if(!controller)cancelShortcut();
      if(aGesture){aGesture=null;blockedA=true;}
      const previousTap=lastTap;lastTap=null;
      if(wheel||!view||!Number.isFinite(point.x)||!Number.isFinite(point.y)||
        point.x<0||point.y<0||point.x>=view.width||point.y>=view.height)return;
      cursor={x:point.x,y:point.y};
      if(overview){description.textContent='Minimap cursor moved. Y focuses the battlefield; B or RB closes.';draw();return;}
      if(targetAction){
        if(!enabled){description.textContent='Wait for the previous order to execute.';draw();return;}
        const radius=Math.max(.8/viewport().zoom,viewport().width*8/680);
        const candidates=targetAction.type==='convert'?(view.battlefield?.enemies||[]).filter(e=>e.hostile!==false):[...view.units,...view.buildings,...(view.battlefield?.allies||[])];
        const target=candidates.find(e=>e.size?point.x>=e.x&&point.x<e.x+e.size&&point.y>=e.y&&point.y<e.y+e.size:Math.hypot(e.x-point.x,e.y-point.y)<=radius);
        const ground=['disembark','patrol','attack-move'].includes(targetAction.type);
        if(!ground&&!target){description.textContent=targetAction.type==='convert'?'Choose a visible hostile target; B cancels.':'Choose a visible friendly target; B cancels.';draw();return;}
        const result=submit({type:targetAction.type,entities:selection.slice(),...(ground?{point:{...point}}:{target:target.id})});
        description.textContent=result.ok?targetAction.label+' submitted. The host rechecks the target, capacity and route.':'Order not submitted. Wait for the previous order.';
        if(result.ok){enabled=false;targetAction=null;}draw();return;
      }
      if(placement){
        if(!enabled){description.textContent='Wait for the previous order to execute.';draw();return;}
        const result=submit({type:'build',entities:selection.slice(),value:placement.value,point:buildPoint(point)});
        description.textContent=result.ok?placement.label+' submitted. Construction and payment wait for host execution.':'Construction not submitted. Wait for the previous order.';
        if(result.ok){enabled=false;if(!add)placement=null;}draw();return;
      }
      const radius=Math.max(.8/viewport().zoom,viewport().width*8/680);
      let nearest=null,distance=Infinity;
      for(const unit of view.units){const d=Math.hypot(unit.x-point.x,unit.y-point.y);if(d<=radius&&d<distance){nearest=unit;distance=d;}}
      const town=view.buildings.find(b=>selectable(b)&&point.x>=b.x&&point.x<b.x+b.size&&point.y>=b.y&&point.y<b.y+b.size);
      if(nearest){
        if(add&&view.buildings.some(b=>selection.includes(b.id))){description.textContent='Mixed building/unit selection is not available in this preview.';draw();return;}
        const at=controller&&!add?now():0;
        // The gesture is on the same unit, not two unrelated A selections.
        // This provisional window still needs comparison with physical Xbox.
        const double=controller&&!add&&previousTap&&previousTap.id===nearest.id&&previousTap.kind===nearest.kind&&at>=previousTap.at&&at-previousTap.at<=350;
        const ids=double?view.units.filter(u=>u.kind===nearest.kind&&onScreen(u)).map(u=>u.id):[nearest.id];
        setSelection(add?selection.concat(ids):ids);
        if(controller&&!add&&!double)lastTap={id:nearest.id,kind:nearest.kind,at};
        description.textContent=nearest.kind==='mon'&&selection.length===1?'Selected Monk · Faith '+Math.floor(nearest.faith??100)+'%. A on a hostile target requests conversion; hold RT for commands; B deselects.':selection.length>1?selection.length+' units selected. A orders the group at the cursor; hold RT for commands; B deselects.':
          'Selected '+nameOf(nearest)+'. Double A selects visible units of this type; LT+A adds another unit. A orders at the cursor; hold RT for commands; B deselects.';
      }
      else if(town){
        if(add&&selection.some(id=>id!==town.id)){description.textContent='LT addition of town centres and mixed building/unit selection are not available in this preview. Use double A to select completed town centres.';draw();return;}
        const at=controller&&!add?now():0;
        const double=controller&&!add&&previousTap&&previousTap.id===town.id&&previousTap.kind===town.kind&&at>=previousTap.at&&at-previousTap.at<=350;
        setSelection(double?view.buildings.filter(b=>selectable(b)&&b.kind===town.kind&&onScreen(b)).map(b=>b.id):[town.id]);
        if(controller&&!add&&!double)lastTap={id:town.id,kind:town.kind,at};
        description.textContent=view.battlefield?(town.label+' selected. Hold RT and choose training or research with the left stick. A sets a rally point for production buildings. B deselects.'):selection.length>1?selection.length+' town centres selected. Hold RT for balanced training (A: one; LT+A: five). Select one town centre to set a rally point. B deselects.':
          'Town centre selected. Double A selects visible completed town centres. A sets a rally point. Hold RT for training (A: one; LT+A: five). B deselects.';
      }
      else if(add){description.textContent='LT+A adds an owned unit at the cursor; it does not issue a move order.';}
      else if(selected&&enabled){
        const rally=view.buildings.some(b=>b.id===selected&&b.rallyable);
        if(rally&&selection.length>1){description.textContent='Group rally orders are not available in this preview. Select one town centre to set its rally point.';draw();return;}
        const enemy=view.battlefield?.enemies.find(e=>e.hostile!==false&&(e.size?point.x>=e.x&&point.x<e.x+e.size&&point.y>=e.y&&point.y<e.y+e.size:Math.hypot(e.x-point.x,e.y-point.y)<=radius));
        const deposit=view.battlefield?.tiles.find(t=>t.index===Math.floor(point.y)*view.width+Math.floor(point.x))?.node;
        const gathering=!rally&&deposit?.id&&(!deposit.farm||deposit.owner===view.team)&&selection.every(id=>view.battlefield.gatherers[id]===(deposit.fish?'fish':'vil'));
        const conversion=enemy&&!rally&&selection.every(id=>view.units.find(u=>u.id===id)?.kind==='mon');
        const attack=enemy&&!rally&&selection.every(id=>view.battlefield.attackers.includes(id));
        if(enemy&&!rally&&!attack&&!conversion){description.textContent='Selected units cannot attack this target.';draw();return;}
        if(isBuilding(selected)&&!rally){description.textContent='This building has no rally point. Hold RT for its available commands.';draw();return;}
        const result=submit(conversion?{type:'convert',entities:selection.slice(),target:enemy.id}:gathering?{type:'gather',entities:selection.slice(),target:deposit.id}:attack?{type:'attack',entities:selection.slice(),target:enemy.id}:{type:rally?'rally':'move',entities:selection.slice(),point:{...point}});
        description.textContent=result.ok?(conversion?'Conversion submitted.':gathering?'Gathering submitted.':attack?'Attack submitted.':rally?'Rally point submitted.':'Move submitted.')+' Changes apply only after host execution.':'Order not submitted. Select fewer units if the group is too large, or wait for the previous order.';
        if(result.ok)enabled=false;
      }else if(selected)description.textContent='Wait for the previous order to execute.';
      else description.textContent='Select one of your blue units or completed town centres first.';
      draw();
    }
    function selectBox(start,end,add){
      lastTap=null;
      if(add&&view.buildings.some(b=>selection.includes(b.id))){
        description.textContent='Mixed building/unit selection is not available in this preview.';draw();return;
      }
      const x0=Math.min(start.x,end.x),x1=Math.max(start.x,end.x),y0=Math.min(start.y,end.y),y1=Math.max(start.y,end.y);
      const ids=view.units.filter(u=>u.x>=x0&&u.x<=x1&&u.y>=y0&&u.y<=y1).map(u=>u.id);
      setSelection(add?selection.concat(ids):ids);
      description.textContent=selection.length?selection.length+' units selected. Tap A orders the group; hold RT for commands; B deselects.':'No owned units in the selection box.';
      draw();
    }
    function canStop() { return !!(enabled&&!overview&&!groupWheel&&view&&selection.length&&selection.every(id=>view.units.some(u=>u.id===id))); }
    function selectNext(direction,town=false,filter=()=>true) {
      cancelGesture();
      const choices=town?view?.buildings.filter(b=>b.kind==='tc'&&b.rallyable):view?.units.filter(filter);
      if(!choices?.length)return;
      const at=choices.findIndex(e=>e.id===selected);
      const next=choices[at<0?(direction<0?choices.length-1:0):(at+direction+choices.length)%choices.length];
      setSelection([next.id]);wheel=false;
      cursor={x:next.x+(town?next.size/2:0),y:next.y+(town?next.size/2:0)};
      cursor.x=Math.min(view.width-0.01,cursor.x);cursor.y=Math.min(view.height-0.01,cursor.y);
      description.textContent=town?'Town centre selected. A sets a rally point. Hold RT for training (A: one; LT+A: five). B deselects.':
        'Selected '+nameOf(next)+' ('+(choices.indexOf(next)+1)+' of '+choices.length+'). A orders at the cursor. Hold RT for commands; B deselects.';
      followCursor();canvas.focus();draw();
    }
    for(const [button,direction,town] of [[previousButton,-1,false],[nextButton,1,false],[townButton,1,true]]){
      if(button){button.disabled=true;button.addEventListener('click',()=>selectNext(direction,town));}
    }
    function stop() {
      cancelGesture();
      if(!canStop())return;
      const result=submit({type:'stop',entities:selection.slice()});
      description.textContent=result.ok?'Stop submitted. Selected units stop after host execution.':'Stop not submitted. Wait for the previous order.';
      if(result.ok)enabled=false;
      draw();
    }
    function train(count=1) {
      cancelGesture();
      if(overview||groupWheel||!enabled||!view?.buildings.some(b=>b.id===selected&&b.rallyable))return;
      const result=submit({type:'train',entities:selection.slice(),value:'vil',...(count===5?{count:5}:{})});
      description.textContent=result.ok?(count===5?'Five-villager training batch submitted. Available resources, population and queue space limit how many are queued after host execution.':'Villager training submitted. Resources and queue change only after host execution.'):'Training not submitted. Wait for the previous order.';
      if(result.ok)enabled=false;
      draw();
    }
    if(stopButton){stopButton.disabled=true;stopButton.addEventListener('click',stop);}
    canvas.addEventListener('blur',()=>{closeOverview();closeGroup();cancelShortcut();cancelGesture();targetAction=null;wheel=false;draw();});
    canvas.addEventListener('click',event=>{
      const bounds=canvas.getBoundingClientRect();
      if(!view||bounds.width<=0||bounds.height<=0)return;
      const v=viewport();canvas.focus();choose({x:v.x+(event.clientX-bounds.left)*v.width/bounds.width,y:v.y+(event.clientY-bounds.top)*v.height/bounds.height});
    });
    function control(buttons,held=buttons,axes=[0,0],dt=1/30) {
      if(!held[0])blockedA=false;
      if(buttons[1]){
        if(overview){closeOverview();cancelShortcut();cancelGesture();description.textContent='Expanded minimap closed.';draw();return;}
        if(groupWheel){closeGroup();cancelShortcut();cancelGesture();description.textContent='Control groups cancelled.';draw();return;}
        cancelShortcut();
        if(targetAction){targetAction=null;cancelGesture();description.textContent='Target command cancelled.';draw();return;}
        if(placement){placement=null;cancelGesture();description.textContent='Construction preview cancelled.';draw();return;}
        if(aGesture){cancelGesture();description.textContent='Selection gesture cancelled.';draw();return;}
        cancelGesture();
        if(wheel){wheel=false;description.textContent='Command menu closed.';draw();}
        else if(selected){setSelection([]);description.textContent='Selection cleared.';draw();}
        else leave();
        return;
      }
      if(Object.keys(buttons).some(key=>buttons[key]&&key!=='0'&&key!=='6'))cancelGesture();
      if(!view||!cursor)return;
      if(buttons[5]&&!held[4]&&!held[7]){
        if(overview)closeOverview();else{overviewOrigin={...cursor};overview=true;}closeGroup();wheel=false;placement=null;targetAction=null;cancelShortcut();cancelGesture();
        description.textContent=overview?'Expanded minimap. Left stick moves its cursor; Y focuses the battlefield; B or RB closes.':'Expanded minimap closed.';
        draw();return;
      }
      if(overview){
        cancelShortcut();cancelGesture();
        const delta=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;
        const axis=i=>Number.isFinite(axes[i])?Math.max(-1,Math.min(1,axes[i])):0;
        cursor.x=Math.max(0,Math.min(view.width-.01,cursor.x+axis(0)*view.width*.6*delta));
        cursor.y=Math.max(0,Math.min(view.height-.01,cursor.y+axis(1)*view.height*.6*delta));
        if(buttons[3]){focusView(cursor);description.textContent='Battlefield focused at minimap cursor.';}
        draw();return;
      }
      if(buttons[4]&&held[4]&&!held[5]&&!held[7]&&!placement&&!targetAction){
        cancelShortcut();cancelGesture();wheel=false;groupWheel={slot:-1,done:false};
      }
      if(groupWheel){
        cancelShortcut();cancelGesture();
        if(held[5]||held[7]){closeGroup();draw();return;}
        if(held[4]){
          const x=Number.isFinite(axes[0])?axes[0]:0,y=Number.isFinite(axes[1])?axes[1]:0;
          if(Math.hypot(x,y)>.45){const angle=(Math.atan2(y,x)+Math.PI/2+Math.PI*2)%(Math.PI*2);groupWheel.slot=Math.floor(angle/(Math.PI*2)*8+.5)%8;}
          if(buttons[3]&&groupWheel.slot>=0){
            const active=groupWheel,ids=availableGroup(groups[active.slot]);
            active.done=true;
            if(ids.length){
              setSelection(ids);groupWheel=active;
              const anchor=view.units.find(u=>u.id===ids[0])||view.buildings.find(b=>b.id===ids[0]);
              focusView({x:anchor.x+(anchor.size||0)/2,y:anchor.y+(anchor.size||0)/2});
              description.textContent='Focused group '+(active.slot+1)+'.';
            }else description.textContent='Group '+(active.slot+1)+' has no available members.';
          }
          if(buttons[2]&&groupWheel.slot>=0){
            const slot=groupWheel.slot;groups[slot]=availableGroup(selection);groupWheel.done=true;
            description.textContent='Group '+(slot+1)+' assigned ('+groups[slot].length+').';
          }
        }else{
          const group=groupWheel;closeGroup();
          if(!group.done&&group.slot>=0)recallGroup(group.slot);
        }
        draw();return;
      }
      if(!held[7])wheel=false;
      if(buttons[7]&&selected){wheel=true;wheelIndex=0;}
      if(wheel){
        cancelShortcut();cancelGesture();
        if(buttons[3]&&view.battlefield&&selection.every(id=>view.battlefield.builders.includes(id))){buildPage=1-buildPage;wheelIndex=0;}
        const items=options();
        if(view.battlefield&&items.length&&Math.hypot(axes[0]||0,axes[1]||0)>.45){
          const angle=(Math.atan2(axes[1],axes[0])+Math.PI/2+Math.PI*2)%(Math.PI*2);
          wheelIndex=Math.floor(angle/(Math.PI*2)*items.length+.5)%items.length;
        }
        if(buttons[0]&&held[7]){
          const entry=items[wheelIndex];
          if(view.battlefield&&entry){
            if(entry.locked){description.textContent=entry.locked;draw();return;}
            if(entry.type==='build'){placement={...entry};wheel=false;blockedA=true;description.textContent=entry.label+' preview. A places; LT repeats; B cancels.';draw();return;}
            if(entry.targeted){if(!enabled){description.textContent='Wait for the previous order to execute.';draw();return;}targetAction={type:entry.type,label:entry.label};placement=null;wheel=false;blockedA=true;description.textContent=entry.label+': release A, then choose '+(entry.type==='disembark'?'a visible shore':['patrol','attack-move'].includes(entry.type)?'a ground destination':entry.type==='convert'?'a visible hostile target':'a friendly target')+' with A. B cancels.';draw();return;}
            if(entry.type==='stop'){if(!held[6])stop();}
            else if(enabled){
              const result=submit({type:entry.type,entities:['research','unload'].includes(entry.type)?[selected]:selection.slice(),...(entry.value===undefined?{}:{value:entry.value}),...(entry.type==='train'&&held[6]?{count:5}:{})});
              description.textContent=result.ok?entry.label+' submitted. Changes apply after host execution.':'Order not submitted. Wait for the previous order.';
              if(result.ok)enabled=false;
            }
          }else if(view.buildings.some(b=>b.id===selected&&b.rallyable))train(held[6]?5:1);else if(!held[6])stop();
        }
        draw();return;
      }
      if(held[4]||held[5]||held[7]||placement||targetAction||
          Object.keys(buttons).some(key=>buttons[key]&&key!=='3'&&key!=='6'))cancelShortcut();
      if(buttons[3]&&held[3]&&!Object.keys(buttons).some(key=>buttons[key]&&key!=='3'&&key!=='6')&&!held[4]&&!held[5]&&!held[7]&&!held[0]&&!placement&&!targetAction&&enabled&&militarySelection())
        yGesture=selection.join(',');
      if(yGesture&&!held[3]){
        const valid=yGesture===selection.join(',')&&enabled&&militarySelection();cancelShortcut();
        if(valid){
          const value=selection.every(id=>view.units.find(u=>u.id===id).formation==='line')?'split':'line';
          const result=submit({type:'formation',entities:selection.slice(),value});
          description.textContent=result.ok?'Formation: '+value+' submitted. Changes apply after host execution.':'Wait for the previous order to execute.';
          if(result.ok)enabled=false;
        }
        draw();return;
      }
      // These buttons retain their Xbox roles. Unsupported preview functions
      // are left unavailable rather than assigned unrelated shortcuts.
      if(held[4]||held[5]||held[7]||held[3]){cancelGesture();draw();return;}
      if(!held[6]){
      if(buttons[12]){selectNext(1,false,u=>(u.kind==='vil'||u.kind==='fish')&&u.idle);return;}
      if(buttons[15]){selectNext(1,false,u=>u.kind==='mon');return;}
      if(buttons[13]){selectNext(1,true);return;}
      if(buttons[14]){selectNext(1,false,u=>!['vil','fish','trn','king','mon','cart','cog'].includes(u.kind));return;}
      }
      const delta=Number.isFinite(dt)?Math.min(.1,Math.max(0,dt)):0;
      const axis=i=>Number.isFinite(axes[i])?Math.max(-1,Math.min(1,axes[i])):0;
      if(!held[6]&&axis(3)){
        const previous=viewport(),rx=(cursor.x-previous.x)/previous.width,ry=(cursor.y-previous.y)/previous.height;
        camera.zoom=cameraZoomLevel(camera.zoom,axis(3),delta);
        camera.x=cursor.x+(.5-rx)*view.width/camera.zoom;camera.y=cursor.y+(.5-ry)*view.height/camera.zoom;
        clampCamera();
      }
      const dx=axis(0)*viewport().width*.6*delta,dy=axis(1)*viewport().height*.6*delta;
      camera.x+=dx;camera.y+=dy;clampCamera();
      cursor.x=Math.max(0,Math.min(view.width-.01,cursor.x+dx));
      cursor.y=Math.max(0,Math.min(view.height-.01,cursor.y+dy));
      followCursor();
      if(placement&&buttons[0]&&!blockedA){choose(cursor,!!held[6],true);blockedA=true;return;}
      if(buttons[0]&&held[0]&&!blockedA&&!aGesture)aGesture={start:{...cursor},box:false};
      if(aGesture){
        // Reuse the solo gesture's provisional 14-pixel drag threshold.
        if(held[0]&&Math.hypot((cursor.x-aGesture.start.x)*680/viewport().width,(cursor.y-aGesture.start.y)*680/viewport().height)>14){aGesture.box=true;lastTap=null;}
        if(!held[0]){
          const gesture=aGesture;aGesture=null;
          if(gesture.box)selectBox(gesture.start,cursor,!!held[6]);else choose(gesture.start,!!held[6],true);
          return;
        }
      }
      draw();
    }
    return Object.freeze({refresh,control,choose,suspend:()=>{closeOverview();closeGroup();cancelShortcut();wheel=false;placement=null;targetAction=null;cancelGesture();draw();},selected:()=>selected,selection:()=>selection.slice(),controlGroups:()=>groups.map(ids=>ids.slice()),viewport});
  }
  root.CK_UNIT_MAP=Object.freeze({project,create});
})(typeof window!=='undefined'?window:globalThis);

