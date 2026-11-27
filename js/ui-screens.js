/* Shared full-screen menu, save-slot and campaign presentation.
 * Functions relocated unchanged from js/ui.js, no gameplay state changes. */
/* Save/load slot presentation and menu action descriptors. */
const slotItems=()=>{const items=SI.map((x,n)=>{const ok=x&&x!=='bad',nm=k=>(CIV[k]||{n:'?'}).n,lab='Slot '+(n+1)+(ok?'   '+nm(x.civ[0])+' vs '+nm(x.civ[1])+'   '+(x.t/60|0)+':'+String(x.t%60|0).padStart(2,'0'):x==='bad'?'   (unreadable)':'   (empty)');return{n:lab,d:()=>ok?(sm==='save'?'Overwrite this save. ':'')+(x.m?'Mission: '+x.m+'. ':'Skirmish. ')+x.w+'x'+x.w+' map, '+difficultyName(x.d)+(x.when?'. Saved '+new Date(x.when).toLocaleString():''):x==='bad'?'This slot cannot be read.':sm==='save'?'Saves the current match here.':'Nothing saved in this slot.',a:()=>{if(sm==='save'){if(ok&&deleteSlotTarget===null){overwriteSlotTarget=n;return}slot=n;if(saveG()){refreshSlots();mode=sb}}else if(ok){slot=n;if(loadG())mode='play'}}}});if(sm==='load')for(let n=0;n<SI.length;n++)if(SI[n])items.push({n:'Delete Save Slot '+(n+1)+(SI[n]==='bad'?' (unreadable)':''),deleteTarget:n,d:()=> 'Permanently remove this save. Confirmation is required.',a:()=>{deleteSlotTarget=n}});
if(sm==='load'){let a=null;try{a=JSON.parse(localStorage.getItem('ck_autosave'))}catch(e){}if(a&&a.v===1&&Number.isFinite(a.t)&&Array.isArray(a.us)&&Array.isArray(a.bs)){items.push({n:'Recover Autosave   '+(a.t/60|0)+':'+String(a.t%60|0).padStart(2,'0'),deleteTarget:'auto',d:()=> 'Most recent automatic checkpoint, saved '+new Date(a.when||0).toLocaleString()+'. Recover this match without overwriting manual slots.',a:()=>{if(loadG(true))mode='play'}})}}if(sm==='load'){let present=false;try{present=localStorage.getItem('ck_autosave')!==null}catch(e){}if(present)items.push({n:'Delete Autosave',deleteTarget:'auto',d:()=> 'Permanently remove the automatic recovery save. Confirmation is required.',a:()=>{deleteSlotTarget='auto'}})}items.push({n:'Back',a:()=>{mode=sb}});return items};
function drawSlots(){titleBg();drawList(sm==='save'?'SAVE GAME':'LOAD / DELETE GAME',slotItems(),ci,deleteSlotTarget!==null?'A: CONFIRM DELETE    B: cancel':'A: '+(sm==='save'?'save here':'load')+'    X: delete selected save    B: back');if(deleteSlotTarget!==null||overwriteSlotTarget!==null){X.fillStyle='rgba(10,15,24,.94)';X.fillRect(CW*.19,CH*.39,CW*.62,CH*.2);tx(overwriteSlotTarget!==null?'OVERWRITE SLOT '+(overwriteSlotTarget+1)+'?':'DELETE '+(deleteSlotTarget==='auto'?'AUTOSAVE':'SLOT '+(deleteSlotTarget+1))+'?',CW*.24,CH*.46,25,'#ffad8b');tx(overwriteSlotTarget!==null?'The previous save will be replaced. A: confirm, B: cancel.':'This cannot be undone. Press A to delete, B to cancel.',CW*.24,CH*.52,17,'#ffffff')}}

