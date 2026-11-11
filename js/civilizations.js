/* Crown & Kingdoms — shared civilization roster and unique technologies.
 * Ordered IDs remain stable for current-build network/selection. Civilization
 * entries may register multiple unique technologies; restrictions stay in kingdom.js. */
'use strict';
const CIV=[{n:'Franks',uu:'axe',d:'Knights +15 HP; Throwing Axemen',fx:t=>hpbF(t,'knight',15),ut:{k:'ut0',n:'Chivalry',cost:{f:300,g:200},t:50,age:2,fx:t=>atkbF(t,'knight',2)},ut2:{k:'ut0p',n:'Bearded Axes',cost:{f:350,g:350},t:40,age:3,fx:t=>{S.tech[t].beardedAxes=1}},elite:{k:'eliteAxeman',n:'Elite Throwing Axeman',cost:{f:950,g:750},t:55,age:3,hpb:{axe:10},atkb:{axe:1},armor:{p:1},bonus:{infantry:2}}},
{n:'Britons',teamWork:{rng:1.1},uu:'lbow',d:'Archers +1 attack; Longbowmen',fx:t=>{atkbF(t,'arc',1);atkbF(t,'xbow',1);atkbF(t,'hcan',1)},ut:{k:'ut1',n:'Yeomen',cost:{f:250,w:200},t:50,age:2,fx:t=>{atkbF(t,'arc',2);atkbF(t,'lbow',2);atkbF(t,'xbow',2)}},ut2:{k:'ut1p',n:'Warwolf',cost:{w:800,g:400},t:60,age:3,fx:t=>{S.tech[t].warwolf=1}},elite:{k:'eliteLongbowman',n:'Elite Longbowman',cost:{f:850,g:850},t:60,age:3,hpb:{lbow:5},armor:{p:1},range:1}},
{n:'Mongols',uu:'mgd',d:'Scouts +30 HP, faster hunting; Mangudai',fx:t=>{hpbF(t,'scout',30);S.tech[t].hunt=1},ut:{k:'ut2',n:'Nomads',cost:{f:250,g:200},t:50,age:2,fx:t=>{hpbF(t,'mgd',30);atkbF(t,'mgd',2)}},ut2:{k:'ut2p',n:'Drill',cost:{w:500,g:450},t:60,age:3,fx:t=>{S.tech[t].drill=1}},baseBonus:{siege:3},elite:{k:'eliteMangudai',n:'Elite Mangudai',cost:{f:1100,g:675},t:50,age:3,atkb:{mgd:2},armor:{m:1},bonus:{siege:2}}},
{n:'Byzantines',uu:'cata',d:'Buildings +15% HP; Cataphracts',fx:t=>{S.tech[t].bz=1},ut:{k:'ut3',n:'Greek Fire',cost:{f:250,g:300},t:40,age:2,fx:t=>{S.tech[t].gf=1}},ut2:{k:'ut3p',n:'Logistica',cost:{f:800,g:600},t:50,age:3,fx:t=>{S.tech[t].logistica=1}},elite:{k:'eliteCataphract',n:'Elite Cataphract',cost:{f:1200,g:800},t:50,age:3,hpb:{cata:40},atkb:{cata:3},bonus:{infantry:5},cavalryArmor:4}},
{n:'Persians',uu:'ele',d:'Start +150 food and wood; War Elephants',fx:t=>{S.res[t].f+=150;S.res[t].w+=150},ut:{k:'ut4',n:'Mahouts',cost:{f:300,g:250},t:50,age:2,fx:t=>{hpbF(t,'ele',40);hpbF(t,'eled',30)}},ut2:{k:'ut4p',n:'Citadels',cost:{w:600,g:300},t:50,age:3,fx:t=>{S.tech[t].citadels=1}},elite:{k:'eliteWarElephant',n:'Elite War Elephant',cost:{f:1600,g:1200},t:75,age:3,hpb:{ele:150},atkb:{ele:2},armor:{m:1,p:1}}},
{n:'Teutons',uu:'tk',d:'Infantry +1 armour; Teutonic Knights',fx:t=>{S.tech[t].armI=1},ut:{k:'ut5',n:'Crenellations',cost:{f:600,s:400},t:60,age:3,fx:t=>{S.tech[t].crenellations=1}},ut2:{k:'ut5p',n:'Ironclad',cost:{w:400,g:350},t:60,age:2,fx:t=>{S.tech[t].ironclad=1}},elite:{k:'eliteTeutonicKnight',n:'Elite Teutonic Knight',cost:{f:950,g:500},t:50,age:3,hpb:{tk:20},atkb:{tk:5},armor:{m:1,p:1}}},
{n:'Celts',teamWork:{siege:1.2},uu:'woad',d:'Siege +30 HP, faster woodcutting; Woad Raiders',fx:t=>{for(const k of['ram','mang','scor','treb','bomb'])hpbF(t,k,30);S.tech[t].wd=1},ut:{k:'ut6',n:'Furor Celtica',cost:{f:750,g:450},t:50,age:3,fx:t=>{for(const k of['ram','mang','scor','bomb'])hpbF(t,k,Math.round(U[k].hp*.4))}},ut2:{k:'ut6p',n:'Stronghold',cost:{f:250,g:200},t:30,age:2,fx:t=>{S.tech[t].stronghold=1}},elite:{k:'eliteWoadRaider',n:'Elite Woad Raider',cost:{f:1000,g:800},t:50,age:3,hpb:{woad:20},atkb:{woad:4},armor:{p:1}}},
{n:'Vikings',uu:'bers',d:'Infantry +10 HP; Berserks',fx:t=>{hpbF(t,'mil',10);hpbF(t,'spear',10);hpbF(t,'bers',10)},ut:{k:'ut7',n:'Chieftains',cost:{f:250,g:150},t:50,age:2,fx:t=>{atkbF(t,'mil',2);atkbF(t,'spear',2);atkbF(t,'bers',3)}},ut2:{k:'ut7p',n:'Bogsveigar',cost:{f:650,g:500},t:40,age:3,fx:t=>{S.tech[t].bogsveigar=1}},elite:{k:'eliteBerserk',n:'Elite Berserk',cost:{f:1075,g:475},t:45,age:3,hpb:{bers:15},atkb:{bers:4},armor:{m:1,p:1}}},
{n:'Saracens',uu:'mamel',d:'Camels +20 HP, +100 gold; Mamelukes',fx:t=>{hpbF(t,'camel',20);S.res[t].g+=100},ut:{k:'ut8',n:'Zealotry',cost:{f:300,g:250},t:50,age:2,fx:t=>{hpbF(t,'camel',20);hpbF(t,'mamel',20)}},ut2:{k:'ut8p',n:'Counterweights',cost:{f:650,g:500},t:60,age:3,fx:t=>{S.tech[t].counterweights=1}},elite:{k:'eliteMameluke',n:'Elite Mameluke',cost:{f:600,g:500},t:50,age:3,hpb:{mamel:15},atkb:{mamel:3},armor:{p:1}}},
{n:'Turks',uu:'jan',d:'Gunpowder units +HP; Janissaries',fx:t=>{hpbF(t,'hcan',9);hpbF(t,'bomb',20);hpbF(t,'jan',11)},ut:{k:'ut9',n:'Sipahi',cost:{f:300,g:250},t:50,age:2,fx:t=>{atkbF(t,'hcan',4);atkbF(t,'jan',4);atkbF(t,'bomb',4)}},ut2:{k:'ut9p',n:'Artillery',cost:{g:500,s:450},t:60,age:3,fx:t=>{S.tech[t].artillery=1}},elite:{k:'eliteJanissary',n:'Elite Janissary',cost:{f:850,g:750},t:55,age:3,hpb:{jan:10},atkb:{jan:5},armor:{p:1}}},
{n:'Chinese',uu:'chuko',d:'Start +200 food; Chu Ko Nu',fx:t=>{S.res[t].f+=200},ut:{k:'ut10',n:'Great Wall',cost:{f:300,w:300,s:200},t:60,age:2,fx:t=>{S.tech[t].fw=1;for(const x of S.bs)if(x.t===t&&(x.k==='wall'||x.k==='gate'||x.k==='tower')){x.mh=Math.round(x.mh*1.5);x.hp=Math.round(x.hp*1.5)}}},ut2:{k:'ut10p',n:'Rocketry',cost:{w:600,g:600},t:60,age:3,fx:t=>{S.tech[t].rocketry=1}},elite:{k:'eliteChuKoNu',n:'Elite Chu Ko Nu',cost:{f:760,g:760},t:50,age:3,hpb:{chuko:5},atkb:{chuko:2}}},
{n:'Japanese',uu:'saml',d:'Infantry +1 attack; Samurai',fx:t=>{atkbF(t,'mil',1);atkbF(t,'spear',1);atkbF(t,'saml',1)},ut:{k:'ut11',n:'Yasama',cost:{f:300,w:200,g:150},t:50,age:2,fx:t=>{S.tech[t].ys=1}},ut2:{k:'ut11p',n:'Kataparuto',cost:{w:550,g:300},t:60,age:3,fx:t=>{S.tech[t].kataparuto=1}},elite:{k:'eliteSamurai',n:'Elite Samurai',cost:{f:950,g:875},t:60,age:3,hpb:{saml:20},atkb:{saml:3},armor:{m:1,p:1}}},
{n:'Khmer',uu:'ele',d:'Elephants +30 HP; Battle Elephants',fx:t=>hpbF(t,'ele',30),ut:{k:'ut12',n:'Tusk Swords',cost:{f:300,g:200},t:50,age:2,fx:t=>atkbF(t,'ele',3)},ut2:{k:'ut12p',n:'Double Crossbow',cost:{f:700,g:400},t:50,age:3,fx:t=>{S.tech[t].doubleCrossbow=1}},elite:{k:'eliteBattleElephant',n:'Elite Battle Elephant',cost:{f:1100,g:800},t:50,age:3,hpb:{ele:70},atkb:{ele:3},armor:{m:1,p:1}}},
{n:'Indians',uu:'eled',d:'Villagers +10 HP, +100 food; Elephant Archers',fx:t=>{hpbF(t,'vil',10);S.res[t].f+=100},ut:{k:'ut13',n:'Shatagni',cost:{f:300,g:250},t:50,age:2,fx:t=>{atkbF(t,'hcan',3);atkbF(t,'eled',2)}},ut2:{k:'ut13p',n:'Grand Trunk Road',cost:{f:400,g:400},t:60,age:2,fx:t=>{S.tech[t].grandTrunkRoad=1}},elite:{k:'eliteElephantArcher',n:'Elite Elephant Archer',cost:{f:1000,g:800},t:60,age:3,hpb:{eled:50},atkb:{eled:2},armor:{p:1}}},
{n:'Spanish',teamEconomic:{tradeGold:1.25},uu:'conq',d:'Miners +15%, +100 gold; Conquistadors',fx:t=>{S.tech[t].mn=1;S.res[t].g+=100},ut:{k:'ut14',n:'Supremacy',cost:{f:300,g:250},t:50,age:2,fx:t=>{atkbF(t,'vil',6);hpbF(t,'vil',40)}},ut2:{k:'ut14p',n:'Inquisition',cost:{f:100,g:300},t:50,age:2,fx:t=>{S.tech[t].inquisition=1}},elite:{k:'eliteConquistador',n:'Elite Conquistador',cost:{f:1200,g:600},t:60,age:3,hpb:{conq:15},atkb:{conq:3},armor:{p:1}}},
{n:'Italians',uu:'genoa',d:'Archers +10 HP, farms +15%; Genoese Crossbowmen',fx:t=>{hpbF(t,'arc',10);hpbF(t,'xbow',10);S.tech[t].fa=1},ut:{k:'ut15',n:'Pavise',cost:{f:250,g:200},t:50,age:2,fx:t=>{atkbF(t,'genoa',2);hpbF(t,'genoa',15)}},ut2:{k:'ut15p',n:'Pirotechnia',cost:{f:650,g:500},t:50,age:3,fx:t=>{S.tech[t].pirotechnia=1}},elite:{k:'eliteGenoeseCrossbowman',n:'Elite Genoese Crossbowman',cost:{f:900,g:750},t:45,age:3,hpb:{genoa:5},atkb:{genoa:2},armor:{p:1}}},
{n:'Slavs',uu:'boyar',d:'Farms +15%, +100 wood; Boyars',fx:t=>{S.tech[t].fa=1;S.res[t].w+=100},ut:{k:'ut16',n:'Detinets',cost:{f:300,g:250},t:50,age:2,fx:t=>{hpbF(t,'boyar',40);hpbF(t,'knight',10)}},ut2:{k:'ut16p',n:'Druzhina',cost:{f:1200,g:500},t:60,age:3,fx:t=>{S.tech[t].druzhina=1}},elite:{k:'eliteBoyar',n:'Elite Boyar',cost:{f:1000,g:600},t:50,age:3,hpb:{boyar:20},atkb:{boyar:3},armor:{m:2}}},
{n:'Huns',teamWork:{stable:1.2},uu:'tarkan',d:'Cavalry +10 HP, +100 food; Tarkans',fx:t=>{hpbF(t,'scout',10);hpbF(t,'knight',10);hpbF(t,'camel',10);S.res[t].f+=100},ut:{k:'ut17',n:'Marauders',cost:{f:250,g:200},t:50,age:2,fx:t=>{atkbF(t,'tarkan',3);hpbF(t,'tarkan',20)}},ut2:{k:'ut17p',n:'Atheism',cost:{f:500,g:500},t:60,age:3,fx:t=>{S.tech[t].atheism=1}},elite:{k:'eliteTarkan',n:'Elite Tarkan',cost:{f:1000,g:500},t:40,age:3,hpb:{tarkan:20},atkb:{tarkan:3},bonus:{building:3}}},
{n:'Goths',teamWork:{bar:1.2},uu:'huskarl',d:'Infantry +15 HP, +100 food; Huskarls',fx:t=>{hpbF(t,'mil',15);hpbF(t,'spear',15);hpbF(t,'huskarl',15);S.res[t].f+=100},ut:{k:'ut18',n:'Anarchy',cost:{f:450,g:250},t:40,age:2,fx:t=>{S.tech[t].anarchy=1}},ut2:{k:'ut18p',n:'Perfusion',cost:{w:400,g:600},t:40,age:3,fx:t=>{S.tech[t].perfusion=1}},baseBonus:{archer:6},elite:{k:'eliteHuskarl',n:'Elite Huskarl',cost:{f:1200,g:550},t:40,age:3,hpb:{huskarl:10},atkb:{huskarl:2},armor:{p:2},bonus:{archer:4,building:2}}},
{n:'Aztecs',teamEconomic:{relicGold:4/3},uu:'jaguar',d:'Villagers carry more, +100 gold; Jaguar Warriors',fx:t=>{S.tech[t].carry=1;S.res[t].g+=100},ut:{k:'ut19',n:'Garland Wars',cost:{f:450,g:750},t:60,age:3,fx:t=>{S.tech[t].garlandWars=1}},ut2:{k:'ut19p',n:'Atlatl',cost:{f:400,g:350},t:40,age:2,fx:t=>{S.tech[t].atlatl=1}},elite:{k:'eliteJaguarWarrior',n:'Elite Jaguar Warrior',cost:{f:1000,g:500},t:45,age:3,hpb:{jaguar:15},atkb:{jaguar:2},bonus:{infantry:2}}},
{n:'Mayans',uu:'plumed',d:'Archers +15 HP, faster hunting; Plumed Archers',fx:t=>{hpbF(t,'arc',15);hpbF(t,'xbow',10);S.tech[t].hunt=1},ut:{k:'ut20',n:'Hulche Javelins',cost:{f:250,w:200},t:50,age:2,fx:t=>{atkbF(t,'plumed',2);atkbF(t,'skirm',2)}},ut2:{k:'ut20p',n:'El Dorado',cost:{f:750,g:450},t:70,age:3,fx:t=>{hpbF(t,'eagle',40);for(const u of S.us)if(u.t===t&&u.k==='eagle'&&u.hp>0)u.hp+=40}},elite:{k:'elitePlumedArcher',n:'Elite Plumed Archer',cost:{f:700,g:1000},t:50,age:3,hpb:{plumed:15},atkb:{plumed:1},armor:{p:1}}},
{n:'Incas',uu:'kamayuk',d:'Miners +15%, spearmen +1 attack; Kamayuks',fx:t=>{S.tech[t].mn=1;atkbF(t,'spear',1)},ut:{k:'ut21',n:'Andean Sling',cost:{f:250,g:200},t:50,age:2,fx:t=>{atkbF(t,'kamayuk',3);hpbF(t,'kamayuk',15)}},ut2:{k:'ut21p',n:'Fabric Shields',cost:{f:600,g:600},t:60,age:3,fx:t=>{S.tech[t].fabricShields=1}},elite:{k:'eliteKamayuk',n:'Elite Kamayuk',cost:{f:900,g:500},t:40,age:3,hpb:{kamayuk:15},atkb:{kamayuk:2},armor:{m:1}}},
{n:'Ethiopians',uu:'shotel',d:'Start +100 food and gold; Shotel Warriors',fx:t=>{S.res[t].f+=100;S.res[t].g+=100},ut:{k:'ut22',n:'Royal Heirs',cost:{f:300,g:200},t:50,age:2,fx:t=>{atkbF(t,'shotel',3);hpbF(t,'shotel',10)}},ut2:{k:'ut22p',n:'Torsion Engines',cost:{f:1000,g:600},t:60,age:3,fx:t=>{S.tech[t].torsionEngines=1}},elite:{k:'eliteShotelWarrior',n:'Elite Shotel Warrior',cost:{f:1200,g:550},t:40,age:3,hpb:{shotel:10},atkb:{shotel:2},armor:{p:1}}},
{n:'Malians',teamWork:{univ:1.8},uu:'gbeto',d:'Infantry +1 attack, farms +15%; Gbeto',fx:t=>{atkbF(t,'mil',1);atkbF(t,'spear',1);S.tech[t].fa=1},ut:{k:'ut23',n:'Tigui',cost:{f:250,g:200},t:50,age:2,fx:t=>{atkbF(t,'gbeto',2);hpbF(t,'gbeto',10)}},ut2:{k:'ut23p',n:'Farimba',cost:{f:650,g:400},t:60,age:3,fx:t=>{S.tech[t].farimba=1}},elite:{k:'eliteGbeto',n:'Elite Gbeto',cost:{f:900,g:600},t:40,age:3,hpb:{gbeto:10},atkb:{gbeto:3},armor:{p:1}}},
{n:'Koreans',uu:'wagon',d:'Walls and gates +80% HP, siege +20 HP; War Wagons',fx:t=>{S.tech[t].fw=1;hpbF(t,'mang',20);hpbF(t,'ram',20)},ut:{k:'ut24',n:'Shinkichon',cost:{f:1100,g:800},t:60,age:3,fx:t=>{S.tech[t].shinkichon=1}},ut2:{k:'ut24p',n:'Eupseong',cost:{f:300,w:300},t:40,age:2,fx:t=>{S.tech[t].eupseong=1}},elite:{k:'eliteWarWagon',n:'Elite War Wagon',cost:{f:1000,g:600},t:75,age:3,hpb:{wagon:30},atkb:{wagon:4},armor:{p:1}}},
{n:'Magyars',uu:'huszar',d:'Cavalry +1 attack, +100 wood; Magyar Huszars',fx:t=>{atkbF(t,'scout',1);atkbF(t,'knight',1);S.res[t].w+=100},ut:{k:'ut25',n:'Corvinian Army',cost:{f:300,g:200},t:50,age:2,fx:t=>{atkbF(t,'huszar',2);hpbF(t,'huszar',20)}},ut2:{k:'ut25p',n:'Recurve Bow',cost:{w:600,g:400},t:40,age:3,fx:t=>{S.tech[t].recurveBow=1}},elite:{k:'eliteMagyarHuszar',n:'Elite Magyar Huszar',cost:{f:800,g:600},t:40,age:3,hpb:{huszar:15},atkb:{huszar:3},armor:{m:1}}},
{n:'Portuguese',teamResearch:1.25,uu:'orgun',d:'Naval/gunpowder, discounted gold units; Organ Guns and Caravels',fx:t=>{
 S.tech[t].portugueseGold=1;
 for(const k of Object.keys(U))if(U[k].sh)hpbF(t,k,Math.round(U[k].hp*.1));
},ut:{k:'ut26',n:'Carrack',cost:{w:400,g:300},t:50,age:2,fx:t=>{S.tech[t].carrack=1}},
ut2:{k:'ut26p',n:'Arquebus',cost:{w:600,g:400},t:60,age:3,fx:t=>{S.tech[t].arquebus=1}},
elite:{k:'eliteOrganGun',n:'Elite Organ Gun',cost:{f:900,g:650},t:60,age:3,hpb:{orgun:10},atkb:{orgun:2},armor:{p:1}}},
{n:'Burmese',uu:'arambai',d:'Infantry and elephants; Arambai',fx:t=>{S.tech[t].burmeseInfantry=1},
ut:{k:'ut27',n:'Manipur Cavalry',cost:{f:300,g:300},t:40,age:2,fx:t=>{S.tech[t].manipurCavalry=1}},
ut2:{k:'ut27p',n:'Howdah',cost:{f:400,s:300},t:40,age:3,fx:t=>{S.tech[t].howdah=1}},
elite:{k:'eliteArambai',n:'Elite Arambai',cost:{f:1000,g:750},t:55,age:3,hpb:{arambai:5},atkb:{arambai:2},armor:{p:1}}},
{n:'Vietnamese',uu:'rattan',d:'Durable ranged units; Rattan Archers',fx:t=>{
 for(const k of ['arc','xbow','skirm','cavarch'])hpbF(t,k,Math.round(U[k].hp*.2));
},ut:{k:'ut28',n:'Chatras',cost:{f:400,g:300},t:50,age:2,hpb:{batele:100},fx:t=>{S.tech[t].chatras=1}},
ut2:{k:'ut28p',n:'Paper Money',cost:{w:300,g:450},t:55,age:3,fx:t=>{S.tech[t].paperMoney=1}},
elite:{k:'eliteRattanArcher',n:'Elite Rattan Archer',cost:{w:1000,g:750},t:45,age:3,hpb:{rattan:5},atkb:{rattan:1},armor:{p:1}}},
{n:'Bulgarians',teamWork:{smith:1.8},uu:'konnik',d:'Dismounting Konnik cavalry and Krepost stronghold; Stirrups and Bagains',fx:t=>{S.tech[t].bulgarianInfantry=1},
 ut:{k:'ut29',n:'Stirrups',cost:{f:300,g:200},t:40,age:2,fx:t=>{S.tech[t].stirrups=1}},
 ut2:{k:'ut29p',n:'Bagains',cost:{f:900,g:450},t:60,age:3,fx:t=>{S.tech[t].bagains=1}},
 elite:{k:'eliteKonnik',n:'Elite Konnik',cost:{f:1000,g:750},t:65,age:3,hpb:{konnik:20},atkb:{konnik:2},armor:{m:1}}},
{n:'Tatars',uu:'keshik',d:'Keshik raiding cavalry and Steppe Lancers; Silk Armor and Timurid Siegecraft',fx:t=>{S.tech[t].tatarPasture=1},
 ut:{k:'ut30',n:'Silk Armor',cost:{w:400,g:300},t:40,age:2,fx:t=>{S.tech[t].silkArmor=1}},
 ut2:{k:'ut30p',n:'Timurid Siegecraft',cost:{w:500,g:400},t:60,age:3,fx:t=>{S.tech[t].timuridSiegecraft=1}},
 elite:{k:'eliteKeshik',n:'Elite Keshik',cost:{f:950,g:700},t:60,age:3,hpb:{keshik:20},atkb:{keshik:2},armor:{p:1}}},
{n:'Cumans',uu:'kipchak',d:'Fast mounted archers and Steppe Lancers; Steppe Husbandry and Cuman Mercenaries',fx:t=>{S.tech[t].cumanCavalry=1},
 ut:{k:'ut31',n:'Steppe Husbandry',cost:{f:400,g:300},t:50,age:2,fx:t=>{S.tech[t].steppeHusbandry=1}},
 ut2:{k:'ut31p',n:'Cuman Mercenaries',cost:{f:650,g:500},t:55,age:3,fx:t=>{S.tech[t].cumanMercenaries=1}},
 elite:{k:'eliteKipchak',n:'Elite Kipchak',cost:{w:1000,g:700},t:55,age:3,hpb:{kipchak:10},atkb:{kipchak:1},armor:{p:1}}},
{n:'Lithuanians',teamWork:{monastery:1.2},uu:'leitis',d:'Mobile spears/skirmishers and relic-backed Leitis cavalry; Hill Forts and Tower Shields',fx:t=>{S.tech[t].lithMobility=1},
 ut:{k:'ut32',n:'Hill Forts',cost:{f:250,g:250},t:40,age:2,fx:t=>{S.tech[t].hillForts=1}},
 ut2:{k:'ut32p',n:'Tower Shields',cost:{f:500,g:200},t:40,age:3,fx:t=>{S.tech[t].towerShields=1}},
 elite:{k:'eliteLeitis',n:'Elite Leitis',cost:{f:750,g:750},t:50,age:3,hpb:{leitis:20},atkb:{leitis:2},armor:{p:1}}},
{n:'Burgundians',uu:'coust',d:'Charged Coustillier cavalry and Flemish Militia, cheaper early economy; Vineyards and Flemish Revolution',fx:t=>{S.tech[t].burgundianEconomy=1},
 ut:{k:'ut33',n:'Burgundian Vineyards',cost:{f:400,g:300},t:50,age:2,fx:t=>{S.tech[t].vineyards=1}},
 ut2:{k:'ut33p',n:'Flemish Revolution',cost:{f:200,g:150},t:10,age:3,fx:t=>{
  for(const u of S.us)if(u.t===t&&u.k==='vil'&&u.hp>0&&!u.ld){
   u.k='flemish';u.hp=U.flemish.hp+(S.tech[t].hpb?.flemish||0);
   u.o='i';u.tg=null;u.p=[];u.ret=0;u.car=0;u.ct=null;u.autoWorker=0;
   u.cd=0;u.wind=0;u.windTarget=null;
  }
 }},
 elite:{k:'eliteCoustillier',n:'Elite Coustillier',cost:{f:950,g:800},t:60,age:3,hpb:{coust:20},atkb:{coust:2},armor:{p:1}}},
{n:'Sicilians',uu:'serjeant',d:'Fortified infantry can build Donjons; First Crusade and Hauberk',
 fx:t=>{hpbF(t,'serjeant',5)},
 ut:{k:'ut34',n:'First Crusade',cost:{f:300,g:600},t:50,age:2,fx:t=>{
  // Grant up to five real Serjeants per owned Town Centre, at most 25,
  // respecting current population limits and open spawn cells.
  let summoned=0;
  for(const tc of S.bs)if(tc.t===t&&tc.k==='tc'&&tc.hp>0&&tc.done){
   for(let i=0;i<5&&summoned<25;i++){
    if(livePopulation(t)>=capOf(t))return;
    const pos=spawnPos(tc);if(!pos)break;
    addU(t,'serjeant',pos[0],pos[1]);summoned++;
   }
  }
 }},
 ut2:{k:'ut34p',n:'Hauberk',cost:{f:500,g:400},t:60,age:3,fx:t=>{S.tech[t].hauberk=1}},
 elite:{k:'eliteSerjeant',n:'Elite Serjeant',cost:{f:800,g:650},t:45,age:3,
  hpb:{serjeant:15},atkb:{serjeant:2},armor:{m:1,p:1}}},
{n:'Poles',uu:'obuch',d:'Folwark farming, armour-stripping Obuch and discounted Knights',
 fx:t=>{S.tech[t].polishFarms=1},
 teamCombat:{scoutVsArcher:1},
 ut:{k:'ut35',n:'Szlachta Privileges',cost:{f:500,g:300},t:45,age:2,
  fx:t=>{S.tech[t].szlachtaPrivileges=1}},
 ut2:{k:'ut35p',n:'Lechitic Legacy',cost:{f:750,g:550},t:60,age:3,
  fx:t=>{S.tech[t].lechiticLegacy=1}},
 elite:{k:'eliteObuch',n:'Elite Obuch',cost:{f:800,g:600},t:55,age:3,
  hpb:{obuch:15},atkb:{obuch:2},armor:{m:1,p:1}}}];
