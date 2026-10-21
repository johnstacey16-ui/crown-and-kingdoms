/* Authenticated room setup and isolated synchronized battlefield preview. */
(function(root){
  'use strict';
  const keys = ['seed','msz','mt','kingdoms','civ','aiCiv','diff','aip','vm','mapLayout',
    'startAge','startRes','startArmy','startVillagers','popLimit','gameMode','scoreLimit'];
  const between = (n, min, max) => Number.isSafeInteger(n) && n >= min && n <= max;
  function validConfig(c) {
    return !!c && typeof c === 'object' && !Array.isArray(c) && Object.keys(c).length === keys.length &&
      keys.every(k => Object.hasOwn(c, k)) && between(c.seed,1,0xffffff) && between(c.msz,0,3) &&
      between(c.mt,0,MT.length-1) && c.kingdoms === 2 && between(c.civ,0,CIV.length-1) &&
      between(c.aiCiv,-1,CIV.length-1) && between(c.diff,0,5) && between(c.aip,0,6) &&
      between(c.vm,0,6) && between(c.mapLayout,0,13) && between(c.startAge,0,3) &&
      between(c.startRes,0,5) && between(c.startArmy,0,3) && between(c.startVillagers,0,3) &&
      [50,100,150,200,250,300,400,500].includes(c.popLimit) && between(c.gameMode,0,2) &&
      SCORE_LIMITS.includes(c.scoreLimit);
  }
  function objectives(config) {
    if(!validConfig(config))throw Error('Verified match settings required');
    return Object.freeze([
      'Destroy the opposing Town Centre and protect your own.',
      'Build a Wonder and protect it for five game minutes.',
      'Hold every relic in your Monasteries for four game minutes.',
      'Keep your King alive and defeat the opposing King.',
      'Have the highest kingdom score when the '+Math.round(config.scoreLimit/60)+'-minute game limit expires.',
      'Control the central hill continuously for five game minutes. Hostile military presence contests it.',
      'Protect your starting Town Centre. Losing it eliminates your kingdom; additional Town Centres cannot be built.'
    ])[config.vm];
  }
  function settings(seed) {
    return { seed, msz, mt, kingdoms:2, civ, aiCiv, diff, aip, vm, mapLayout,
      startAge, startRes, startArmy, startVillagers, popLimit, gameMode, scoreLimit };
  }
  function preparation() {
    const saved = { ...settings(seedOv), kingdoms, cmp, gs };
    function apply(c) {
      ({ msz,mt,kingdoms,civ,aiCiv,diff,aip,vm,mapLayout,startAge,startRes,startArmy,
        startVillagers,popLimit,gameMode,scoreLimit } = c);
      seedOv = c.seed;
    }
    return {
      prepare(c) {
        if (!validConfig(c)) throw Error('Invalid starting settings');
        apply(c); cmp = null; gs = 1;
        try {
          start();ensureResourceIds();
          return root.CK_SIM_SYNC.checksum({ config:c, width:W, height:H,
            world:root.CK_SIM_SYNC.worldCheckpoint(S,0).hash,
            terrain:Array.from(S.gt) });
        } finally {
          // start() briefly sets play synchronously; never allow a frame to advance.
          mode = 'multiplayer'; acc = 0;
        }
      },
      live(transport, startup) {
        if (!S || S.t !== 0 || S.teamN !== 2 || mode !== 'multiplayer') throw Error('Opening world required');
        S.humanTeams = Object.freeze([0,1]);
        const inWorld = action => {
          if (mode !== 'multiplayer') throw Error('Preview lost its simulation gate');
          mode = 'play';
          try { return action(); } finally { mode = 'multiplayer'; acc = 0; }
        };
        return root.CK_LIVE_SESSION.create({transport,startup,mapSize:W,
          lookupEntity:root.CK_GAME_COMMANDS.lookup,
          execute:(order,team,frame)=>inWorld(()=>root.CK_GAME_COMMANDS.execute(order,team,frame)),
          advance:()=>inWorld(()=>{if(S.over)return false;step(DT);return true;}),
          outcome:()=>!S.over?null:{winner:S.over==='draw'?null:S.over==='win'?0:1,reason:S.why||''},
          hash:frame=>root.CK_SIM_SYNC.worldCheckpoint(S,frame).hash
        });
      },
      restore() { apply(saved); cmp = saved.cmp; gs = saved.gs; acc = 0; if(S)delete S.humanTeams; }
    };
  }
  let panel = null;
  function open(onLeave, { createTransport = () => root.CK_AUTH_TRANSPORT.createClient() } = {}) {
    if (panel) return;
    if (typeof createTransport !== 'function') throw Error('Invalid multiplayer provider');
    const preparationSession = preparation();
    let connection = null, startup = null, live = null, timer = null, progressTimer = null, busy = false, updating = false, closed = false, stopped = false;
    let previewRunning=false,menuOpen=false,objectivesOpen=false,menuFocus=null;
    const overlay = document.createElement('section');
    overlay.className = 'ck-room-overlay';
    overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','Authenticated multiplayer setup');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:30;overflow:auto;background:radial-gradient(ellipse at top left,#243b4b,#090d16 65%);color:#eef2ff;padding:clamp(16px,5vw,64px);box-sizing:border-box;font:18px system-ui';
    const title = document.createElement('h1'); title.textContent = 'Two-player room setup';
    const description = document.createElement('p');
    description.textContent = 'Create a private invitation or paste one to join. Verify the shared map, then enter the battlefield preview: explore, construct buildings, train and research, and fight with your own kingdom. Terrain and opponents are shown only within your team’s sight. Select villagers and use A on a visible resource to gather. This is a two-player preview. Leave setup to close the room.';
    description.className = 'ck-room-intro';
    const details = document.createElement('p');
    details.textContent = 'The host’s current game settings will apply to both players, with two kingdoms.';
    const input = document.createElement('input'); input.type = 'text'; input.maxLength = 43;
    input.autocomplete = 'off'; input.spellcheck = false; input.placeholder = 'Paste private invitation';
    input.setAttribute('aria-label','Private room invitation');
    const status = document.createElement('p'); status.className = 'ck-room-status'; status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
    status.textContent = 'No room connected.';
    const makeButton = label => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; return b; };
    const host = makeButton('Create private room'), join = makeButton('Join room');
    const verify = makeButton('Verify shared map'), leave = makeButton('Leave setup');
    const run = makeButton('Run live preview'), trainButton = makeButton('Train villager'), cancelButton = makeButton('Cancel training');
    const economy = document.createElement('p'); economy.setAttribute('aria-live','polite');
    const mapButton = makeButton('Control units on map'), stopButton = makeButton('Stop selected unit');
    const previousButton=makeButton('Previous unit'),nextButton=makeButton('Next unit'),townButton=makeButton('Select town centre');
    const matchMenu=document.createElement('section');
    matchMenu.className = 'ck-room-overlay';
    matchMenu.setAttribute('role','dialog');matchMenu.setAttribute('aria-modal','true');
    matchMenu.setAttribute('aria-label','Multiplayer menu');
    matchMenu.style.cssText=overlay.style.cssText;
    const menuTitle=document.createElement('h1');menuTitle.textContent='Multiplayer menu';
    const menuNotice=document.createElement('p');menuNotice.textContent='The multiplayer match continues while this menu is open.';
    const resumeButton=makeButton('Resume match'),objectivesButton=makeButton('Objectives'),exitButton=makeButton('Leave match');
    const menuControls=[resumeButton,objectivesButton,exitButton];
    const objectiveBody=document.createElement('section');objectiveBody.setAttribute('aria-label','Match objectives');
    const objectiveText=document.createElement('p'),objectiveClock=document.createElement('p');
    objectiveText.setAttribute('id','ck-match-objective');
    objectiveClock.setAttribute('id','ck-match-objective-clock');
    const backButton=makeButton('Back to multiplayer menu');
    objectiveBody.append(objectiveText,objectiveClock,backButton);
    objectiveBody.hidden=true;objectiveBody.style.display='none';
    const activeMenuControls=()=>objectivesOpen?[backButton]:menuControls;
    matchMenu.append(menuTitle,menuNotice,resumeButton,objectivesButton,exitButton,objectiveBody);
    matchMenu.hidden=true;matchMenu.style.display='none';
    const unitCanvas = document.createElement('canvas'), mapDescription = document.createElement('p');
    mapDescription.setAttribute('role','status'); unitCanvas.hidden = mapDescription.hidden = stopButton.hidden = true;
    const unitMap = root.CK_UNIT_MAP.create({canvas:unitCanvas,description:mapDescription,stopButton,previousButton,nextButton,townButton,
      submit:order=>live&&!stopped&&!menuOpen?live.submit(order):{ok:false},leave:()=>mapButton.focus(),
      nameOf:unit=>unitName(unit.kind,connection.snapshot().team)});
    for (const element of [host,input,join,verify,run,trainButton,cancelButton,mapButton,previousButton,nextButton,townButton,stopButton,leave,...menuControls,backButton]) {
      element.className = 'ck-room-control';
    }
    function showMap(visible) {
      for(const element of [unitCanvas,mapDescription,previousButton,nextButton,townButton,stopButton]) {
        element.hidden=!visible;
        element.style.display=visible?'block':'none';
      }
    }
    showMap(false);
    verify.disabled = run.disabled = trainButton.disabled = cancelButton.disabled = mapButton.disabled = true;
    const shell = document.createElement('div'); shell.className = 'ck-room-shell';
    const brand = document.createElement('p'); brand.className = 'ck-room-brand'; brand.textContent = 'CROWN & KINGDOMS · MULTIPLAYER PREVIEW';
    const grid = document.createElement('div'); grid.className = 'ck-room-grid';
    function card(heading, ...children) {
      const section = document.createElement('section'); section.className = 'ck-room-card';
      const label = document.createElement('h2'); label.textContent = heading;
      section.append(label,...children); return section;
    }
    const roomCard = card('1 · Private room',host,input,join);
    const setupCard = card('2 · Shared battlefield',details,verify,run);
    const battlefieldCard = card('Your kingdom',trainButton,cancelButton,economy,mapButton,previousButton,nextButton,townButton,unitCanvas,mapDescription,stopButton);
    battlefieldCard.className += ' ck-room-battlefield';
    grid.append(roomCard,setupCard,battlefieldCard);
    const footer = document.createElement('footer'); footer.className = 'ck-room-footer'; footer.append(leave);
    shell.append(brand,title,description,status,grid,footer); overlay.append(shell);
    document.body.appendChild(overlay);
    document.body.appendChild(matchMenu);
    const controls = [host,input,join,verify,run,trainButton,cancelButton,mapButton,previousButton,nextButton,townButton,unitCanvas,stopButton,leave];
    function refreshObjectives() {
      if(!objectivesOpen||!S)return;
      const config=startup.snapshot().config;
      const seconds=Math.max(0,Math.floor(config.vm===4?config.scoreLimit-S.t:S.t));
      const clock=(config.vm===4?'Time remaining: ':'Game time: ')+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
      if(objectiveClock.textContent!==clock)objectiveClock.textContent=clock;
    }
    function showObjectives(visible,focus=true) {
      objectivesOpen=visible;
      for(const button of menuControls){button.hidden=visible;button.style.display=visible?'none':'block';}
      objectiveBody.hidden=!visible;objectiveBody.style.display=visible?'block':'none';
      menuTitle.textContent=visible?'Objectives':'Multiplayer menu';
      if(visible){objectiveText.textContent=objectives(startup.snapshot().config);refreshObjectives();}
      if(focus)(visible?backButton:objectivesButton).focus();
    }
    function openMenu() {
      if(closed||stopped||!previewRunning||menuOpen)return;
      unitMap.suspend();
      menuFocus=document.activeElement;menuOpen=true;overlay.inert=true;showObjectives(false,false);
      matchMenu.hidden=false;matchMenu.style.display='block';resumeButton.focus();
    }
    function closeMenu(restore=true) {
      if(!menuOpen)return;
      menuOpen=false;showObjectives(false,false);overlay.inert=false;matchMenu.hidden=true;matchMenu.style.display='none';
      if(restore){
        const target=menuFocus&&!menuFocus.disabled&&!menuFocus.hidden?menuFocus:mapButton;
        target.focus();
      }
      menuFocus=null;
    }
    function close() {
      if (closed) return;
      closed = true; root.clearTimeout(timer); root.clearTimeout(progressTimer);
      if (live) live.close(); else if (startup) startup.close(); else if (connection) connection.close();
      closeMenu(false);preparationSession.restore(); overlay.remove();matchMenu.remove();panel = null;
      root.removeEventListener('pagehide', close);
      onLeave();
    }
    function error() {
      if (closed) return;
      stopped = true; root.clearTimeout(timer); root.clearTimeout(progressTimer);
      previewRunning=false;closeMenu(false);
      if (live) live.close(); else if (connection) connection.close();
      const failure = connection?.diagnostics?.().failure;
      status.textContent = failure === 'connection-timeout' ?
        'The players could not connect directly. Leave setup and create a new room to retry. Some mobile, work or school networks may block this connection; try another network.' :
        ['connection-lost','channel-closed','channel-error','room-unavailable'].includes(failure) ?
        'The connection to the other player ended. Leave setup and create a new room to play again.' :
        'Room setup stopped. The other player may have left, the connection failed, or the worlds did not match. Leave setup to try again.';
      verify.disabled = run.disabled = trainButton.disabled = cancelButton.disabled = mapButton.disabled = true;
      showMap(false);
      leave.focus();
    }
    async function update() {
      if (closed || stopped) return;
      updating = true;
      try {
        if (!busy && connection) {
          if (!live) await connection.refreshRoster(); if (closed) return;
          const room = connection.snapshot();
          if (room.phase === 'ready' && !startup) startup = root.CK_MATCH_STARTUP.create({
            transport:connection, validateConfig:validConfig, prepare:preparationSession.prepare
          });
          if (startup && !live) {
            const result = await startup.pump(); if (closed) return;
            verify.disabled = room.team !== 0 || result.phase !== 'waiting';
            if (result.config) details.textContent = 'Two kingdoms · ' + ['Small','Medium','Large','Huge'][result.config.msz] +
              ' map · ' + MT[result.config.mt].n + ' · population limit ' + result.config.popLimit;
            status.textContent = result.phase === 'verified' ? 'Both players confirmed the same starting world. The host can run the live preview.' :
              result.phase === 'waiting' ? (room.team === 0 ? 'Guest connected. Choose Verify shared map.' : 'Connected. Waiting for the host to verify the map.') : 'Checking starting maps with the other player…';
            if (result.phase === 'verified') live = preparationSession.live(connection,result);
          } else status.textContent = 'Room created. Share the private invitation above with your guest.';
          if (live) {
            const state = await live.pump(); if (closed) return;
            previewRunning=['running','finishing','finished'].includes(state.phase);
            run.disabled = room.team !== 0 || state.phase !== 'waiting';
            trainButton.disabled = cancelButton.disabled = state.phase !== 'running' || state.commandPending;
            if (state.phase === 'waiting') status.textContent = 'Both players confirmed the same starting world. The host can run the live preview.';
            else if (state.phase === 'starting') status.textContent = 'Waiting for the guest to enter the live preview…';
            else if(state.phase==='finishing')status.textContent='Confirming the final battlefield frame with the other player…';
            else if(state.phase==='finished')status.textContent=(state.outcome.winner===null?'Draw':state.outcome.winner===room.team?'Victory':'Defeat')+' · '+state.outcome.reason+' · final frame '+state.frame;
            else status.textContent = 'Live preview · frame ' + state.frame + ' · ' +
              (state.commandPending ? 'Order awaiting acceptance' : state.lastResult ?
                (state.lastResult.ok ? 'Last order executed' : 'Last order could not execute. Check sight, ownership, prerequisites, resources and queue space.') :
                'Explore, build, train and command your kingdom');
            refreshObjectives();
            const team = room.team, town = S.bs.find(b=>b.t===team&&b.k==='tc'&&b.hp>0);
            mapButton.disabled = state.phase !== 'running';
            showMap(true);
            unitMap.refresh(S,team,W,H,state.phase === 'running'&&!state.commandPending);
            economy.textContent = 'Your kingdom: ' + (team+1) + ' · Food: ' + Math.floor(S.res[team].f) +
              ' · Wood: '+Math.floor(S.res[team].w)+' · Gold: '+Math.floor(S.res[team].g)+' · Stone: '+Math.floor(S.res[team].s)+
              ' · Population: ' + popOf(team) + '/' + capOf(team) +
              ' · Villagers: ' + S.us.filter(u=>u.t===team&&u.k==='vil'&&u.hp>0).length +
              ' · Training queue: ' + (town?.q?.length || 0);
          }
        }
      } catch (_) { error(); return; } finally { updating = false; }
      if (!closed && !stopped) timer = root.setTimeout(update,live&&live.snapshot().phase!=='finished'?34:500);
    }
    async function connect(invitation) {
      if (busy || connection) return;
      busy = true; host.disabled = join.disabled = true; input.readOnly = true;
      status.textContent = 'Connecting…';
      try {
        connection = createTransport();
        function progress() {
          if (closed || stopped || startup || live) return;
          const stage = connection.diagnostics?.().stage;
          if (stage === 'connecting') status.textContent = 'Connecting directly to the other player… This can take up to a minute.';
          else if (stage === 'waiting') status.textContent = 'Room created. Share the private invitation above with your guest.';
          progressTimer = root.setTimeout(progress,500);
        }
        if (connection.diagnostics) progress();
        const room = await connection.connect(invitation); if (closed) return;
        input.value = room.roomId; input.focus(); input.select();
        busy = false; void update();
      } catch (_) { busy = false; error(); }
    }
    host.addEventListener('click', () => { void connect(); });
    join.addEventListener('click', () => {
      const invitation = input.value.trim();
      if (!/^[A-Za-z0-9_-]{43}$/.test(invitation)) { status.textContent = 'Paste the full, case-sensitive private invitation.'; input.focus(); return; }
      void connect(invitation);
    });
    verify.addEventListener('click', async () => {
      if (busy || updating || !startup || verify.disabled) return;
      busy = true; verify.disabled = true; status.textContent = 'Generating the shared starting map…';
      try {
        const random = new Uint32Array(1); root.crypto.getRandomValues(random);
        await startup.begin(settings((random[0] & 0xffffff) || 1));
      } catch (_) { error(); } finally { busy = false; }
    });
    run.addEventListener('click', async () => {
      if (busy || updating || !live || run.disabled) return;
      busy = true; run.disabled = true;
      try { await live.begin(); } catch (_) { error(); } finally { busy = false; }
    });
    function order(type) {
      if (!live || stopped || menuOpen) return;
      const team = connection.snapshot().team;
      const town = S.bs.find(b=>b.t===team&&b.k==='tc'&&b.hp>0&&b.done);
      if (!town) { status.textContent = 'Your kingdom has no completed Town Centre.'; return; }
      const result = live.submit({type,entities:[town.netId],...(type==='train'?{value:'vil'}:{})});
      if (result.ok) { trainButton.disabled = cancelButton.disabled = true; status.textContent = 'Order submitted. Resources change only if it executes successfully.'; }
      else status.textContent = 'Order not submitted: wait for the previous order or restart the preview.';
    }
    trainButton.addEventListener('click',()=>order('train'));
    cancelButton.addEventListener('click',()=>order('cancel'));
    mapButton.addEventListener('click',()=>unitCanvas.focus());
    leave.addEventListener('click', close);
    resumeButton.addEventListener('click',()=>closeMenu());
    objectivesButton.addEventListener('click',()=>{if(menuOpen&&!objectivesOpen)showObjectives(true);});
    backButton.addEventListener('click',()=>showObjectives(false));
    exitButton.addEventListener('click',close);
    matchMenu.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();if(objectivesOpen)showObjectives(false);else closeMenu();}
      if(event.key==='Tab'){
        const menuControls=activeMenuControls();
        const at=menuControls.indexOf(document.activeElement);
        if((event.shiftKey&&at<=0)||(!event.shiftKey&&at===menuControls.length-1)){
          event.preventDefault();menuControls[event.shiftKey?menuControls.length-1:0].focus();
        }
      }
    });
    overlay.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); if(previewRunning)openMenu();else close(); }
      if (event.key === 'Tab') {
        const available = controls.filter(element => !element.disabled && !element.hidden);
        const at = available.indexOf(document.activeElement);
        if (event.shiftKey && at <= 0) { event.preventDefault(); available[available.length-1].focus(); }
        else if (!event.shiftKey && at === available.length-1) { event.preventDefault(); available[0].focus(); }
      }
    });
    root.addEventListener('pagehide', close);
    panel = { close, suspend:()=>unitMap.suspend(), control(dt) {
      if(menuOpen){
        if(E[9]){closeMenu();return;}
        if(E[1]){if(objectivesOpen)showObjectives(false);else closeMenu();return;}
        const menuControls=activeMenuControls();
        if(E[12]||E[13]){
          const at=Math.max(0,menuControls.indexOf(document.activeElement));
          menuControls[(at+(E[12]?-1:1)+menuControls.length)%menuControls.length].focus();
        }
        if(E[0]&&menuControls.includes(document.activeElement))document.activeElement.click();
        return;
      }
      if(E[9]&&previewRunning){openMenu();return;}
      if (document.activeElement === unitCanvas && !E[9]) { unitMap.control(E,P,[ax(0),ax(1)],dt); return; }
      if (E[1] || E[9]) { close(); return; }
      const available = controls.filter(element => !element.disabled && !element.hidden);
      if (E[12] || E[13]) {
        const at = Math.max(0,available.indexOf(document.activeElement));
        available[(at+(E[12]?-1:1)+available.length)%available.length].focus();
      }
      if (E[0] && controls.includes(document.activeElement)) {
        if (document.activeElement === input) input.focus(); else document.activeElement.click();
      }
    }};
    host.focus();
  }
  root.CK_AUTH_LOBBY = Object.freeze({ open, active:()=>!!panel, control:dt=>panel?.control(dt),
    close:()=>panel?.close(), suspend:()=>panel?.suspend(), validConfig, settings, objectives, preparation });
})(window);