/* Reusable title-background and controller list presentation for all menu screens. */
function titleBg(){
 titleScene();
 // Submenus retain the same kingdom vista and gold focus, without title overlap.
 X.fillStyle='rgba(5,12,19,.28)';X.fillRect(0,0,CW,CH);
}
/* The controller must never select an off-screen setup option. The Figma
 * reference's gold focus and slate panel colours are reused here, while input
 * state, setting values and menu action handlers remain the canonical owners. */
const CK_MENU_UI=Object.freeze({
 focus:'#f2c14e',selected:'#354651',text:'#f1f5f9',muted:'#cbd5e1',
 gold:'#f5d27b',success:'#9ae6b4',panel:'#111820'
});
function menuListLayout(count,index,width,height){
 const total=Math.max(0,Math.trunc(count));
 const w=Math.max(240,Math.min(780,width-40));
 const rh=Math.max(30,Math.min(48,Math.floor((height-200)/Math.min(Math.max(total,1),10))));
 const visible=Math.min(total,Math.max(1,Math.floor((height-238)/rh)));
 const selected=Math.max(0,Math.min(Number.isInteger(index)?index:0,total-1));
 const start=Math.max(0,Math.min(selected-Math.floor(visible/2),total-visible));
 const h=visible*rh+150;
 return {w,x:(width-w)/2,y:Math.max(8,Math.floor((height-h)/2)),h,rh,visible,start,total,selected};
}
function menuMeasure(s,size){
 X.font='bold '+size+'px system-ui,sans-serif';
 return typeof X.measureText==='function'?X.measureText(s).width:s.length*size*.6;
}
function menuFit(s,width,size){
 const value=String(s??'');
 if(menuMeasure(value,size)<=width)return value;
 let lo=0,hi=value.length;
 while(lo<hi){
  const mid=Math.ceil((lo+hi)/2);
  if(menuMeasure(value.slice(0,mid)+'…',size)<=width)lo=mid;
  else hi=mid-1;
 }
 return value.slice(0,lo)+'…';
}
function menuDescription(s,width,size){
 const words=String(s??'').trim().split(/\s+/).filter(Boolean);
 if(!words.length)return [];
 let first='';
 while(words.length){
  const next=first?first+' '+words[0]:words[0];
  if(first&&menuMeasure(next,size)>width)break;
  first=next;words.shift();
 }
 return words.length?[menuFit(first,width,size),menuFit(words.join(' '),width,size)]:[menuFit(first,width,size)];
}
function drawList(title,items,idx,sub){
 X.fillStyle='rgba(3,7,12,.64)';X.fillRect(0,0,CW,CH);
 const l=menuListLayout(items.length,idx,CW,CH);
 const {w,x,y,h,rh,visible,start,total,selected}=l;
 panel(x,y,w,h);
 tx(menuFit(title,w-170,Math.min(32,w/13)),CW/2,y+49,Math.min(32,w/13),CK_MENU_UI.gold,'center');
 tx(total?(selected+1)+' / '+total+(start?'  ▲':'')+(start+visible<total?'  ▼':''):'',
  x+w-24,y+50,14,CK_MENU_UI.muted,'right');
 X.fillStyle='rgba(220,181,104,.18)';X.fillRect(x+24,y+62,w-48,1);
 for(let row=0;row<visible;row++){
  const i=start+row,it=items[i],yy=y+72+row*rh,active=i===selected;
  if(active){
   const gradient=X.createLinearGradient(x,yy,x+w,yy+rh);
   gradient.addColorStop(0,'#5c492d');
   gradient.addColorStop(.55,CK_MENU_UI.selected);
   gradient.addColorStop(1,'#27343c');
   X.fillStyle=gradient;X.fillRect(x+14,yy,w-28,rh-4);
   X.strokeStyle=CK_MENU_UI.focus;X.lineWidth=1.5;
   X.strokeRect(x+14.5,yy+.5,w-29,rh-5);
   X.fillStyle=CK_MENU_UI.focus;X.fillRect(x+22,yy+7,4,Math.max(8,rh-18));
  }else{
   X.fillStyle='rgba(255,255,255,.025)';X.fillRect(x+18,yy,w-36,rh-5);
  }
  const sz=Math.max(15,Math.min(24,Math.floor(rh*.52)));
  const adjustable=typeof it.v==='function';
  const labelWidth=adjustable?w-238:w-95;
  tx(menuFit(it.n,labelWidth,sz),x+36,yy+rh*.65,sz,
   active?CK_MENU_UI.gold:it.a&&!adjustable?CK_MENU_UI.gold:CK_MENU_UI.text);
  if(adjustable){
   const value=String(it.v());
   tx('‹',x+w-150,yy+rh*.65,sz,CK_MENU_UI.focus,'center');
   tx(menuFit(value,104,Math.max(14,sz-2)),x+w-88,yy+rh*.65,Math.max(14,sz-2),CK_MENU_UI.gold,'center');
   tx('›',x+w-28,yy+rh*.65,sz,CK_MENU_UI.focus,'center');
  }
 }
 const bottom=y+72+visible*rh;
 const selectedItem=items[selected];
 const desc=selectedItem&&typeof selectedItem.d==='function'?selectedItem.d():'';
 if(desc){
  X.fillStyle='rgba(0,0,0,.28)';X.fillRect(x+18,bottom+4,w-36,46);
  const size=Math.max(13,Math.min(16,w/42));
  menuDescription(desc,w-74,size).forEach((line,i)=>
   tx(line,CW/2,bottom+20+i*18,size,CK_MENU_UI.muted,'center'));
 }
 tx(menuFit(sub,w-48,Math.max(12,Math.min(16,w/49))),CW/2,bottom+66,
  Math.max(12,Math.min(16,w/49)),CK_MENU_UI.success,'center');
}

