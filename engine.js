
'use strict';
const cv=document.getElementById('c'),X=cv.getContext('2d');let CW=0,CH=0,DPR=1,gq=1,ui=1,br=1,mm={x:0,y:0,w:216};
const rs=()=>{DPR=Math.min(window.devicePixelRatio||1,[1,1.25,1.5][gq]);CW=innerWidth/ui|0;CH=innerHeight/ui|0;cv.width=Math.round(CW*DPR);cv.height=Math.round(CH*DPR);cv.style.width=innerWidth+'px';cv.style.height=innerHeight+'px';cv.style.filter='brightness('+br+')';const m=Math.max(140,Math.min(300,CH*.45|0,CW*.3|0));mm={x:CW-m-14,y:CH-(m>>1)-14,w:m,h:m>>1}};let resizeTimer=0;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(rs,80)});rs();
/* ===== GAME STATE / MAP ===== */
/* ===== GENERATED MAP CONNECTIVITY AUDIT =====
   Terrain semantics: wt=0 land, wt=1 navigable water, wt=2 shallow ford.
   Buildings/resources are intentionally excluded: this audits the generated terrain
   before placement, not temporary gameplay obstructions. */
/* ===== GENERATED MAP CONNECTIVITY AUDIT =====
   Terrain semantics: wt=0 land, wt=1 navigable water, wt=2 shallow ford.
   Buildings/resources are intentionally excluded: this audits generated terrain
   before placement, not temporary gameplay obstructions. */

