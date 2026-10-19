/* Authenticated room setup UI and frozen opening-world preparation. */
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
          start();
          return root.CK_SIM_SYNC.checksum({ config:c, width:W, height:H,
            world:root.CK_SIM_SYNC.worldCheckpoint(S,0).hash,
            terrain:Array.from(S.gt) });
        } finally {
          // start() briefly sets play synchronously; never allow a frame to advance.
          mode = 'multiplayer'; acc = 0;
        }
      },
      restore() { apply(saved); cmp = saved.cmp; gs = saved.gs; acc = 0; }
    };
  }
  let panel = null;
  function open(onLeave) {
    if (panel) return;
    const preparationSession = preparation();
    let connection = null, startup = null, timer = null, busy = false, updating = false, closed = false, stopped = false;
    const overlay = document.createElement('section');
    overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','Authenticated multiplayer setup');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:30;overflow:auto;background:#090d16;color:#eef2ff;padding:clamp(16px,5vw,64px);box-sizing:border-box;font:18px system-ui';
    const title = document.createElement('h1'); title.textContent = 'Two-player room setup';
    const description = document.createElement('p');
    description.textContent = 'Create a private invitation or paste one to join. This connection test checks that both players generate the same starting map. Shared gameplay is not enabled yet.';
    const details = document.createElement('p');
    details.textContent = 'The host’s current game settings will apply to both players, with two kingdoms.';
    const input = document.createElement('input'); input.type = 'text'; input.maxLength = 43;
    input.autocomplete = 'off'; input.spellcheck = false; input.placeholder = 'Paste private invitation';
    input.setAttribute('aria-label','Private room invitation');
    const status = document.createElement('p'); status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
    status.textContent = 'No room connected.';
    const makeButton = label => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; return b; };
    const host = makeButton('Create private room'), join = makeButton('Join room');
    const verify = makeButton('Verify shared map'), leave = makeButton('Leave setup');
    for (const element of [host,input,join,verify,leave]) {
      element.style.cssText = 'display:block;width:min(100%,680px);box-sizing:border-box;margin:14px 0;padding:14px;border:2px solid #c9a24a;border-radius:6px;background:#15243c;color:#fff;font:inherit';
    }
    verify.disabled = true;
    overlay.append(title,description,details,host,input,join,verify,status,leave);
    document.body.appendChild(overlay);
    const controls = [host,input,join,verify,leave];
    function close() {
      if (closed) return;
      closed = true; root.clearTimeout(timer);
      if (startup) startup.close(); else if (connection) connection.close();
      preparationSession.restore(); overlay.remove(); panel = null;
      root.removeEventListener('pagehide', close);
      onLeave();
    }
    function error() {
      if (closed) return;
      stopped = true; root.clearTimeout(timer);
      if (connection) connection.close();
      status.textContent = 'Room setup stopped. The service may be unavailable, the other player left, or the starting maps did not match. Leave setup to try again.';
      verify.disabled = true;
      leave.focus();
    }
    async function update() {
      if (closed || stopped) return;
      updating = true;
      try {
        if (!busy && connection) {
          await connection.refreshRoster(); if (closed) return;
          const room = connection.snapshot();
          if (room.phase === 'ready' && !startup) startup = root.CK_MATCH_STARTUP.create({
            transport:connection, validateConfig:validConfig, prepare:preparationSession.prepare
          });
          if (startup) {
            const result = await startup.pump(); if (closed) return;
            verify.disabled = room.team !== 0 || result.phase !== 'waiting';
            if (result.config) details.textContent = 'Two kingdoms · ' + ['Small','Medium','Large','Huge'][result.config.msz] +
              ' map · ' + MT[result.config.mt].n + ' · population limit ' + result.config.popLimit;
            status.textContent = result.phase === 'verified' ? 'Both players confirmed the same starting world. Connection test complete; gameplay remains paused.' :
              result.phase === 'waiting' ? (room.team === 0 ? 'Guest connected. Choose Verify shared map.' : 'Connected. Waiting for the host to verify the map.') : 'Checking starting maps with the other player…';
          } else status.textContent = 'Room created. Share the private invitation above with your guest.';
        }
      } catch (_) { error(); return; } finally { updating = false; }
      if (!closed && !stopped) timer = root.setTimeout(update,500);
    }
    async function connect(invitation) {
      if (busy || connection) return;
      busy = true; host.disabled = join.disabled = true; input.readOnly = true;
      status.textContent = 'Connecting…';
      try {
        connection = root.CK_AUTH_TRANSPORT.createClient();
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
    leave.addEventListener('click', close);
    overlay.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'Tab') {
        const available = controls.filter(element => !element.disabled);
        const at = available.indexOf(document.activeElement);
        if (event.shiftKey && at <= 0) { event.preventDefault(); available[available.length-1].focus(); }
        else if (!event.shiftKey && at === available.length-1) { event.preventDefault(); available[0].focus(); }
      }
    });
    root.addEventListener('pagehide', close);
    panel = { close, control() {
      if (E[1] || E[9]) { close(); return; }
      const available = controls.filter(element => !element.disabled);
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
  root.CK_AUTH_LOBBY = Object.freeze({ open, active:()=>!!panel, control:()=>panel?.control(),
    close:()=>panel?.close(), validConfig, settings, preparation });
})(window);
