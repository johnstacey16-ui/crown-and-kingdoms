import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';
const {source,sandbox,storage,listeners}=headlessGame();
assert.ok(source.length > 200000, 'The external real game engine must be present');

const harness = `
let aiPeak = {};
const aiMilitaryCount = (team) => S.us.filter((u) => u.t === team && u.hp > 0 && u.k !== 'vil' && !U[u.k].sh && !['king', 'cart', 'mon'].includes(u.k)).length;
globalThis.__CK_TEST__ = {
  start(seed, age = 0) { restoreCampaignPrefs(); seedOv = seed; cmp = null; gameMode = 0; startAge = age; start(); aiPeak = {}; for (let team = 1; team < S.teamN; team++) aiPeak[team] = aiMilitaryCount(team); },
  auditSaveTimersAndRng() {
    const u=S.us[0]; u.rp=-3.25; u.cd=-.1;
    const saved=saveG();
    const expected=Array.from({length:8},()=>S.r());
    const loaded=loadG();
    const actual=Array.from({length:8},()=>S.r());
    const snapshot=JSON.parse(localStorage.getItem(skey(slot)));
    const invalidRejected=[-1,4294967296,1.5,null,'42'].every(value=>{
      localStorage.setItem(skey(slot),JSON.stringify({...snapshot,rngState:value}));
      const before=S;return loadG()===false&&S===before;
    });
    delete snapshot.rngState;
    localStorage.setItem(skey(slot),JSON.stringify(snapshot));
    const legacyLoaded=loadG();
    return {saved,loaded,expected,actual,invalidRejected,legacyLoaded,rp:S.us[0].rp,cd:S.us[0].cd,scores:S.scoreCache.length};
  },
  startMap(seed, mapIndex, teams = 4) { seedOv = seed; mt = mapIndex; mapLayout = 0; msz = 0; kingdoms = teams; cmp = null; gameMode = 0; startAge = 0; startArmy = 0; start(); seedOv = null; return this.state(); },
  startLayout(layoutIndex, teams = 4) { mapLayout = layoutIndex; applyMapLayout(); kingdoms = teams; msz = 0; cmp = null; gameMode = 0; startAge = 0; startArmy = 0; start(); seedOv = null; return this.state(); },
  auditMapStarts(starts) { return auditGeneratedMap(starts); },
  startCampaign(index) { startScenario(index); return this.state(); },
  playCampaignScenario(index = 0, maxSeconds = 240) {
    this.startCampaign(index);
    const plan = index === 0 ? { buildings: [{ kind: 'house', count: 1 }, { kind: 'lumber', count: 1 }, { kind: 'bar', count: 1 }], villagers: 10, soldiers: 4, ages: 1 } : index === 1 ? { buildings: [{ kind: 'house', count: 1 }, { kind: 'bar', count: 1 }], villagers: 0, soldiers: 8, ages: 1 } : index === 2 ? { buildings: [{ kind: 'lumber', count: 1 }, { kind: 'mill', count: 1 }, { kind: 'market', count: 1 }, { kind: 'tower', count: 2 }, { kind: 'bar', count: 1 }], villagers: 0, soldiers: 4, ages: 2 } : index === 3 || index === 11 ? { buildings: [{ kind: 'monastery', count: 1 }], villagers: 0, soldiers: 0, ages: 2 } : index === 4 || index === 8 ? { buildings: [], villagers: 0, soldiers: 0, ages: 2, units: { ram: 1 }, attack: true } : index === 9 ? { buildings: [], villagers: 0, soldiers: 0, ages: 2, units: { ram: 1 }, attack: true } : index === 5 ? { buildings: [{ kind: 'house', count: 1 }, { kind: 'lumber', count: 1 }, { kind: 'mill', count: 1 }, { kind: 'bar', count: 1 }], villagers: 0, soldiers: 0, ages: 1, units: { mil: 8 }, attack: true } : index === 6 ? { buildings: [{ kind: 'tower', count: 1 }, { kind: 'rng', count: 1 }], villagers: 0, soldiers: 0, ages: 1, units: { arc: 6 } } : index === 7 ? { buildings: [{ kind: 'market', count: 1 }, { kind: 'tower', count: 2 }, { kind: 'bar', count: 1 }], villagers: 0, soldiers: 4, ages: 1 } : index === 12 ? { buildings: [{ kind: 'dock', count: 1 }, { kind: 'siege', count: 1 }], villagers: 0, soldiers: 0, ages: 2, units: { gal: 3, ram: 2 }, attack: true } : index === 10 ? { buildings: [{ kind: 'market', count: 1 }, { kind: 'tower', count: 2 }, { kind: 'bar', count: 1 }], villagers: 0, soldiers: 4, ages: 1 } : index === 13 ? { buildings: [{ kind: 'monastery', count: 1 }, { kind: 'siege', count: 1 }], villagers: 0, soldiers: 0, ages: 2, units: { ram: 2, gal: 3 }, attack: true } : index === 14 ? { buildings: [{ kind: 'siege', count: 1 }], villagers: 0, soldiers: 0, ages: 3, units: { bomb: 2 }, attack: true } : index === 15 ? { buildings: [{ kind: 'tower', count: 2 }, { kind: 'wall', count: 6 }], villagers: 0, soldiers: 0, ages: 2 } : index === 16 ? { buildings: [{ kind: 'dock', count: 1 }, { kind: 'tower', count: 2 }], villagers: 0, soldiers: 0, ages: 2, units: { gal: 3, ram: 2 }, attack: true } : index === 17 ? { buildings: [{ kind: 'castle', count: 2 }, { kind: 'siege', count: 1 }], villagers: 0, soldiers: 0, ages: 3, units: { bomb: 2 }, attack: true } : index === 18 ? { buildings: [{ kind: 'tower', count: 2 }, { kind: 'bar', count: 1 }], villagers: 0, soldiers: 8, ages: 1 } : null;
    if (!plan) throw new Error('No scripted-player plan exists for campaign mission ' + (index + 1));
    const tc = S.bs.find(building => building.t === 0 && building.k === 'tc' && building.done && building.hp > 0);
    if (!tc) throw new Error('Campaign bot requires a live Town Centre');
    const assignFood = unit => {
      const node = S.nodes.filter(n => n && n.k === 'f' && n.amt > 0)
        .sort((a, b) => Math.hypot(a.x - unit.x, a.y - unit.y) - Math.hypot(b.x - unit.x, b.y - unit.y))[0];
      if (!node) return false;
      unit.o = 'g'; unit.tg = node; unit.ct = 'f'; unit.car = 0; unit.ret = 0; unit.p = []; unit.rp = 0;
      return true;
    };
    const assignWood = unit => {
      const node = S.nodes.filter(n => n && n.k === 'w' && n.amt > 0)
        .sort((a, b) => Math.hypot(a.x - unit.x, a.y - unit.y) - Math.hypot(b.x - unit.x, b.y - unit.y))[0];
      if (!node) return false;
      unit.o = 'g'; unit.tg = node; unit.ct = 'w'; unit.car = 0; unit.ret = 0; unit.p = []; unit.rp = 0;
      return true;
    };
    const assignGold = unit => {
      const node = S.nodes.filter(n => n && n.k === 'g' && n.amt > 0)
        .sort((a, b) => Math.hypot(a.x - unit.x, a.y - unit.y) - Math.hypot(b.x - unit.x, b.y - unit.y))[0];
      if (!node) return false;
      unit.o = 'g'; unit.tg = node; unit.ct = 'g'; unit.car = 0; unit.ret = 0; unit.p = []; unit.rp = 0;
      return true;
    };
    const placeBuilding = (kind, count = 1) => {
      const existing = S.bs.filter(building => building.t === 0 && building.k === kind && building.hp > 0);
      if (existing.length >= count || existing.some(building => !building.done)) return true;
      if ((B[kind].age || 0) > S.age[0]) return false;
      if (!can(0, B[kind].cost)) return false;
      const workers = S.us.filter(unit => unit && unit.t === 0 && unit.k === 'vil' && unit.hp > 0 && !unit.ld);
      const available = workers.filter(unit => unit.o !== 'b' || !unit.tg || unit.tg.done);
      const worker = available.sort((a, b) => Math.hypot(a.x - (tc.x + tc.s / 2), a.y - (tc.y + tc.s / 2)) - Math.hypot(b.x - (tc.x + tc.s / 2), b.y - (tc.y + tc.s / 2)))[0];
      if (!worker) return false;
      let site = null;
      const originX = Math.floor(tc.x + tc.s / 2), originY = Math.floor(tc.y + tc.s / 2);
      for (let radius = 3; radius <= 18 && !site; radius++) {
        for (let dy = -radius; dy <= radius && !site; dy++) for (let dx = -radius; dx <= radius && !site; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
          const x = originX + dx, y = originY + dy;
          const candidate = { x, y, s: B[kind].s };
          if (okPlace(0, kind, x, y) && path(worker, goalNear(candidate, 1))) site = [x, y];
        }
      }
      if (!site) return false;
      pay(0, B[kind].cost);
      const building = addB(0, kind, site[0], site[1], false);
      worker.o = 'b'; worker.tg = building; worker.p = []; worker.rp = 0;
      return true;
    };
    for (const unit of S.us.filter(unit => unit && unit.t === 0 && unit.k === 'vil' && unit.hp > 0)) assignFood(unit);
    let trainingGate = null;
    for (let tick = 0; tick < Math.round(maxSeconds * 30) && !S.over; tick++) {
      const villagers = S.us.filter(unit => unit && unit.t === 0 && unit.k === 'vil' && unit.hp > 0).length;
      const queuedVillagers = tc.q.filter(queue => queue.k === 'vil').length;
      if (plan.villagers > 0 && villagers + queuedVillagers < plan.villagers && tc.q.length < 5) train(tc, 'vil');
      for (const entry of plan.buildings) {
        const existing = S.bs.filter(building => building.t === 0 && building.k === entry.kind && building.hp > 0).length;
        if (existing < entry.count) placeBuilding(entry.kind, entry.count);
      }
      if (S.age[0] < plan.ages && !tc.rs) research(tc, 'age');
      if (index === 3 || index === 11 || index === 13) {
        const monks = S.us.filter(unit => unit && unit.t === 0 && unit.k === 'mon' && unit.hp > 0 && !unit.ld);
        const reserved = new Set(monks.filter(unit => unit.o === 'r' && unit.tg && !unit.rel && !unit.tg.c && !unit.tg.m).map(unit => unit.tg));
        for (const monk of monks) {
          if (monk.rel || (monk.o === 'r' && monk.tg && !monk.tg.c && !monk.tg.m)) continue;
          const relic = S.rel.find(item => item.rl && !item.c && !item.m && !reserved.has(item));
          if (relic) { monk.o = 'r'; monk.tg = relic; monk.p = []; monk.rp = 0; reserved.add(relic); }
        }
      }
      const barracks = S.bs.find(building => building.t === 0 && building.k === 'bar' && building.done && building.hp > 0);
      const queuedMilitia = barracks ? barracks.q.filter(queue => queue.k === 'mil').length : 0;
      if (barracks && cmil(0) + queuedMilitia < plan.soldiers && barracks.q.length < 5) {
        if (S.age[0] < U.mil.age) trainingGate = 'Militia require Feudal Age, but this mission starts below that age';
        else train(barracks, 'mil');
      }
      const woodNeeded = index === 2 && S.res[0].w < 180;
      if (woodNeeded) {
        const woodWorker = S.us.find(unit => unit && unit.t === 0 && unit.k === 'vil' && unit.hp > 0 && !unit.ld && unit.o !== 'b');
        if (woodWorker) assignWood(woodWorker);
      }
      if (index === 6 && S.res[0].g < 120 && !S.us.some(unit => unit && unit.t === 0 && unit.k === 'vil' && unit.hp > 0 && unit.o === 'g' && unit.ct === 'g')) {
        const goldWorker = S.us.find(unit => unit && unit.t === 0 && unit.k === 'vil' && unit.hp > 0 && !unit.ld && unit.o === 'g' && unit.ct === 'f');
        if (goldWorker) assignGold(goldWorker);
      }
      for (const [unitKind, targetCount] of Object.entries(plan.units || {})) {
        if (U[unitKind] && U[unitKind].age > S.age[0]) { trainingGate = unitKind + ' requires age ' + U[unitKind].age; continue; }
        const live = S.us.filter(unit => unit && unit.t === 0 && unit.k === unitKind && unit.hp > 0).length;
        const producer = S.bs.find(building => building.t === 0 && building.done && building.hp > 0 && Array.isArray(B[building.k].tr) && B[building.k].tr.includes(unitKind));
        const queued = producer ? producer.q.filter(queue => queue.k === unitKind).length : 0;
        if (producer && live + queued < targetCount && producer.q.length < 5) train(producer, unitKind);
      }
      if (plan.attack && Object.entries(plan.units || {}).every(([unitKind, targetCount]) => S.us.filter(unit => unit && unit.t === 0 && unit.k === unitKind && unit.hp > 0).length >= targetCount)) {
        const enemyCastle = S.bs.find(building => building.t === 1 && building.k === 'castle' && building.hp > 0);
        const enemyTC = tcOf(1);
        const enemyKing = index === 5 ? S.us.find(unit => unit && unit.t === 1 && unit.k === 'king' && unit.hp > 0) : null;
        for (const unit of S.us.filter(unit => unit && unit.t === 0 && unit.hp > 0 && !unit.ld && U[unit.k] && U[unit.k].dmg > 0 && !['vil', 'mon', 'king', 'cart', 'cog'].includes(unit.k))) {
          const target = U[unit.k].sh
            ? (S.us.find(other => other && other.t === 1 && other.hp > 0 && U[other.k] && U[other.k].sh) || S.bs.find(building => building.t === 1 && building.k === 'dock' && building.hp > 0))
            : (enemyKing && !enemyKing.ld ? enemyKing : (enemyCastle || enemyTC));
          if (target && (unit.o !== 'a' || unit.tg !== target)) { unit.o = 'a'; unit.tg = target; unit.p = []; unit.rp = 0; }
        }
      }
      for (const unit of S.us.filter(unit => unit && unit.t === 0 && unit.k === 'vil' && unit.hp > 0 && !unit.ld)) {
        if (unit.o === 'i') assignFood(unit);
      }
      this.tick(1 / 30);
    }
    return {
      over: S.over, time: S.t, campaignTime: cmp.t, mode,
      age: S.age[0], trainingGate,
      objectives: CAMP[index].goals.map(goal => ({ title: goal.t, complete: !!cmp.d[goal.id], predicate: goal.ok() })),
      villagers: S.us.filter(unit => unit && unit.t === 0 && unit.k === 'vil' && unit.hp > 0).length,
      soldiers: cmil(0),
      buildings: S.bs.filter(building => building.t === 0 && building.done && building.hp > 0).map(building => building.k),
      unfinished: S.bs.filter(building => building.t === 0 && !building.done && building.hp > 0).map(building => ({ kind: building.k, x: building.x, y: building.y, progress: building.pr, builder: S.us.find(unit => unit && unit.t === 0 && unit.k === 'vil' && unit.tg === building)?.o || null })),
      workerOrders: S.us.filter(unit => unit && unit.t === 0 && unit.k === 'vil' && unit.hp > 0).map(unit => ({ order: unit.o, target: unit.tg?.k || null, loaded: !!unit.ld })),
      resources: { ...S.res[0] },
    };
  },
  auditCampaignGoalReachability() {
    const results = [];
    const addBuilding = (kind, count) => {
      for (let n = 0; n < count; n++) {
        const existing = S.bs.filter(b => b.t === 0 && b.k === kind && b.done && b.hp > 0).length;
        if (existing >= count) break;
        const slot = S.bs.length + n;
        addB(0, kind, 2 + (slot * 3) % Math.max(1, W - 8), 2 + (Math.floor(slot * 3 / Math.max(1, W - 8)) * 3) % Math.max(1, H - 8), true);
      }
    };
    const addUnits = (kind, count) => {
      for (let n = 0; n < count; n++) addU(0, kind, 4 + (n % 12), 4 + (Math.floor(n / 12) % 12));
    };
    for (let index = 0; index < CAMP.length; index++) {
      this.startCampaign(index);
      const scenario = CAMP[index];
      const initialTrue = scenario.goals.filter(goal => goal.ok()).map(goal => goal.t);
      const failedPredicates = [];
      for (const goal of scenario.goals) {
        const title = goal.t;
        if (/House/.test(title)) addBuilding('house', 1);
        if (/Lumber Camp/.test(title)) addBuilding('lumber', 1);
        if (/Barracks/.test(title)) addBuilding('bar', 1);
        if (/Market/.test(title)) addBuilding('market', 1);
        if (/Monastery/.test(title)) addBuilding('monastery', 1);
        if (/Dock/.test(title)) addBuilding('dock', 1);
        if (/Siege Workshop/.test(title)) addBuilding('siege', 1);
        if (/Wall sections/.test(title)) addBuilding('wall', 6);
        if (/2 completed Castles/.test(title)) addBuilding('castle', 2);
        if (/2 (?:completed )?Towers/.test(title)) addBuilding('tower', 2);
        if (/Watch Tower/.test(title)) addBuilding('tower', 1);
        if (/villagers/.test(title)) addUnits('vil', 10);
        if (/Train 4 soldiers/.test(title)) addUnits('mil', 4);
        if (/Train 8 soldiers/.test(title)) addUnits('mil', 8);
        if (/ranged soldiers/.test(title)) addUnits('arc', 6);
        if (/3 War Galleys/.test(title)) addUnits('gal', 3);
        if (/Bombard Cannons/.test(title)) addUnits('bomb', 2);
        if (/12 land soldiers/.test(title)) addUnits('knight', 12);
        if (/8 land soldiers/.test(title)) addUnits('spear', 8);
        if (/15 land soldiers/.test(title)) addUnits('spear', 15);
        if (/Reach the (?:Feudal|Castle) Age/.test(title)) S.age[0] = 3;
        if (/8:00/.test(title)) cmp.t = Math.max(cmp.t, 480);
        if (/10:00/.test(title)) cmp.t = Math.max(cmp.t, 600);
        if (/9:00/.test(title)) cmp.t = Math.max(cmp.t, 540);
        if (/relics/.test(title)) {
          const count = /3 relics/.test(title) ? 3 : 2;
          // Campaign victory requires a real, completed, living player Monastery.
          // An invented object resembling a Monastery is not valid game state.
          addBuilding('monastery', 1);
          const monastery = S.bs.find(b => b.t === 0 && b.k === 'monastery' && b.done && b.hp > 0);
          if (!monastery) throw new Error('Relic-objective fixture must have a live player Monastery');
          while (S.rel.filter(relic => relic.m && relic.m.t === 0 && relic.m.done && relic.m.hp > 0).length < count) {
            S.rel.push({ rl: 1, x: W / 2, y: H / 2, c: null, m: monastery });
          }
        }
        if (/Destroy .*Castle/.test(title)) {
          cmp.t = Math.max(cmp.t, 4);
          if (index === 4) cmp.d.cas = 1;
          S.bs.filter(building => building.t === 1 && building.k === 'castle').forEach(building => { building.hp = 0; });
        }
        if (/Destroy .*Town Centre/.test(title)) {
          cmp.t = Math.max(cmp.t, 4);
          S.bs.filter(building => building.t === 1 && building.k === 'tc').forEach(building => { building.hp = 0; });
        }
        if (/Slay the enemy King/.test(title)) {
          cmp.t = Math.max(cmp.t, 4);
          S.us.filter(unit => unit && unit.t === 1 && unit.k === 'king').forEach(unit => { unit.hp = 0; });
        }
      }
      for (const goal of scenario.goals) {
        try { if (goal.ok() !== true) failedPredicates.push(goal.t); }
        catch { failedPredicates.push(goal.t + ' (threw)'); }
      }
      for (let tick = 0; tick < 15; tick++) cmpTick(0.05);
      results.push({ index, initialTrue, failedPredicates, won: S.over === 'win', goals: scenario.goals.length });
    }
    const defeats = [];
    for (let index = 0; index < CAMP.length; index++) {
      this.startCampaign(index);
      const tc = S.bs.find(building => building.t === 0 && building.k === 'tc' && building.hp > 0);
      if (tc) tc.hp = 0;
      cmpTick(0.05);
      defeats.push({ index, lost: S.over === 'lose' });
    }
    this.startCampaign(5);
    S.us.filter(unit => unit && unit.t === 0 && unit.k === 'king').forEach(unit => { unit.hp = 0; });
    cmpTick(0.05);
    return { results, defeats, kingDefeat: S.over === 'lose' && S.why === 'Your King has fallen' };
  },
  exerciseTimedCampaignEvent() {
    this.startCampaign(0);
    const event = CAMP[0].ev[0];
    if (!event || !Number.isFinite(event.at)) throw new Error('First Hearth must expose its first timed event');
    const original = event.do;
    let calls = 0;
    event.do = () => { calls++; original(); };
    try {
      for (let tick = 0; tick < 240; tick++) cmpTick(0.05);
      const afterDueWindow = { calls, fired: !!cmp.e[0], time: cmp.t };
      for (let tick = 0; tick < 120; tick++) cmpTick(0.05);
      return { ...afterDueWindow, callsAfterRepeat: calls, firedAfterRepeat: !!cmp.e[0], timeAfterRepeat: cmp.t };
    } finally {
      event.do = original;
    }
  },
  exerciseCampaignDefeat() {
    localStorage.removeItem('ck_camp');
    this.startCampaign(0);
    const tc = S.bs.find(building => building.t === 0 && building.k === 'tc' && building.hp > 0);
    if (!tc) throw new Error('First Hearth must start with a living player Town Centre');
    tc.hp = 0;
    for (let tick = 0; tick < 15; tick++) cmpTick(0.05);
    return { over: S.over, mode, reason: S.why, campaignTime: cmp.t, savedCompletion: localStorage.getItem('ck_camp') };
  },
  exerciseCampaignCompletion() {
    this.startCampaign(0);
    const scenario = CAMP[0];
    const original = scenario.goals.map(goal => goal.ok);
    try {
      scenario.goals.forEach(goal => { goal.ok = () => false; });
      const pulse = () => { for (let tick = 0; tick < 15; tick++) cmpTick(0.05); };
      pulse();
      const before = { over: S.over, completed: { ...cmp.d }, mode };
      for (let index = 0; index < scenario.goals.length; index++) {
        scenario.goals[index].ok = () => true;
        pulse();
        if (index < scenario.goals.length - 1 && S.over === 'win') throw new Error('Campaign ended before all objectives were complete');
      }
      const won = { over: S.over, completed: { ...cmp.d }, mode, time: cmp.t };
      endA();
      return { before, won, nextBriefing: { mode, index: bi }, savedCompletion: JSON.parse(localStorage.getItem('ck_camp') || '{}') };
    } finally {
      scenario.goals.forEach((goal, index) => { goal.ok = original[index]; });
    }
  },
  exerciseKingHillControl() {
    this.start(123456);
    const previousVm = vm;
    const originalUnits = S.us;
    const center = { x: W / 2, y: H / 2 };
    const unit = (t, k, extra = {}) => ({ t, k, x: center.x, y: center.y, hp: 50, ...extra });
    try {
      vm = 5;
      S.over = null; S.why = ''; mode = 'play';
      S.kh = Array(S.teamN).fill(0);
      S.us = [unit(0, 'mil'), unit(1, 'mil')];
      kingHillControl(10);
      const contestedProgress = [...S.kh];
      S.us = [unit(0, 'vil'), unit(0, 'cart'), unit(0, 'gal')];
      kingHillControl(300);
      const excludedUnitsProgress = [...S.kh];
      S.over = null; S.why = ''; mode = 'play';
      S.kh = Array(S.teamN).fill(0);
      S.us = [unit(0, 'mil')];
      kingHillControl(299);
      const beforeWin = { progress: S.kh[0], over: S.over };
      kingHillControl(1);
      const playerWin = { progress: S.kh[0], over: S.over, reason: S.why };
      S.over = null; S.why = ''; mode = 'play';
      S.kh = Array(S.teamN).fill(0);
      S.us = [unit(1, 'mil')];
      kingHillControl(300);
      const enemyWin = { progress: S.kh[1], over: S.over, reason: S.why };
      return { contestedProgress, excludedUnitsProgress, beforeWin, playerWin, enemyWin };
    } finally {
      vm = previousVm;
      S.us = originalUnits;
      S.over = null; S.why = '';
      mode = 'play';
    }
  },
  auditCurrentCampaignObjectives() {
    if (!cmp || !CAMP[cmp.i]) return null;
    const goals = CAMP[cmp.i].goals || [];
    const ids = goals.map((goal) => goal && goal.id);
    let predicateErrors = 0;
    for (const goal of goals) {
      if (!goal || typeof goal.ok !== 'function') { predicateErrors++; continue; }
      try { if (typeof goal.ok() !== 'boolean') predicateErrors++; }
      catch { predicateErrors++; }
    }
    return { index: cmp.i, count: goals.length, ids, unique: ids.every((id) => typeof id === 'string' && id.length > 0) && new Set(ids).size === ids.length, predicateErrors };
  },
  auditCurrentCampaignEvents() {
    if (!cmp || !CAMP[cmp.i]) return null;
    const events = CAMP[cmp.i].ev || [];
    let invalid = 0;
    for (const event of events) {
      const hasTime = Number.isFinite(event?.at) && event.at >= 0;
      const hasCondition = typeof event?.when === 'function';
      if (typeof event?.do !== 'function' || (!hasTime && !hasCondition)) invalid++;
    }
    return { index: cmp.i, count: events.length, invalid };
  },
  exerciseAutosaveOverwrite() {
    if (!S || !Array.isArray(S.us) || !cmp) throw new Error('Autosave regression requires an active campaign state');
    const manualKeys = ['ck_save', 'ck_save2', 'ck_save3'];
    const manualBefore = manualKeys.map(key => localStorage.getItem(key));
    if (!saveG(true)) throw new Error('Initial autosave write failed');
    const firstRaw = localStorage.getItem('ck_autosave');
    if (!firstRaw) throw new Error('Autosave must use its dedicated single rolling slot');
    const first = JSON.parse(firstRaw);
    S.t += 60;
    if (!saveG(true)) throw new Error('Second autosave write failed');
    const secondRaw = localStorage.getItem('ck_autosave');
    const second = JSON.parse(secondRaw);
    const manualAfter = manualKeys.map(key => localStorage.getItem(key));
    S.t = 0;
    const loaded = loadG(true);
    return {
      firstTime: first.t,
      secondTime: second.t,
      overwritten: firstRaw !== secondRaw && second.t === first.t + 60,
      loaded,
      restoredTime: S.t,
      manualSlotsUnchanged: manualKeys.every((key, index) => manualBefore[index] === manualAfter[index]),
      autosaveCount: localStorage.getItem('ck_autosave') ? 1 : 0,
    };
  },
  saveLoadRoundTrip() {
    slot = 0;
    const snapshot = () => ({
      time: S.t,
      size: W,
      units: S.us.length,
      buildings: S.bs.length,
      nodeCount: S.nodes.length,
      resources: S.res.map((r) => ({ ...r })),
      technology: S.tech.map((t) => ({ ...t })),
      campaign: cmp ? { index: cmp.i, time: cmp.t, goals: { ...cmp.d }, events: { ...cmp.e } } : null,
    });
    const before = snapshot();
    saveG();
    const stored = localStorage.getItem(skey(slot));
    if (!stored) throw new Error('Saving the active match did not write a local save slot');
    const payload = JSON.parse(stored);
    if (payload.v !== 1) throw new Error('Saved game did not use the supported save format');
    S.us.length = 0;
    S.bs.length = 0;
    S.nodes.length = 0;
    S.rel.length = 0;
    S.res[0].f = -12345;
    if (S.tech[0]) S.tech[0].cons = !S.tech[0].cons;
    cmp = null;
    const loaded = loadG();
    return { loaded, version: payload.v, bytes: stored.length, before, after: snapshot() };
  },
  tick(dt) { step(dt); for (let team = 1; team < S.teamN; team++) aiPeak[team] = Math.max(aiPeak[team] || 0, aiMilitaryCount(team)); },
  runSkirmish(seconds = 60) {
    kingdoms = 4;
    this.start(24680);
    for (let tick = 0; tick < Math.round(seconds * 30); tick++) this.tick(1 / 30);
    return {
      time: S.t, teams: S.teamN, width: W, height: H, units: S.us.length, buildings: S.bs.length,
      invalidUnits: S.us.filter(u => !u || !Number.isFinite(u.x) || !Number.isFinite(u.y) || u.x < 0 || u.y < 0 || u.x >= W || u.y >= H || !Number.isFinite(u.hp)).length,
      invalidBuildings: S.bs.filter(b => !b || !Number.isFinite(b.x) || !Number.isFinite(b.y) || b.x < 0 || b.y < 0 || b.x >= W || b.y >= H || !Number.isFinite(b.hp)).length,
      invalidResources: S.res.filter(r => !r || !['f','w','g','s'].every(k => Number.isFinite(r[k]) && r[k] >= 0)).length,
    };
  },

  runFourKingdomWar(economySeconds = 360, combatSeconds = 60) {
    kingdoms = 4;
    this.start(86420);
    const ticksPerSecond = 30;
    const runTicks = (seconds) => {
      for (let tick = 0; tick < Math.round(seconds * ticksPerSecond); tick++) { this.tick(1 / ticksPerSecond); aiTeam(0, 1 / ticksPerSecond); }
    };
    const snapshot = () => Array.from({ length: 4 }, (_, team) => {
      const units = S.us.filter(u => u && u.t === team && u.hp > 0);
      const buildings = S.bs.filter(b => b && b.t === team && b.hp > 0);
      const resources = S.res[team] || {};
      return {
        team, units: units.length, buildings: buildings.length,
        villagers: units.filter(u => u.k === 'vil').length,
        military: aiMilitaryCount(team),
        gathering: units.filter(u => u.o === 'g' && u.tg && Number.isFinite(u.tg.amt)).length,
        constructing: units.filter(u => u.o === 'b' || u.o === 'build').length,
        resources: { food: resources.f || 0, wood: resources.w || 0, gold: resources.g || 0, stone: resources.s || 0 },
        buildingKinds: buildings.reduce((out, b) => { out[b.k] = (out[b.k] || 0) + 1; return out; }, {}),
      };
    });
    const before = snapshot();
    runTicks(economySeconds);
    const economy = snapshot();

    // Preserve the developed economies, then order each surviving army against
    // the next kingdom. This makes the second phase a genuine live-engine war.
    for (let team = 0; team < 4; team++) {
      const enemies = S.us.filter(u => u && u.t !== team && u.hp > 0);
      for (const unit of S.us.filter(u => u && u.t === team && u.hp > 0 && u.k !== 'vil' && u.k !== 'cart' && u.k !== 'fish' && u.k !== 'trn' && u.k !== 'cog')) {
        let target = null, best = Infinity;
        for (const enemy of enemies) {
          const distance = Math.hypot(enemy.x - unit.x, enemy.y - unit.y);
          if (distance < best) { best = distance; target = enemy; }
        }
        if (target) { unit.o = 'a'; unit.tg = target; unit.p = []; }
      }
    }
    runTicks(combatSeconds);
    const after = snapshot();
    const invalidUnits = S.us.filter(u => !u || !Number.isFinite(u.x) || !Number.isFinite(u.y) || u.x < 0 || u.y < 0 || u.x >= W || u.y >= H || !Number.isFinite(u.hp)).length;
    const invalidBuildings = S.bs.filter(b => !b || !Number.isFinite(b.x) || !Number.isFinite(b.y) || b.x < 0 || b.y < 0 || b.x >= W || b.y >= H || !Number.isFinite(b.hp)).length;
    const invalidResources = S.res.filter(r => !r || !['f','w','g','s'].every(k => Number.isFinite(r[k]) && r[k] >= 0)).length;
    return {
      teams: S.teamN, economySeconds, combatSeconds, simulatedSeconds: S.t,
      before, economy, after, invalidUnits, invalidBuildings, invalidResources,
      elapsedMs: 0,
    };
  },
  auditHusbandrySpeeds() {
    const previous = S.tech[0].husb;
    try {
      S.tech[0].husb = 1;
      return {
        knight: unitSpeed({ t: 0, k: 'knight' }),
        infantry: unitSpeed({ t: 0, k: 'mil' }),
        transport: unitSpeed({ t: 0, k: 'trn' }),
        transportBase: U.trn.sp,
        conqMounted: CAVARM.has('conq'),
      };
    } finally {
      if (previous === undefined) delete S.tech[0].husb;
      else S.tech[0].husb = previous;
    }
  },
  auditConscriptionRates() {
    const previous = S.tech[0].cons;
    try {
      S.tech[0].cons = 1;
      return {
        barracks: trainRate({ t: 0, k: 'bar' }, 'mil'),
        castle: trainRate({ t: 0, k: 'castle' }, 'knight'),
        monastery: trainRate({ t: 0, k: 'monastery' }, 'mon'),
        galley: trainRate({ t: 0, k: 'dock' }, 'gal'),
        villager: trainRate({ t: 0, k: 'tc' }, 'vil'),
        cart: trainRate({ t: 0, k: 'market' }, 'cart'),
        fish: trainRate({ t: 0, k: 'dock' }, 'fish'),
        transport: trainRate({ t: 0, k: 'dock' }, 'trn'),
        tradeCog: trainRate({ t: 0, k: 'dock' }, 'cog'),
      };
    } finally {
      if (previous === undefined) delete S.tech[0].cons;
      else S.tech[0].cons = previous;
    }
  },
  auditAttackResearchDamage() {
    const attacker = { t: 0, k: 'mil', x: 8, y: 8, hp: 100 };
    const target = { t: 1, k: 'mil', x: 9, y: 8, hp: 100000, dead: 0 };
    const tech = S.tech[0], keys = ['forging','ironCasting','blastFurnace','atkR','atkR2'];
    const prior = Object.fromEntries(keys.map(k=>[k,tech[k]]));
    const oldHp = target.hp, oldDead = target.dead;
    const damage = enabled => {
      for (const key of keys) delete tech[key];
      for (const key of enabled) tech[key]=1;
      target.hp = 100000; target.dead = 0;
      dmgT(attacker, target);
      return 100000 - target.hp;
    };
    try {
      const meleeBase = damage([]);
      const meleeBasic = damage(['forging']);
      const meleeIntermediate = damage(['forging','ironCasting']);
      const meleeAdvanced = damage(['forging','ironCasting','blastFurnace']);
      attacker.k = 'xbow';
      const rangedBase = damage([]);
      const rangedBasic = damage(['atkR']);
      const rangedAdvanced = damage(['atkR2']);
      return { meleeBase, meleeBasic, meleeIntermediate, meleeAdvanced, rangedBase, rangedBasic, rangedAdvanced };
    } finally {
      attacker.k = 'mil';
      target.hp = oldHp; target.dead = oldDead;
      for (const key of keys) {
        delete tech[key];
        if (prior[key] !== undefined) tech[key]=prior[key];
      }
    }
  },
  auditArmourResearchDamage() {
    const attacker = { t: 0, k: 'mil', x: 8, y: 8, hp: 100 };
    const target = { t: 1, k: 'mil', x: 9, y: 8, hp: 100000, dead: 0 };
    const armour = S.tech[1];
    const oldArmI = armour.armI, oldArmR = armour.armR, oldArmC = armour.armC;
    const oldKind = target.k, oldHp = target.hp, oldDead = target.dead;
    const damage = (attackerKind, targetKind, armourKey) => {
      attacker.k = attackerKind;
      target.k = targetKind;
      delete armour.armI; delete armour.armR;
      if (armourKey) armour[armourKey] = 1;
      target.hp = 100000; target.dead = 0;
      dmgT(attacker, target);
      return 100000 - target.hp;
    };
    try {
      return {
        infantryBase: damage('mil', 'mil', null),
        infantryArmour: damage('mil', 'mil', 'armI'),
        rangedBase: damage('xbow', 'arc', null),
        rangedArmour: damage('xbow', 'arc', 'armR'),
        cavalryBase: damage('mil', 'knight', null),
        cavalryArmour: damage('mil', 'knight', 'armC'),
      };
    } finally {
      attacker.k = 'mil'; target.k = oldKind; target.hp = oldHp; target.dead = oldDead;
      for (const key of ['armI','armR','armC']) delete armour[key];
      if (oldArmI !== undefined) armour.armI = oldArmI;
      if (oldArmR !== undefined) armour.armR = oldArmR;
      if (oldArmC !== undefined) armour.armC = oldArmC;
    }
  },
  auditSpatialTargets() {
    const originalUnits=S.us,originalBuildings=S.bs;
    const probes=[
      {t:0,k:'knight',x:8,y:8,hp:100},
      {t:1,k:'knight',x:31.8,y:32.1,hp:100},
      {t:2,k:'knight',x:64,y:63.9,hp:100},
      {t:0,k:'knight',x:128,y:128,hp:100},
    ];
    const units=probes.concat([
      {t:1,k:'mil',x:8.5,y:8,hp:100},
      {t:1,k:'mil',x:7.5,y:8,hp:100},
      {t:1,k:'mil',x:8,y:8,hp:0},
      {t:1,k:'mil',x:8.1,y:8,hp:100,ld:1},
    ]);
    for(let i=0;i<396;i++)units.push({
      t:1+(i%3),k:'mil',x:4+((i*17)%176),y:4+((i*31)%176),
      hp:i%29===0?0:100,ld:i%19===0?1:0
    });
    const linear=(u,r)=>{
      let best=null,bd=r;
      for(const e of S.us)if(isHostile(u.t,e.t)&&e.hp>0&&!e.ld){
        const d=Math.hypot(e.x-u.x,e.y-u.y);
        if(d<bd){bd=d;best=e}
      }
      return best
    };
    let queries=0,mismatches=0,tiePreserved=false;
    try {
      S.us=units;S.bs=[];foeGridDirty=true;
      const cases=[[probes[0],1],[probes[0],6],[probes[1],9],[probes[2],4],[probes[3],12]];
      for(const [u,r] of cases){
        const expected=linear(u,r),actual=foe(u,r);
        if(actual!==expected)mismatches++;
        if(u===probes[0]&&r===1)tiePreserved=actual===units[4];
        queries++;
      }
      units[9].x=probes[0].x+0.2;units[9].y=probes[0].y+0.1;
      foeGridDirty=true;
      if(foe(probes[0],2)!==linear(probes[0],2))mismatches++;
      queries++;
      return {queries,mismatches,tiePreserved,units:units.length,buckets:FOE_BUCKETS.size};
    } finally {
      S.us=originalUnits;S.bs=originalBuildings;foeGridDirty=true;
    }
  },
  completeFirstCampaignMission() {
    startScenario(0);
    const tc = S.bs.find((b) => b.t === 0 && b.k === 'tc' && b.done);
    if (!tc) throw new Error('First Hearth must start with a Town Centre');
    for (const kind of ['house', 'lumber', 'bar']) {
      if (!put(0, kind, tc.x + 8, tc.y + 8)) throw new Error('Could not place campaign objective building: ' + kind);
    }
    while (S.us.filter((u) => u.t === 0 && u.k === 'vil').length < 10) {
      const p = spawnPos(tc);
      if (!p) throw new Error('Could not spawn villagers for campaign objective test');
      addU(0, 'vil', p[0], p[1]);
    }
    while (cmil(0) < 4) {
      const p = spawnPos(tc);
      if (!p) throw new Error('Could not spawn soldiers for campaign objective test');
      addU(0, 'mil', p[0], p[1]);
    }
    return { mission: cmp.i, requiredGoals: CAMP[cmp.i].goals.map((g) => g.id) };
  },
  beginShipRepair() {
    let pair = null;
    for (let y = 2; y < H - 2 && !pair; y++) for (let x = 2; x < W - 2 && !pair; x++) {
      if (S.wt[y * W + x] !== 1 || S.nd[y * W + x]) continue;
      for (const [dx, dy] of D8) {
        const lx = x + dx, ly = y + dy, li = ly * W + lx;
        if (S.wt[li] === 0 && !S.g[li] && !S.nd[li]) { pair = { sx: x, sy: y, vx: lx, vy: ly }; break; }
      }
    }
    if (!pair) throw new Error('Seeded map has no clear coastal tile pair for ship repair');
    const ship = addU(0, 'gal', pair.sx + 0.5, pair.sy + 0.5);
    ship.hp = U[ship.k].hp * 0.5; ship.testRepairTarget = true;
    const worker = addU(0, 'vil', pair.vx + 0.5, pair.vy + 0.5);
    S.sel = [worker];
    if (!orderSel(ship, ship.x, ship.y)) throw new Error('Real player order should accept a villager ship-repair command');
    return { hp: ship.hp, maxHp: U[ship.k].hp, order: worker.o, distance: Math.hypot(worker.x - ship.x, worker.y - ship.y) };
  },
  beginNavalCombat() {
    const pass = (x, y) => x >= 1 && y >= 1 && x < W - 1 && y < H - 1 &&
      S.wt[y * W + x] === 1 && !S.nd[y * W + x];
    const seen = new Uint8Array(W * H);
    let best = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const index = y * W + x;
      if (seen[index] || !pass(x, y)) continue;
      const component = [[x, y]];
      seen[index] = 1;
      for (let head = 0; head < component.length; head++) {
        const [cx, cy] = component[head];
        for (const [dx, dy] of D8) {
          const nx = cx + dx, ny = cy + dy, ni = ny * W + nx;
          if (seen[ni] || !pass(nx, ny)) continue;
          if (dx && dy && (!pass(cx + dx, cy) || !pass(cx, cy + dy))) continue;
          seen[ni] = 1; component.push([nx, ny]);
        }
      }
      if (component.length > best.length) best = component;
    }
    if (best.length < 20) throw new Error('Seeded map has no usable water component for naval combat');
    let pair = null, bestDistance = Infinity;
    for (let i = 0; i < best.length; i++) for (let j = i + 1; j < best.length; j++) {
      const distance = Math.hypot(best[i][0] - best[j][0], best[i][1] - best[j][1]);
      if (distance >= 3 && distance <= 5 && distance < bestDistance) {
        pair = [best[i], best[j]]; bestDistance = distance;
      }
    }
    if (!pair) throw new Error('Could not find adjacent clear water tiles for opposing ships');
    const attacker = addU(0, 'gal', pair[0][0] + 0.5, pair[0][1] + 0.5);
    const target = addU(1, 'gal', pair[1][0] + 0.5, pair[1][1] + 0.5);
    target.testNavalTarget = true; attacker.o = 'a'; attacker.tg = target;
    return { attacker: { x: attacker.x, y: attacker.y }, targetHp: target.hp, targetMaxHp: U[target.k].hp, targetKey: [target.t, target.k, target.x, target.y].join(':') };
  },
  exerciseGalleyTargetReacquisition() {
    this.start(24680);
    const naval = this.beginNavalCombat();
    const ship = S.us.find(unit => unit && [unit.t, unit.k, unit.x, unit.y].join(':') === naval.targetKey);
    const liveEnemy = ship && S.us.find(unit => unit && unit.t === 0 && unit.k === 'gal' && Math.hypot(unit.x - ship.x, unit.y - ship.y) < 10);
    if (!ship || !liveEnemy) throw new Error('Naval test must create an AI galley and a nearby hostile galley');
    ship.o = 'a';
    ship.tg = { t: 0, k: 'gal', hp: 0, ld: 0, x: ship.x, y: ship.y };
    S.ai[1].cd = 0;
    aiTeam(1, 1 / 30);
    const reacquiredAfterTargetLoss = ship.tg === liveEnemy;
    ship.o = 'm'; ship.tg = null; ship.p = []; S.ai[1].cd = 0;
    aiTeam(1, 1 / 30);
    return { reacquired: reacquiredAfterTargetLoss, idleMoveReacquired: ship.tg === liveEnemy, order: ship.o, targetHp: ship.tg?.hp, targetTeam: ship.tg?.t };
  },
  beginNavalMove() {
    const pass = (x, y) => x >= 1 && y >= 1 && x < W - 1 && y < H - 1 &&
      S.wt[y * W + x] === 1 && !S.nd[y * W + x];
    const seen = new Uint8Array(W * H);
    let best = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const index = y * W + x;
      if (seen[index] || !pass(x, y)) continue;
      const component = [[x, y]];
      seen[index] = 1;
      for (let head = 0; head < component.length; head++) {
        const [cx, cy] = component[head];
        for (const [dx, dy] of D8) {
          const nx = cx + dx, ny = cy + dy, ni = ny * W + nx;
          if (seen[ni] || !pass(nx, ny)) continue;
          if (dx && dy && (!pass(cx + dx, cy) || !pass(cx, cy + dy))) continue;
          seen[ni] = 1;
          component.push([nx, ny]);
        }
      }
      if (component.length > best.length) best = component;
    }
    if (best.length < 12) throw new Error('Seeded map has no usable navigable-water component for a ship movement test');
    const start = best[0];
    let target = start, farthest = -1;
    for (const tile of best) {
      const distance = Math.hypot(tile[0] - start[0], tile[1] - start[1]);
      if (distance > farthest) { farthest = distance; target = tile; }
    }
    const ship = addU(0, 'gal', start[0] + 0.5, start[1] + 0.5);
    const goal = gp(target[0] + 0.5, target[1] + 0.5, 0.6);
    const route = path(ship, goal);
    if (!route || route.length < 6) throw new Error('Could not find a meaningful real ship route through navigable water');
    ship.testNaval = true; ship.o = 'm'; ship.p = route; ship.rp = 10;
    return { start: { x: ship.x, y: ship.y }, target, routeLength: route.length };
  },
  beginTradeRoute() {
    const playerTc = S.bs.find((b) => b.t === 0 && b.k === 'tc' && b.done);
    const enemyTc = S.bs.find((b) => b.t !== 0 && b.k === 'tc' && b.done);
    if (!playerTc || !enemyTc) throw new Error('The seeded match must have player and enemy Town Centres');
    const findMarketSite = (tc, team) => {
      for (let radius = 3; radius <= 18; radius++) {
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
            const x = Math.floor(tc.x + 1) + dx, y = Math.floor(tc.y + 1) + dy;
            if (okPlace(team, 'market', x, y)) return [x, y];
          }
        }
      }
      return null;
    };
    const srcSite = findMarketSite(playerTc, 0);
    const dstSite = findMarketSite(enemyTc, enemyTc.t);
    if (!srcSite || !dstSite) throw new Error('Could not find legal market sites for the trade-route test');
    const src = addB(0, 'market', srcSite[0], srcSite[1], true);
    const dst = addB(enemyTc.t, 'market', dstSite[0], dstSite[1], true);
    const p = spawnPos(src);
    if (!p) throw new Error('Could not find a legal trade-cart spawn tile');
    const cart = addU(0, 'cart', p[0], p[1]);
    cart.tradeFromKey = [0, 'market', src.x, src.y].join(':');
    const distance = Math.hypot((src.x + src.s / 2) - (dst.x + dst.s / 2), (src.y + src.s / 2) - (dst.y + dst.s / 2));
    if (distance < 10) throw new Error('Trade route is too short to provide a meaningful gold-delivery test');
    return { gold: S.res[0].g, distance };
  },
  beginHouseConstruction() {
    const u = S.us.find((u) => u.t === 0 && u.k === 'vil' && !u.ld);
    if (!u) throw new Error('The seeded match must contain a builder');
    let site = null;
    const ux = Math.floor(u.x), uy = Math.floor(u.y);
    for (let radius = 2; radius <= 12 && !site; radius++) {
      for (let dy = -radius; dy <= radius && !site; dy++) {
        for (let dx = -radius; dx <= radius && !site; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
          const x = ux + dx, y = uy + dy;
          if (okPlace(0, 'house', x, y)) site = [x, y];
        }
      }
    }
    if (!site) throw new Error('Could not find a legal explored tile for the construction test');
    const b = addB(0, 'house', site[0], site[1], false);
    u.o = 'b'; u.tg = b; u.p = []; u.rp = 0;
    return { x: b.x, y: b.y, buildSeconds: B.house.bt };
  },
  runSiegeTargetTest() {
    const team = 1;
    const aiTc = S.bs.find((b) => b.t === team && b.k === 'tc' && b.done);
    const playerTc = S.bs.find((b) => b.t === 0 && b.k === 'tc' && b.done);
    if (!aiTc || !playerTc) throw new Error('Seeded match must have both Town Centres');
    S.age[team] = 2;
    S.res[team] = { f: 5000, w: 5000, g: 5000, s: 5000 };
    const castle = put(0, 'castle', playerTc.x + 10, playerTc.y);
    if(!castle)throw Error('No legal castle test site');
    const tower = put(0, 'tower', playerTc.x + 7, playerTc.y);
    if(!tower)throw Error('No legal tower test site');
    const ramSpawn=spawnPos(aiTc);
    if(!ramSpawn)throw Error('No legal ram spawn');
    const ram = addU(team, 'ram', ...ramSpawn);
    const infantry = [];
    for (let i = 0; i < 20; i++) infantry.push(addU(team, 'mil', ...ramSpawn));
    for (const u of [ram, ...infantry]) { u.o = 'i'; u.tg = null; u.p = []; u.retreating = 0; }
    const ai = S.ai[team];
    S.t=900; // All difficulty levels have passed their initial attack delay.
    ai.cd = 0; ai.nx = 0; ai.wave = 0; ai.on = 0; ai.stg = null;
    aiTeam(team, 1 / 30);
    const waveStarted = ai.wave > 0 && !!ai.stg;
    const selectedSiegeTarget = !!ai.stg && ai.stg.siegeT === castle;
    const primaryTarget = ai.stg?.tg || null;
    const stagedMixedArmy = !!ai.stg && infantry.some((u) => u.o === 'm' || u.o === 'a');
    S.t += 51;
    ai.cd = 0;
    aiTeam(team, 1 / 30);
    return {
      waveStarted,
      selectedSiegeTarget,
      siegeUnitTargetedCastle: ram.o === 'a' && ram.tg === castle,
      infantryAssignedToPrimaryTarget: !!primaryTarget && infantry.some((u) => u.o === 'a' && u.tg === primaryTarget),
      stagedMixedArmy,
      towerExists: tower.hp > 0,
    };
  },
  runDefenseResponse() {
    const team = 1;
    const tc = S.bs.find((b) => b.t === team && b.k === 'tc' && b.done);
    if (!tc) throw new Error('Seeded AI must have a completed Town Centre');
    const intruder = addU(0, 'mil', tc.x + 4, tc.y + 4);
    intruder.hp = 10000; intruder.mh = 10000;
    const defenders = [
      addU(team, 'mil', tc.x + 6, tc.y + 4),
      addU(team, 'spear', tc.x + 7, tc.y + 4),
    ];
    for (const u of defenders) { u.o = 'i'; u.tg = null; u.p = []; u.retreating = 0; }
    const worker = S.us.find((u) => u.t === team && u.k === 'vil' && !u.ld);
    if (!worker) throw new Error('Seeded AI must have a villager available for the defence test');
    worker.x = tc.x + 4; worker.y = tc.y + 5; worker.o = 'i'; worker.tg = null; worker.p = []; worker.ld = null;
    S.ai[team].cd = 0;
    aiTeam(team, 1 / 30);
    return {
      militaryResponded: defenders.some((u) => u.o === 'a' && u.tg === intruder),
      villagerGarrisoned: worker.o === 'B' && worker.tg === tc,
    };
  },
  beginRelicIncome() {
    const size = B.monastery.s;
    let site = null;
    for (let y = 2; y < H - size - 1 && !site; y++) for (let x = 2; x < W - size - 1 && !site; x++) {
      let clear = true;
      for (let dy = 0; dy < size && clear; dy++) for (let dx = 0; dx < size; dx++) {
        const index = (y + dy) * W + x + dx;
        if (S.g[index] || S.wt[index]) { clear = false; break; }
      }
      if (clear) site = { x, y };
    }
    if (!site) throw new Error('Could not find a clear site for the relic-income test Monastery');
    const monastery = addB(0, 'monastery', site.x, site.y, true);
    const relic = S.rel.find(r => !r.m && !r.c);
    if (!relic) throw new Error('Seeded match must contain an unclaimed relic for the relic-income test');
    relic.m = monastery;
    for (const u of S.us) if (u.t === 0) { u.o = 'i'; u.tg = null; u.p = []; u.rp = 0; }
    S.res[0].g = 0;
    return { gold: S.res[0].g, relics: S.rel.filter(r => r.m === monastery).length };
  },
  beginFarmReseed() {
    const worker = S.us.find((u) => u.t === 0 && u.k === 'vil' && !u.ld);
    if (!worker) throw new Error('The seeded match must contain a player villager for farm reseeding');
    let node = null;
    for (let y = 2; y < H - 2 && !node; y++) for (let x = 2; x < W - 3 && !node; x++) {
      const a = y * W + x, b = a + 1;
      if (S.wt[a] || S.wt[b] || S.g[a] || S.g[b] || S.nd[a] || S.nd[b]) continue;
      worker.x = x + 0.5; worker.y = y + 0.5;
      node = addN('f', x + 1, y, 0, 1); if (node) node.t = 0;
    }
    if (!node) throw new Error('Could not find two adjacent open land tiles for farm reseeding');
    node.testFarmReseed = true;
    S.res[0].w = 60;
    worker.o = 'i'; worker.tg = null; worker.ct = 'f'; worker.p = []; worker.ret = 0; worker.car = 0;
    return { wood: S.res[0].w, amount: node.amt };
  },
  beginGatherResearch() {
    const tc = S.bs.find((b) => b.t === 0 && b.k === 'tc' && b.done);
    return tc ? research(tc, 'gath') : false;
  },
  beginManAtArmsResearch() {
    let barracks = S.bs.find((b) => b.t === 0 && b.k === 'bar' && b.done);
    if (!barracks) {
      const size = B.bar.s;
      let site = null;
      for (let y = 2; y < H - size - 1 && !site; y++) for (let x = 2; x < W - size - 1 && !site; x++) {
        let clear = true;
        for (let dy = 0; dy < size && clear; dy++) for (let dx = 0; dx < size; dx++) {
          if (S.g[(y + dy) * W + x + dx] || S.wt[(y + dy) * W + x + dx]) { clear = false; break; }
        }
        if (clear) site = { x, y };
      }
      if (!site) throw new Error('Could not find a clear site for a completed test Barracks');
      barracks = addB(0, 'bar', site.x, site.y, true);
    }
    let unit = S.us.find((u) => u.t === 0 && u.k === 'mil');
    if (!unit) {
      const tc = S.bs.find((b) => b.t === 0 && b.k === 'tc' && b.done);
      const p = spawnPos(tc);
      if (!p) throw new Error('Could not find a spawn position for the existing-unit upgrade test');
      unit = addU(0, 'mil', p[0], p[1]);
    }
    const beforeMax = mhp(unit);
    unit.hp = beforeMax - 10;
    unit.testTechTarget = true;
    S.res[0].f = 1000; S.res[0].g = 1000; S.res[0].w = 1000; S.res[0].s = 1000;
    if (!research(barracks, 'man')) throw new Error('Barracks should accept affordable Man-at-Arms research');
    return { beforeMax, beforeHp: unit.hp };
  },
  addPostUpgradeMilitia() {
    const tc = S.bs.find((b) => b.t === 0 && b.k === 'tc' && b.done);
    const p = spawnPos(tc);
    if (!p) throw new Error('Could not find a valid spawn position for post-upgrade Militia');
    const unit = addU(0, 'mil', p[0], p[1]);
    unit.testTechNew = true;
  },
  beginChemistryResearch() {
    S.age[0] = 3;
    this.beginNavalCombat();
    const attacker = S.us.find((u) => u.t === 0 && u.k === 'gal' && u.o === 'a' && u.tg?.testNavalTarget);
    const target = S.us.find((u) => u.testNavalTarget === true);
    if (!attacker || !target) throw new Error('Could not prepare the Chemistry naval-combat test');
    attacker.o = 'i'; attacker.tg = null; attacker.p = [];
    attacker.testChemistryAttacker = true;
    S.tech[1] = {};
    const targetHp = target.hp;
    dmgT(attacker, target);
    S.chemistryBaseDamage = targetHp - target.hp;
    target.hp = targetHp; target.dead = 0;
    let university = S.bs.find((b) => b.t === 0 && b.k === 'univ' && b.done);
    if (!university) {
      const size = B.univ.s;
      let site = null;
      for (let y = 2; y < H - size - 1 && !site; y++) for (let x = 2; x < W - size - 1 && !site; x++) {
        let clear = true;
        for (let dy = 0; dy < size && clear; dy++) for (let dx = 0; dx < size; dx++) {
          const index = (y + dy) * W + x + dx;
          if (S.g[index] || S.wt[index] || S.nd[index]) { clear = false; break; }
        }
        if (clear) site = { x, y };
      }
      if (!site) throw new Error('Could not find a clear site for a completed test University');
      university = addB(0, 'univ', site.x, site.y, true);
    }
    S.res[0].f = 1000; S.res[0].g = 1000; S.res[0].w = 1000; S.res[0].s = 1000;
    if (!research(university, 'chem')) throw new Error('University should accept affordable Chemistry research');
    return { baselineDamage: S.chemistryBaseDamage };
  },
  resolveChemistryShot() {
    this.beginNavalCombat();
    const target = [...S.us].reverse().find((u) => u.testNavalTarget === true);
    const attacker = target && [...S.us].reverse().find((u) => u.t === 0 && u.k === 'gal' && u.o === 'a' && u.tg === target);
    if (!attacker || !target) throw new Error('Chemistry combatants could not be recreated after the research timer');
    S.tech[1] = {};
    attacker.hp = U[attacker.k].hp; attacker.dead = 0;
    target.hp = U[target.k].hp; target.dead = 0;
    const before = target.hp;
    dmgT(attacker, target);
    return {
      baselineDamage: S.chemistryBaseDamage,
      actualDamage: before - target.hp,
      attackBonus: S.tech[0].atkb?.gal || 0
    };
  },
  beginBloodlinesResearch() {
    S.civ[0] = 2; // Mongols have Bloodlines; source-verified rather than relying on random civilization.
    S.age[0] = 2;
    let stable = S.bs.find((b) => b.t === 0 && b.k === 'stable' && b.done);
    if (!stable) {
      const size = B.stable.s;
      let site = null;
      for (let y = 2; y < H - size - 1 && !site; y++) for (let x = 2; x < W - size - 1 && !site; x++) {
        let clear = true;
        for (let dy = 0; dy < size && clear; dy++) for (let dx = 0; dx < size; dx++) {
          const index = (y + dy) * W + x + dx;
          if (S.g[index] || S.wt[index] || S.nd[index]) { clear = false; break; }
        }
        if (clear) site = { x, y };
      }
      if (!site) throw new Error('Could not find a clear site for a completed test Stable');
      stable = addB(0, 'stable', site.x, site.y, true);
    }
    const tc = S.bs.find((b) => b.t === 0 && b.k === 'tc' && b.done);
    const p = spawnPos(tc);
    if (!p) throw new Error('Could not spawn the existing cavalry test unit');
    const unit = addU(0, 'knight', p[0], p[1]);
    const beforeMax = mhp(unit);
    unit.hp = beforeMax - 10;
    unit.testBloodlinesTarget = true;
    S.res[0].f = 1000; S.res[0].g = 1000; S.res[0].w = 1000; S.res[0].s = 1000;
    if (!research(stable, 'blood')) throw new Error('Stable should accept affordable Bloodlines research');
    return { beforeMax, beforeHp: unit.hp };
  },
  addPostUpgradeKnight() {
    const tc = S.bs.find((b) => b.t === 0 && b.k === 'tc' && b.done);
    const p = spawnPos(tc);
    if (!p) throw new Error('Could not find a spawn position for a post-Bloodlines Knight');
    const unit = addU(0, 'knight', p[0], p[1]);
    unit.testBloodlinesNew = true;
  },
  orderWoodGather() {
    const u = S.us.find((u) => u.t === 0 && u.k === 'vil' && !u.ld);
    if (!u) throw new Error('The seeded match must contain a player villager');
    const nodes = S.nodes.filter((n) => n.k === 'w' && n.amt > 0);
    nodes.sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y));
    const n = nodes[0];
    if (!n) throw new Error('The seeded match must contain a wood resource node');
    u.o = 'g'; u.tg = n; u.ct = n.k; u.car = 0; u.ret = 0; u.p = []; u.rp = 0; u.autoWorker = 0;
  },
  benchmarkArmy(count, ticks = 15, combat = false) {
    this.start(13579);
    const baseCount = S.us.length;
    const toAdd = Math.max(0, count - baseCount);
    const synthetic = [];
    for (let i = 0; i < toAdd; i++) {
      const x = combat ? W / 2 + (i % 20 - 9.5) * 1.35 : 4 + (i % 20) * 4;
      const y = combat ? H / 2 + (Math.floor(i / 20) % 20 - 9.5) * 1.25 : 4 + Math.floor(i / 20) * 3.5;
      const team = combat ? i % Math.min(2, S.teamN) : i % Math.min(4, S.teamN);
      const unit = addU(team, 'mil', x, y);
      unit.o = 'i'; unit.tg = null; unit.p = []; unit.sc = 1000; unit.as = 0; unit.retreating = 0;
      synthetic.push(unit);
    }
    if (combat) for (const unit of synthetic) {
      let target = null, best = Infinity;
      for (const enemy of synthetic) if (enemy.t !== unit.t && enemy.hp > 0) {
        const distance = Math.hypot(enemy.x - unit.x, enemy.y - unit.y);
        if (distance < best) { best = distance; target = enemy; }
      }
      if (target) { unit.o = 'a'; unit.tg = target; }
    }
    const added = S.us.length - baseCount;
    const started = performance.now();
    for (let i = 0; i < ticks; i++) step(1 / 30);
    const elapsedMs = performance.now() - started;
    return { requested: count, added, units: S.us.length, ticks, elapsedMs, time: S.t, mapSize: W, combat };
  },
  runFourKingdomMassBattle(populationPerTeam = 500, ticks = 30) {
    this.start(24680);
    if (S.teamN !== 4) throw new Error('Mass battle requires exactly four kingdoms');
    S.us.length = 0;
    const armies = Array.from({ length: 4 }, () => []);
    const centreX = W / 2, centreY = H / 2;
    for (let team = 0; team < 4; team++) {
      const offsetX = [-5, 5, 5, -5][team];
      const offsetY = [-5, -5, 5, 5][team];
      for (let i = 0; i < populationPerTeam; i++) {
        const x = Math.max(1, Math.min(W - 2, centreX + offsetX + (i % 25) * 0.16));
        const y = Math.max(1, Math.min(H - 2, centreY + offsetY + (Math.floor(i / 25) % 20) * 0.16));
        const unit = addU(team, 'mil', x, y);
        unit.o = 'i'; unit.tg = null; unit.p = []; unit.sc = 1000; unit.as = 0; unit.retreating = 0;
        armies[team].push(unit);
      }
    }
    for (let team = 0; team < 4; team++) {
      const enemies = armies[(team + 1) % 4];
      for (let i = 0; i < populationPerTeam; i++) {
        const unit = armies[team][i];
        unit.o = 'a'; unit.tg = enemies[i]; unit.p = [];
      }
    }
    const initial = armies.map((army, team) => ({ team, starting: army.length }));
    const started = performance.now();
    let tickError = null;
    for (let tick = 0; tick < ticks; tick++) {
      try { step(1 / 30); } catch (error) { tickError = String(error?.stack || error); break; }
    }
    const elapsedMs = performance.now() - started;
    const result = armies.map((army, team) => ({
      team,
      starting: initial[team].starting,
      alive: army.filter(u => u && u.hp > 0 && S.us.includes(u)).length,
      deadOrRemoved: army.filter(u => !u || !(u.hp > 0) || !S.us.includes(u)).length,
      invalid: army.filter(u => !u || !Number.isFinite(u.x) || !Number.isFinite(u.y) || !Number.isFinite(u.hp)).length,
    }));
    return {
      requestedPerTeam: populationPerTeam, requestedTotal: populationPerTeam * 4,
      actualUnits: S.us.length, teams: S.teamN, ticksCompleted: tickError ? undefined : ticks,
      simulatedSeconds: S.t, elapsedMs, tickError, result,
      invalidUnits: S.us.filter(u => !u || !Number.isFinite(u.x) || !Number.isFinite(u.y) || !Number.isFinite(u.hp)).length,
    };
  },
  auditTownBellReservations() {
    const shelters = S.bs.filter((b) => b.t === 0 && b.done && b.hp > 0 && GAR[b.k]);
    if (!shelters.length) throw new Error('The seeded match must have an eligible player shelter');
    for (const b of shelters) b.cg = [];
    for (const u of S.us) {
      if (u.t === 0 && u.k === 'vil') u.ld = true;
      if (u.t === 0 && u.o === 'B') { u.o = 'i'; u.tg = null; }
    }
    const tc = S.bs.find((b) => b.t === 0 && b.k === 'tc' && b.done && b.hp > 0);
    const workers = [];
    for (let i = 0; i < 100; i++) {
      const u = addU(0, 'vil', tc.x + 1 + (i % 7) * 0.15, tc.y + 1 + Math.floor(i / 7) * 0.15);
      u.ld = null; u.o = 'i'; u.tg = null; u.p = []; u.rp = 0;
      workers.push(u);
    }
    const totalCapacity = shelters.reduce((sum, b) => sum + GAR[b.k], 0);
    const sent = townBell(0);
    const assigned = workers.filter((u) => u.o === 'B' && shelters.includes(u.tg));
    const occupancy = shelters.map((b) => ({
      kind: b.k, capacity: GAR[b.k],
      assigned: assigned.filter((u) => u.tg === b).length,
    }));
    return { sent, assigned: assigned.length, totalCapacity, occupancy, unassigned: workers.length - assigned.length };
  },
  state() {
    return {
      time: S.t,
      ticks: S.vt,
      layout: mapLayout,
      mapAudit: S.mapAudit ? { ...S.mapAudit } : null,
      enemyGalleys: S.us.filter((u) => u.t === 1 && u.k === 'gal' && u.hp > 0).length,
      units: S.us.length,
      buildings: S.bs.length,
      playerGold: S.res[0].g,
      campaign: cmp ? { index: cmp.i, goals: { ...cmp.d }, time: cmp.t } : null,
      repairTarget: (() => {
        const u = S.us.find((u) => u.testRepairTarget === true);
        return u ? { hp: u.hp, maxHp: U[u.k].hp } : null;
      })(),
      repairWorker: (() => {
        const u = S.us.find((u) => u.o === 'rep' && u.t === 0 && u.k === 'vil');
        return u ? { order: u.o, targetHp: u.tg?.hp ?? null } : null;
      })(),
      navalCombatTarget: (() => {
        const u = S.us.find((u) => u.testNavalTarget === true);
        return u ? { hp: u.hp, maxHp: U[u.k].hp, dead: !!u.dead } : null;
      })(),
      navalShip: (() => {
        const u = S.us.find((u) => u.t === 0 && u.k === 'gal' && u.testNaval === true);
        return u ? { x: u.x, y: u.y, order: u.o, water: S.wt[(u.y | 0) * W + (u.x | 0)] === 1 } : null;
      })(),
      houseConstruction: (() => {
        const b = S.bs.find((b) => b.t === 0 && b.k === 'house');
        return b ? { done: b.done, progress: b.pr, hp: b.hp, maxHp: b.mh } : null;
      })(),
      farmReseed: (() => { const n = S.nodes.find((n) => n.testFarmReseed); return n ? { amount: n.amt, wood: S.res[0].w, farm: !!n.fm } : null; })(),
      scoreCache: S.scoreCache.slice(),
      resources: S.res.map((r) => ({ ...r })),
      gameOver: S.over,
      research: {
        gatherRate: S.tech[0].gath || 0,
        manAtArms: S.tech[0].man || 0,
        bloodlines: S.tech[0].blood || 0,
        chemistry: S.tech[0].chem || 0,
        townCentreResearch: (S.bs.find((b) => b.t === 0 && b.k === 'tc') || {}).rs || null,
      },
      upgradedUnits: {
        existing: (() => { const u = S.us.find((u) => u.testTechTarget); return u ? { hp: u.hp, maxHp: mhp(u) } : null; })(),
        newlyTrained: (() => { const u = S.us.find((u) => u.testTechNew); return u ? { hp: u.hp, maxHp: mhp(u) } : null; })(),
      },
      bloodlineUnits: {
        existing: (() => { const u = S.us.find((u) => u.testBloodlinesTarget); return u ? { hp: u.hp, maxHp: mhp(u) } : null; })(),
        newlyCreated: (() => { const u = S.us.find((u) => u.testBloodlinesNew); return u ? { hp: u.hp, maxHp: mhp(u) } : null; })(),
      },
      mapAudit: S.mapAudit ? { ...S.mapAudit } : null,
      aiPeak: { ...aiPeak },
      aiGrowth: S.ai.map((a, team) => team === 0 || !a ? null : ({
        team,
        age: S.age[team],
        buildings: S.bs.filter((b) => b.t === team && b.hp > 0).length,
        completedMilitaryBuildings: S.bs.filter((b) => b.t === team && b.done && ['bar', 'rng', 'stable', 'siege'].includes(b.k)).length,
        militaryUnits: S.us.filter((u) => u.t === team && u.hp > 0 && u.k !== 'vil' && !U[u.k].sh && !['king', 'cart', 'mon'].includes(u.k)).length,
        wave: a.wave || 0,
        villagers: S.us.filter(u=>u.t===team&&u.k==='vil'&&u.hp>0).length,
        foodWorkers: S.us.filter(u=>u.t===team&&u.k==='vil'&&u.hp>0&&u.o==='g'&&u.ct==='f').length,
        idleVillagers: S.us.filter(u=>u.t===team&&u.k==='vil'&&u.hp>0&&u.o==='i').length,
        ageReady: ageRequirements(team).ready,
        structureKinds: S.bs.filter(b=>b.t===team&&b.hp>0).map(b=>b.k+(b.done?'':'*')),
        tcQueue: (S.bs.find(b=>b.t===team&&b.k==='tc')?.q||[]).map(q=>q.k),
        tcResearch: S.bs.find(b=>b.t===team&&b.k==='tc')?.rs?.k||null,
        waveNeed: Math.min(60,Math.round(([12,14,18,22,26,30][diff]+Math.min(a.wave||0,8)*[2,3,3,4,5,5][diff])*PERS[aip].n)),
        readyArmy: S.us.filter(u=>u.t===team&&u.hp>0&&!u.ld&&U[u.k]?.dmg>0&&u.k!=='vil'&&!U[u.k].sh&&u.o!=='b'&&u.o!=='B'&&u.o!=='G'&&u.o!=='F'&&(!a.rd||!a.rd.u.includes(u))).length,
        currentArmy: S.us.filter(u=>u.t===team&&u.hp>0&&u.k!=='vil'&&!U[u.k].sh).map(u=>u.k+':'+u.o),
        playerTownAlive: S.bs.some(b=>b.t===0&&b.k==='tc'&&b.hp>0),
      })).filter(Boolean),
      woodNodes: S.nodes.filter((n) => n.k === 'w').reduce((sum, n) => sum + n.amt, 0),
      worker: (() => {
        const u = S.us.find((u) => u.t === 0 && u.k === 'vil' && !u.ld);
        return u ? { x: u.x, y: u.y, order: u.o, carrying: u.car, returning: u.ret } : null;
      })(),
    };
  },
};
`;
const vmContext = vm.createContext(sandbox);
new vm.Script(source + '\n' + harness, { filename: 'index.html:simulation-smoke' }).runInContext(vmContext, { timeout: 15000 });

