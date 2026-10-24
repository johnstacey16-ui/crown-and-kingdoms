const DIFFICULTY_NAMES=['Easiest','Easy','Moderate','Hard','Hardest','Extreme'];
const difficultyName=i=>DIFFICULTY_NAMES[i]||'Unknown';
/* Crown & Kingdoms — game constants and balance data. Loaded before engine.js. */
/* ===== CONFIG / BALANCE ===== */
let TW=89.6,TH=44.8,zm=1.4;const T=32,DT=1/30,GR=.8,CAP=10,SZ=[72,96,128,176];let W=72,H=72;
const U={vil:{n:'Villager',hp:25,sp:.8,dmg:3,rng:.9,cd:1.5,arm:0,cost:{f:50},t:25,c:'#e8c07a',r:7},
mil:{n:'Militia',hp:40,sp:.9,dmg:4,rng:.9,cd:2,arm:0,cost:{f:50,g:20},t:21,c:'#d5d9e2',r:9,age:0},
arc:{n:'Archer',hp:30,sp:.96,dmg:4,rng:4,cd:2,delay:.35,ps:7,acc:.8,arm:0,cost:{w:25,g:45},t:35,c:'#8fd18a',r:8,age:1,bn:{spear:3}},
spear:{n:'Spearman',hp:45,sp:1,dmg:3,rng:.9,cd:3,arm:0,cost:{f:35,w:25},t:22,c:'#b6a98a',r:9,age:1,bn:{scout:15,knight:15,camel:12,cata:15,ele:15,eled:15,boyar:15,tarkan:15,huszar:15,mamel:12}},
scout:{n:'Scout Cavalry',hp:45,sp:1.55,dmg:3,rng:.9,cd:2,arm:0,cost:{f:80},t:30,c:'#d9b38c',r:9,age:1,bn:{mon:6}},
knight:{n:'Knight',hp:100,sp:1.35,dmg:10,rng:.9,cd:1.8,arm:2,cost:{f:60,g:75},t:30,c:'#f0e0a0',r:11,age:2},
xbow:{n:'Crossbowman',hp:35,sp:.96,dmg:5,rng:5,cd:2,delay:.35,ps:7,acc:.85,arm:0,cost:{w:25,g:45},t:27,c:'#a8e6c0',r:8,age:2,bn:{spear:3}},
cart:{n:'Trade Cart',hp:45,sp:1.6,dmg:0,rng:.9,cd:2,arm:0,cost:{w:100},t:30,c:'#b99a63',r:8,age:1},
fish:{n:'Fishing Ship',hp:40,sp:2,dmg:1,rng:.9,cd:2,arm:0,cost:{w:75},t:12,c:'#7fd4e6',r:10,age:0,sh:1},
gal:{n:'War Galley',hp:90,sp:2.2,dmg:8,rng:6,cd:1.8,arm:1,cost:{w:90,g:50},t:16,c:'#4aa3c8',r:11,age:2,sh:1,bn:{fish:8,trn:6}},
trn:{n:'Transport Ship',hp:80,sp:1.8,dmg:1,rng:.9,cd:2,arm:0,cap:5,cost:{w:100},t:14,c:'#b8a46a',r:11,age:1,sh:1},
cog:{n:'Trade Cog',hp:65,sp:2,dmg:0,rng:.9,cd:2,arm:0,cost:{w:100,g:50},t:35,c:'#7fd4e6',r:10,age:1,sh:1},
ram:{n:'Battering Ram',hp:150,sp:1.0,dmg:5,bb:20,sg:1,rng:.9,cd:2.5,arm:3,cost:{w:160,g:75},t:20,c:'#8b6b3d',r:11,age:2},
mon:{n:'Monk',hp:30,sp:1.2,dmg:1,rng:.9,cd:2,arm:0,cost:{g:100},t:14,c:'#c9a0e0',r:8,age:2},
woad:{n:'Woad Raider',hp:55,sp:1.9,dmg:9,rng:.9,cd:1.2,arm:0,cost:{f:65,g:25},t:14,c:'#4a7ab0',r:9,age:2},
bers:{n:'Berserk',hp:60,sp:1.4,dmg:10,rng:.9,cd:1.5,arm:0,cost:{f:65,g:35},t:16,c:'#a05a3a',r:9,age:2},
mamel:{n:'Mameluke',hp:100,sp:1.8,dmg:8,rng:.9,cd:1.8,arm:0,cost:{f:55,g:70},t:16,c:'#c9a46a',r:11,age:2,bn:{knight:9,scout:9,cata:6}},
jan:{n:'Janissary',hp:45,sp:1.3,dmg:18,rng:5.5,cd:3.2,arm:0,cost:{f:55,g:60},t:16,c:'#3a5a9a',r:8,age:2},
chuko:{n:'Chu Ko Nu',hp:40,sp:1.4,dmg:4,rng:5.5,cd:.9,arm:0,cost:{w:40,g:35},t:14,c:'#a04a3a',r:8,age:2},
saml:{n:'Samurai',hp:60,sp:1.5,dmg:9,rng:.9,cd:1,arm:0,cost:{f:60,g:30},t:16,c:'#a03030',r:9,age:2},
eled:{n:'Elephant Archer',hp:200,sp:1.3,dmg:9,rng:5.5,cd:2.2,arm:0,cost:{f:90,g:80},t:24,c:'#8a8a90',r:14,age:3},
hcan:{n:'Hand Cannoneer',hp:35,sp:1.3,dmg:17,rng:5,cd:3.4,arm:0,cost:{f:45,g:50},t:16,c:'#b0a090',r:8,age:3},
bomb:{n:'Bombard Cannon',hp:80,sp:.8,dmg:40,bb:30,du:.5,rng:9,cd:6,arm:0,cost:{w:225,g:225},t:30,c:'#6a6a70',r:12,age:3,spl:1,sg:1},
axe:{n:'Throwing Axeman',hp:50,sp:1.5,dmg:7,rng:4,cd:1.8,arm:0,cost:{f:55,g:25},t:12,c:'#e0b080',r:9,age:2},
lbow:{n:'Longbowman',hp:35,sp:1.3,dmg:7,rng:7,cd:1.6,arm:0,cost:{w:35,g:40},t:12,c:'#6fa05a',r:8,age:2},
mgd:{n:'Mangudai',hp:60,sp:2.2,dmg:6,rng:4,cd:1.5,arm:0,cost:{w:55,g:65},t:14,c:'#c9905a',r:11,age:2,bn:{arc:4,skirm:4}},
cata:{n:'Cataphract',hp:130,sp:1.9,dmg:12,rng:.9,cd:1.8,arm:0,cost:{f:70,g:75},t:18,c:'#b8b8c4',r:12,age:2,bn:{spear:8,mil:4}},
ele:{n:'War Elephant',hp:300,sp:1.1,dmg:14,rng:.9,cd:2.2,arm:0,cost:{f:120,g:70},t:26,c:'#8a8a90',r:14,age:3},
tk:{n:'Teutonic Knight',hp:90,sp:1.1,dmg:12,rng:.9,cd:1.6,arm:0,cost:{f:50,g:40},t:16,c:'#d0d0d8',r:10,age:2},
treb:{n:'Trebuchet',hp:60,sp:.8,dmg:20,bb:40,du:.25,rng:11,minR:3,cd:5,arm:0,cost:{w:200,g:150},t:30,c:'#8a6a3a',r:12,age:3,spl:1.2,sg:1},
camel:{n:'Camel Rider',hp:100,sp:1.45,dmg:6,rng:.9,cd:2,arm:0,cost:{f:55,g:60},t:22,c:'#c9a46a',r:11,age:2,bn:{knight:9,scout:9}},
king:{n:'King',hp:150,sp:1.2,dmg:1,rng:.9,cd:2,arm:0,cost:{},t:0,c:'#c9a0ff',r:9,age:0},
skirm:{n:'Skirmisher',hp:30,sp:.96,dmg:2,rng:4,minR:1,cd:3,acc:.9,arm:0,cost:{f:25,w:35},t:26,c:'#9ccf7a',r:8,age:1,bn:{arc:3,xbow:3,lbow:3,skirm:3,spear:3,mamel:2}},
mang:{n:'Mangonel',hp:70,sp:.9,dmg:14,rng:7,cd:3.5,arm:0,cost:{w:160,g:135},t:26,c:'#8a6a3a',r:11,age:2,spl:1.6,sg:1},
scor:{n:'Scorpion',hp:50,sp:1,dmg:10,rng:6.5,cd:2.6,arm:0,cost:{w:75,g:75},t:18,c:'#8a6a3a',r:10,age:2,bn:{mil:6,spear:6,arc:6,xbow:6,skirm:6,vil:6}},
tca:{n:'Town Centre',hp:1,sp:0,dmg:5,rng:7,cd:2.2,arm:0,cost:{},t:0,c:'#fff',r:0,age:0},
tw:{n:'Tower',hp:1,sp:0,dmg:7,rng:7,cd:2,arm:0,cost:{},t:0,c:'#fff',r:0,age:0},cs:{n:'Castle',hp:1,sp:0,dmg:12,rng:9,cd:1.5,arm:0,cost:{},t:0,c:'#fff',r:0,age:0}};
const B={tc:{n:'Town Centre',s:3,hp:900,cost:{},bt:1,tr:['vil'],rs:['loom','wheel','handcart','gath','carry'],atk:'tca'},house:{n:'House',s:2,hp:200,cost:{w:25},bt:12},
lumber:{n:'Lumber Camp',s:2,hp:250,cost:{w:100},bt:15,rs:['axe','saw']},mine:{n:'Mining Camp',s:2,hp:250,cost:{w:100},bt:15,rs:['gmine','smine']},mill:{n:'Mill',s:2,hp:250,cost:{w:100},bt:15,rs:['coll','plow','crop']},farm:{n:'Farm',s:1,hp:480,cost:{w:60},bt:15},
bar:{n:'Barracks',s:3,hp:500,cost:{w:150},bt:25,tr:['mil','spear'],rs:['man','longs','twohand','champ','pike','halb','squires','arson'],age:0},rng:{n:'Archery Range',s:3,hp:500,cost:{w:150},bt:25,tr:['arc','skirm','xbow','hcan'],rs:['xbow','elsk','thumb','arb'],req:'bar',age:1},
stable:{n:'Stable',s:3,hp:500,cost:{w:150},bt:25,tr:['scout','camel','knight'],rs:['lcav','cavl','hcamel','blood','husb'],req:'bar',age:1},smith:{n:'Blacksmith',s:3,hp:400,cost:{w:150},bt:25,rs:['atkM','atkR','armI','armR','armC','atkM2','atkR2','bodkin'],req:'bar',age:1},
market:{n:'Market',s:3,hp:400,cost:{w:175},bt:25,tr:['cart'],tx:1,age:1},palisade:{n:'Palisade Wall',s:1,hp:150,cost:{w:3},bt:3,age:0},wall:{n:'Stone Wall',s:1,hp:300,cost:{s:5},bt:3,age:1},dock:{n:'Dock',s:2,hp:600,cost:{w:150},bt:25,tr:['fish','gal','trn','cog'],rs:['navalAtk','navalHull'],age:0,wat:1},siege:{n:'Siege Workshop',s:3,hp:500,cost:{w:200},bt:30,tr:['ram','mang','scor','bomb'],rs:['siegeup'],req:'bar',age:2},univ:{n:'University',s:3,hp:550,cost:{w:200,s:50},bt:35,rs:['crane','mas','slit','gtow','keep','fw','chem','ballistics','murderHoles'],req:'smith',age:2},gate:{n:'Gate',s:1,hp:300,cost:{s:20},bt:6,age:1},outpost:{n:'Outpost',s:1,hp:150,cost:{w:25,s:10},bt:8,age:1},wonder:{n:'Wonder',s:4,hp:2400,cost:{f:400,w:600,g:600,s:600},bt:120,age:3},monastery:{n:'Monastery',s:3,hp:500,cost:{w:175,g:50},bt:30,tr:['mon'],rs:['devotion','faith','heresy','redemption','atonement','sanctity','fervor','blockPrinting','illumination','theocracy','herbalMedicine'],req:'bar',age:2},tower:{n:'Watch Tower',s:2,hp:400,cost:{w:50,s:100},bt:20,age:1,atk:'tw'},castle:{n:'Castle',s:4,hp:1400,cost:{w:200,s:350},bt:60,age:2,atk:'cs',tr:['knight','xbow','treb'],rs:['cons']}};
const NM={w:'Tree',f:'Food',g:'Gold',s:'Stone'},TASK={i:'Idle',m:'Moving',a:'Attacking',g:'Gathering',b:'Building',p:'Patrolling',v:'Converting',r:'Fetching relic',B:'Boarding',U:'Unloading'};
const RN={f:'Food',w:'Wood',g:'Gold',s:'Stone'},TR=[['w',100,'g',70],['f',100,'g',70],['g',80,'w',100],['g',80,'f',100],['g',90,'s',100]];
const AG=[{n:'Founding Age'},{n:'Feudal Age',cost:{f:500},t:130,needs:['lumber','mill','mine','bar','dock']},{n:'Castle Age',cost:{f:800,g:200},t:160,needs:['rng','stable','smith','market']},{n:'Imperial Age',cost:{f:1000,g:800},t:190,needs:['siege','univ','monastery'],single:'castle'}];
const TE={devotion:{n:'Devotion',cost:{f:100,g:200},t:40,age:2},faith:{n:'Faith',cost:{f:550,g:750},t:60,age:3,pre:'devotion'},heresy:{n:'Heresy',cost:{g:1000},t:60,age:2},redemption:{n:'Redemption',cost:{g:475},t:50,age:2},atonement:{n:'Atonement',cost:{g:325},t:40,age:2},sanctity:{n:'Sanctity',cost:{g:175},t:60,age:2,hpb:{mon:15}},fervor:{n:'Fervor',cost:{g:140},t:50,age:2},blockPrinting:{n:'Block Printing',cost:{g:200},t:55,age:3},illumination:{n:'Illumination',cost:{g:120},t:65,age:3},theocracy:{n:'Theocracy',cost:{g:200},t:75,age:3},herbalMedicine:{n:'Herbal Medicine',cost:{g:200},t:35,age:2},murderHoles:{n:'Murder Holes',cost:{f:200,s:100},t:35,age:2},bodkin:{n:'Bodkin Arrow',cost:{f:200,g:100},t:35,age:2,pre:'atkR'},ballistics:{n:'Ballistics',cost:{w:300,g:175},t:60,age:2},loom:{n:'Loom (Villager HP +15)',cost:{g:50},t:25,age:0,hpb:{vil:15}},wheel:{n:'Wheelbarrow',cost:{f:175,w:50},t:75,age:1},handcart:{n:'Hand Cart',cost:{f:300,w:200},t:55,age:2,pre:'wheel'},gath:{n:'Gather Rate +25%',cost:{f:200,w:100},t:30,age:1},carry:{n:'Carry Capacity +5',cost:{f:150,w:100},t:30,age:1},atkM:{n:'Melee Attack +2',cost:{f:150,g:100},t:30,age:1},atkR:{n:'Fletching',cost:{f:100,g:50},t:30,age:1},armI:{n:'Infantry Armour +1',cost:{f:150,g:100},t:30,age:1},armR:{n:'Ranged Armour +1',cost:{f:150,g:100},t:30,age:1},armC:{n:'Cavalry Armour +1',cost:{f:150,g:100},t:30,age:1},fw:{n:'Fortified Wall',cost:{f:200,w:100,s:150},t:45,age:2,pre:'mas'},gtow:{n:'Guard Tower',cost:{f:100,w:50,g:50},t:40,age:2,pre:'slit'},keep:{n:'Keep',cost:{f:250,w:200,g:150},t:60,age:3,pre:'gtow'},
man:{n:'Man-at-Arms',cost:{f:100,g:40},t:40,age:1,hpb:{mil:5},atkb:{mil:2}},longs:{n:'Long Swordsman',cost:{f:150,g:65},t:40,age:2,pre:'man',hpb:{mil:15},atkb:{mil:3}},twohand:{n:'Two-Handed Swordsman',cost:{f:200,g:100},t:45,age:3,pre:'longs',hpb:{mil:5},atkb:{mil:3}},champ:{n:'Champion',cost:{f:650,g:350},t:70,age:3,pre:'twohand',hpb:{mil:5},atkb:{mil:2}},pike:{n:'Pikeman',cost:{f:160,g:90},t:35,age:2,hpb:{spear:10},atkb:{spear:1}},halb:{n:'Halberdier',cost:{f:300,g:600},t:50,age:3,pre:'pike',hpb:{spear:5},atkb:{spear:2}},xbow:{n:'Crossbowman',cost:{f:175,g:100},t:35,age:2,fx:t=>{
 const tech=S.tech[t]||{},oldMax=U.arc.hp+(tech.hpb?.arc||0),newMax=U.xbow.hp+(tech.hpb?.xbow||0);
 for(const u of S.us)if(u&&u.t===t&&u.k==='arc'&&u.hp>0){
  u.k='xbow';u.hp=Math.min(newMax,Math.max(1,u.hp+newMax-oldMax));
 }
 for(const b of S.bs)if(b&&b.t===t&&Array.isArray(b.q))for(const q of b.q)if(q?.k==='arc'){
  q.k='xbow';q.t=Math.min(q.t,U.xbow.t);
 }
}},thumb:{n:'Thumb Ring',cost:{f:300,w:250},t:45,age:2},arb:{n:'Arbalester',cost:{f:450,g:350},t:50,age:3,pre:'xbow',hpb:{xbow:5},atkb:{xbow:1}},elsk:{n:'Elite Skirmisher',cost:{w:230,g:130},t:50,age:2,hpb:{skirm:5},atkb:{skirm:1}},lcav:{n:'Light Cavalry',cost:{f:150,g:50},t:45,age:2,hpb:{scout:15},atkb:{scout:2}},cavl:{n:'Cavalier',cost:{f:300,g:300},t:80,age:3,hpb:{knight:20},atkb:{knight:2}},hcamel:{n:'Heavy Camel Rider',cost:{f:325,g:360},t:105,age:3,hpb:{camel:20},atkb:{camel:1}},siegeup:{n:'Siege Engineers',cost:{w:300,g:200},t:45,age:3,atkb:{ram:8,mang:5,scor:3,treb:5,bomb:8},hpb:{ram:50,treb:15,bomb:20}},crane:{n:'Treadmill Crane',cost:{f:150,w:150},t:35,age:2},mas:{n:'Masonry',cost:{f:200,w:150},t:40,age:2},slit:{n:'Arrowslits',cost:{f:100,w:100},t:30,age:2},
axe:{n:'Double-bit Axe',cost:{f:100,w:50},t:25,age:0},saw:{n:'Bow Saw',cost:{f:150,w:100},t:35,age:1,pre:'axe'},gmine:{n:'Gold Mining',cost:{f:100,w:75},t:25,age:0},smine:{n:'Stone Mining',cost:{f:100,w:75},t:25,age:0},coll:{n:'Horse Collar',cost:{f:75,w:75},t:25,age:0},plow:{n:'Heavy Plow',cost:{f:125,w:125},t:35,age:1,pre:'coll'},crop:{n:'Crop Rotation',cost:{f:300,w:200},t:50,age:3,pre:'plow'},atkM2:{n:'Melee Attack +5',cost:{f:300,g:250},t:45,age:3,pre:'atkM'},atkR2:{n:'Bracer',cost:{f:300,g:200},t:40,age:3,pre:'bodkin'},navalAtk:{n:'Ship Weapons +3',cost:{w:250,g:200},t:40,age:2,atkb:{gal:3}},navalHull:{n:'Reinforced Hulls',cost:{w:200,g:150},t:40,age:2,hpb:{fish:20,gal:35,trn:30,cog:25}},blood:{n:'Bloodlines',cost:{f:150,g:100},t:40,age:2,hpb:{scout:20,knight:20,camel:20,mamel:20,cata:20,ele:20,mgd:20,eled:20}},chem:{n:'Chemistry',cost:{f:300,g:200},t:60,age:3,atkb:{hcan:1,jan:1,bomb:1,gal:1}},cons:{n:'Conscription',cost:{f:150,g:150},t:60,age:3},husb:{n:'Husbandry',cost:{f:150,g:150},t:40,age:2},squires:{n:'Squires (Infantry Speed +10%)',cost:{f:100},t:40,age:2},arson:{n:'Arson (Infantry +2 vs Buildings)',cost:{f:150,g:50},t:40,age:2}};

