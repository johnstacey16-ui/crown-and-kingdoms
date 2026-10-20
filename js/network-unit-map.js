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
      units:world.us.filter(u=>u&&u.t===team&&u.hp>0&&!u.ld&&position(u)).map(u=>({id:u.netId,kind:u.k,x:u.x,y:u.y})),
      buildings:world.bs.filter(b=>b&&b.t===team&&b.hp>0&&position(b)).map(b=>({id:b.netId,kind:b.k,x:b.x,y:b.y,size:b.s||1,
        rallyable:b.k==='tc'&&!!b.done,rally:b.rally&&position(b.rally)?{x:b.rally.x,y:b.rally.y}:null}))};
  }
  function create({canvas,description,submit,leave,stopButton,previousButton,nextButton,townButton,nameOf=()=> 'unit'}) {
    const context=canvas.getContext('2d');
    if(!context)throw Error('Unit map canvas unavailable');
    let view=null,selected=null,cursor=null,enabled=false;
    canvas.width=canvas.height=680;canvas.tabIndex=0;
    canvas.setAttribute('aria-label','Your kingdom unit map. Use LB/RB to select your previous or next unit; LT selects your town centre. Use the D-pad to move the cursor, A to select or order, Y to stop, X to clear selection, and B to return to the lobby controls.');
    canvas.style.cssText='display:block;width:min(100%,680px);height:auto;aspect-ratio:1;border:2px solid #c9a24a;background:#090d16;touch-action:manipulation';
    function draw() {
      if(stopButton)stopButton.disabled=!canStop();
      for(const button of [previousButton,nextButton])if(button)button.disabled=!view?.units.length;
      if(townButton)townButton.disabled=!view?.buildings.some(b=>b.rallyable);
      context.fillStyle='#090d16';context.fillRect(0,0,680,680);
      if(!view)return;
      const sx=680/view.width,sy=680/view.height;
      context.strokeStyle='#1b2a3f';context.lineWidth=1;
      for(let cell=0;cell<=view.width;cell+=8){context.beginPath();context.moveTo(cell*sx,0);context.lineTo(cell*sx,680);context.stroke();}
      for(let cell=0;cell<=view.height;cell+=8){context.beginPath();context.moveTo(0,cell*sy);context.lineTo(680,cell*sy);context.stroke();}
      context.fillStyle='#c9a24a';
      for(const b of view.buildings){
        context.fillStyle=b.id===selected?'#ffe78a':'#c9a24a';
        context.fillRect(b.x*sx,b.y*sy,b.size*sx,b.size*sy);
        if(b.id===selected&&b.rally){
          context.strokeStyle='#ffe78a';context.beginPath();
          context.moveTo((b.x+b.size/2)*sx,(b.y+b.size/2)*sy);
          context.lineTo(b.rally.x*sx,b.rally.y*sy);context.stroke();
          context.fillRect(b.rally.x*sx-3,b.rally.y*sy-3,6,6);
        }
      }
      for(const u of view.units){
        context.fillStyle=u.id===selected?'#ffe78a':'#73c9ff';context.beginPath();
        context.arc(u.x*sx,u.y*sy,u.id===selected?6:4,0,Math.PI*2);context.fill();
      }
      if(cursor){
        const x=cursor.x*sx,y=cursor.y*sy;
        context.strokeStyle='#fff';context.lineWidth=2;context.beginPath();
        context.moveTo(x-7,y);context.lineTo(x+7,y);context.moveTo(x,y-7);context.lineTo(x,y+7);context.stroke();
      }
    }
    function refresh(world,team,width,height,canCommand) {
      view=project(world,team,width,height);enabled=canCommand;
      if(selected&&!view.units.some(u=>u.id===selected)&&!view.buildings.some(b=>b.id===selected&&b.rallyable))selected=null;
      if(!cursor){const first=view.units[0]||view.buildings[0];cursor=first?{x:first.x,y:first.y}:{x:width/2,y:height/2};}
      canvas.setAttribute('aria-disabled',String(!enabled));
      if(!selected)description.textContent='Your units are blue and your buildings gold. Select a unit to move, or a completed town centre to set its rally point. Enemy positions and terrain are not shown.';
      draw();
    }
    function choose(point) {
      if(!enabled||!view||!Number.isFinite(point.x)||!Number.isFinite(point.y)||
        point.x<0||point.y<0||point.x>=view.width||point.y>=view.height)return;
      cursor={x:point.x,y:point.y};
      const radius=Math.max(0.8,view.width*8/680);
      let nearest=null,distance=Infinity;
      for(const unit of view.units){const d=Math.hypot(unit.x-point.x,unit.y-point.y);if(d<=radius&&d<distance){nearest=unit;distance=d;}}
      const town=view.buildings.find(b=>b.rallyable&&point.x>=b.x&&point.x<b.x+b.size&&point.y>=b.y&&point.y<b.y+b.size);
      if(nearest){selected=nearest.id;description.textContent='Selected '+nameOf(nearest)+'. Choose a destination, Y stops, X clears selection.';}
      else if(town){selected=town.id;description.textContent='Town centre selected. Choose a rally point for newly trained units; X clears selection.';}
      else if(selected){
        const rally=view.buildings.some(b=>b.id===selected&&b.rallyable);
        const result=submit({type:rally?'rally':'move',entities:[selected],point:{...point}});
        description.textContent=result.ok?(rally?'Rally point submitted.':'Move submitted.')+' Changes apply only after host execution.':'Order not submitted. Wait for the previous order or select another entity.';
        if(result.ok)enabled=false;
      }else description.textContent='Select one of your blue units or completed town centres first.';
      draw();
    }
    function canStop() { return !!(enabled&&view&&view.units.some(u=>u.id===selected)); }
    function selectNext(direction,town=false) {
      const choices=town?view?.buildings.filter(b=>b.rallyable):view?.units;
      if(!choices?.length)return;
      const at=choices.findIndex(e=>e.id===selected);
      const next=choices[at<0?(direction<0?choices.length-1:0):(at+direction+choices.length)%choices.length];
      selected=next.id;
      cursor={x:next.x+(town?next.size/2:0),y:next.y+(town?next.size/2:0)};
      cursor.x=Math.min(view.width-0.01,cursor.x);cursor.y=Math.min(view.height-0.01,cursor.y);
      description.textContent=town?'Town centre selected. Choose a rally point for newly trained units.':
        'Selected '+nameOf(next)+' ('+(choices.indexOf(next)+1)+' of '+choices.length+'). Choose a destination, Y stops, X clears selection.';
      canvas.focus();draw();
    }
    for(const [button,direction,town] of [[previousButton,-1,false],[nextButton,1,false],[townButton,1,true]]){
      if(button){button.disabled=true;button.addEventListener('click',()=>selectNext(direction,town));}
    }
    function stop() {
      if(!canStop())return;
      const result=submit({type:'stop',entities:[selected]});
      description.textContent=result.ok?'Stop submitted. The unit stops after host execution.':'Stop not submitted. Wait for the previous order.';
      if(result.ok)enabled=false;
      draw();
    }
    if(stopButton){stopButton.disabled=true;stopButton.addEventListener('click',stop);}
    canvas.addEventListener('click',event=>{
      const bounds=canvas.getBoundingClientRect();
      if(!view||bounds.width<=0||bounds.height<=0)return;
      canvas.focus();choose({x:(event.clientX-bounds.left)*view.width/bounds.width,y:(event.clientY-bounds.top)*view.height/bounds.height});
    });
    function control(buttons) {
      if(buttons[1]){leave();return;}
      if(!view||!cursor)return;
      if(buttons[4]||buttons[5]||buttons[6]){selectNext(buttons[4]?-1:1,!!buttons[6]);return;}
      if(buttons[2]){selected=null;description.textContent='Selection cleared.';}
      if(buttons[3]){stop();return;}
      if(buttons[12])cursor.y=Math.max(0,cursor.y-1);
      if(buttons[13])cursor.y=Math.min(view.height-0.01,cursor.y+1);
      if(buttons[14])cursor.x=Math.max(0,cursor.x-1);
      if(buttons[15])cursor.x=Math.min(view.width-0.01,cursor.x+1);
      if(buttons[0])choose(cursor);else draw();
    }
    return Object.freeze({refresh,control,choose,selected:()=>selected});
  }
  root.CK_UNIT_MAP=Object.freeze({project,create});
})(typeof window!=='undefined'?window:globalThis);