const game = sandbox.__CK_TEST__;

const timed = (label, run) => {
  const startedAt = Date.now();
  try {
    return run();
  } finally {
    console.log('section-timing: '+label+' elapsedMs='+(Date.now()-startedAt));
  }
};
const playCampaignScenarioTimed = (index, maxSeconds) => {
  const result = timed('campaign-playthrough-mission-'+(index+1), () => game.playCampaignScenario(index, maxSeconds));
  console.log('campaign-isolation-result: '+JSON.stringify({
    mission: index,
    outcome: result.over === 'win' ? 'win' : result.over === 'lose' ? 'lose' : 'timeout',
    campaignTime: Number(result.campaignTime.toFixed(1)),
    completedObjectives: result.objectives.filter(objective => objective.complete).map(objective => objective.title),
    objectiveCount: result.objectives.filter(objective => objective.complete).length,
    totalObjectives: result.objectives.length
  }));
  return result;
};
const requestedMission = process.env.CK_MISSION === undefined ? null : Number(process.env.CK_MISSION);
if (requestedMission !== null) assert.ok(Number.isInteger(requestedMission) && requestedMission >= 0 && requestedMission < 19, 'CK_MISSION must be an integer from 0 to 18');
const skipCampaignPlaythroughs = process.env.CK_SKIP_CAMPAIGN === '1';
const shouldRunCampaignMission = index => !skipCampaignPlaythroughs && (requestedMission === null || requestedMission === index);
if (skipCampaignPlaythroughs) console.log('campaign-playthrough-mode: skipped all 19 scripted playthroughs (CK_SKIP_CAMPAIGN=1)');
else if (requestedMission !== null) console.log('campaign-playthrough-mode: running mission '+(requestedMission+1)+' only (CK_MISSION='+requestedMission+')');