/* World construction is owned by js/mapgen.js. */
const w2s=(x,y)=>[(x-y)*TW/2-cam.x,(x+y)*TH/2-cam.y];
const s2w=(sx,sy)=>{const u=(sx+cam.x)/(TW/2),v=(sy+cam.y)/(TH/2);return[(u+v)/2,(v-u)/2]};
function clampCam(){const[x,y]=s2w(CW/2,CH/2),cx=cl(x,1,W-1),cy=cl(y,1,H-1);cam.x=(cx-cy)*TW/2-CW/2;cam.y=(cx+cy)*TH/2-CH/2}
const ctr=(x,y)=>{cam.x=(x-y)*TW/2-CW/2;cam.y=(x+y)*TH/2-CH/2;clampCam()};
function start(){newGame();if(!cmp&&gameMode===1){for(let t=0;t<S.teamN;t++){S.res[t]={f:2000,w:2000,g:2000,s:2000};S.age[t]=3;grp(t,'knight',6);grp(t,'arc',8);grp(t,'ram',2)}}else if(!cmp&&gameMode===2){for(let t=0;t<S.teamN;t++){S.res[t]={f:500,w:500,g:500,s:500};grp(t,'vil',5)}}if(!cmp&&startArmy>0){for(let t=0;t<S.teamN;t++){if(startArmy===1)grp(t,'scout',2);else if(startArmy===2){grp(t,'mil',3);grp(t,'arc',2)}else if(startArmy===3){grp(t,'mil',4);grp(t,'arc',4);grp(t,'ram',1)}}}if(vm===3)for(let t=0;t<S.teamN;t++){const tc=S.bs.find(b=>b.t===t&&b.k==='tc'),p=spawnPos(tc);if(p)addU(t,'king',p[0],p[1])}mode='play';menu=place=null;fx=[];corp=[];rub=[];notes=[];idleI=0;queueWarm();PT.length=0;note('Left stick moves the cursor, A selects, hold RT for the command menu, D-pad quick-selects');note('You lead the '+CIV[S.civ[0]].n+(S.teamN>2?' against '+(S.teamN-1)+' rival kingdoms':' vs the '+CIV[S.civ[1]].n)+': '+CIV[S.civ[0]].d);if(vm===6)note('Sudden Death: protect your starting Town Centre; losing it eliminates your kingdom and extra Town Centres are disabled')}
const capOf=t=>Math.min(popLimit,10+5*S.bs.filter(b=>b.t===t&&b.k==='house'&&b.done).length);
const popOf=t=>S.us.filter(u=>u.t===t).length+S.bs.reduce((a,b)=>a+(b.t===t?b.q.length:0),0);
const can=(t,c)=>Object.keys(c).every(k=>S.res[t][k]>=c[k]),pay=(t,c,m=-1)=>{for(const k in c)S.res[t][k]+=m*c[k]};
const cs=c=>Object.entries(c).map(([k,v])=>v+k.toUpperCase()).join(' ')||'free';
const vis=e=>e.t===0||S.vs[(e.y|0)*W+(e.x|0)];
const hpbF=(t,k,v)=>{const T0=S.tech[t];T0.hpb=T0.hpb||{};T0.hpb[k]=(T0.hpb[k]||0)+v},atkbF=(t,k,v)=>{const T0=S.tech[t];T0.atkb=T0.atkb||{};T0.atkb[k]=(T0.atkb[k]||0)+v};
const CIV0=[{n:'Franks',uu:'axe',d:'Knights +15 HP; Throwing Axemen',fx:t=>hpbF(t,'knight',15)},{n:'Britons',uu:'lbow',d:'Archers +1 attack; Longbowmen',fx:t=>{atkbF(t,'arc',1);atkbF(t,'xbow',1);atkbF(t,'hcan',1)}},{n:'Mongols',uu:'mgd',d:'Scouts +30 HP, faster hunting; Mangudai',fx:t=>{hpbF(t,'scout',30);S.tech[t].hunt=1}},{n:'Byzantines',uu:'cata',d:'Buildings +15% HP; Cataphracts',fx:t=>{S.tech[t].bz=1}},{n:'Persians',uu:'ele',d:'Start +150 food and wood; War Elephants',fx:t=>{S.res[t].f+=150;S.res[t].w+=150}},{n:'Teutons',uu:'tk',d:'Infantry +1 armour; Teutonic Knights',fx:t=>{S.tech[t].armI=1}}];
const CIV=[{n:'Franks',uu:'axe',d:'Knights +15 HP; Throwing Axemen',fx:t=>hpbF(t,'knight',15),ut:{k:'ut0',n:'Chivalry',cost:{f:300,g:200},t:50,age:2,fx:t=>atkbF(t,'knight',2)}},
{n:'Britons',uu:'lbow',d:'Archers +1 attack; Longbowmen',fx:t=>{atkbF(t,'arc',1);atkbF(t,'xbow',1);atkbF(t,'hcan',1)},ut:{k:'ut1',n:'Yeomen',cost:{f:250,w:200},t:50,age:2,fx:t=>{atkbF(t,'arc',2);atkbF(t,'lbow',2);atkbF(t,'xbow',2)}}},
{n:'Mongols',uu:'mgd',d:'Scouts +30 HP, faster hunting; Mangudai',fx:t=>{hpbF(t,'scout',30);S.tech[t].hunt=1},ut:{k:'ut2',n:'Nomads',cost:{f:250,g:200},t:50,age:2,fx:t=>{hpbF(t,'mgd',30);atkbF(t,'mgd',2)}}},
{n:'Byzantines',uu:'cata',d:'Buildings +15% HP; Cataphracts',fx:t=>{S.tech[t].bz=1},ut:{k:'ut3',n:'Greek Fire',cost:{f:300,g:250},t:50,age:2,fx:t=>{S.tech[t].gf=1}}},
{n:'Persians',uu:'ele',d:'Start +150 food and wood; War Elephants',fx:t=>{S.res[t].f+=150;S.res[t].w+=150},ut:{k:'ut4',n:'Mahouts',cost:{f:300,g:250},t:50,age:2,fx:t=>{hpbF(t,'ele',40);hpbF(t,'eled',30)}}},
{n:'Teutons',uu:'tk',d:'Infantry +1 armour; Teutonic Knights',fx:t=>{S.tech[t].armI=1},ut:{k:'ut5',n:'Crenellations',cost:{f:250,w:250},t:50,age:2,fx:t=>hpbF(t,'tk',30)}},
{n:'Celts',uu:'woad',d:'Siege +30 HP, faster woodcutting; Woad Raiders',fx:t=>{for(const k of['ram','mang','scor','treb','bomb'])hpbF(t,k,30);S.tech[t].wd=1},ut:{k:'ut6',n:'Furor Celtica',cost:{f:300,g:200},t:50,age:2,fx:t=>{for(const k of['ram','mang','scor','treb','bomb'])hpbF(t,k,60)}}},
{n:'Vikings',uu:'bers',d:'Infantry +10 HP; Berserks',fx:t=>{hpbF(t,'mil',10);hpbF(t,'spear',10);hpbF(t,'bers',10)},ut:{k:'ut7',n:'Chieftains',cost:{f:250,g:150},t:50,age:2,fx:t=>{atkbF(t,'mil',2);atkbF(t,'spear',2);atkbF(t,'bers',3)}}},
{n:'Saracens',uu:'mamel',d:'Camels +20 HP, +100 gold; Mamelukes',fx:t=>{hpbF(t,'camel',20);S.res[t].g+=100},ut:{k:'ut8',n:'Zealotry',cost:{f:300,g:250},t:50,age:2,fx:t=>{hpbF(t,'camel',20);hpbF(t,'mamel',20)}}},
{n:'Turks',uu:'jan',d:'Gunpowder units +HP; Janissaries',fx:t=>{hpbF(t,'hcan',9);hpbF(t,'bomb',20);hpbF(t,'jan',11)},ut:{k:'ut9',n:'Sipahi',cost:{f:300,g:250},t:50,age:2,fx:t=>{atkbF(t,'hcan',4);atkbF(t,'jan',4);atkbF(t,'bomb',4)}}},
{n:'Chinese',uu:'chuko',d:'Start +200 food; Chu Ko Nu',fx:t=>{S.res[t].f+=200},ut:{k:'ut10',n:'Great Wall',cost:{f:300,w:300,s:200},t:60,age:2,fx:t=>{S.tech[t].fw=1;for(const x of S.bs)if(x.t===t&&(x.k==='wall'||x.k==='gate'||x.k==='tower')){x.mh=Math.round(x.mh*1.5);x.hp=Math.round(x.hp*1.5)}}}},
{n:'Japanese',uu:'saml',d:'Infantry +1 attack; Samurai',fx:t=>{atkbF(t,'mil',1);atkbF(t,'spear',1);atkbF(t,'saml',1)},ut:{k:'ut11',n:'Yasama',cost:{f:300,w:200,g:150},t:50,age:2,fx:t=>{S.tech[t].ys=1}}},
{n:'Khmer',uu:'ele',d:'Elephants +30 HP; Battle Elephants',fx:t=>hpbF(t,'ele',30),ut:{k:'ut12',n:'Tusk Swords',cost:{f:300,g:200},t:50,age:2,fx:t=>atkbF(t,'ele',3)}},
{n:'Indians',uu:'eled',d:'Villagers +10 HP, +100 food; Elephant Archers',fx:t=>{hpbF(t,'vil',10);S.res[t].f+=100},ut:{k:'ut13',n:'Shatagni',cost:{f:300,g:250},t:50,age:2,fx:t=>{atkbF(t,'hcan',3);atkbF(t,'eled',2)}}},
{n:'Spanish',uu:'conq',d:'Miners +15%, +100 gold; Conquistadors',fx:t=>{S.tech[t].mn=1;S.res[t].g+=100},ut:{k:'ut14',n:'Supremacy',cost:{f:300,g:250},t:50,age:2,fx:t=>{atkbF(t,'conq',3);hpbF(t,'conq',15)}}},
{n:'Italians',uu:'genoa',d:'Archers +10 HP, farms +15%; Genoese Crossbowmen',fx:t=>{hpbF(t,'arc',10);hpbF(t,'xbow',10);S.tech[t].fa=1},ut:{k:'ut15',n:'Pavise',cost:{f:250,g:200},t:50,age:2,fx:t=>{atkbF(t,'genoa',2);hpbF(t,'genoa',15)}}},
{n:'Slavs',uu:'boyar',d:'Farms +15%, +100 wood; Boyars',fx:t=>{S.tech[t].fa=1;S.res[t].w+=100},ut:{k:'ut16',n:'Detinets',cost:{f:300,g:250},t:50,age:2,fx:t=>{hpbF(t,'boyar',40);hpbF(t,'knight',10)}}},
{n:'Huns',uu:'tarkan',d:'Cavalry +10 HP, +100 food; Tarkans',fx:t=>{hpbF(t,'scout',10);hpbF(t,'knight',10);hpbF(t,'camel',10);S.res[t].f+=100},ut:{k:'ut17',n:'Marauders',cost:{f:250,g:200},t:50,age:2,fx:t=>{atkbF(t,'tarkan',3);hpbF(t,'tarkan',20)}}},
{n:'Goths',uu:'huskarl',d:'Infantry +15 HP, +100 food; Huskarls',fx:t=>{hpbF(t,'mil',15);hpbF(t,'spear',15);hpbF(t,'huskarl',15);S.res[t].f+=100},ut:{k:'ut18',n:'Anarchy',cost:{f:250,g:150},t:50,age:2,fx:t=>{hpbF(t,'huskarl',20);atkbF(t,'huskarl',2)}}},
{n:'Aztecs',uu:'jaguar',d:'Villagers carry more, +100 gold; Jaguar Warriors',fx:t=>{S.tech[t].carry=1;S.res[t].g+=100},ut:{k:'ut19',n:'Garland Wars',cost:{f:300,g:200},t:50,age:2,fx:t=>{atkbF(t,'jaguar',3);hpbF(t,'jaguar',15)}}},
{n:'Mayans',uu:'plumed',d:'Archers +15 HP, faster hunting; Plumed Archers',fx:t=>{hpbF(t,'arc',15);hpbF(t,'xbow',10);S.tech[t].hunt=1},ut:{k:'ut20',n:'Hulche Javelins',cost:{f:250,w:200},t:50,age:2,fx:t=>{atkbF(t,'plumed',2);atkbF(t,'skirm',2)}}},
{n:'Incas',uu:'kamayuk',d:'Miners +15%, spearmen +1 attack; Kamayuks',fx:t=>{S.tech[t].mn=1;atkbF(t,'spear',1)},ut:{k:'ut21',n:'Andean Sling',cost:{f:250,g:200},t:50,age:2,fx:t=>{atkbF(t,'kamayuk',3);hpbF(t,'kamayuk',15)}}},
{n:'Ethiopians',uu:'shotel',d:'Start +100 food and gold; Shotel Warriors',fx:t=>{S.res[t].f+=100;S.res[t].g+=100},ut:{k:'ut22',n:'Royal Heirs',cost:{f:300,g:200},t:50,age:2,fx:t=>{atkbF(t,'shotel',3);hpbF(t,'shotel',10)}}},
{n:'Malians',uu:'gbeto',d:'Infantry +1 attack, farms +15%; Gbeto',fx:t=>{atkbF(t,'mil',1);atkbF(t,'spear',1);S.tech[t].fa=1},ut:{k:'ut23',n:'Tigui',cost:{f:250,g:200},t:50,age:2,fx:t=>{atkbF(t,'gbeto',2);hpbF(t,'gbeto',10)}}},
{n:'Koreans',uu:'wagon',d:'Walls and gates +80% HP, siege +20 HP; War Wagons',fx:t=>{S.tech[t].fw=1;hpbF(t,'mang',20);hpbF(t,'ram',20)},ut:{k:'ut24',n:'Shinkichon',cost:{f:300,g:250},t:50,age:2,fx:t=>{atkbF(t,'wagon',3);hpbF(t,'wagon',30)}}},
{n:'Magyars',uu:'huszar',d:'Cavalry +1 attack, +100 wood; Magyar Huszars',fx:t=>{atkbF(t,'scout',1);atkbF(t,'knight',1);S.res[t].w+=100},ut:{k:'ut25',n:'Corvinian Army',cost:{f:300,g:200},t:50,age:2,fx:t=>{atkbF(t,'huszar',2);hpbF(t,'huszar',20)}}}];
CIV.forEach(c=>{TE[c.ut.k]=c.ut});
const rsOf=b=>{let l=B[b.k].rs||[];if(b.k==='castle'&&S.civ)l=l.concat([CIV[S.civ[b.t]].ut.k]);return l};
const PERS=[{v:1,g:1,n:1,r:1,tw:2,wl:56},{v:.85,g:.7,n:.8,r:.8,tw:2,wl:20,cv:1},{v:1,g:1.3,n:1.1,r:1.2,tw:4,wl:80,rg:1},{v:1.3,g:1.5,n:1.2,r:1.4,tw:2,wl:56},{v:.8,g:.45,n:.55,r:1,tw:1,wl:0},{v:1.1,g:1.8,n:1.4,r:1.6,tw:6,wl:110,rg:1},{v:1,g:1.1,n:.9,r:.35,tw:2,wl:12,cv:1}];
const AIPN=['Balanced','Aggressive','Defensive','Economic','Rush','Turtle','Raider'],AIPD=['Even mix of economy and army.','Attacks earlier, favours melee and cavalry.','Builds towers and walls; strong defenders.','Big economy; attacks late with large armies.','Early small attack on a thin economy.','Heavy walls and towers; a very late, big attack.','Frequent cavalry and archer raids.'];
const CATU={scout:'cav',knight:'cav',camel:'cav',mgd:'cav',cata:'cav',mamel:'cav',ele:'cav',eled:'cav',arc:'rng',xbow:'rng',lbow:'rng',skirm:'rng',hcan:'rng',jan:'rng',chuko:'rng',axe:'rng',boyar:'cav',tarkan:'cav',huszar:'cav',wagon:'cav',conq:'rng',genoa:'rng',plumed:'rng',gbeto:'rng',ram:'sg',mang:'sg',scor:'sg',treb:'sg',bomb:'sg'},PW=[{},{cav:1.6,inf:1.4,rng:.8},{rng:1.5,inf:1.2,cav:.6,sg:.7},{sg:1.2},{inf:1.8,cav:1,rng:.6,sg:.3},{rng:1.6,cav:.5,sg:.8},{cav:2.2,rng:1.2,inf:.5,sg:.6}];
function pickW(o){const w=o.map(k=>PW[aip][CATU[k]||'inf']||1),t=w.reduce((a,b)=>a+b,0);let r=S.r()*t;for(let i=0;i<o.length;i++){r-=w[i];if(r<=0)return o[i]}return o[o.length-1]}
const trOf=b=>{let l=B[b.k].tr||[];if(b.k==='castle'&&S.civ)l=l.concat([CIV[S.civ[b.t]].uu]);return l};
const rumbleOK=()=>!!(pad&&pad.vibrationActuator&&pad.vibrationActuator.playEffect);let lastRb=0;
function rumble(d,a,b){if(!rmb||!rumbleOK())return;const n=performance.now();if(n-lastRb<150)return;lastRb=n;try{const p=pad.vibrationActuator.playEffect('dual-rumble',{startDelay:0,duration:d,weakMagnitude:b,strongMagnitude:a});if(p&&p.catch)p.catch(()=>{})}catch(e){}}
function setQ(v){gq=v;rs();sset()}
function autoPause(){if(mode==='play'){mode='pause';pm=0}}
function compactPositive(a,k){let w=0;for(let i=0;i<a.length;i++){const v=a[i];if(v[k]>0)a[w++]=v}a.length=w}
function compactNotFlag(a,k){let w=0;for(let i=0;i<a.length;i++){const v=a[i];if(!v[k])a[w++]=v}a.length=w}

