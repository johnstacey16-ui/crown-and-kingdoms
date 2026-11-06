/* Crown & Kingdoms — shared civilization roster and unique technologies.
 * Ordered IDs are save/network relevant. All effects retain the existing rules.
 * Research availability matrices and selectors remain in js/kingdom.js. */
'use strict';
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
{n:'Spanish',uu:'conq',d:'Miners +15%, +100 gold; Conquistadors',fx:t=>{S.tech[t].mn=1;S.res[t].g+=100},ut:{k:'ut14',n:'Supremacy',cost:{f:300,g:250},t:50,age:2,fx:t=>{atkbF(t,'vil',6);hpbF(t,'vil',40)}}},
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