CIV.forEach(c=>{TE[c.ut.k]=c.ut;if(c.ut2)TE[c.ut2.k]=c.ut2;if(c.elite)TE[c.elite.k]=c.elite});

/* Common Elite unique-unit research effects. Keep unit-specific values with
 * CIV rather than repeating one combat, label and range branch per civilization.
 * Research is authorized through rsOf; these helpers only read the team's
 * confirmed research and matching unique unit. */
function eliteUniqueUnitUpgrade(k,t){
 const civ=Number.isInteger(t)?CIV[S?.civ?.[t]]:null;
 return civ?.uu===k&&civ.elite&&S?.tech?.[t]?.[civ.elite.k]?civ.elite:null;
}
function civilizationUniqueUnitTargetBonus(a,target){
 const civ=Number.isInteger(a?.t)?CIV[S?.civ?.[a.t]]:null;
 if(!civ||civ.uu!==a.k)return 0;
 const elite=eliteUniqueUnitUpgrade(a.k,a.t);
 const base=civ.baseBonus||{},extra=elite?.bonus||{};
 if(target.s)return (base.building||0)+(extra.building||0);
 let n=0;
 if(ARCHARM.has(target.k))n+=(base.archer||0)+(extra.archer||0);
 if(INFARM.has(target.k))n+=(base.infantry||0)+(extra.infantry||0);
 if(U[target.k]?.sg||target.k==='scor')n+=(base.siege||0)+(extra.siege||0);
 return n;
}