/* Reusable framed panels, match results and runtime-error presentation. */
function panel(x,y,w,h){X.save();X.shadowColor='rgba(0,0,0,.55)';X.shadowBlur=24;X.shadowOffsetY=8;const g=X.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'#354451');g.addColorStop(.18,'#202b34');g.addColorStop(.72,'#111820');g.addColorStop(1,'#080d12');X.fillStyle=g;X.fillRect(x,y,w,h);X.restore();X.fillStyle='rgba(7,12,17,.42)';X.fillRect(x+8,y+8,w-16,h-16);X.strokeStyle='#d9b568';X.lineWidth=3;X.strokeRect(x+1.5,y+1.5,w-3,h-3);X.strokeStyle='#6f5631';X.lineWidth=1;X.strokeRect(x+7.5,y+7.5,w-15,h-15);X.strokeStyle='rgba(235,207,143,.5)';X.lineWidth=1;X.beginPath();X.moveTo(x+20,y+17);X.lineTo(x+w-20,y+17);X.moveTo(x+20,y+h-17);X.lineTo(x+w-20,y+h-17);X.stroke();for(const q of [[x+11,y+11],[x+w-11,y+11],[x+11,y+h-11],[x+w-11,y+h-11]]){X.fillStyle='#f5d58a';X.beginPath();X.moveTo(q[0],q[1]-4);X.lineTo(q[0]+4,q[1]);X.lineTo(q[0],q[1]+4);X.lineTo(q[0]-4,q[1]);X.closePath();X.fill()}X.fillStyle='#d9b568';X.fillRect(x+w*.5-30,y+13,60,2);X.fillRect(x+w*.5-15,y+h-15,30,2)}
function shade(t,l1,l2,c){X.fillStyle='#000b';X.fillRect(0,0,CW,CH);tx(t,CW/2,CH*.36,64,c,'center');l1.forEach((s,i)=>tx(s,CW/2,CH*.36+60+i*38,26,'#e2e8f0','center'));tx(l2,CW/2,CH*.78,26,'#9ae6b4','center')}
function drawError(){X.setTransform(DPR,0,0,DPR,0,0);X.fillStyle='#090b10';X.fillRect(0,0,CW,CH);const w=Math.min(900,CW-32),h=Math.min(CH-32,Math.max(310,CH*.72)),x=(CW-w)/2,y=(CH-h)/2;panel(x,y,w,h);tx('CROWN & KINGDOMS — RUNTIME ERROR',x+24,y+42,Math.min(27,w/28),'#ff8b82');tx('Simulation paused to prevent repeated failure.',x+24,y+76,18,'#f4d6d3');const er=CK_ERR||{},lines=[`Error: ${er.message||'Unknown error'}`,`Game time: ${Number(er.time||0).toFixed(1)}s   Units: ${er.units||0}   Buildings: ${er.buildings||0}`,`Map: ${er.map||'unknown'}   Mode before error: ${er.mode||'unknown'}`,...String(er.stack||'').split('\n').slice(1,8)];let yy=y+112;for(const line of lines){if(yy>y+h-62)break;tx(line.slice(0,Math.max(20,Math.floor((w-48)/9))),x+24,yy,14,line.startsWith('Error:')?'#ffb4ab':'#e2e8f0');yy+=22}tx('Press A or B to return to the title screen. Start a fresh match after an error.',x+24,y+h-24,15,'#9ae6b4')}