/* ===== CONTROLLER INPUT ===== */
const GAR={tc:15,castle:20,tower:5},MT=[{n:'Arabia',l:1,f:1,m:1},{n:'Black Forest',l:.4,f:3,m:.8},{n:'Lakes',l:3,f:.7,m:1},{n:'Open Plains',l:.3,f:.25,m:1.5},{n:'Desert Oasis',l:.5,f:.3,m:1.2,pal:1},{n:'Frozen North',l:1.3,f:1.2,m:1,pal:2},{n:'Coastal',l:.3,f:.6,m:1.2,cs:1},{n:'Mediterranean',l:.2,f:.7,m:1.2,rv:0,sea:1},{n:'Gold Rush',l:.4,f:.5,m:2.6,gd:1,rv:0},{n:'Highland Pass',l:.3,f:.6,m:1.6,rg:1,rv:0,pal:3},{n:'Scattered Lakes',l:.2,f:.7,m:1.5,arch:1,rv:0},{n:'Twin Lakes',l:.6,f:.8,m:1.1,lake:1,rv:0}];
const MA={mil:1,spear:1,knight:2,gal:1,cata:2,ele:3,tk:5,saml:1,eled:2,bers:0,fish:1,trn:2},PRA={mil:1,scout:2,knight:2,skirm:3,ram:50,gal:3,trn:2,camel:0,cata:3,ele:2,tk:2,saml:1,eled:2,fish:2};
/* Blacksmith armour applies by unit class, including unique units; keep these sets explicit because the roster is data-driven. */
const INFARM=new Set(['mil','spear','tk','woad','bers','saml','huskarl','jaguar','kamayuk','shotel','axe','gbeto']);
const ARCHARM=new Set(['arc','xbow','lbow','skirm','genoa','plumed','chuko','jan','hcan','conq','wagon','eled','mgd']);
const CAVARM=new Set(['scout','knight','camel','mamel','cata','ele','mgd','eled','conq','boyar','tarkan']);
Object.assign(U,{conq:{n:'Conquistador',hp:55,sp:1.3,dmg:16,rng:5.5,cd:3.2,arm:0,cost:{f:60,g:70},t:18,c:'#8a3a2a',r:8,age:2},genoa:{n:'Genoese Crossbowman',hp:45,sp:1.4,dmg:6,rng:5.5,cd:1.6,arm:0,cost:{w:45,g:35},t:15,c:'#3a6a9a',r:8,age:2,bn:{knight:4,scout:4}},boyar:{n:'Boyar',hp:130,sp:1.7,dmg:9,rng:.9,cd:1.8,arm:0,cost:{f:70,g:60},t:18,c:'#a05a2a',r:11,age:2,mt:1,lk:'knight'},tarkan:{n:'Tarkan',hp:110,sp:1.8,dmg:10,rng:.9,cd:1.7,arm:0,cost:{f:60,g:50},t:16,c:'#7a4a2a',r:11,age:2,mt:1,lk:'scout'},huskarl:{n:'Huskarl',hp:60,sp:1.4,dmg:10,rng:.9,cd:1.5,arm:0,cost:{f:50,g:30},t:14,c:'#5a5a6a',r:9,age:2},jaguar:{n:'Jaguar Warrior',hp:60,sp:1.5,dmg:10,rng:.9,cd:1.4,arm:0,cost:{f:60,g:30},t:15,c:'#b08a2a',r:9,age:2,bn:{mil:6,spear:6,axe:6}},plumed:{n:'Plumed Archer',hp:50,sp:1.6,dmg:5,rng:5.5,cd:1.5,arm:0,cost:{f:55,w:40},t:15,c:'#2a8a6a',r:8,age:2},kamayuk:{n:'Kamayuk',hp:65,sp:1.3,dmg:7,rng:.9,cd:1.6,arm:0,cost:{f:55,w:40},t:15,c:'#a0603a',r:9,age:2,bn:{knight:10,scout:10,camel:10,cata:8}},shotel:{n:'Shotel Warrior',hp:45,sp:2,dmg:12,rng:.9,cd:1.6,arm:0,cost:{f:50,g:30},t:13,c:'#3a8a3a',r:9,age:2},gbeto:{n:'Gbeto',hp:40,sp:1.8,dmg:4,rng:5,cd:1.5,arm:0,cost:{f:40,g:30},t:11,c:'#8a6a2a',r:8,age:2,bn:{arc:3,xbow:3}},wagon:{n:'War Wagon',hp:150,sp:1.5,dmg:5,rng:5.5,cd:1.2,arm:0,cost:{w:90,g:60},t:20,c:'#8a7a4a',r:11,age:2,mt:1,lk:'mgd'},huszar:{n:'Magyar Huszar',hp:85,sp:2,dmg:7,rng:.9,cd:1.7,arm:0,cost:{f:60,g:30},t:14,c:'#a0302a',r:10,age:2,mt:1,lk:'scout'}});
Object.assign(MA,{boyar:3,tarkan:2,huskarl:1,kamayuk:1,huszar:1,wagon:1});Object.assign(PRA,{boyar:3,tarkan:2,huskarl:6,kamayuk:2,huszar:2,wagon:3,jaguar:1,gbeto:1});
function setZoom(z){const c=S?s2w(CW/2,CH/2):null;zm=z;TW=64*z;TH=32*z;if(c)ctr(c[0],c[1])}
function emit(k,x,y,n,o){const cap=PMAX[gq];o=o||{};for(let i=0;i<n;i++){if(PT.length>=cap)return;PT.push({k,x,y,z:0,vx:(Math.random()-.5)*(o.s||1),vy:(Math.random()-.5)*(o.s||1),vz:(o.vz||0)*(.6+Math.random()*.8),l:o.l||.6,t:0,c:o.c||'#ccc',r:o.r||2})}}
function updP(dt){for(let i=PT.length-1;i>=0;i--){const p=PT[i];p.t+=dt;if(p.t>=p.l){PT[i]=PT[PT.length-1];PT.pop();continue}p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.k==='deb'||p.k==='spark')p.vz-=9*dt}}
let WQ=[];
function queueWarm(){WQ=[];const uu=new Set(CIV.map(c=>c.uu)),mine=new Set((S.civ||[0,1]).map(c=>CIV[c].uu));for(const k in U){if(k==='tw'||k==='cs'||k==='tca')continue;if(uu.has(k)&&!mine.has(k))continue;for(const t of[0,1,2,3]){WQ.push([k,t,0,0]);for(let f=0;f<4;f++)WQ.push([k,t,1,f])}}WQ.reverse()}
function warm(){if(!WQ.length)return;const t0=performance.now();while(WQ.length&&performance.now()-t0<3){const q=WQ.pop(),k=q[0],sz=USZ(k);spr(k+'|'+q[1]+'|'+q[2]+'|'+q[3],sz[0],sz[1],g=>paintUnit(g,k,teamColor(q[1]),q[2],q[3]))}}

