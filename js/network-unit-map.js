/* Team-relative canvas map, painted artwork and authenticated controller interaction. */
(function(root){
  'use strict';
  const project=root.CK_UNIT_PROJECTION?.project;
  if(typeof project!=='function')throw Error('Unit map projection unavailable');
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
        const commands=(units[0]?.commands||[]).filter(option=>units.every(u=>u?.commands?.some(o=>o.type===option.type&&o.value===option.value))).map(option=>{
          if(option.type!=='stance')return option;
          const active=units.every(u=>u.commands.some(o=>o.type==='stance'&&o.value===option.value&&o.active));
          return {...option,active,label:option.label+(active?' (current)':'')};
        });
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
    const {drawTerrain,drawEntity}=root.CK_NETWORK_MAP_RENDER.create({
      context,terrainMemory,getView:()=>view,getSelection:()=>selection,viewport
    });
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
      for(const b of view.buildings)if(chosen.has(b.id)&&b.rally){
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
        if(['follow','guard'].includes(targetAction.type)&&selection.includes(target?.id)){description.textContent='Choose a friendly target outside the selected group; B cancels.';draw();return;}
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
        description.textContent=view.battlefield?((selection.length>1?selection.length+' production buildings':town.label)+' selected. Hold RT and choose training or research with the left stick. A sets a rally point for production buildings. B deselects.'):selection.length>1?selection.length+' town centres selected. Hold RT for balanced training (A: one; LT+A: five). A sets a rally point for the group. B deselects.':
          'Town centre selected. Double A selects visible completed town centres. A sets a rally point. Hold RT for training (A: one; LT+A: five). B deselects.';
      }
      else if(add){description.textContent='LT+A adds an owned unit at the cursor; it does not issue a move order.';}
      else if(selected&&enabled){
        const rally=view.buildings.some(b=>b.id===selected&&b.rallyable);
        if(rally&&!selection.every(id=>view.buildings.some(b=>b.id===id&&b.rallyable))){description.textContent='Select completed production buildings together to set a group rally point.';draw();return;}
        const enemy=view.battlefield?.enemies.find(e=>e.hostile!==false&&(e.size?point.x>=e.x&&point.x<e.x+e.size&&point.y>=e.y&&point.y<e.y+e.size:Math.hypot(e.x-point.x,e.y-point.y)<=radius));
        const deposit=view.battlefield?.tiles.find(t=>t.index===Math.floor(point.y)*view.width+Math.floor(point.x))?.node;
        const gathering=!rally&&deposit?.id&&(!deposit.farm||deposit.owner===view.team)&&selection.every(id=>view.battlefield.gatherers[id]===(deposit.fish?'fish':'vil'));
        const resourceRally=rally&&deposit?.id&&(!deposit.farm&&!deposit.trap||deposit.owner===view.team)&&
          selection.every(id=>view.buildings.find(b=>b.id===id)?.commands?.some(o=>o.type==='train'&&o.value===(deposit.fish?'fish':'vil')));
        const conversion=enemy&&!rally&&selection.every(id=>view.units.find(u=>u.id===id)?.kind==='mon');
        const attack=enemy&&!rally&&selection.every(id=>view.battlefield.attackers.includes(id));
        if(enemy&&!rally&&!attack&&!conversion){description.textContent='Selected units cannot attack this target.';draw();return;}
        if(isBuilding(selected)&&!rally){description.textContent='This building has no rally point. Hold RT for its available commands.';draw();return;}
        const result=submit(conversion?{type:'convert',entities:selection.slice(),target:enemy.id}:gathering?{type:'gather',entities:selection.slice(),target:deposit.id}:attack?{type:'attack',entities:selection.slice(),target:enemy.id}:{type:rally?'rally':'move',entities:selection.slice(),point:{...point},...(resourceRally?{target:deposit.id}:{})});
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