/* Campaign objective, list and briefing presentation; progression stays in js/campaign.js. */
// Mission briefing body scrolls independently from fixed Xbox button help.
let briefScroll=0,briefScrollMax=0,briefScrollMission=-1;
function briefingLines(s,w,sz){X.font=`bold ${sz}px system-ui,sans-serif`;let line='';const lines=[];for(const word of String(s||'').split(' ')){const next=line?line+' '+word:word;if(line&&X.measureText(next).width>w){lines.push(line);line=word}else line=next}lines.push(line);return lines}
function wrapT(s,x,y,w,sz,c,lh,rows=null){const lines=rows||briefingLines(s,w,sz);lines.forEach((line,i)=>tx(line,x,y+i*lh,sz,c));return y+lines.length*lh}

function cmpHud(){const sc=CAMP[cmp.i];if(!sc)return;const pending=sc.goals.filter(q=>!cmp.d[q.id]),g=pending.slice(0,5),more=pending.length-g.length;if(!g.length)return;const y=typeof hudTopLayout==='function'?hudTopLayout(CW).height+8:60;X.fillStyle='rgba(0,0,0,.55)';X.fillRect(10,y,Math.min(420,CW-20),30+(g.length+(more?1:0))*26);tx('Mission '+(cmp.i+1)+': '+sc.t,20,y+20,17,'#f2c14e');g.forEach((q,i)=>tx('- '+q.t,24,y+44+i*26,16,'#fff'));if(more)tx('+'+more+' more — View for all objectives',24,y+44+g.length*26,15,'#f2c14e')}

function cmpObj(){const sc=CAMP[cmp.i];if(!sc)return;const gap=sc.goals.length>1?Math.max(20,Math.min(34,(CH-145-440)/(sc.goals.length-1))):34;tx('Mission '+(cmp.i+1)+': '+sc.t,CW/2-400,400,22,'#f2c14e');sc.goals.forEach((g,i)=>tx((cmp.d[g.id]?'[x] ':'[  ] ')+g.t,CW/2-400,440+i*gap,21,cmp.d[g.id]?'#9ae6b4':'#fff'))}

function drawCamp(){briefScrollMission=-1;titleBg();drawList('CAMPAIGNS & MISSIONS',campItems(),ci,'D-pad Up/Down: choose    Left/Right: campaign    A: briefing    B: back')}