const sv=()=>{try{localStorage.setItem('ck_map',JSON.stringify(BM))}catch(e){}};
const skey=n=>n?'ck_save'+(n+1):'ck_save';let slot=0,sm='load',sb='title',SI=[];
function refreshSlots(){SI=[0,1,2].map(n=>{let r=null;try{r=localStorage.getItem(skey(n))}catch(e){}if(!r)return null;try{const j=JSON.parse(r);if(j.v!==1||!Array.isArray(j.us)||!Array.isArray(j.civ))return'bad';return{t:j.t|0,civ:j.civ,w:j.sz,d:j.diff|0,m:j.cmp&&CAMP[j.cmp.i]?CAMP[j.cmp.i].t:null,when:j.when}}catch(e){return'bad'}})}
function openSlots(m,back){sm=m;sb=back;refreshSlots();ci=slot;mode='slots';if(window.CK_STORAGE)window.CK_STORAGE.restoreMissing().then(()=>refreshSlots()).catch(()=>{})}
function slotsCtl(){const it=slotItems(),n=it.length;if(E[12])ci=(ci+n-1)%n;if(E[13])ci=(ci+1)%n;if(E[0]&&it[ci].a)it[ci].a();if(E[1])mode=sb}


let aDown=null,lastTap=0,lastTapK=null,boxR=null,cgo=null,yc=0,ysc={vb:'house',tb:{}},mmF=0,mmM=0,omr='pause',tsc=0,tcI=0;
const SIEGE=['ram','mang','scor','treb','bomb'],ECO=['house','farm','lumber','mine','mill','market','dock','wall','gate','outpost'];
const isMil=u=>u.t===0&&!u.ld&&u.k!=='vil'&&u.k!=='fish'&&u.k!=='trn'&&u.k!=='king'&&u.k!=='mon';
const onScr=(x,y)=>{const p=w2s(x,y);return p[0]>-20&&p[0]<CW+20&&p[1]>-20&&p[1]<CH+20};
const focus=a=>ctr(a.x+(a.s||0)/2,a.y+(a.s||0)/2);
function nearV(x,y){let b=null,bd=1e9;for(const u of S.us)if(u.t===0&&!u.ld&&u.k==='vil'){const d=Math.hypot(u.x-x,u.y-y)+(u.o==='i'?-20:0);if(d<bd){bd=d;b=u}}return b}
function qsel(k){let l=[];if(k==='idle'){l=S.us.filter(u=>u.t===0&&!u.ld&&(u.k==='vil'||u.k==='fish')&&u.o==='i');if(!l.length)return note('No idle villagers');const u=l[idleI++%l.length];S.sel=[u];focus(u);return}
if(k==='support'){l=S.us.filter(u=>u.t===0&&!u.ld&&u.k==='mon');if(!l.length)return note('No support units');S.sel=l;focus(l[0]);return}
if(k==='tc'){l=S.bs.filter(b=>b.t===0&&b.k==='tc');if(!l.length)return;const b=l[tcI++%l.length];S.sel=[b];focus(b);return}
l=S.us.filter(isMil);if(!l.length)return note('No military units');S.sel=l;focus(l[0])}
function boxSel(r,add){const x0=Math.min(r.x0,r.x1),x1=Math.max(r.x0,r.x1),y0=Math.min(r.y0,r.y1),y1=Math.max(r.y0,r.y1),inb=(x,y,dy)=>{const p=w2s(x,y);return p[0]>=x0&&p[0]<=x1&&p[1]-dy>=y0&&p[1]-dy<=y1};let l=S.us.filter(u=>u.t===0&&!u.ld&&inb(u.x,u.y,14*zm));if(!l.length)l=S.bs.filter(b=>b.t===0&&inb(b.x+b.s/2,b.y+b.s/2,0));if(add)l=S.sel.concat(l.filter(u=>!S.sel.includes(u)));if(l.length){S.sel=l;ack(l[0])}}
function tapA(wx,wy,add){const now=performance.now(),t=pick(wx,wy);
if(t&&t.t===0&&now-lastTap<350&&lastTapK===t.k&&!add){const l=t.q?S.bs.filter(b=>b.t===0&&b.k===t.k&&onScr(b.x+b.s/2,b.y+b.s/2)):S.us.filter(u=>u.t===0&&u.k===t.k&&!u.ld&&onScr(u.x,u.y));S.sel=l;note(l.length+' selected');lastTap=0;return}
lastTap=now;lastTapK=t&&t.k;
if(t&&t.t===0&&!(t.q&&(!t.done||t.hp<t.mh)&&S.sel.some(u=>u.k==='vil'))){S.sel=add?(S.sel.includes(t)?S.sel:S.sel.concat([t])):[t];ack(t)}
else if(!orderSel(t,wx,wy))note('Select your units first (A on a unit)')}
const bLock=k=>{const d=B[k];return k==='wonder'&&vm!==1?'Wonder victory is off':d.age>S.age[0]?'Needs '+AG[d.age].n:d.req&&!S.bs.some(b=>b.t===0&&b.k===d.req&&b.done)?'Needs '+B[d.req].n:''};
function yShort(cyc){const s=S.sel;if(!s.length)return note('Select villagers, a building or soldiers for the Y shortcut');
if(s.some(u=>u.k==='vil')){const L=ECO.concat(['bar','rng','stable','siege','smith','univ','castle','tower','monastery']);if(cyc){const i=L.indexOf(ysc.vb);ysc.vb=L[(i+1)%L.length];return note('Y builds: '+B[ysc.vb].n)}const k=ysc.vb,lk=bLock(k);if(lk)return note(lk);if(!can(0,B[k].cost))return note('Not enough resources');place={k};return}
const b=s[0];if(b.q){if(!b.done)return;const l=trOf(b);if(!l.length)return note('Nothing to train here');let i=ysc.tb[b.k]|0;if(cyc){ysc.tb[b.k]=(i+1)%l.length;return note('Y trains: '+unitName(l[ysc.tb[b.k]],b.t))}const k=l[i%l.length];if(U[k].age>S.age[0])return note('Requires '+AG[U[k].age].n);const n=P[6]?5:1;let ok=0;for(let q=0;q<n;q++)if(train(b,k))ok++;else break;if(ok)note(unitName(k,b.t)+(ok>1?' x'+ok:'')+' queued');return}
fm=(fm+1)%4;note('Formation: '+FMN[fm])}
function siteMenu(wx,wy){const t=pick(wx,wy),it=[],mk=(l,fn)=>it.push({l,c:{},lk:'',fn:()=>{menu=null;fn()}});const give=(arr,fn)=>{if(!arr.length)return note('No such units');const sv=S.sel;S.sel=arr;fn();S.sel=sv};
const mil=()=>S.us.filter(u=>isMil(u)&&!SIEGE.includes(u.k)&&!U[u.k].sh),sg=()=>S.us.filter(u=>u.t===0&&!u.ld&&SIEGE.includes(u.k)),nv=()=>S.us.filter(u=>u.t===0&&!u.ld&&u.k==='gal');
if(t&&t.t>0){mk('Attack with military',()=>give(mil(),()=>orderSel(t,wx,wy)));mk('Attack with siege',()=>give(sg(),()=>orderSel(t,wx,wy)));mk('Attack with navy',()=>give(nv(),()=>orderSel(t,wx,wy)));if(!t.q)mk('Send Monk to convert',()=>give(S.us.filter(u=>u.t===0&&!u.ld&&u.k==='mon'),()=>orderSel(t,wx,wy)))}
else if(t&&t.amt>0){const selected=S.sel.filter(u=>u.t===0&&u.k==='vil'&&u.hp>0&&!u.ld);mk(selected.length?'Send selected villagers to gather ('+selected.length+')':'Send Villager to gather',()=>{if(selected.length)give(selected,()=>orderSel(t,wx,wy));else{const v=nearV(wx,wy);if(v)give([v],()=>orderSel(t,wx,wy));else note('No villagers')}});const dk=t.k==='w'?'lumber':(t.k==='g'||t.k==='s')?'mine':'mill';mk('Build '+B[dk].n+' here',()=>{const v=nearV(wx,wy);if(!v)return note('No villagers');S.sel=[v];place={k:dk}});mk('Send flare',()=>{S.flare={x:wx,y:wy,t:S.t};note('Flare sent')})}
else{if(t&&t.t===0&&t.sh&&t.hp<U[t.k].hp)mk('Repair damaged ship',()=>{const vs=S.sel.filter(u=>u.k==='vil');if(vs.length)give(vs,()=>orderSel(t,wx,wy));else note('Select villagers to repair the ship')});mk('Build...',()=>{const v=nearV(wx,wy);if(!v)return note('No villagers');S.sel=[v];openMenu();if(menu){menu.rad=1;menu.pg=0}});mk('Send military here',()=>give(mil(),()=>orderSel(null,wx,wy)));mk('Send navy here',()=>give(nv(),()=>orderSel(null,wx,wy)));mk('Send siege here',()=>give(sg(),()=>orderSel(null,wx,wy)));mk('Send Villager here',()=>{const v=nearV(wx,wy);if(v)give([v],()=>orderSel(null,wx,wy))})}
return{title:t&&t.t>0?'Target':t&&t.amt>0?'Resource':'Command',i:0,items:it}}
function openRadial(wx,wy){aDown=null;boxR=null;const target=pick(wx,wy),hasVillagers=S.sel.some(u=>u.t===0&&u.k==='vil'&&u.hp>0&&!u.ld);if(target&&target.amt>0&&!target.fi&&hasVillagers){menu=siteMenu(wx,wy);menu.rad=1;menu.pg=0}else if(S.sel.length){openMenu();if(menu){menu.rad=1;menu.pg=0}}else{menu=siteMenu(wx,wy);menu.rad=1;menu.pg=0}}
function playCtl(dt){const lt=P[6],pa=0,py=3,rad=!!(menu&&menu.rad)||!!cgo,sp=650*cspd*(lt?.55:1);
if(!rad){cur.x=cl(cur.x+ax(0)*sp*dt,0,CW);cur.y=cl(cur.y+ax(1)*sp*dt,0,CH)}
const ex=cur.x<20?-.8:cur.x>CW-20?.8:0,ey=cur.y<20?-.8:cur.y>CH-20?.8:0;cam.x+=(ax(2)+ex)*700*camspd*dt;cam.y+=(ax(3)+ey)*700*camspd*dt;clampCam();
const wxy=s2w(cur.x,cur.y),wx=wxy[0],wy=wxy[1];
if(ov){const o=ovr();if(E[0]||E[3]){const mw=m2w(o,cur.x,cur.y);ctr(mw[0],mw[1]);ov=0;return}if(E[1]||E[5]||E[8]){ov=0;return}if(E[12]){const mw=m2w(o,cur.x,cur.y);S.flare={x:mw[0],y:mw[1],t:S.t};note('Signal sent')}if(E[15]){mmF=(mmF+1)%3;note(['Minimap: full','Minimap: simple','Minimap: no terrain'][mmF])}if(E[14]){mmM=(mmM+1)%3;note(['Minimap: everything','Minimap: economy only','Minimap: military only'][mmM])}return}
if(cgo){const sx=ax(0),sy=ax(1);if(Math.hypot(sx,sy)>.45){const a=(Math.atan2(sy,sx)+Math.PI/2+6.2832)%6.2832;cgo.sel=Math.floor(a/6.2832*8+.5)%8}S.cg=S.cg||[];const sl=cgo.sel,live=()=>(S.cg[sl]||[]).filter(u=>u.hp>0&&!u.ld);
if(E[2]&&sl>=0){S.cg[sl]=S.sel.slice();cgo.done=1;note('Group '+(sl+1)+' set ('+S.sel.length+')')}if(E[3]&&sl>=0&&live().length){S.sel=live();focus(S.sel[0]);cgo.done=1;note('Group '+(sl+1)+' selected')}
if(RE[4]){if(!cgo.done&&sl>=0&&live().length){S.sel=live();note('Group '+(sl+1)+' selected')}cgo=null}if(E[1])cgo=null;return}
if(menu){const m=menu,N=m.items.length,pr=m.pr||Array.from({length:Math.ceil(N/12)},(_,i)=>[i*12,Math.min(N,i*12+12)]),pg=Math.min(m.pg||0,pr.length-1),a0=pr[pg][0],n=pr[pg][1]-a0,sx=ax(0),sy=ax(1);
if(Math.hypot(sx,sy)>.4){const a=(Math.atan2(sy,sx)+Math.PI/2+6.2832)%6.2832;m.i=a0+Math.floor(a/6.2832*n+.5)%n}else if(m.i<a0||m.i>=a0+n)m.i=a0;
if(E[3])yc=1;if(RE[7]&&m.rad){menu=null;return}if(E[0]){m.items[m.i].fn();return}if(E[2]&&m.b)cancelQ(m.b);if(E[3]&&pr.length>1){m.pg=(pg+1)%pr.length;m.i=pr[m.pg][0]}if(E[1])menu=null;return}
if(pat){if(E[1])pat=0;else if(E[0]){if(pat===3||pat===4)orderGuardFollow(wx,wy,pat===3?'F':'G');else patrol(wx,wy,pat===2);pat=0}return}
if(place){if(E[1]){place=null;return}const s=B[place.k].s;place.x=cl(Math.round(wx-s/2),0,W-s);place.y=cl(Math.round(wy-s/2),0,H-s);place.ok=okPlace(0,place.k,place.x,place.y)&&can(0,B[place.k].cost);
if(E[0]){const k=place.k,d=B[k];if(!okPlace(0,k,place.x,place.y))return note('Cannot build there');if(!can(0,d.cost))return note('Not enough resources');pay(0,d.cost);let vs=S.sel.filter(u=>u.k==='vil');if(!vs.length){const v=nearV(place.x,place.y);if(v)vs=[v]}
if(k==='farm'){const n=addN('f',place.x,place.y,farmFood(0),1);if(n)n.t=0;for(const u of vs){u.o='g';u.tg=n;u.ct='f';u.p=[];u.ret=0;u.car=0}}else{const b=addB(0,k,place.x,place.y,false);for(const u of vs){u.o='b';u.tg=b;u.p=[]}}
if(k!=='wall'&&!lt)place=null;note(d.n+' placed')}return}
if(E[5]){ov=1;aDown=null;boxR=null;return}if(E[7]){openRadial(wx,wy);return}if(E[4]){cgo={sel:-1,done:0};yc=1;aDown=null;boxR=null;return}
if(E[3])yc=0;if(P[py]&&E[14]){yShort(true);yc=1}if(RE[py]){if(!yc)yShort(false);yc=0}
if(!lt&&!P[7]&&!P[4]&&!P[py]){if(E[12])qsel('idle');if(E[15])qsel('support');if(E[13])qsel('tc');if(E[14])qsel('mil')}
if(E[0]){if(cur.x>=mm.x&&cur.y>=mm.y){const mw=m2w(mm,cur.x,cur.y);ctr(mw[0],mw[1])}else aDown={x:cur.x,y:cur.y}}
if(aDown&&P[pa]&&Math.hypot(cur.x-aDown.x,cur.y-aDown.y)>14)boxR={x0:aDown.x,y0:aDown.y,x1:cur.x,y1:cur.y};
if(aDown&&RE[pa]){if(boxR){boxSel(boxR,lt);boxR=null}else{const aw=s2w(aDown.x,aDown.y);tapA(aw[0],aw[1],lt)}aDown=null}
if(E[2]&&!orderSel(pick(wx,wy),wx,wy))note('Select units first, then X orders them');if(E[1])S.sel=[];
if(E[8]){omr='play';mode='obj';return}if(E[11])subg(1);
if(E[10]){const pg=S.ping&&S.t-S.ping.t<30&&!S.sel.length;if(pg)ctr(S.ping.x,S.ping.y);else{const a=S.sel[0]||S.bs.find(b=>b.t===0&&b.k==='tc');if(a)focus(a)}}}
/* ===== CAMPAIGN: The Crown of Ashford. A scenario is: setup rules + goals + timed or conditional events ===== */
const tcOf=t=>S.bs.find(b=>b.t===t&&b.k==='tc'),cb=(k,t=0)=>S.bs.filter(b=>b.t===t&&b.k===k&&b.done).length,cu=(k,t=0)=>S.us.filter(u=>u.t===t&&(!k||u.k===k)).length,cmil=t=>S.us.filter(u=>u.t===t&&u.k!=='vil'&&u.k!=='mon'&&u.k!=='king'&&!U[u.k].sh).length;
const grp=(t,k,n)=>{const tc=tcOf(t);for(let i=0;i<n;i++){const p=tc&&spawnPos(tc);if(p)addU(t,k,p[0]+(i%4)*.3,p[1]+(i%3)*.3)}};
function put(t,k,cx,cy){for(let r=0;r<16;r++)for(let a=0;a<12;a++){const x=Math.round(cx+Math.cos(a*.52)*r),y=Math.round(cy+Math.sin(a*.52)*r);if(x>1&&y>1&&x<W-4&&y<H-4&&okPlace(t,k,x,y))return addB(t,k,x,y,true)}return null}
function draw(dt){gt+=dt;X.setTransform(DPR,0,0,DPR,0,0);updP(dt);warm();X.fillStyle='#000';X.fillRect(0,0,CW,CH);if(drawFrontEndScreen())return;
for(const n of notes)n.t-=dt;compactPositive(notes,'t');drawWorld();
drawGameOverlays(dt)}
/* ===== MAIN LOOP (fixed 30Hz step, clamped delta for tab suspension) ===== */
/* Runtime exceptions used to be painted as a thin red strip while the same failing simulation kept running every frame. Halt immediately and expose useful diagnostics instead of repeatedly executing a broken step. */
let CK_ERR=null;
function frame(now){requestAnimationFrame(frame);try{frame2(now)}catch(e){if(mode!=='error'){CK_ERR={message:String(e&&e.message||e),stack:String(e&&e.stack||''),time:typeof S!=='undefined'&&S?S.t:0,units:typeof S!=='undefined'&&S&&S.us?S.us.length:0,buildings:typeof S!=='undefined'&&S&&S.bs?S.bs.length:0,map:typeof W!=='undefined'?W+'x'+H:'unknown',mode};mode='error';acc=0}try{drawError()}catch(_){X.fillStyle='#400';X.fillRect(0,0,CW,CH);X.fillStyle='#fff';X.fillText('Runtime error — simulation stopped',20,40)}}}
function frame2(now){const dt=Math.min(.25,(now-last)/1000);last=now;readPad();if(mode==='error'){if(E[0]||E[1]){if(window.CK_NET&&window.CK_NET.snapshot().roomCode)window.CK_NET.leaveToTitle();else mode='title';menu=place=null;CK_ERR=null;acc=0}drawError();return}ctl(dt);
const simStart=performance.now();if(mode==='play'){acc+=dt*gs;while(acc>=DT&&mode==='play'){step(DT);acc-=DT}}perfStepMs=performance.now()-simStart;perfStepPeak=Math.max(perfStepPeak,perfStepMs);
const drawStart=performance.now();draw(dt);perfDrawMs=performance.now()-drawStart;perfDrawPeak=Math.max(perfDrawPeak,perfDrawMs)}
function sset(){try{localStorage.setItem('ck_set',JSON.stringify({ui,br,msz,diff,vm,scoreLimit,mt,mapLayout,civ,zm,gq,aip,kingdoms,perfHud,vol:VOL,rmb,snd,mus}))}catch(e){}}
try{hs=[0,1,2].some(n=>!!localStorage.getItem(skey(n)));BM=JSON.parse(localStorage.getItem('ck_map'))||{};const st=JSON.parse(localStorage.getItem('ck_set')||'null');if(st){ui=[.8,1,1.25,1.5].includes(st.ui)?st.ui:1;br=cl(+st.br||1,.6,1.5);msz=cl(st.msz|0,0,3);diff=cl(st.diff|0,0,2);vm=cl(st.vm|0,0,6);scoreLimit=SCORE_LIMITS.includes(st.scoreLimit)?st.scoreLimit:1200;mt=cl(st.mt|0,0,MT.length-1);mapLayout=cl(st.mapLayout|0,0,13);if(mapLayout)applyMapLayout();civ=cl(st.civ|0,0,CIV.length-1);zm=cl(+st.zm||1.4,1,2);TW=64*zm;TH=32*zm;gq=cl(st.gq===undefined?1:st.gq|0,0,2);if(st.vol){const v01=x=>{x=+x;return x>=0&&x<=1?x:1};VOL={m:v01(st.vol.m),mu:v01(st.vol.mu),sf:v01(st.vol.sf),am:v01(st.vol.am)}}aip=cl(st.aip|0,0,6);kingdoms=st.kingdoms===2?2:4;perfHud=st.perfHud?1:0;rmb=st.rmb===0?0:1;snd=st.snd===0?0:1;mus=st.mus===0?0:1;}}catch(e){}
rs();
if(window.CK_STORAGE)window.CK_STORAGE.restoreMissing().catch(()=>{});
try{if('serviceWorker' in navigator&&window.location&&window.location.protocol==='https:')navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{})}catch(e){}
try{const ael=document.getElementById('ck-assets');if(ael&&ael.textContent&&ael.textContent.trim()!=='{}')loadAssetPack(JSON.parse(ael.textContent));if(window.CK_ASSETS)loadAssetPack(window.CK_ASSETS)}catch(e){};fetch('./assets/atlas-manifest.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('Asset manifest unavailable');return r.json()}).then(pack=>{if(pack&&typeof pack==='object')loadAssetPack(pack)}).catch(()=>{});
document.addEventListener('visibilitychange',()=>{if(document.hidden)autoPause()});addEventListener('blur',autoPause);
addEventListener('keydown',e=>{if(e.key&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Enter','Escape','Tab','PageUp','PageDown'].includes(e.key))e.preventDefault()},{passive:false});
addEventListener('contextmenu',e=>e.preventDefault());addEventListener('wheel',e=>e.preventDefault(),{passive:false});
setInterval(aTick,120);
['pointerdown','keydown','touchstart'].forEach(e=>addEventListener(e,()=>{if(aInit()&&AC.state==='suspended')AC.resume().catch(()=>{})},{passive:true}));
requestAnimationFrame(frame);