if (requestedMission === null) {
assert.ok(game, 'Test hooks must be attached after the real game script initialises');
const kingHill = game.exerciseKingHillControl();
assert.ok(kingHill.contestedProgress.every(value => value === 0), 'Contested hill control must reset every kingdom progress counter');
assert.ok(kingHill.excludedUnitsProgress.every(value => value === 0), 'Villagers, trade carts and ships must not capture the central hill');
assert.equal(kingHill.beforeWin.progress, 299, 'A kingdom must accumulate its own uninterrupted hill-control time');
assert.equal(kingHill.beforeWin.over, null, 'King of the Hill must not end before five uninterrupted minutes');
assert.equal(kingHill.playerWin.over, 'win', 'Player military control must win after 300 seconds');
assert.match(kingHill.playerWin.reason, /held the central hill for 5 minutes/, 'Player victory must explain the hill-control win');
assert.equal(kingHill.enemyWin.over, 'lose', 'A hostile kingdom holding the hill for 300 seconds must defeat the player');
assert.match(kingHill.enemyWin.reason, /held the central hill for 5 minutes/, 'Enemy victory must explain the hill-control loss');
console.log('king-of-the-hill-smoke: contested control resets; non-military/economic units excluded; player/enemy five-minute wins verified');
game.start(123456);
const saveTimers=game.auditSaveTimersAndRng();
assert.equal(saveTimers.saved,true);
assert.equal(saveTimers.loaded,true,'real saves accept elapsed fractional retry/cooldown timers');
assert.equal(saveTimers.invalidRejected,true,'bad RNG state is rejected before replacing the running match');
assert.equal(saveTimers.legacyLoaded,true,'legacy saves without RNG state remain loadable');
assert.ok(saveTimers.scores>=2,'loaded matches rebuild their score cache immediately');
assert.equal(saveTimers.rp,-3.25);
assert.equal(saveTimers.cd,-.1);
assert.deepEqual(saveTimers.actual,saveTimers.expected,'save/load resumes the simulation RNG stream');
console.log('save-rng-smoke: elapsed timers and eight subsequent random values survive save/load');
game.start(123456);
const conscriptionRates = game.auditConscriptionRates();
for (const key of ['barracks','castle','monastery','galley']) {
  assert.equal(conscriptionRates[key], 4 / 3, 'Conscription should speed military production at ' + key);
}
for (const key of ['villager','cart','fish','transport','tradeCog']) {
  assert.equal(conscriptionRates[key], 1, 'Conscription must not speed economic or transport queue ' + key);
}
console.log('conscription-smoke: military queues run at 4/3 speed; economy/trade/transport queues remain unchanged');
const husbandrySpeeds = game.auditHusbandrySpeeds();
assert.ok(Math.abs(husbandrySpeeds.knight - 1.485) < 1e-9, 'Husbandry must increase AoE2 base Knight speed (1.35) by 10%');
assert.equal(husbandrySpeeds.infantry, .9, 'Husbandry must not increase base Militia speed (AoE2:DE is 0.9)');
assert.equal(husbandrySpeeds.transport, husbandrySpeeds.transportBase, 'Husbandry must not increase transport-ship speed');
assert.equal(husbandrySpeeds.conqMounted, true, 'Mounted unique cavalry must be included in the mounted set');
console.log('husbandry-smoke: cavalry receives +10% speed; infantry and transport ships are unchanged');
const attackResearch = game.auditAttackResearchDamage();
assert.equal(attackResearch.meleeBasic - attackResearch.meleeBase, 1, 'Forging must increase live melee damage by exactly one');
assert.equal(attackResearch.meleeIntermediate - attackResearch.meleeBase, 2, 'Iron Casting adds one more melee damage');
assert.equal(attackResearch.meleeAdvanced - attackResearch.meleeBase, 4, 'Blast Furnace must add two more melee damage');
assert.equal(attackResearch.rangedBasic - attackResearch.rangedBase, 1, 'Ranged Attack +1 must increase live ranged damage by exactly one');
assert.equal(attackResearch.rangedAdvanced - attackResearch.rangedBase, 3, 'Ranged Attack +3 must increase live ranged damage by exactly three');
console.log('attack-research-smoke: three melee tiers and ranged upgrades verified against live combat damage');
const armourResearch = game.auditArmourResearchDamage();
assert.equal(armourResearch.infantryBase - armourResearch.infantryArmour, 1,
  'Infantry Armour research must reduce incoming melee damage by exactly one');
assert.equal(armourResearch.rangedBase - armourResearch.rangedArmour, 1,
  'Archer Armour research must reduce incoming ranged damage by exactly one');
assert.equal(armourResearch.cavalryBase - armourResearch.cavalryArmour, 1,
  'Cavalry Armour research must reduce incoming melee damage by exactly one');
console.log('armour-research-smoke: infantry, archer and cavalry armour upgrades each reduce matching live incoming damage by one');

const targetAudit=game.auditSpatialTargets();
assert.equal(targetAudit.queries,6,'Spatial target audit must compare several radii and bucket boundaries');
assert.equal(targetAudit.mismatches,0,'Spatial target search must match the original linear nearest-hostile scan');
assert.equal(targetAudit.tiePreserved,true,'Equidistant targets must preserve original unit-order tie breaking');
assert.ok(targetAudit.units>=400,'Spatial target audit must cover a 400-unit synthetic army');
assert.ok(targetAudit.buckets>1,'Spatial target index must partition the army into local buckets');
console.log('spatial-target-smoke: '+targetAudit.queries+' queries matched linear targeting across '+targetAudit.units+' units and '+targetAudit.buckets+' buckets');
const before = game.state();
assert.ok(before.units > 0, 'A real match should spawn units');
assert.ok(before.buildings > 0, 'A real match should create starting buildings');
assert.equal(before.time, 0, 'A fresh match should begin at zero game time');
for (let tick = 0; tick < 60; tick += 1) game.tick(1 / 30);
const after = game.state();
assert.equal(after.ticks, 60, 'The actual simulation step must execute 60 ticks');
assert.ok(Math.abs(after.time - 2) < 1e-9, '60 ticks at 30 Hz must advance game time by two seconds');
assert.equal(after.units, before.units, 'The short smoke window should not spontaneously remove starting units');
assert.ok(after.scoreCache.some((score) => Number.isFinite(score) && score > 0),
  'The real simulation should refresh its derived kingdom-score cache');
assert.ok(after.resources.every((r) => Object.values(r).every((v) => Number.isFinite(v))),
  'Resource state must remain finite after the ticks');
assert.equal(after.gameOver, null, 'The smoke match should remain active');
console.log(`simulation-smoke: 60 real ticks passed (units=${after.units}, buildings=${after.buildings}, gameTime=${after.time}s)`);

game.start(123456);
game.orderWoodGather();
const economyBefore = game.state();
for (let tick = 0; tick < 1800; tick += 1) game.tick(1 / 30);
const economyAfter = game.state();
assert.ok(
  economyAfter.woodNodes < economyBefore.woodNodes ||
  economyAfter.worker?.carrying > 0 ||
  economyAfter.resources[0].w > economyBefore.resources[0].w,
  'A real villager gathering order should harvest wood, carry it, or deliver it within 60 simulated seconds',
);
assert.ok(economyAfter.worker, 'The gathering villager should remain alive');
console.log(`economy-smoke: villager order advanced 60s (wood=${economyBefore.woodNodes}->${economyAfter.woodNodes}, carried=${economyAfter.worker.carrying}, playerWood=${economyBefore.resources[0].w}->${economyAfter.resources[0].w})`);

game.start(123456, 1);
assert.equal(game.beginGatherResearch(), true, 'The Town Centre should accept affordable Gather Rate research');
assert.equal(game.state().research.gatherRate, 0, 'Research must not apply before its timer completes');
for (let tick = 0; tick < 930; tick += 1) game.tick(1 / 30);
const researchAfter = game.state();
assert.equal(researchAfter.research.gatherRate, 1, 'Completing research must apply the real Gather Rate technology effect');
assert.equal(researchAfter.research.townCentreResearch, null, 'The completed research queue should clear');
console.log('research-smoke: Gather Rate research completed through 31 simulated seconds and applied to the real technology state');

game.start(123456, 1);
const hpBeforeUpgrade = game.beginManAtArmsResearch();
for (let tick = 0; tick < 1230; tick += 1) game.tick(1 / 30);
const hpAfterUpgrade = game.state();
assert.equal(hpAfterUpgrade.research.manAtArms, 1, 'Man-at-Arms research should complete through the real research timer');
assert.equal(hpAfterUpgrade.upgradedUnits.existing.maxHp, hpBeforeUpgrade.beforeMax + 5,
  'The researched hit-point bonus must increase the maximum HP of an existing Militia unit');
assert.equal(hpAfterUpgrade.upgradedUnits.existing.hp, hpBeforeUpgrade.beforeHp + 5,
  'Upgrading an injured unit must preserve its existing damage rather than fully healing it');
game.addPostUpgradeMilitia();
const hpWithNewUnit = game.state().upgradedUnits.newlyTrained;
assert.equal(hpWithNewUnit.maxHp, hpBeforeUpgrade.beforeMax + 5,
  'New Militia created after research must inherit the same HP bonus');
assert.equal(hpWithNewUnit.hp, hpWithNewUnit.maxHp,
  'New Militia should spawn at its upgraded maximum HP');
console.log('technology-hp-smoke: completed Man-at-Arms research upgrades existing injured units and newly created units without erasing damage');

game.start(123456, 1);
const bloodlinesBefore = game.beginBloodlinesResearch();
for (let tick = 0; tick < 1230; tick += 1) game.tick(1 / 30);
const bloodlinesAfter = game.state();
assert.equal(bloodlinesAfter.research.bloodlines, 1, 'Bloodlines research should complete in the real Stable timer');
assert.equal(bloodlinesAfter.bloodlineUnits.existing.maxHp, bloodlinesBefore.beforeMax + 20,
  'Bloodlines must increase the maximum HP of cavalry that already exists');
assert.equal(bloodlinesAfter.bloodlineUnits.existing.hp, bloodlinesBefore.beforeHp + 20,
  'Bloodlines must preserve existing cavalry damage while adding HP');
game.addPostUpgradeKnight();
const newBloodlineKnight = game.state().bloodlineUnits.newlyCreated;
assert.equal(newBloodlineKnight.maxHp, bloodlinesBefore.beforeMax + 20,
  'New cavalry created after Bloodlines must inherit its HP bonus');
assert.equal(newBloodlineKnight.hp, newBloodlineKnight.maxHp,
  'New cavalry must spawn at its upgraded maximum HP');
console.log('bloodlines-smoke: Stable research improves existing and newly created cavalry without erasing existing damage');

game.start(123456, 1);
const chemistryBefore = game.beginChemistryResearch();
for (let tick = 0; tick < 1830; tick += 1) game.tick(1 / 30);
assert.equal(game.state().research.chemistry, 0,
  'DE Chemistry cannot complete on the outdated 60-second timer');
for (let tick = 1830; tick < 3030; tick += 1) game.tick(1 / 30);
const chemistryAfter = game.state();
assert.equal(chemistryAfter.research.chemistry, 1, 'Chemistry research should complete through the real University timer');
const chemistryShot = game.resolveChemistryShot();
assert.equal(chemistryShot.attackBonus, 1, 'Completed Chemistry must add its ship-attack bonus to the technology ledger');
assert.equal(chemistryShot.actualDamage, chemistryBefore.baselineDamage + 1,
  'A researched War Galley shot must deal exactly one more damage than the same unresearched shot');
console.log('chemistry-smoke: University research increased real War Galley damage by one');


game.start(123456);
const plannedHouse = game.beginHouseConstruction();
for (let tick = 0; tick < 1800; tick += 1) game.tick(1 / 30);
const constructionAfter = game.state();
assert.ok(constructionAfter.houseConstruction, 'The real house should remain in the game state');
assert.equal(constructionAfter.houseConstruction.done, true,
  'A villager ordered to build a legal house site should complete it within 60 simulated seconds');
assert.equal(constructionAfter.houseConstruction.hp, constructionAfter.houseConstruction.maxHp,
  'A completed house should have full hit points');
assert.ok(constructionAfter.buildings >= 5, 'The completed house should be included in the live building state');
console.log(`construction-smoke: house at ${plannedHouse.x},${plannedHouse.y} completed in 60 simulated seconds (build time=${plannedHouse.buildSeconds}s)`);

game.start(123456, 1);
const tradeBefore = game.beginTradeRoute();
for (let tick = 0; tick < 1800; tick += 1) game.tick(1 / 30);
const tradeAfter = game.state();
assert.ok(tradeAfter.playerGold > tradeBefore.gold,
  'A real trade cart travelling between completed allied/enemy markets should deliver gold');
console.log(`trade-smoke: cart route distance=${tradeBefore.distance.toFixed(1)} tiles, player gold ${tradeBefore.gold}->${tradeAfter.playerGold} over 60 simulated seconds`);

game.start(123456);
const navalBefore = game.beginNavalMove();
for (let tick = 0; tick < 900; tick += 1) game.tick(1 / 30);
const navalAfter = game.state();
assert.ok(navalAfter.navalShip, 'The test ship should remain present in the real simulation');
assert.ok(Math.hypot(navalAfter.navalShip.x - navalBefore.start.x, navalAfter.navalShip.y - navalBefore.start.y) > 4,
  'The real ship movement order should move the ship across the water route');
assert.equal(navalAfter.navalShip.water, true, 'The ship should remain on navigable water during the movement smoke test');
console.log(`naval-smoke: ship moved across water (route=${navalBefore.routeLength} path points, displacement=${Math.hypot(navalAfter.navalShip.x - navalBefore.start.x, navalAfter.navalShip.y - navalBefore.start.y).toFixed(1)} tiles)`);

game.start(123456);
const combatBefore = game.beginNavalCombat();
for (let tick = 0; tick < 900; tick += 1) game.tick(1 / 30);
const combatAfter = game.state();
assert.ok(combatAfter.navalCombatTarget, 'The enemy galley should remain inspectable in the live simulation');
assert.ok(combatAfter.navalCombatTarget.hp < combatBefore.targetHp || combatAfter.navalCombatTarget.dead,
  'A real galley attack order should damage or destroy the enemy ship');
console.log(`naval-combat-smoke: enemy galley HP ${combatBefore.targetHp}->${combatAfter.navalCombatTarget.hp} over 30 simulated seconds`);

game.start(123456);
const repairBefore = game.beginShipRepair();
assert.equal(repairBefore.order, 'rep', 'The real villager command should enter ship-repair state');
for (let tick = 0; tick < 300; tick += 1) game.tick(1 / 30);
const repairAfter = game.state();
assert.ok(repairAfter.repairTarget, 'The damaged ship should remain in the real simulation');
assert.ok(repairAfter.repairTarget.hp > repairBefore.hp, 'The real repair order should restore ship hit points');
assert.ok(repairAfter.repairTarget.hp <= repairAfter.repairTarget.maxHp, 'Repairing must not exceed maximum ship health');
console.log(`ship-repair-smoke: galley HP ${repairBefore.hp}->${repairAfter.repairTarget.hp} over 10 simulated seconds`);



const campaignBefore = game.completeFirstCampaignMission();
for (let tick = 0; tick < 15; tick += 1) game.tick(1 / 30);
const campaignAfter = game.state();
assert.equal(campaignBefore.mission, 0, 'The campaign smoke should initialise First Hearth');
for (const goal of campaignBefore.requiredGoals) {
  assert.equal(campaignAfter.campaign.goals[goal], 1, `Campaign objective ${goal} should be marked complete by the real objective tracker`);
}
assert.equal(campaignAfter.gameOver, 'win', 'Completing all First Hearth objectives should trigger the real mission-win state');
console.log(`campaign-smoke: First Hearth completed; objectives=${campaignBefore.requiredGoals.join(',')}, result=${campaignAfter.gameOver}`);

game.start(123456);
const aiBefore = game.state();
for (let tick = 0; tick < 21600; tick += 1) game.tick(1 / 30);
const aiAfter = game.state();
const activeAi = aiAfter.aiGrowth.filter((a) => a && a.team > 0);
assert.ok(activeAi.length > 0, 'The seeded match should initialise at least one rival AI kingdom');
assert.ok(activeAi.some((a) => a.buildings > (aiBefore.aiGrowth.find((b) => b && b.team === a.team)?.buildings ?? 0) ||
  a.militaryUnits > (aiBefore.aiGrowth.find((b) => b && b.team === a.team)?.militaryUnits ?? 0) ||
  a.age > (aiBefore.aiGrowth.find((b) => b && b.team === a.team)?.age ?? 0)),
  'Rival AI must make measurable economic, military or age progression during twelve simulated minutes');
console.log('aoe2-de-ai-debug: '+JSON.stringify(activeAi.map(a=>({...a,resources:aiAfter.resources[a.team]}))));
assert.ok(activeAi.some((a) => a.age >= 1),
  'At least one rival should complete Feudal Age after meeting building and food prerequisites');
// Preserve the Feudal-age milestone above at twelve minutes. Authentic
// base villager/gathering speeds no longer justify expecting a *large army*
// and its coordinated attack within that same early-economy time window.
// Give post-age production a further eight minutes without relaxing the
// mandatory barracks, force-size and actual attack-wave outcomes.
for (let tick = 0; tick < 14400; tick += 1) game.tick(1 / 30);
const matureAi = game.state();
const matureTeams = matureAi.aiGrowth.filter(a => a && a.team > 0);
assert.ok(matureTeams.some((a) => a.completedMilitaryBuildings > 0),
  'A rival must complete a military production building in the later production phase');
assert.ok(Object.values(matureAi.aiPeak).some((count) => count >= 4),
  'A rival must field at least four military units after reaching Feudal Age');
console.log('aoe2-de-ai-mature-debug: '+JSON.stringify(matureTeams.map(a=>({...a,resources:matureAi.resources[a.team]}))));
assert.ok(matureTeams.some((a) => a.wave > 0),
  'A rival must launch a real coordinated attack wave during the mature economy phase');
assert.ok(matureAi.gameOver === null || matureAi.gameOver === 'lose',
  'The unattended 20-minute match must not incorrectly award a player victory or draw');
console.log('ai-growth-smoke: strict Feudal-by-720s and mature 1200s military/wave checks: ' +
  matureTeams.map((a) => `team ${a.team}: age=${a.age}, buildings=${a.buildings}, military=${a.militaryUnits}, wave=${a.wave}`).join('; '));

game.start(123456);
const defence = game.runDefenseResponse();
assert.equal(defence.militaryResponded, true, 'Idle AI defenders should engage a hostile intruder near their Town Centre');
assert.equal(defence.villagerGarrisoned, true, 'AI villagers near a threatened Town Centre should garrison');
console.log('ai-defence-smoke: idle military engaged a hostile intruder and a nearby villager garrisoned');

game.start(246810);
const siegeAttack = game.runSiegeTargetTest();
assert.equal(siegeAttack.waveStarted, true, 'A sufficiently large AI army should initiate a coordinated wave');
assert.equal(siegeAttack.selectedSiegeTarget, true, 'Siege targeting should prefer a completed hostile Castle over a Tower or Town Centre');
assert.equal(siegeAttack.siegeUnitTargetedCastle, true, 'A staged battering ram should receive the selected Castle target');
assert.equal(siegeAttack.infantryAssignedToPrimaryTarget, true, 'Non-siege units should retain the primary attack target');
console.log('ai-siege-smoke: coordinated wave selected the Castle for the ram and retained the Town Centre target for infantry');

game.start(123456);
const relicBefore = game.beginRelicIncome();
assert.equal(relicBefore.relics, 1, 'The relic-income test should place one relic in the completed Monastery');
for (let tick = 0; tick < 1800; tick += 1) game.tick(1 / 30);
const relicAfter = game.state();
assert.ok(relicAfter.playerGold >= relicBefore.gold + 29.5,
  'A relic held in a completed Monastery should generate approximately 30 gold over 60 simulated seconds');
console.log(`relic-income-smoke: one relic generated ${relicAfter.playerGold - relicBefore.gold} gold over 60 simulated seconds`);

game.start(123456);
const farmBefore = game.beginFarmReseed();
assert.equal(farmBefore.wood, 60, 'The farm reseed test should begin with the required 60 wood');
game.tick(1 / 30);
const farmAfter = game.state().farmReseed;
assert.equal(farmAfter.farm, true, 'The exhausted resource must remain a farm node after reseeding');
assert.equal(farmAfter.wood, 0, 'Automatic farm reseeding must charge 60 wood');
assert.ok(farmAfter.amount >= 175, 'The exhausted farm should be replenished with its base food capacity');
console.log(`farm-reseed-smoke: depleted farm replenished to ${farmAfter.amount} food for 60 wood`);

const generatedMaps = [];
for (let mapIndex = 0; mapIndex < 12; mapIndex += 1) {
  const result = game.startMap(73000 + mapIndex, mapIndex, 4);
  assert.equal(result.mapAudit?.landReachable, true, `Generated map ${mapIndex} should connect all four starting land regions`);
  assert.ok(result.mapAudit.waterCells > 0, `Generated map ${mapIndex} should contain water cells`);
  assert.equal(result.mapAudit.starts, 4, `Generated map ${mapIndex} should audit all four starting locations`);
  generatedMaps.push({ mapIndex, landComponents: result.mapAudit.landComponents, waterComponents: result.mapAudit.waterComponents, dockableStarts: result.mapAudit.dockableStarts });
}
console.log('generated-map-smoke: all 12 actual map types generated with connected starting land: ' +
  generatedMaps.map((m) => `map ${m.mapIndex}: land components=${m.landComponents}, water components=${m.waterComponents}, dockable starts=${m.dockableStarts}`).join('; '));

const causewaySkirmish = game.startLayout(12, 4);
assert.equal(causewaySkirmish.layout, 12, 'The selectable Causeway layout must load directly in a four-kingdom match');
assert.equal(causewaySkirmish.mapAudit?.landReachable, true, 'All four skirmish starting land regions must connect across the shallow crossings');
assert.equal(causewaySkirmish.mapAudit?.starts, 4, 'The four-kingdom Causeway map must audit every starting position');
assert.ok(causewaySkirmish.mapAudit?.waterCells > 0, 'The four-kingdom Causeway map must retain a navigable-water corridor');
const causewayShipStart = game.beginNavalMove();
for (let tick = 0; tick < 900; tick += 1) game.tick(1 / 30);
const causewayShipAfter = game.state().navalShip;
assert.ok(causewayShipAfter, 'The ship used for the Causeway water-route test must remain in the simulation');
assert.ok(Math.hypot(causewayShipAfter.x - causewayShipStart.start.x, causewayShipAfter.y - causewayShipStart.start.y) > 4,
  'A ship must traverse the actual Causeway layout water corridor, not merely spawn on water');
assert.equal(causewayShipAfter.water, true, 'The Causeway ship must remain on navigable water during the route test');
console.log('causeway-layout-smoke: layout 12 generated for four kingdoms with connected land and a traversable ship route');

const brokenIsles = game.startLayout(13, 4);
assert.equal(brokenIsles.layout, 13, 'Broken Isles must load as layout 13');
assert.equal(brokenIsles.mapAudit?.starts, 4, 'Broken Isles must recognise all four starting positions');
assert.equal(brokenIsles.mapAudit?.landReachable, true, 'Shallow crossings must keep every starting kingdom land-connected');
assert.ok(brokenIsles.mapAudit?.waterCells > 0, 'Broken Isles must retain navigable water channels');
assert.ok((brokenIsles.mapAudit?.waterNetworkCoverage || 0) >= 50, 'The largest Broken Isles channel network must cover at least half of mapped water cells');
const brokenShipStart = game.beginNavalMove();
for (let tick = 0; tick < 900; tick += 1) game.tick(1 / 30);
const brokenShipAfter = game.state().navalShip;
assert.ok(brokenShipAfter, 'The Broken Isles movement ship must remain active');
assert.ok(Math.hypot(brokenShipAfter.x - brokenShipStart.start.x, brokenShipAfter.y - brokenShipStart.start.y) > 4,
  'A ship must travel through the Broken Isles water network rather than merely spawn');
assert.equal(brokenShipAfter.water, true, 'The Broken Isles ship must finish its route on navigable deep water');
console.log('broken-isles-smoke: connected starting land, one water network and an actual ship route');

game.start(123456);
const invalidMapStartAudit = game.auditMapStarts([[-1, 10], [10, 10]]);
assert.equal(invalidMapStartAudit.landReachable, false, 'Out-of-bounds map start coordinates must not alias an in-bounds linear grid index');
const causewayCampaign = game.startCampaign(16);
assert.equal(causewayCampaign.campaign?.index, 16, 'The seventeenth campaign mission should start through the real scenario loader');
assert.equal(causewayCampaign.layout, 12, 'The Causeway mission must select the dedicated map layout');
assert.ok(causewayCampaign.enemyGalleys >= 3, 'The Causeway rival must begin with three galleys contesting the strait');
assert.equal(causewayCampaign.mapAudit?.landReachable, true, 'Campaign player and rival starting land must connect across the shallow crossings');
assert.equal(causewayCampaign.mapAudit?.starts, 2, 'The campaign map audit must recognise its player and rival starting positions');
assert.ok(causewayCampaign.mapAudit?.waterCells > 0, 'The Causeway campaign must retain a navigable-water corridor');
assert.ok(causewayCampaign.buildings >= 4 && causewayCampaign.units > 0, 'The Causeway mission must create its starting economy and forces');

console.log('causeway-campaign-smoke: mission 17 loaded on layout 12 with connected starting land and a live water corridor');

// Boot every campaign scenario through the real scenario loader, then advance it
// for one simulated second. This catches mission-specific setup/runtime crashes
// without pretending that a startup smoke test is a completed playthrough.
const campaignBoots = [];
for (let mission = 0; mission < 19; mission += 1) {
  const before = game.startCampaign(mission);
  assert.equal(before.campaign?.index, mission, `Campaign mission ${mission + 1} should initialise the requested scenario`);
  const objectiveAudit = game.auditCurrentCampaignObjectives();
  const eventAudit = game.auditCurrentCampaignEvents();
  assert.ok(eventAudit, `Campaign mission ${mission + 1} must expose its event schedule`);
  assert.equal(eventAudit.invalid, 0, `Campaign mission ${mission + 1} events must have a valid trigger and action`);
  assert.ok(objectiveAudit && objectiveAudit.count > 0, `Campaign mission ${mission + 1} must define at least one objective`);
  assert.equal(objectiveAudit.unique, true, `Campaign mission ${mission + 1} must use unique, non-empty objective IDs`);
  assert.equal(objectiveAudit.predicateErrors, 0, `Campaign mission ${mission + 1} objective predicates must execute and return booleans at scenario start`);
  assert.ok(before.units > 0, `Campaign mission ${mission + 1} should initialise at least one unit`);
  assert.ok(before.buildings > 0, `Campaign mission ${mission + 1} should initialise at least one building`);
  // Keep each real scenario alive for forty simulated seconds so early
  // scheduled events, repeated AI decisions and campaign state transitions execute.
  for (let tick = 0; tick < 1200; tick += 1) game.tick(1 / 30);
  const eventAuditAfterSimulation = game.auditCurrentCampaignEvents();
  assert.ok(eventAuditAfterSimulation && eventAuditAfterSimulation.invalid === 0, `Campaign mission ${mission + 1} must retain valid event definitions after simulation`);
  const objectiveAuditAfterSimulation = game.auditCurrentCampaignObjectives();
  assert.ok(objectiveAuditAfterSimulation && objectiveAuditAfterSimulation.count > 0, `Campaign mission ${mission + 1} must retain its objective set after scheduled events and AI ticks`);
  assert.equal(objectiveAuditAfterSimulation.unique, true, `Campaign mission ${mission + 1} objective IDs must remain unique after simulation`);
  assert.equal(objectiveAuditAfterSimulation.predicateErrors, 0, `Campaign mission ${mission + 1} objective predicates must remain safe after 40 simulated seconds`);
  const after = game.state();
  assert.equal(after.campaign?.index, mission, `Campaign mission ${mission + 1} should remain active after simulation steps`);
  assert.ok(Number.isFinite(after.time), `Campaign mission ${mission + 1} should retain finite simulation time`);
  campaignBoots.push({ mission: mission + 1, units: after.units, buildings: after.buildings });
}
console.log('campaign-matrix-smoke: all 19 campaign missions started and survived 40 simulated seconds: ' +
  campaignBoots.map((m) => `M${m.mission}=${m.units}u/${m.buildings}b`).join(', '));

// Directly exercise every campaign goal predicate, mission victory, and both defeat routes.

const campaignGoalAudit = timed('campaign-goal-reachability-19-missions', () => game.auditCampaignGoalReachability());
assert.equal(campaignGoalAudit.results.length, 19, 'All 19 campaign missions must be audited');
for (const mission of campaignGoalAudit.results) {
  assert.equal(mission.initialTrue.length, 0, `Mission ${mission.index + 1} must not start with a completed objective: ${mission.initialTrue.join(', ')}`);
  assert.equal(mission.failedPredicates.length, 0, `Mission ${mission.index + 1} goals must be satisfiable through direct game-state changes: ${mission.failedPredicates.join(', ')}`);
  assert.equal(mission.won, true, `Mission ${mission.index + 1} must reach victory when every goal condition is satisfied`);
}
assert.equal(campaignGoalAudit.defeats.length, 19, 'Every mission must have its Town Centre defeat route checked');
for (const mission of campaignGoalAudit.defeats) assert.equal(mission.lost, true, `Mission ${mission.index + 1} must reach defeat when its Town Centre is destroyed`);
assert.equal(campaignGoalAudit.kingDefeat, true, 'The Last Crown must also defeat when the player King is killed');
console.log('campaign-goal-reachability: 19 missions; every goal predicate satisfied directly; all Town Centre defeat routes and the Last Crown King defeat route passed');
if (shouldRunCampaignMission(0)) {
const firstHearthPlaythrough = playCampaignScenarioTimed(0, 240);
assert.equal(firstHearthPlaythrough.trainingGate, null, 'First Hearth must permit its required soldier training without an impossible age prerequisite: '+JSON.stringify(firstHearthPlaythrough));
assert.equal(firstHearthPlaythrough.over, 'win', 'A scripted player using real building, gathering and training orders must win First Hearth within four simulated minutes: '+JSON.stringify(firstHearthPlaythrough));
assert.ok(firstHearthPlaythrough.objectives.every(objective => objective.complete && objective.predicate), 'First Hearth must naturally complete every objective through the simulation: '+JSON.stringify(firstHearthPlaythrough));
console.log('campaign-scripted-playthrough: First Hearth won through real building, gathering and production orders in '+firstHearthPlaythrough.campaignTime.toFixed(1)+' simulated seconds');
}
if (shouldRunCampaignMission(1)) {
const raidersAtFordPlaythrough = playCampaignScenarioTimed(1, 600);
assert.equal(raidersAtFordPlaythrough.trainingGate, null, 'Raiders at the Ford must allow its required soldiers to be trained: '+JSON.stringify(raidersAtFordPlaythrough));
assert.equal(raidersAtFordPlaythrough.over, 'win', 'A scripted player must build a Barracks, train eight soldiers and survive the timed raids in Raiders at the Ford: '+JSON.stringify(raidersAtFordPlaythrough));
assert.ok(raidersAtFordPlaythrough.objectives.every(objective => objective.complete), 'Raiders at the Ford must record every objective as completed: '+JSON.stringify(raidersAtFordPlaythrough));
assert.equal(raidersAtFordPlaythrough.objectives.find(objective => objective.title === 'Survive until 8:00')?.predicate, true, 'The survival objective must still be true at victory');
console.log('campaign-scripted-playthrough: Raiders at the Ford won through real building, training and timed raid simulation in '+raidersAtFordPlaythrough.campaignTime.toFixed(1)+' simulated seconds');
}
if (shouldRunCampaignMission(2)) {
const feudalFrontierPlaythrough = playCampaignScenarioTimed(2, 900);
assert.ok(['win', 'lose'].includes(feudalFrontierPlaythrough.over), 'The Feudal Frontier must reach a real victory or defeat transition: '+JSON.stringify(feudalFrontierPlaythrough));
assert.ok(feudalFrontierPlaythrough.objectives.find(objective => objective.title === 'Reach the Feudal Age')?.complete, 'The Feudal Frontier bot must naturally reach Feudal Age: '+JSON.stringify(feudalFrontierPlaythrough));
const frontierOutcome = feudalFrontierPlaythrough.over === 'win' ? 'won' : 'ended in defeat; simple-bot winnability remains unverified';
console.log('campaign-scripted-playthrough: The Feudal Frontier '+frontierOutcome+' after '+feudalFrontierPlaythrough.campaignTime.toFixed(1)+' simulated seconds; age='+feudalFrontierPlaythrough.age+', objectives='+feudalFrontierPlaythrough.objectives.filter(objective => objective.complete).length+'/'+feudalFrontierPlaythrough.objectives.length);
}
if (shouldRunCampaignMission(3)) {
const relicRoadPlaythrough = playCampaignScenarioTimed(3, 600);
assert.equal(relicRoadPlaythrough.over, 'win', 'A scripted player must build a Monastery and recover three relics in the first Relic Road: '+JSON.stringify(relicRoadPlaythrough));
assert.ok(relicRoadPlaythrough.objectives.every(objective => objective.complete), 'The first Relic Road must record all objectives complete: '+JSON.stringify(relicRoadPlaythrough));
console.log('campaign-scripted-playthrough: The Relic Road won through real monastery construction and monk relic behaviour in '+relicRoadPlaythrough.campaignTime.toFixed(1)+' simulated seconds');
}
if (shouldRunCampaignMission(11)) {
const secondRelicRoadPlaythrough = playCampaignScenarioTimed(11, 600);
assert.equal(secondRelicRoadPlaythrough.over, 'win', 'A scripted player must build a Monastery and return two relics in the second Relic Road: '+JSON.stringify(secondRelicRoadPlaythrough));
assert.ok(secondRelicRoadPlaythrough.objectives.every(objective => objective.complete), 'The second Relic Road must record both objectives complete: '+JSON.stringify(secondRelicRoadPlaythrough));
console.log('campaign-scripted-playthrough: the second Relic Road won through real monastery construction and monk relic behaviour in '+secondRelicRoadPlaythrough.campaignTime.toFixed(1)+' simulated seconds');
}
if (shouldRunCampaignMission(12)) {
const goldenCoastPlaythrough = playCampaignScenarioTimed(12, 1200);
assert.ok(['win', 'lose'].includes(goldenCoastPlaythrough.over), 'The Golden Coast must reach a real victory or defeat transition: '+JSON.stringify(goldenCoastPlaythrough));
console.log('campaign-scripted-playthrough: The Golden Coast '+(goldenCoastPlaythrough.over === 'win' ? 'won' : 'ended in defeat; simple-bot winnability remains unverified')+' after '+goldenCoastPlaythrough.campaignTime.toFixed(1)+' simulated seconds; objectives='+goldenCoastPlaythrough.objectives.filter(objective => objective.complete).length+'/'+goldenCoastPlaythrough.objectives.length);
}
if (shouldRunCampaignMission(14)) {
const tidewatchPlaythrough = playCampaignScenarioTimed(14, 1200);
assert.ok(['win', 'lose'].includes(tidewatchPlaythrough.over), 'The Siege of Tidewatch must reach a real victory or defeat transition: '+JSON.stringify(tidewatchPlaythrough));
console.log('campaign-scripted-playthrough: The Siege of Tidewatch '+(tidewatchPlaythrough.over === 'win' ? 'won' : 'ended in defeat; simple-bot winnability remains unverified')+' after '+tidewatchPlaythrough.campaignTime.toFixed(1)+' simulated seconds; objectives='+tidewatchPlaythrough.objectives.filter(objective => objective.complete).length+'/'+tidewatchPlaythrough.objectives.length);
}
if (shouldRunCampaignMission(6)) {
const northernWatchPlaythrough = playCampaignScenarioTimed(6, 600);
assert.equal(northernWatchPlaythrough.trainingGate, null, 'The Northern Watch must permit its ranged-unit objective at the mission start age: '+JSON.stringify(northernWatchPlaythrough));
assert.ok(['win', 'lose', null].includes(northernWatchPlaythrough.over), 'The Northern Watch must reach victory, defeat or the explicit simulation timeout: '+JSON.stringify(northernWatchPlaythrough));
console.log('campaign-scripted-playthrough: The Northern Watch '+(northernWatchPlaythrough.over === 'win' ? 'won' : northernWatchPlaythrough.over === 'lose' ? 'ended in defeat; simple-bot winnability remains unverified' : 'timed out; simple-bot winnability remains unverified')+' after '+northernWatchPlaythrough.campaignTime.toFixed(1)+' simulated seconds; objectives='+northernWatchPlaythrough.objectives.filter(objective => objective.complete).length+'/'+northernWatchPlaythrough.objectives.length);
}
if (shouldRunCampaignMission(7)) {
const redwaterPlaythrough = playCampaignScenarioTimed(7, 600);
assert.equal(redwaterPlaythrough.over, 'win', 'A scripted player must build the Market and two Towers and survive Crossing at Redwater: '+JSON.stringify(redwaterPlaythrough));
assert.ok(redwaterPlaythrough.objectives.every(objective => objective.complete), 'Crossing at Redwater must naturally complete all three objectives: '+JSON.stringify(redwaterPlaythrough));
console.log('campaign-scripted-playthrough: Crossing at Redwater '+(redwaterPlaythrough.over === 'win' ? 'won' : redwaterPlaythrough.over === 'lose' ? 'ended in defeat; simple-bot winnability remains unverified' : 'timed out; simple-bot winnability remains unverified')+' after '+redwaterPlaythrough.campaignTime.toFixed(1)+' simulated seconds; objectives='+redwaterPlaythrough.objectives.filter(objective => objective.complete).length+'/'+redwaterPlaythrough.objectives.length);
}
if (shouldRunCampaignMission(5)) {
const lastCrownPlaythrough = playCampaignScenarioTimed(5, 1200);
assert.ok(['win', 'lose', null].includes(lastCrownPlaythrough.over), 'The Last Crown must reach victory, defeat or the explicit simulation timeout: '+JSON.stringify(lastCrownPlaythrough));
console.log('campaign-scripted-playthrough: The Last Crown '+(lastCrownPlaythrough.over === 'win' ? 'won' : lastCrownPlaythrough.over === 'lose' ? 'ended in defeat; simple-bot winnability remains unverified' : 'timed out; simple-bot winnability remains unverified')+' after '+lastCrownPlaythrough.campaignTime.toFixed(1)+' simulated seconds; objectives='+lastCrownPlaythrough.objectives.filter(objective => objective.complete).length+'/'+lastCrownPlaythrough.objectives.length);
}
for (const [index, label, limit] of [
  [10, 'The King’s Road', 700],
  [13, 'The Strait’s Last Relic', 1200],
  [15, 'The Bridge at Blackwood', 700],
  [16, 'The Causeway Muster', 1200],
  [17, 'The Crown Holds the Crossing', 1200],
  [18, 'The Iron Pass', 700],
]) {
  if (!shouldRunCampaignMission(index)) continue;
  const result = playCampaignScenarioTimed(index, limit);
  assert.ok(['win', 'lose', null].includes(result.over), label+' must reach victory, defeat or the explicit simulation timeout: '+JSON.stringify(result));
  const completed = result.objectives.filter(objective => objective.complete).length;
  const total = result.objectives.length;
  console.log('campaign-scripted-playthrough: '+label+' '+(result.over === 'win' ? 'won' : result.over === 'lose' ? 'ended in defeat; simple-bot winnability remains unverified' : 'timed out; simple-bot winnability remains unverified')+' after '+result.campaignTime.toFixed(1)+' simulated seconds; objectives='+completed+'/'+total+'; incomplete='+result.objectives.filter(objective => !objective.complete).map(objective => objective.title).join('|'));
}
for (const [index, label] of [[4, 'Siege of Kronburg'], [8, 'Crown of Ashford'], [9, 'Siege of Greywatch']]) {
  if (!shouldRunCampaignMission(index)) continue;
  const result = playCampaignScenarioTimed(index, 900);
  assert.ok(['win', 'lose', null].includes(result.over), label+' must reach victory, defeat or the explicit simulation timeout: '+JSON.stringify(result));
  console.log('campaign-scripted-playthrough: '+label+' '+(result.over === 'win' ? 'won' : result.over === 'lose' ? 'ended in defeat; simple-bot winnability remains unverified' : 'timed out; simple-bot winnability remains unverified')+' after '+result.campaignTime.toFixed(1)+' simulated seconds; objectives='+result.objectives.filter(objective => objective.complete).length+'/'+result.objectives.length);
}

if (requestedMission === null) {
// Exercise campaign event dispatch itself, not just the shape of event definitions.
// The first timed tutorial event must fire when due and remain one-shot afterwards.
const timedCampaignEvent = game.exerciseTimedCampaignEvent();
assert.ok(timedCampaignEvent.time >= 2, 'Campaign event test must advance beyond the event deadline');
assert.equal(timedCampaignEvent.fired, true, 'The due timed campaign event must be marked as fired');
assert.equal(timedCampaignEvent.calls, 1, 'The timed campaign event action must execute exactly once');
assert.equal(timedCampaignEvent.callsAfterRepeat, 1, 'Further campaign ticks must not execute a fired event again');
assert.equal(timedCampaignEvent.firedAfterRepeat, true, 'The event fired marker must remain set after additional ticks');
console.log('campaign-event-dispatch: timed event fired once and remained one-shot across 18 seconds of campaign time');

// Campaigns must fail through the normal mission-end path when the player's Town Centre falls.
const campaignDefeat = game.exerciseCampaignDefeat();
assert.equal(campaignDefeat.over, 'lose', 'Losing the player Town Centre must defeat a campaign mission');
assert.equal(campaignDefeat.mode, 'end', 'Campaign defeat should enter the mission-end screen');
assert.equal(campaignDefeat.reason, 'Your Town Centre fell', 'Campaign defeat should explain the cause');
assert.equal(campaignDefeat.campaignTime, 0, 'Campaign time must stop advancing after immediate defeat');
assert.equal(campaignDefeat.savedCompletion, null, 'A failed mission must not be recorded as completed');
console.log('campaign-defeat-transition: Town Centre loss ends the mission without recording a win');

// Exercise the real mission-end path: no victory before all goals, persistent completion,
// then the next mission briefing follows the campaign's declared arc order.
const campaignCompletion = game.exerciseCampaignCompletion();
assert.notEqual(campaignCompletion.before.over, 'win', 'A campaign must not win while every objective predicate is false');
assert.equal(Object.keys(campaignCompletion.before.completed).length, 0, 'No objective may be marked complete before its predicate succeeds');
assert.equal(campaignCompletion.won.over, 'win', 'The mission should win after every objective predicate succeeds');
assert.equal(Object.keys(campaignCompletion.won.completed).length, 5, 'Every First Hearth objective must be recorded complete');
assert.equal(campaignCompletion.won.mode, 'end', 'Campaign victory should enter the mission-end screen');
assert.equal(campaignCompletion.nextBriefing.mode, 'brief', 'Continue after victory should open the next mission briefing');
assert.equal(campaignCompletion.nextBriefing.index, 1, 'First Hearth should advance to Raiders at the Ford');
assert.equal(campaignCompletion.savedCompletion['0'], 1, 'Mission completion should be persisted for campaign unlocks');
console.log('campaign-completion-transition: all objectives required, completion persisted, next mission briefing opened');

// Verify the live AI decision loop retargets a war galley after its previous target dies.
const galleyReacquisition = game.exerciseGalleyTargetReacquisition();
assert.equal(galleyReacquisition.reacquired, true, 'An AI war galley must acquire a nearby live hostile ship after target loss');
assert.equal(galleyReacquisition.order, 'a', 'The retargeted war galley should remain in attack mode');
assert.equal(galleyReacquisition.idleMoveReacquired, true, 'An AI war galley moving without a target must engage a nearby hostile ship');
console.log('naval-ai-target-reacquisition: live AI retargeted after target loss');

// Exercise every named generated-map layout through the actual game initializer.
// This catches disconnected starts and bad map-layout seeds that static tests miss.
const generatedMapAudits = [];
for (let layout = 1; layout <= 13; layout += 1) {
  const state = game.startLayout(layout, 4);
  assert.equal(state.layout, layout, `Map layout ${layout} should remain selected after initialization`);
  assert.ok(state.mapAudit, `Map layout ${layout} must publish its generated-map audit`);
  assert.equal(state.mapAudit.landReachable, true, `Map layout ${layout} must connect all four starting land regions`);
  assert.equal(state.mapAudit.starts, 4, `Map layout ${layout} must audit all four starting positions`);
  assert.ok(Number.isInteger(state.mapAudit.attempts) && state.mapAudit.attempts >= 1 && state.mapAudit.attempts <= 13, `Map layout ${layout} must report a bounded 1–13 generation attempt count`);
  assert.ok(state.units >= 20, `Map layout ${layout} must initialize a starting economy for all four kingdoms`);
  generatedMapAudits.push({ layout, attempts: state.mapAudit.attempts ?? null, water: state.mapAudit.waterCells, dockableStarts: state.mapAudit.dockableStarts });
}
for (const layout of [2, 4, 12, 13]) {
  for (const teams of [2, 3]) {
    const state = game.startLayout(layout, teams);
    assert.equal(state.mapAudit?.landReachable, true, `Map layout ${layout} must connect ${teams} kingdoms`);
    assert.equal(state.mapAudit?.starts, teams, `Map layout ${layout} must audit ${teams} starting positions`);
  }
}
console.log('generated-map-matrix: '+generatedMapAudits.length+' named layouts passed four-kingdom connectivity; Twin Rivers, Island Reach, Kings Causeway and Broken Isles also passed two/three-kingdom starts');

const skirmish = timed('four-kingdom-skirmish', () => game.runSkirmish(60));
assert.equal(skirmish.teams, 4, 'Long skirmish stress test must include four kingdoms');
assert.ok(skirmish.time >= 59.9, 'Skirmish stress test must advance at least 60 simulated seconds');
assert.ok(skirmish.units > 0, 'Four-kingdom skirmish should retain at least one valid unit record');
assert.equal(skirmish.invalidUnits, 0, 'AI skirmish must not leave units with invalid coordinates or health');
assert.equal(skirmish.invalidBuildings, 0, 'AI skirmish must not leave buildings with invalid coordinates or health');
assert.equal(skirmish.invalidResources, 0, 'AI skirmish must preserve finite non-negative kingdom resources');
console.log('four-kingdom-skirmish-smoke: '+skirmish.time.toFixed(1)+'s, '+skirmish.units+' units, '+skirmish.buildings+' buildings, invalid units/buildings/resources='+skirmish.invalidUnits+'/'+skirmish.invalidBuildings+'/'+skirmish.invalidResources);

// Longer four-kingdom economy-to-war run: enable the existing AI decision function
// for team 0 as well as the three native AI teams, allow six simulated minutes of
// gathering/building/training, then order surviving armies to attack rivals for one minute.
const war = timed('four-kingdom-economy-war', () => game.runFourKingdomWar(360, 60));
assert.equal(war.teams, 4, 'Extended AI war must run four kingdoms');
assert.ok(war.simulatedSeconds >= 419.9, 'Extended AI war must simulate at least seven minutes');
assert.ok(war.before.every(t => t.units > 0 && t.buildings > 0), 'Each AI kingdom must start with units and buildings');
assert.ok(war.economy.every(t => t.units > 0 && t.buildings > 0), 'Each AI kingdom must retain units and buildings after economy phase');
assert.equal(war.invalidUnits, 0, 'Extended AI war must preserve valid unit states');
assert.equal(war.invalidBuildings, 0, 'Extended AI war must preserve valid building states');
assert.equal(war.invalidResources, 0, 'Extended AI war must preserve finite non-negative resources');
console.log('four-kingdom-economy-war: simulated='+war.simulatedSeconds.toFixed(1)+'s (economy='+war.economySeconds+'s, attack='+war.combatSeconds+'s), teams='+war.after.map(t=>'T'+t.team+' units='+t.units+' buildings='+t.buildings+' villagers='+t.villagers+' military='+t.military+' gathering='+t.gathering+' resources='+JSON.stringify(t.resources)).join(' | ')+', invalid='+war.invalidUnits+'/'+war.invalidBuildings+'/'+war.invalidResources);










game.startCampaign(16);
for (let tick = 0; tick < 90; tick += 1) game.tick(1 / 30);
const autosave = timed('rolling-autosave-overwrite-and-load', () => game.exerciseAutosaveOverwrite());
assert.equal(autosave.overwritten, true, 'A second autosave must overwrite the single rolling autosave payload');
assert.equal(autosave.loaded, true, 'The latest rolling autosave must restore successfully');
assert.equal(autosave.restoredTime, autosave.secondTime, 'Autosave loading must restore the newest saved simulation time');
assert.equal(autosave.manualSlotsUnchanged, true, 'Autosaving must not overwrite the three independent manual save slots');
assert.equal(autosave.autosaveCount, 1, 'Autosave must retain one dedicated rolling slot');
console.log('rolling-autosave-smoke: latest snapshot overwrites the previous autosave, restores successfully and leaves manual slots untouched');
const saveRoundTrip = timed('campaign-save-load-round-trip', () => game.saveLoadRoundTrip());
assert.equal(saveRoundTrip.loaded, true, 'A valid local save must restore successfully');
assert.equal(saveRoundTrip.version, 1, 'The save round-trip must preserve the current versioned format');
assert.ok(saveRoundTrip.bytes > 1000, 'The active campaign must write a non-empty world snapshot');
assert.equal(saveRoundTrip.after.time, saveRoundTrip.before.time, 'Simulation time must survive save/load');
assert.equal(saveRoundTrip.after.size, saveRoundTrip.before.size, 'Map dimensions must survive save/load');
assert.equal(saveRoundTrip.after.units, saveRoundTrip.before.units, 'All saved units must be restored');
assert.equal(saveRoundTrip.after.buildings, saveRoundTrip.before.buildings, 'All saved buildings must be restored');
assert.equal(saveRoundTrip.after.nodeCount, saveRoundTrip.before.nodeCount, 'All saved resource nodes must be restored');
assert.deepEqual(JSON.parse(JSON.stringify(saveRoundTrip.after.resources)), JSON.parse(JSON.stringify(saveRoundTrip.before.resources)), 'All kingdoms’ resources must be restored');
assert.deepEqual(JSON.parse(JSON.stringify(saveRoundTrip.after.technology)), JSON.parse(JSON.stringify(saveRoundTrip.before.technology)), 'Researched technologies must be restored');
assert.deepEqual(JSON.parse(JSON.stringify(saveRoundTrip.after.campaign)), JSON.parse(JSON.stringify(saveRoundTrip.before.campaign)), 'Campaign time, completed goals and fired events must be restored');
assert.equal(saveRoundTrip.after.campaign?.index, 16, 'The Causeway campaign must remain the active mission after loading');
console.log(`save-load-smoke: restored campaign ${saveRoundTrip.after.campaign.index} with ${saveRoundTrip.after.units} units, ${saveRoundTrip.after.buildings} buildings and ${saveRoundTrip.bytes} saved characters`);


game.start(123456);
const townBellAudit = game.auditTownBellReservations();
assert.equal(townBellAudit.sent, townBellAudit.assigned, 'Town Bell must report every actual villager assignment');
assert.equal(townBellAudit.assigned, townBellAudit.totalCapacity, 'With enough villagers, Town Bell should reserve every available shelter slot exactly once');
assert.equal(townBellAudit.unassigned, 100 - townBellAudit.totalCapacity, 'Villagers beyond total shelter capacity must remain unassigned');
for (const shelter of townBellAudit.occupancy) {
  assert.ok(shelter.assigned <= shelter.capacity, 'Town Bell must not overbook ' + shelter.kind);
}
console.log('town-bell-behaviour: '+townBellAudit.assigned+' villagers assigned across '+townBellAudit.occupancy.length+' shelters with no capacity overbooking');

// Warm both sides of the 64-unit separation threshold before recording timed samples.
game.benchmarkArmy(100, 30);
game.benchmarkArmy(400, 30);

for (const population of [100, 200, 400]) {
  const samples = [];
  let finalResult = null;
  for (let repeat = 0; repeat < 3; repeat++) {
    const result = game.benchmarkArmy(population, 30);
    const elapsedMs = result.elapsedMs;
    assert.equal(result.units, population, 'Benchmark must measure the requested total live-unit population, including the seeded starting army');
    assert.ok(result.added >= 0, 'Benchmark must report how many synthetic units were added to reach the target population');
    assert.equal(result.ticks, 30, 'Benchmark must execute the full fixed number of simulation ticks');
    assert.ok(Number.isFinite(elapsedMs) && elapsedMs >= 0, 'Simulation-only benchmark timing must be finite');
    samples.push(elapsedMs);
    finalResult = result;
  }
  samples.sort((a, b) => a - b);
  console.log('large-army-runtime: requested='+population+' added='+finalResult.added+' total='+finalResult.units+' ticks='+finalResult.ticks+' repeats=3 simulationOnly=true medianMs='+samples[1].toFixed(2)+' rangeMs='+samples[0].toFixed(2)+'-'+samples[2].toFixed(2));
}

// Measure a dense opposing-army scenario as well as idle separation overhead.
const combatSamples = [];
let combatResult = null;
for (let repeat = 0; repeat < 3; repeat++) {
  combatResult = game.benchmarkArmy(400, 30, true);
  assert.equal(combatResult.units, 400, 'Combat benchmark must contain the requested live-unit population');
  assert.equal(combatResult.combat, true, 'Combat benchmark must enable opposing attack orders');
  assert.equal(combatResult.ticks, 30, 'Combat benchmark must execute all fixed simulation ticks');
  assert.ok(Number.isFinite(combatResult.elapsedMs) && combatResult.elapsedMs >= 0, 'Combat timing must be finite');
  combatSamples.push(combatResult.elapsedMs);
}
combatSamples.sort((a, b) => a - b);
console.log('large-army-combat-runtime: requested=400 ticks=30 repeats=3 simulationOnly=true medianMs='+combatSamples[1].toFixed(2)+' rangeMs='+combatSamples[0].toFixed(2)+'-'+combatSamples[2].toFixed(2));

// Four-way, 2,000-unit live-engine stress battle: 500 units per kingdom, with
// 300 real simulation ticks (10 simulated seconds) and directed attack orders.
// This is a bounded stress run, not a claim that a full match or Xbox performance is certified.
const massBattle = game.runFourKingdomMassBattle(500, 300);
assert.equal(massBattle.teams, 4, 'Mass battle must contain four kingdoms');
assert.equal(massBattle.requestedTotal, 2000, 'Mass battle must request 2,000 total units');
assert.equal(massBattle.actualUnits, 2000, 'Mass battle must retain all 2,000 unit records after the run');
assert.equal(massBattle.ticksCompleted, 300, 'Mass battle must complete all 300 fixed simulation ticks');
assert.equal(massBattle.tickError, null, 'Mass battle must not throw during simulation');
assert.equal(massBattle.invalidUnits, 0, 'Mass battle must not create units with invalid coordinates or health');
assert.ok(Number.isFinite(massBattle.elapsedMs) && massBattle.elapsedMs >= 0, 'Mass battle timing must be finite');
for (const team of massBattle.result) {
  assert.equal(team.starting, 500, 'Each kingdom must start with 500 units');
  assert.equal(team.invalid, 0, 'Each kingdom must retain valid unit state');
}
console.log('four-kingdom-mass-battle: '+massBattle.requestedTotal+' units, 500/team, ticks='+massBattle.ticksCompleted+', simulated='+massBattle.simulatedSeconds.toFixed(2)+'s, elapsedMs='+massBattle.elapsedMs.toFixed(2)+', survivors='+massBattle.result.map(t=>'T'+t.team+':'+t.alive).join('/')+', invalid='+massBattle.invalidUnits);



}
}