function drawBrief(){
 const sc=CAMP[bi];if(!sc)return;
 if(briefScrollMission!==bi){briefScroll=0;briefScrollMission=bi}
 titleBg();X.fillStyle='rgba(0,0,0,.6)';X.fillRect(0,0,CW,CH);
 const w=Math.min(900,CW-60),x=(CW-w)/2,titleY=Math.min(100,Math.max(72,CH*.13)),clipTop=Math.max(112,titleY+34),clipBottom=Math.max(clipTop+20,CH-118);
 panel(x,40,w,CH-80);tx('MISSION '+(bi+1)+': '+sc.t.toUpperCase(),CW/2,titleY,Math.min(34,Math.max(24,CH*.047)),'#f2c14e','center');
 const story=briefingLines(sc.b,w-60,20),storyY=clipTop+24,storyEnd=storyY+story.length*28,metaY=storyEnd+6,headingY=storyEnd+48,goalsY=headingY+34;
 const lastY=goalsY+Math.max(0,sc.goals.length-1)*30;
 briefScrollMax=Math.max(0,lastY-(clipBottom-18));briefScroll=Math.max(0,Math.min(briefScroll,briefScrollMax));
 X.save();X.beginPath();X.rect(x+18,clipTop,w-36,clipBottom-clipTop);X.clip();
 wrapT(sc.b,x+30,storyY-briefScroll,w-60,20,'#e2e8f0',28,story);
 tx('You: '+CIV[sc.civ].n+'    Enemy: '+CIV[sc.en].n+'    Difficulty: '+difficultyName(sc.diff),x+30,metaY-briefScroll,19,'#cbd5e1');
 tx('OBJECTIVES',x+30,headingY-briefScroll,22,'#fde68a');
 sc.goals.forEach((g,i)=>tx('- '+g.t,x+40,goalsY+i*30-briefScroll,20));
 X.restore();
 tx(briefScrollMax?'D-pad Up/Down: scroll    A: start mission    B: back':'A: start mission    B: back',CW/2,CH-62,20,'#9ae6b4','center');
}

/* Main title, new-game setup and options screen drawing. */
/* Cinematic main menu: original, deterministic valley artwork cached once.
 * The controller's existing nine action indices remain unchanged. */
