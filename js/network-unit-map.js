/* A read-only, team-relative projection and controls for the live preview. */
(function(root){
  'use strict';
  function project(world,team,width,height) {
    if(!world||!Number.isInteger(team)||team<0||team>=world.teamN||
      !Number.isInteger(width)||width<1||!Number.isInteger(height)||height<1)throw Error('Invalid unit map');
    const position=e=>Number.isFinite(e.x)&&Number.isFinite(e.y)&&e.x>=0&&e.y>=0&&e.x<width&&e.y<height;
    // Copy only owned, living entities. Never expose the opponent, resource nodes,
    // shared fog arrays or mutable simulation objects to this UI projection.
    return {width,height,team,
      units:world.us.filter(u=>u&&u.t===team&&u.hp>0&&!u.ld&&position(u)).map(u=>({id:u.netId,kind:u.k,x:u.x,y:u.y,idle:u.o==='i'})),
      buildings:world.bs.filter(b=>b&&b.t===team&&b.hp>0&&position(b)).map(b=>({id:b.netId,kind:b.k,x:b.x,y:b.y,size:b.s||1,
        rallyable:b.k==='tc'&&!!b.done,rally:b.rally&&position(b.rally)?{x:b.rally.x,y:b.rally.y}:null}))};
  }
  function create({canvas,description,submit,leave,stopButton,previousButton,nextButton,townButton,nameOf=()=> 'unit',now=()=>Date.now()}) {
    const context=canvas.getContext('2d');
    if(!context)throw Error('Unit map canvas unavailable');
    let view=null,selected=null,selection=[],cursor=null,enabled=false,wheel=false,lastTap=null,aGesture=null,blockedA=false;
    function cancelGesture(){if(aGesture)blockedA=true;aGesture=null;lastTap=null;}
    function setSelection(ids){selection=[...new Set(ids)];selected=selection[0]||null;}
    canvas.width=canvas.height=680;canvas.tabIndex=0;
    canvas.setAttribute('aria-label','Your kingdom unit map. Left stick moves the cursor. Tap A to select or order; hold A and drag with the left stick for a selection box. Double A on a unit selects all your visible units of that type. Hold LT to add units or boxes to selection. D-pad Up selects an idle villager, Right support, Down a town centre, Left military. Hold RT for the command menu and press A to confirm; at a town centre, LT+A requests five villagers. B cancels a box, clears selection or closes the command menu.');
    canvas.style.cssText='display:block;width:min(100%,680px);height:auto;aspect-ratio:1;border:2px solid #c9a24a;background:#090d16;touch-action:manipulation';
    function draw() {
      if(stopButton)stopButton.disabled=!canStop();
      for(const button of [previousButton,nextButton])if(button)button.disabled=!view?.units.length;
      if(townButton)townButton.disabled=!view?.buildings.some(b=>b.rallyable);
      context.fillStyle='#090d16';context.fillRect(0,0,680,680);
      if(!view)return;
      const chosen=new Set(selection);
      const sx=680/view.width,sy=680/view.height;
      context.strokeStyle='#1b2a3f';context.lineWidth=1;
      for(let cell=0;cell<=view.width;cell+=8){context.beginPath();context.moveTo(cell*sx,0);context.lineTo(cell*sx,680);context.stroke();}
      for(let cell=0;cell<=view.height;cell+=8){context.beginPath();context.moveTo(0,cell*sy);context.lineTo(680,cell*sy);context.stroke();}
      context.fillStyle='#c9a24a';
      for(const b of view.buildings){
        context.fillStyle=chosen.has(b.id)?'#ffe78a':'#c9a24a';
        context.fillRect(b.x*sx,b.y*sy,b.size*sx,b.size*sy);
        if(b.id===selected&&b.rally){
          context.strokeStyle='#ffe78a';context.beginPath();
          context.moveTo((b.x+b.size/2)*sx,(b.y+b.size/2)*sy);
          context.lineTo(b.rally.x*sx,b.rally.y*sy);context.stroke();
          context.fillRect(b.rally.x*sx-3,b.rally.y*sy-3,6,6);
        }
      }
      for(const u of view.units){
        context.fillStyle=chosen.has(u.id)?'#ffe78a':'#73c9ff';context.beginPath();
        context.arc(u.x*sx,u.y*sy,chosen.has(u.id)?6:4,0,Math.PI*2);context.fill();
      }
      if(aGesture?.box&&cursor){
        const x=Math.min(aGesture.start.x,cursor.x)*sx,y=Math.min(aGesture.start.y,cursor.y)*sy;
        const width=Math.abs(cursor.x-aGesture.start.x)*sx,height=Math.abs(cursor.y-aGesture.start.y)*sy;
        context.fillStyle='rgba(140,255,60,.12)';context.fillRect(x,y,width,height);
        context.strokeStyle='#8cff3c';context.lineWidth=2;context.setLineDash([7,5]);
        context.strokeRect(x,y,width,height);context.setLineDash([]);
      }
      if(cursor){
        const x=cursor.x*sx,y=cursor.y*sy;
        context.strokeStyle='#fff';context.lineWidth=2;context.beginPath();
        context.moveTo(x-7,y);context.lineTo(x+7,y);context.moveTo(x,y-7);context.lineTo(x,y+7);context.stroke();
      }
      if(wheel){
        context.fillStyle='rgba(9,13,22,.95)';context.beginPath();context.arc(340,340,150,0,Math.PI*2);context.fill();
        context.strokeStyle='#c9a24a';context.lineWidth=3;context.stroke();
        context.fillStyle='#fff';context.textAlign='center';context.font='22px system-ui';
        context.fillText('Command menu',340,302);
        context.fillText(view.buildings.some(b=>b.id===selected&&b.rallyable)?'Train villager':selection.length>1?'Stop '+selection.length+' units':'Stop',340,344);
        context.font='16px system-ui';
        if(view.buildings.some(b=>b.id===selected&&b.rallyable)){
          context.fillText('Hold RT + A: train 1',340,374);
          context.fillText('Hold RT + LT + A: train 5',340,402);
        }else context.fillText('Hold RT + A: confirm',340,384);
      }
    }
    function refresh(world,team,width,height,canCommand) {
      if(view&&(view.team!==team||view.width!==width||view.height!==height))cancelGesture();
      view=project(world,team,width,height);enabled=canCommand;
      if(lastTap&&!view.units.some(u=>u.id===lastTap.id&&u.kind===lastTap.kind))lastTap=null;
      const previousCount=selection.length;
      setSelection(selection.filter(id=>view.units.some(u=>u.id===id)||view.buildings.some(b=>b.id===id&&b.rallyable)));
      if(selected&&selection.length!==previousCount)description.textContent=selection.length+' unit'+(selection.length===1?' remains':'s remain')+' selected. A orders at the cursor; hold RT for commands; B deselects.';
      if(!selected)wheel=false;
      if(!cursor){const first=view.units[0]||view.buildings[0];cursor=first?{x:first.x,y:first.y}:{x:width/2,y:height/2};}
      canvas.setAttribute('aria-disabled',String(!enabled));
      if(!selected)description.textContent='D-pad: Up idle villager, Right support, Down town centre, Left military. Left stick moves the cursor; tap A to select or order; hold A and drag to box-select units. LT adds units or boxes; hold RT for commands. Enemy positions and terrain are not shown.';
      draw();
    }
    function choose(point,add=false,controller=false) {
      if(aGesture){aGesture=null;blockedA=true;}
      const previousTap=lastTap;lastTap=null;
      if(wheel||!view||!Number.isFinite(point.x)||!Number.isFinite(point.y)||
        point.x<0||point.y<0||point.x>=view.width||point.y>=view.height)return;
      cursor={x:point.x,y:point.y};
      const radius=Math.max(0.8,view.width*8/680);
      let nearest=null,distance=Infinity;
      for(const unit of view.units){const d=Math.hypot(unit.x-point.x,unit.y-point.y);if(d<=radius&&d<distance){nearest=unit;distance=d;}}
      const town=view.buildings.find(b=>b.rallyable&&point.x>=b.x&&point.x<b.x+b.size&&point.y>=b.y&&point.y<b.y+b.size);
      if(nearest){
        if(add&&view.buildings.some(b=>selection.includes(b.id))){description.textContent='Multiple-building or mixed building/unit selection is not available in this preview.';draw();return;}
        const at=controller&&!add?now():0;
        // The gesture is on the same unit, not two unrelated A selections.
        // This provisional window still needs comparison with physical Xbox.
        const double=controller&&!add&&previousTap&&previousTap.id===nearest.id&&previousTap.kind===nearest.kind&&at>=previousTap.at&&at-previousTap.at<=350;
        const ids=double?view.units.filter(u=>u.kind===nearest.kind).map(u=>u.id):[nearest.id];
        setSelection(add?selection.concat(ids):ids);
        if(controller&&!add&&!double)lastTap={id:nearest.id,kind:nearest.kind,at};
        description.textContent=selection.length>1?selection.length+' units selected. A orders the group at the cursor; hold RT for commands; B deselects.':
          'Selected '+nameOf(nearest)+'. Double A selects visible units of this type; LT+A adds another unit. A orders at the cursor; hold RT for commands; B deselects.';
      }
      else if(town){
        if(add&&selection.some(id=>id!==town.id)){description.textContent='Multiple-building or mixed building/unit selection is not available in this preview.';draw();return;}
        setSelection([town.id]);description.textContent='Town centre selected. A sets a rally point. Hold RT for training (A: one; LT+A: five). B deselects.';
      }
      else if(add){description.textContent='LT+A adds an owned unit at the cursor; it does not issue a move order.';}
      else if(selected&&enabled){
        const rally=view.buildings.some(b=>b.id===selected&&b.rallyable);
        const result=submit({type:rally?'rally':'move',entities:selection.slice(),point:{...point}});
        description.textContent=result.ok?(rally?'Rally point submitted.':'Move submitted.')+' Changes apply only after host execution.':'Order not submitted. Select fewer units if the group is too large, or wait for the previous order.';
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
    function canStop() { return !!(enabled&&view&&selection.length&&selection.every(id=>view.units.some(u=>u.id===id))); }
    function selectNext(direction,town=false,filter=()=>true) {
      cancelGesture();
      const choices=town?view?.buildings.filter(b=>b.rallyable):view?.units.filter(filter);
      if(!choices?.length)return;
      const at=choices.findIndex(e=>e.id===selected);
      const next=choices[at<0?(direction<0?choices.length-1:0):(at+direction+choices.length)%choices.length];
      setSelection([next.id]);wheel=false;
      cursor={x:next.x+(town?next.size/2:0),y:next.y+(town?next.size/2:0)};
      cursor.x=Math.min(view.width-0.01,cursor.x);cursor.y=Math.min(view.height-0.01,cursor.y);
      description.textContent=town?'Town centre selected. A sets a rally point. Hold RT for training (A: one; LT+A: five). B deselects.':
        'Selected '+nameOf(next)+' ('+(choices.indexOf(next)+1)+' of '+choices.length+'). A orders at the cursor. Hold RT for commands; B deselects.';
      canvas.focus();draw();
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
      if(!enabled||!view?.buildings.some(b=>b.id===selected&&b.rallyable))return;
      const result=submit({type:'train',entities:[selected],value:'vil',...(count===5?{count:5}:{})});
      description.textContent=result.ok?(count===5?'Five-villager training batch submitted. Available resources, population and queue space limit how many are queued after host execution.':'Villager training submitted. Resources and queue change only after host execution.'):'Training not submitted. Wait for the previous order.';
      if(result.ok)enabled=false;
      draw();
    }
    if(stopButton){stopButton.disabled=true;stopButton.addEventListener('click',stop);}
    canvas.addEventListener('blur',()=>{cancelGesture();wheel=false;draw();});
    canvas.addEventListener('click',event=>{
      const bounds=canvas.getBoundingClientRect();
      if(!view||bounds.width<=0||bounds.height<=0)return;
      canvas.focus();choose({x:(event.clientX-bounds.left)*view.width/bounds.width,y:(event.clientY-bounds.top)*view.height/bounds.height});
    });
    function control(buttons,held=buttons,axes=[0,0],dt=1/30) {
      if(!held[0])blockedA=false;
      if(buttons[1]){
        if(aGesture){cancelGesture();description.textContent='Selection gesture cancelled.';draw();return;}
        cancelGesture();
        if(wheel){wheel=false;description.textContent='Command menu closed.';draw();}
        else if(selected){setSelection([]);description.textContent='Selection cleared.';draw();}
        else leave();
        return;
      }
      if(Object.keys(buttons).some(key=>buttons[key]&&key!=='0'&&key!=='6'))cancelGesture();
      if(!view||!cursor)return;
      if(!held[7])wheel=false;
      if(buttons[7]&&selected)wheel=true;
      if(wheel){
        cancelGesture();
        if(buttons[0]&&held[7]){
          if(view.buildings.some(b=>b.id===selected&&b.rallyable))train(held[6]?5:1);else if(!held[6])stop();
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
      cursor.x=Math.max(0,Math.min(view.width-.01,cursor.x+axis(0)*view.width*.6*delta));
      cursor.y=Math.max(0,Math.min(view.height-.01,cursor.y+axis(1)*view.height*.6*delta));
      if(buttons[0]&&held[0]&&!blockedA&&!aGesture)aGesture={start:{...cursor},box:false};
      if(aGesture){
        // Reuse the solo gesture's provisional 14-pixel drag threshold.
        if(held[0]&&Math.hypot((cursor.x-aGesture.start.x)*680/view.width,(cursor.y-aGesture.start.y)*680/view.height)>14){aGesture.box=true;lastTap=null;}
        if(!held[0]){
          const gesture=aGesture;aGesture=null;
          if(gesture.box)selectBox(gesture.start,cursor,!!held[6]);else choose(gesture.start,!!held[6],true);
          return;
        }
      }
      draw();
    }
    return Object.freeze({refresh,control,choose,suspend:()=>{wheel=false;cancelGesture();draw();},selected:()=>selected,selection:()=>selection.slice()});
  }
  root.CK_UNIT_MAP=Object.freeze({project,create});
})(typeof window!=='undefined'?window:globalThis);