const CK_TITLE_OPTIONS=Object.freeze([
 ['New Game','Found a kingdom and choose your own battlefield.'],
 ['Campaign','Follow the stories of kingdoms across nineteen missions.'],
 ['Continue','Return to a saved kingdom.'],
 ['Options','Adjust your game, graphics and audio settings.'],
 ['Controls','Learn the controller commands and shortcuts.'],
 ['About','Discover Crown & Kingdoms.'],
 ['Multiplayer','Gather allies or challenge rival kingdoms.'],
 ['Xbox FPS Test','Compare performance at 50, 100 or 200 units.'],
 ['Large Battle Test Save','Load the large-scale battlefield test.']
]);
let ckTitleScene=null;
let ckTitleMotionPreference=null;
function titleLayout(width,height,index){
 const edge=Math.max(12,Math.min(64,width*.045,height*.055));
 const wide=width>=height*1.28;
 const w=wide?Math.min(580,width*.47-edge):width-2*edge;
 const brandSize=Math.max(22,Math.min(60,w/6.6,height*.095));
 const top=edge+brandSize*1.82+38;
 const footer=height-edge-7,detailY=footer-52;
 const room=Math.max(22,detailY-top-15);
 const rh=Math.max(22,Math.min(46,Math.floor(room/9)));
 const visible=Math.min(9,Math.max(1,Math.floor(room/rh)));
 const selected=Math.max(0,Math.min(8,Number.isInteger(index)?index:0));
 const start=Math.max(0,Math.min(9-visible,selected-Math.floor(visible/2)));
 return {edge,wide,x:edge,w,brandSize,top,footer,detailY,rh,visible,start,selected};
}
function paintTitleValley(c){
 const W=960,H=540;
 const shape=(pts,color)=>{
  c.fillStyle=color;c.beginPath();c.moveTo(...pts[0]);
  for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);
  c.closePath();c.fill();
 };
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h)};
 const sky=c.createLinearGradient(0,0,0,H);
 [[0,'#081725'],[.33,'#304955'],[.61,'#9a8870'],[.78,'#5d655a'],[1,'#101c20']].forEach(([p,col])=>sky.addColorStop(p,col));
 c.fillStyle=sky;c.fillRect(0,0,W,H);
 const sun=c.createRadialGradient(725,162,3,725,162,186);
 sun.addColorStop(0,'rgba(255,221,157,.76)');sun.addColorStop(.24,'rgba(233,191,128,.24)');sun.addColorStop(1,'rgba(233,191,128,0)');
 c.fillStyle=sun;c.fillRect(0,0,W,H);
 // Fixed seed: no simulation RNG consumption, no changing pixels between frames.
 let seed=91731;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 for(let layer=0;layer<4;layer++){
  const horizon=240+layer*37,points=[[0,H],[0,horizon]];
  for(let i=0;i<=24;i++){
   const x=i*W/24,y=horizon-Math.sin(i*.53+layer)*28-rand()*(58-layer*9);
   points.push([x,y]);
  }
  points.push([W,H]);
  shape(points,['#596c70','#40575e','#30474c','#203639'][layer]);
 }
 // A winding river leads toward the fortified hill.
 shape([[424,540],[488,467],[610,418],[660,385],[714,347],[724,347],[694,384],[635,426],[557,481],[530,540]],'#526c6c');
 shape([[460,540],[507,472],[621,421],[670,385],[714,349],[719,349],[683,386],[637,426],[530,484],[493,540]],'#8b9790');
 shape([[0,540],[0,436],[170,398],[332,435],[448,449],[480,496],[452,540]],'#182a2c');
 shape([[960,540],[960,360],[833,334],[759,364],[700,412],[780,467],[868,540]],'#263a39');
 // A defensible stone ridge and medieval keep, silhouetted against dusk.
 shape([[559,390],[596,332],[650,310],[716,318],[777,309],[846,338],[900,390],[780,416],[649,420]],'#283a3a');
 const stone='#344342',shadow='#202d30',lit='#66706a';
 const tower=(x,y,w,h)=>{
  rect(x,y,w,h,stone);rect(x+w*.71,y,w*.29,h,shadow);
  rect(x-3,y-7,w+6,9,shadow);
  for(let i=0;i<4;i++)rect(x-3+i*(w+6)/4,y-15,(w+6)/7,9,shadow);
  rect(x+3,y+5,2,h-7,lit);
  for(let k=0;k<3;k++)rect(x+w*.4,y+14+k*20,4,10,'#d7aa66');
 };
 rect(606,300,214,51,stone);rect(606,343,214,10,shadow);
 for(let i=0;i<16;i++)rect(605+i*13.5,290,7,12,shadow);
 tower(596,264,29,86);tower(653,248,31,103);tower(780,253,31,98);tower(817,278,27,73);
 tower(707,215,43,136);
 shape([[700,215],[728,184],[757,215]],'#1a292e');
 rect(727,177,2,13,'#c6a876');shape([[729,177],[756,181],[729,190]],'#9d5945');
 for(const [x,y] of [[608,247],[794,235],[668,230]]){
  rect(x,y,2,20,'#c4a577');shape([[x+2,y],[x+23,y+4],[x+2,y+10]],'#895041');
 }
 rect(718,321,20,30,'#121e25');c.fillStyle='#121e25';c.beginPath();c.arc(728,321,10,Math.PI,0);c.fill();
 // Distant pines and dark foreground forest frame the landscape.
 for(let i=0;i<145;i++){
  const x=rand()*W,y=355+rand()*185;
  if(x>560&&x<885&&y<423)continue;
  if(x>425&&x<695&&y>411&&x<660-(y-411)*.95)continue;
  const h=9+(y-355)*.12+rand()*16,tw=h*.28,col=y>465?'#102323':'#203638';
  rect(x-1,y-h*.25,2,h*.28,col);
  for(let j=0;j<3;j++){const q=y-h+j*h*.23;shape([[x,q],[x-tw*(.62+j*.2),q+h*.65],[x+tw*(.62+j*.2),q+h*.65]],col)}
 }
 const ground=c.createLinearGradient(0,425,0,H);
 ground.addColorStop(0,'rgba(6,15,20,0)');ground.addColorStop(1,'rgba(6,15,20,.88)');
 c.fillStyle=ground;c.fillRect(0,425,W,H-425);
}
function titleScene(){
 if(!ckTitleScene&&typeof document!=='undefined'&&typeof document.createElement==='function'){
  const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;
  const context=canvas.getContext('2d');
  if(context&&context!==X){paintTitleValley(context);ckTitleScene=canvas}
 }
 if(ckTitleScene){
  const scale=Math.max(CW/960,CH/540),w=960*scale,h=540*scale;
  // Preserve the landscape's aspect ratio, including compact portrait displays.
  const dx=Math.min(0,Math.max(CW-w,CW*.68-w*.75));
  X.drawImage(ckTitleScene,dx,(CH-h)/2,w,h);
 }
 else{X.save();X.scale(CW/960,CH/540);paintTitleValley(X);X.restore()}
 if(ckTitleMotionPreference===null)ckTitleMotionPreference=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):false;
 const phase=ckTitleMotionPreference&&ckTitleMotionPreference.matches?0:Math.sin(performance.now()/13000);
 const mistY=CH*(.66+phase*.017),mist=X.createLinearGradient(0,mistY-CH*.07,0,mistY+CH*.07);
 mist.addColorStop(0,'rgba(164,190,184,0)');mist.addColorStop(.5,'rgba(164,190,184,.10)');mist.addColorStop(1,'rgba(164,190,184,0)');
 X.fillStyle=mist;X.fillRect(0,mistY-CH*.07,CW,CH*.14);
}
function titleOptionLabel(index,hasSave,load){
 return CK_TITLE_OPTIONS[index][0]+(index===2&&!hasSave?'  ·  NO SAVE':index===7?' · '+load+' units':'');
}
function titleCrest(x,y,size){
 // Original crowned shield, drawn with seven compact paths; no asset requests.
 const p=(pts,col)=>{
  X.fillStyle=col;X.beginPath();X.moveTo(x+pts[0][0]*size,y+pts[0][1]*size);
  for(let i=1;i<pts.length;i++)X.lineTo(x+pts[i][0]*size,y+pts[i][1]*size);
  X.closePath();X.fill();
 };
 p([[-.48,-.40],[.48,-.40],[.41,.17],[.25,.39],[0,.55],[-.25,.39],[-.41,.17]],'#c8a66b');
 p([[-.40,-.32],[.40,-.32],[.34,.14],[.20,.32],[0,.46],[-.20,.32],[-.34,.14]],'#152b35');
 p([[-.30,-.15],[-.19,.02],[0,-.21],[.19,.02],[.30,-.15],[.23,.15],[-.23,.15]],'#f5d27b');
 p([[-.23,.20],[.23,.20],[.20,.26],[-.20,.26]],'#c8a66b');
 p([[-.04,-.46],[0,-.51],[.04,-.46],[0,-.41]],'#f5d27b');
}
function drawTitle(){
 titleScene();
 const l=titleLayout(CW,CH,ti),{x,w,edge,brandSize,top,footer,detailY,rh,visible,start,selected}=l;
 const shade=X.createLinearGradient(0,0,CW,0);
 shade.addColorStop(0,'rgba(5,12,19,.97)');shade.addColorStop(l.wide?.43:.76,'rgba(5,12,19,.85)');shade.addColorStop(1,l.wide?'rgba(5,12,19,.04)':'rgba(5,12,19,.72)');
 X.fillStyle=shade;X.fillRect(0,0,CW,CH);
 // A stable, readable wordmark; no blocking splash screen or intro delay.
 X.save();X.textAlign='left';X.fillStyle='#f5d27b';X.font='bold '+brandSize+'px Georgia, serif';
 X.fillText('CROWN &',x,edge+brandSize*.82);X.fillText('KINGDOMS',x,edge+brandSize*1.66);X.restore();
 tx(menuFit('BUILD YOUR REALM. CLAIM THE CROWN.',w,12),x,top-16,12,'#cbb68d');
 X.fillStyle='rgba(219,184,114,.40)';X.fillRect(x,top-8,w,1);
 for(let row=0;row<visible;row++){
  const i=start+row,yy=top+row*rh,active=i===selected,disabled=i===2&&!hs;
  const name=titleOptionLabel(i,hs,selectedXboxPerformanceLoad);
  if(active){
   const band=X.createLinearGradient(x,yy,x+w,yy);
   band.addColorStop(0,'#705430');band.addColorStop(1,'rgba(48,60,62,.92)');
   X.fillStyle=band;X.fillRect(x,yy,w,rh-3);X.strokeStyle='#f5d27b';X.lineWidth=1;
   X.strokeRect(x+.5,yy+.5,w-1,rh-4);X.fillStyle='#f5d27b';X.fillRect(x+4,yy+4,3,rh-11);
  }else{X.fillStyle='rgba(8,16,22,.47)';X.fillRect(x,yy,w,rh-3)}
  const size=Math.max(13,Math.min(23,rh*.49|0));
  tx(menuFit(name,w-42,size),x+17,yy+rh*.67,size,disabled?'#a3abb0':active?'#fff0cb':i>=7?'#b7c2c5':'#edf2f5');
  if(active)tx('›',x+w-17,yy+rh*.67,size+3,'#f5d27b','center');
 }
 const description=selected===2&&!hs?'No saved game found. Start a new kingdom first.':CK_TITLE_OPTIONS[selected][1];
 tx(menuFit(description,w,13),x,detailY,13,'#d2dddf');
 if(visible<9)tx((selected+1)+' / 9'+(start?'  ▲':'')+(start+visible<9?'  ▼':''),x+w,detailY+17,12,'#b9c5cb','right');
 X.fillStyle='rgba(5,12,19,.90)';X.fillRect(0,footer-26,CW,CH-footer+26);
 X.fillStyle='rgba(219,184,114,.32)';X.fillRect(edge,footer-26,CW-2*edge,1);
 const hint=selected===7?'D-PAD UP / DOWN  NAVIGATE   •   LEFT / RIGHT  UNITS   •   A  LOAD':'D-PAD  NAVIGATE    •    A  SELECT';
 const hintSize=Math.max(11,Math.min(16,CW/65));
 tx(menuFit(hint,CW-2*edge,hintSize),edge,footer-7,hintSize,'#f5d27b');
 const status=pad?'CONTROLLER CONNECTED':gpErr?'CONTROLLER ACCESS BLOCKED — OPEN AS A FULL PAGE':'CONNECT A CONTROLLER — PRESS ANY GAMEPAD BUTTON';
 tx(menuFit(status,CW-2*edge,12),edge,footer+11,12,pad?'#9ae6b4':'#e7b9a7');
 if(l.wide){
  const right=CW-edge,crestSize=Math.min(70,Math.max(36,CH*.075));
  titleCrest(right-crestSize*.5,edge+crestSize*.55,crestSize);
  tx('A KINGDOM AWAITS',right-crestSize-13,edge+crestSize*.43,12,'#ead4a5','right');
  tx('REAL-TIME STRATEGY',right-crestSize-13,edge+crestSize*.72,12,'#c6d2d3','right');
 }
}
function drawSetup(){titleBg();drawList('NEW GAME',setRows(),si,'D-pad Up/Down: choose    Left/Right: change    A: select    B: back')}
function drawOpts(){titleBg();drawList('OPTIONS',optsItems(),oi,'D-pad Up/Down: choose    Left/Right: change    A: select    B: back')}

