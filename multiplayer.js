/* Crown & Kingdoms — Phase 1 multiplayer networking spine.
 * Isolated from the simulation. Supabase loads only when Multiplayer is opened.
 */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://isfzrqtbsbqlaojtpkxr.supabase.co';
  // Publishable client key only. Never put a service-role/secret key here.
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_wj7wH708NGPxJscwv77pug_8Lf6XR7u';
  const PROTOCOL_VERSION = 1;
  const CONFIG_VERSION = 1;
  const CHANNEL_PREFIX = 'ck:v1:';
  const MAX_PACKET_BYTES = 1024; // App-level budget, below Supabase's transport limit.
  const SEND_INTERVAL_MS = 200; // 5 Hz; coalesce stale positions rather than queueing them.
  // Four is the game's maximum kingdom count; it bounds Broadcast fan-out too.
  const MAX_PLAYERS = 4;
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const MARKER_COLORS = ['#ff6b6b', '#4dd0e1', '#ffd166', '#c792ea', '#7ee081', '#ff9f43', '#82aaff', '#f48fb1'];

  function makeSessionId() {
    try {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
      if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
        const b = new Uint8Array(16);
        window.crypto.getRandomValues(b);
        b[6] = (b[6] & 15) | 64;
        b[8] = (b[8] & 63) | 128;
        const h = Array.from(b, n => n.toString(16).padStart(2, '0')).join('');
        return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
      }
    } catch (_) {}
    return 'ck-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2) + '-' + Math.random().toString(36).slice(2);
  }

  const sessionId = makeSessionId();
  let supabaseClient = null;
  let supabaseLoadPromise = null;
  let lobbyFields = null;
  let selectedRow = 0;
  let drawTime = 0;
  let pendingPayload = null;
  let sendInFlight = false;
  let markerTimer = null;
  let beforeRoomSettings = null;
  let pageUnloadBound = false;

  const state = {
    epoch: 0, active: false, busy: false, connected: false, tracked: false,
    role: null, roomCode: '', nick: 'Player', hostSid: null, config: null,
    lifecycle: 'idle', hostSignature: '', localFailure: '',
    statusText: 'Not connected. Create a room or join using a room code.',
    channel: null, members: new Map(), verified: new Set(), seq: 0,
    startingGame: false, gameStarted: false
  };

  const remotePlayers = new Map();
  const lastSeqBySid = new Map();

  function cleanNick(value) {
    if (typeof value !== 'string' || /[\u0000-\u001f\u007f-\u009f]/.test(value)) return '';
    const s = value.trim();
    if (!s) return '';
    return Array.from(s).slice(0, 24).join('');
  }

  function normalizeRoomCode(value) {
    if (typeof value !== 'string') return '';
    return value.toUpperCase().replace(/[\s-]/g, '');
  }

  function validRoomCode(value) {
    return /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(value);
  }

  function randomInt24() {
    try {
      const a = new Uint32Array(1);
      window.crypto.getRandomValues(a);
      return (a[0] & 0xffffff) || 1;
    } catch (_) {
      return ((Math.random() * 0x1000000) | 0) || 1;
    }
  }

  function makeRoomCode() {
    let out = '';
    try {
      const bytes = new Uint8Array(6);
      window.crypto.getRandomValues(bytes);
      for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
    } catch (_) {
      for (let i = 0; i < 6; i++) out += ALPHABET[(Math.random() * ALPHABET.length) | 0];
    }
    return out;
  }

  function currentLocalConfig() {
    return {
      schema: CONFIG_VERSION, seed: randomInt24(),
      msz: Number.isInteger(msz) ? msz : 2,
      mt: Number.isInteger(mt) ? mt : 0,
      kingdoms: kingdoms === 2 ? 2 : 4,
      civ: Number.isInteger(civ) ? civ : 0,
      diff: Number.isInteger(diff) ? diff : 1,
      aip: Number.isInteger(aip) ? aip : 0,
      vm: Number.isInteger(vm) ? vm : 0
    };
  }

  function validateConfig(raw) {
    if (!raw || typeof raw !== 'object' || raw.schema !== CONFIG_VERSION) return null;
    if (!Number.isSafeInteger(raw.seed) || raw.seed < 1 || raw.seed > 0xffffff) return null;
    if (!Number.isInteger(raw.msz) || raw.msz < 0 || raw.msz > 3) return null;
    if (!Number.isInteger(raw.mt) || raw.mt < 0 || raw.mt >= MT.length) return null;
    if (raw.kingdoms !== 2 && raw.kingdoms !== 4) return null;
    if (!Number.isInteger(raw.civ) || raw.civ < 0 || raw.civ >= CIV.length) return null;
    if (!Number.isInteger(raw.diff) || raw.diff < 0 || raw.diff > 2) return null;
    if (!Number.isInteger(raw.aip) || raw.aip < 0 || raw.aip > 6) return null;
    if (!Number.isInteger(raw.vm) || raw.vm < 0 || raw.vm > 3) return null;
    return {
      schema: CONFIG_VERSION, seed: raw.seed, msz: raw.msz, mt: raw.mt,
      kingdoms: raw.kingdoms, civ: raw.civ, diff: raw.diff, aip: raw.aip, vm: raw.vm
    };
  }

  function loadSupabase() {
    if (supabaseClient) return Promise.resolve(supabaseClient);
    if (supabaseLoadPromise) return supabaseLoadPromise;
    supabaseLoadPromise = new Promise((resolve, reject) => {
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        try {
          supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
            realtime: { params: { eventsPerSecond: 20 } }
          });
          resolve(supabaseClient);
          return;
        } catch (e) { reject(e); return; }
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async = true;
      script.onload = () => {
        try {
          if (!window.supabase || typeof window.supabase.createClient !== 'function') {
            reject(new Error('Supabase client loaded without createClient.'));
            return;
          }
          supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
            realtime: { params: { eventsPerSecond: 20 } }
          });
          resolve(supabaseClient);
        } catch (e) { reject(e); }
      };
      script.onerror = () => reject(new Error('Supabase CDN could not be loaded. Single-player remains available.'));
      document.head.appendChild(script);
    }).catch(err => {
      supabaseLoadPromise = null;
      throw err;
    });
    return supabaseLoadPromise;
  }

  function ensureLobbyFields() {
    if (lobbyFields) return lobbyFields;
    const css = document.createElement('style');
    css.textContent =
      '#ck-mp-fields{position:fixed;z-index:20;left:0;top:0;transform:none;width:310px;display:none;gap:10px;flex-direction:column;pointer-events:auto;font:600 18px system-ui,sans-serif}' +
      '#ck-mp-fields input{box-sizing:border-box;width:100%;height:38px;border:2px solid #c9a24a;border-radius:4px;background:#10131c;color:#fff;padding:6px 10px;font:600 18px system-ui,sans-serif;user-select:text;-webkit-user-select:text;touch-action:auto;outline-offset:3px}' +
      '#ck-mp-fields input:focus{outline:3px solid #82aaff;border-color:#fff}' +
      '#ck-mp-fields input::placeholder{color:#b9b9b9}' +
      '@media(max-height:650px){#ck-mp-fields{gap:6px}#ck-mp-fields input{height:32px;font-size:16px}}';
    document.head.appendChild(css);
    const box = document.createElement('div');
    box.id = 'ck-mp-fields';
    const nick = document.createElement('input');
    nick.id = 'ck-mp-nick';
    nick.type = 'text';
    nick.maxLength = 24;
    nick.autocomplete = 'off';
    nick.spellcheck = false;
    nick.setAttribute('aria-label', 'Multiplayer nickname');
    nick.placeholder = 'Nickname (1–24 characters)';
    const code = document.createElement('input');
    code.id = 'ck-mp-code';
    code.type = 'text';
    code.maxLength = 8;
    code.autocomplete = 'off';
    code.spellcheck = false;
    code.setAttribute('aria-label', 'Six-character multiplayer room code');
    code.placeholder = 'Room code (6 characters)';
    code.style.textTransform = 'uppercase';
    box.append(nick, code);
    document.body.appendChild(box);
    nick.value = state.nick;
    lobbyFields = { box, nick, code };
    nick.addEventListener('input', () => { state.nick = nick.value; });
    code.addEventListener('input', () => {
      code.value = code.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '').slice(0, 6);
    });
    return lobbyFields;
  }

  function showLobbyFields(show) {
    const f = ensureLobbyFields();
    const panelW = Math.min(920, CW - 28);
    const panelH = Math.min(CH - 30, Math.max(440, CH * 0.9));
    const panelX = (CW - panelW) / 2;
    const panelY = (CH - panelH) / 2;
    f.box.style.left = (panelX + 104) + 'px';
    f.box.style.top = (panelY + panelH * 0.16) + 'px';
    f.box.style.width = Math.min(310, panelW * 0.42) + 'px';
    f.box.style.display = show ? 'flex' : 'none';
    if (show) {
      if (!f.nick.value) f.nick.value = state.nick || 'Player';
      if (state.roomCode) f.code.value = state.roomCode;
    } else if (document.activeElement === f.nick || document.activeElement === f.code) {
      try { document.activeElement.blur(); } catch (_) {}
    }
  }

  function setStatus(message) {
    state.statusText = String(message || '');
  }

  function channelStillCurrent(epoch, channel) {
    return state.active && state.epoch === epoch && state.channel === channel;
  }

  function roomTopic(code) {
    return CHANNEL_PREFIX + code;
  }

  function presenceEntries(channel) {
    const result = [];
    let ps = {};
    try { ps = channel.presenceState() || {}; } catch (_) {}
    for (const key of Object.keys(ps)) {
      const records = Array.isArray(ps[key]) ? ps[key] : [];
      for (const rec of records) {
        if (!rec || typeof rec !== 'object') continue;
        const sid = typeof rec.sid === 'string' ? rec.sid : key;
        if (!sid || sid.length > 80) continue;
        result.push({ ...rec, sid });
      }
    }
    return result;
  }

  function hostMetadata(lifecycle) {
    return {
      schema: CONFIG_VERSION, sid: sessionId, nick: state.nick,
      role: 'host', hostSid: sessionId, config: state.config,
      lifecycle: lifecycle || state.lifecycle,
      mapSignature: state.hostSignature || '', ready: true
    };
  }

  function guestMetadata() {
    return {
      schema: CONFIG_VERSION, sid: sessionId, nick: state.nick,
      role: 'guest', hostSid: state.hostSid, lifecycle: 'lobby', ready: true
    };
  }

  async function trackHost(lifecycle, epoch, channel) {
    if (!channelStillCurrent(epoch, channel) || state.role !== 'host') return;
    state.lifecycle = lifecycle;
    const result = await channel.track(hostMetadata(lifecycle));
    if (!channelStillCurrent(epoch, channel)) return;
    if (result && result !== 'ok') throw new Error('Presence track returned ' + String(result));
    state.tracked = true;
    state.connected = true;
    setStatus(lifecycle === 'lobby' ? 'Room created. Waiting for another player.' :
      lifecycle === 'starting' ? 'Publishing map configuration and starting…' :
      lifecycle === 'running' ? 'Match running. Markers update at 5 Hz.' : 'Room status: ' + lifecycle);
  }

  let guestTrackPromise = null;
  async function trackGuestOnce(epoch, channel) {
    if (!channelStillCurrent(epoch, channel) || state.role !== 'guest' || !state.hostSid) return false;
    if (state.tracked) return true;
    if (guestTrackPromise) return guestTrackPromise;
    const operation = (async () => {
      try {
        const result = await channel.track(guestMetadata());
        if (!channelStillCurrent(epoch, channel)) return false;
        if (result && result !== 'ok') throw new Error('Presence track returned ' + String(result));
        state.tracked = true;
        state.connected = true;
        setStatus('Connected. Waiting for the host to start the marker match.');
        reconcilePresence(epoch, channel);
        return true;
      } catch (e) {
        if (channelStillCurrent(epoch, channel)) {
          state.tracked = false;
          setStatus('Presence could not be established: ' + String(e && e.message || e));
        }
        return false;
      }
    })();
    guestTrackPromise = operation;
    try { return await operation; }
    finally { if (guestTrackPromise === operation) guestTrackPromise = null; }
  }

  function reconcilePresence(epoch, channel) {
    if (!channelStillCurrent(epoch, channel)) return;
    const entries = presenceEntries(channel);
    const members = new Map();
    for (const entry of entries) {
      if (typeof entry.sid !== 'string' || entry.sid.length > 80) continue;
      if (typeof entry.nick !== 'string' || entry.nick.length > 96) continue;
      if (entry.schema !== CONFIG_VERSION || !['host', 'guest'].includes(entry.role)) continue;
      members.set(entry.sid, { ...entry, nick: cleanNick(entry.nick) || 'Player' });
    }
    if (members.size > MAX_PLAYERS) {
      setStatus('Room membership limit reached. Leave and create a smaller room.');
      return;
    }
    state.members = members;
    for (const sid of remotePlayers.keys()) {
      if (!members.has(sid) || sid === sessionId) {
        remotePlayers.delete(sid);
        lastSeqBySid.delete(sid);
        state.verified.delete(sid);
      }
    }

    const hosts = Array.from(members.values()).filter(m =>
      m.role === 'host' && m.sid === m.hostSid && validateConfig(m.config));
    if (hosts.length > 1) {
      failRoom('More than one host is present for this room code. The match has been stopped safely.', epoch, channel);
      return;
    }

    if (state.role === 'host') {
      if (!members.has(sessionId)) {
        setStatus('Reconnecting to room presence…');
        return;
      }
      if (hosts.some(h => h.sid !== sessionId)) {
        failRoom('Host identity conflict detected. The match has been stopped safely.', epoch, channel);
        return;
      }
      const others = Array.from(members.values()).filter(m => m.sid !== sessionId);
      if (state.lifecycle === 'lobby') {
        setStatus(others.length ? 'Room ready. Select Start Marker Match when the other player is ready.' : 'Room created. Share the code and wait for another player.');
      }
      return;
    }

    if (state.role !== 'guest') return;
    const host = hosts[0];
    if (!host) {
      setStatus('Connected to the room. Waiting for the host configuration…');
      return;
    }
    state.hostSid = host.sid;
    if (state.lifecycle !== 'running') {
      const cfg = validateConfig(host.config);
      if (!cfg) {
        setStatus('Host configuration is invalid. Leave this room and try again.');
        return;
      }
      state.config = cfg;
    }
    if (!state.tracked) void trackGuestOnce(epoch, channel);
    if (host.lifecycle === 'failed') {
      failLocal('The host reported a map/configuration integrity failure.');
      return;
    }
    if (host.lifecycle === 'running' && !state.gameStarted && !state.startingGame) {
      void startGuestGame(host, epoch, channel);
    } else if (host.lifecycle === 'lobby' && !state.gameStarted) {
      setStatus('Connected. Waiting for the host to start the marker match.');
    } else if (host.lifecycle === 'starting' && !state.gameStarted) {
      setStatus('Host is publishing and validating the starting map…');
    }
  }

  async function publishHostFailure(reason, epoch, channel) {
    try {
      state.lifecycle = 'failed';
      state.localFailure = reason;
      await channel.track(hostMetadata('failed'));
    } catch (_) {}
    try {
      await channel.send({ type: 'broadcast', event: 'room-failed', payload: { v: 1, sid: sessionId, reason: String(reason).slice(0, 180) } });
    } catch (_) {}
    if (channelStillCurrent(epoch, channel)) {
      stopMarkerTimer();
      remotePlayers.clear();
      lastSeqBySid.clear();
      mode = 'multiplayer';
      setStatus(reason);
    }
  }

  function failRoom(reason, epoch, channel) {
    if (state.localFailure) return;
    void publishHostFailure(reason, epoch, channel);
  }

  function failLocal(reason) {
    state.localFailure = String(reason || 'Multiplayer integrity check failed.');
    state.lifecycle = 'failed';
    stopMarkerTimer();
    remotePlayers.clear();
    lastSeqBySid.clear();
    mode = 'multiplayer';
    setStatus(state.localFailure);
  }

  function mapSignature() {
    // Divergence detector only; this is deliberately not an anti-cheat hash.
    const nodes = S.nodes.map(n => [
      String(n.k), +n.x, +n.y, +n.amt || 0, n.fm ? 1 : 0, n.an ? 1 : 0, n.fi ? 1 : 0
    ]).sort((a, b) => a[1] - b[1] || a[2] - b[2] || a[0].localeCompare(b[0]));
    const units = S.us.map(u => [String(u.k), +u.t, +u.x, +u.y])
      .sort((a, b) => a[1] - b[1] || a[2] - b[2] || a[3] - b[3] || a[0].localeCompare(b[0]));
    const buildings = S.bs.map(b => [String(b.k), +b.t, +b.x, +b.y, +b.s, !!b.done])
      .sort((a, b) => a[1] - b[1] || a[2] - b[2] || a[3] - b[3] || a[0].localeCompare(b[0]));
    const relics = S.rel.map(q => [+q.x, +q.y]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const canonical = JSON.stringify({
      v: 1, w: W, h: H, wt: Array.from(S.wt), g: Array.from(S.g),
      nodes, units, buildings, relics, civ: Array.from(S.civ), teamN: S.teamN
    });
    let hash = 0x811c9dc5;
    for (let i = 0; i < canonical.length; i++) {
      hash ^= canonical.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return 'fnv1a32-' + hash.toString(16).padStart(8, '0') + '-' + canonical.length.toString(16);
  }

  function saveLocalSettings() {
    if (!beforeRoomSettings) beforeRoomSettings = { msz, mt, kingdoms, civ, diff, aip, vm, seedOv, cmp };
  }

  function restoreLocalSettings() {
    if (!beforeRoomSettings) return;
    try {
      ({ msz, mt, kingdoms, civ, diff, aip, vm, seedOv, cmp } = beforeRoomSettings);
      if (typeof sset === 'function') sset();
    } catch (_) {}
    beforeRoomSettings = null;
  }

  function applyConfig(cfg) {
    msz = cfg.msz; mt = cfg.mt; kingdoms = cfg.kingdoms;
    civ = cfg.civ; diff = cfg.diff; aip = cfg.aip; vm = cfg.vm;
  }

  function startGameUsingConfig(cfg) {
    saveLocalSettings();
    applyConfig(cfg);
    const priorSeed = seedOv;
    const priorCampaign = cmp;
    seedOv = cfg.seed;
    cmp = null; // Multiplayer starts a skirmish, never a campaign mission.
    try {
      start();
      const sig = mapSignature();
      seedOv = priorSeed;
      return sig;
    } catch (e) {
      seedOv = priorSeed;
      cmp = priorCampaign;
      throw e;
    }
  }

  async function startHostGame(epoch, channel) {
    if (!channelStillCurrent(epoch, channel) || state.role !== 'host' || state.lifecycle !== 'lobby') return;
    const others = Array.from(state.members.values()).filter(m => m.sid !== sessionId && m.sid && m.ready !== false);
    if (!state.connected || !state.tracked || !state.config || !others.length) {
      setStatus('Start requires a connected host, a valid configuration and at least one other player.');
      return;
    }
    const cfg = validateConfig(state.config);
    if (!cfg) {
      setStatus('Cannot start: host map configuration is invalid.');
      return;
    }
    state.busy = true;
    state.config = cfg;
    try {
      // Publish the final, immutable configuration through Presence before map generation.
      await trackHost('starting', epoch, channel);
      if (!channelStillCurrent(epoch, channel)) return;
      state.hostSignature = startGameUsingConfig(cfg);
      state.lifecycle = 'running';
      await trackHost('running', epoch, channel);
      if (!channelStillCurrent(epoch, channel)) return;
      state.gameStarted = true;
      state.startingGame = false;
      setStatus('Marker match running. Waiting for map-signature confirmation.');
      startMarkerTimer(epoch);
      sendMarkerNow(epoch);
    } catch (e) {
      if (channelStillCurrent(epoch, channel)) {
        state.busy = false;
        failRoom('Could not start marker match: ' + String(e && e.message || e), epoch, channel);
      }
      return;
    } finally {
      if (channelStillCurrent(epoch, channel)) state.busy = false;
    }
  }

  async function startGuestGame(host, epoch, channel) {
    if (!channelStillCurrent(epoch, channel) || state.role !== 'guest' || state.startingGame || state.gameStarted) return;
    const cfg = validateConfig(host.config);
    if (!cfg || typeof host.mapSignature !== 'string' || !host.mapSignature) {
      setStatus('Host map configuration/signature is not ready. Waiting…');
      return;
    }
    state.startingGame = true;
    state.config = cfg;
    setStatus('Generating and checking the host map…');
    try {
      if (!state.tracked) {
        const tracked = await trackGuestOnce(epoch, channel);
        if (!tracked || !state.tracked) throw new Error('Presence membership has not been established.');
      }
      if (!channelStillCurrent(epoch, channel)) return;
      const sig = startGameUsingConfig(cfg);
      if (sig !== host.mapSignature) {
        state.startingGame = false;
        try {
          await channel.send({ type: 'broadcast', event: 'map-fail', payload: { v: 1, sid: sessionId, signature: sig, expected: host.mapSignature } });
        } catch (_) {}
        failLocal('Initial map signature mismatch. The marker match was aborted; use the same settings and recreate the room.');
        return;
      }
      state.hostSignature = host.mapSignature;
      state.lifecycle = 'running';
      state.gameStarted = true;
      state.startingGame = false;
      setStatus('Map signature matches host. Marker match running.');
      startMarkerTimer(epoch);
      sendMarkerNow(epoch);
      try {
        await channel.send({ type: 'broadcast', event: 'map-ok', payload: { v: 1, sid: sessionId, signature: sig } });
      } catch (_) {}
    } catch (e) {
      if (channelStillCurrent(epoch, channel)) {
        state.startingGame = false;
        failLocal('Could not generate/verify the shared map: ' + String(e && e.message || e));
      }
    }
  }

  function jsonByteLength(value) {
    const s = JSON.stringify(value);
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s).length;
    return unescape(encodeURIComponent(s)).length;
  }

  function sendMarkerNow(epoch) {
    if (!state.active || state.lifecycle !== 'running' || epoch !== state.epoch) return;
    let p;
    try {
      const world = s2w(cur.x, cur.y);
      p = {
        v: PROTOCOL_VERSION, sid: sessionId, nick: state.nick,
        x: Math.max(0, Math.min(W - 1, world[0])),
        y: Math.max(0, Math.min(H - 1, world[1])),
        seq: ++state.seq
      };
    } catch (_) { return; }
    if (jsonByteLength(p) > MAX_PACKET_BYTES) return;
    pendingPayload = p;
    if (sendInFlight) return;
    const ch = state.channel;
    const payload = pendingPayload;
    pendingPayload = null;
    sendInFlight = true;
    Promise.resolve(ch.send({ type: 'broadcast', event: 'marker', payload }))
      .catch(() => { if (channelStillCurrent(epoch, ch)) setStatus('Network send interrupted; local gameplay continues.'); })
      .finally(() => { sendInFlight = false; });
  }

  async function broadcast(event, payload, epoch) {
    const ch = state.channel;
    if (!ch || !channelStillCurrent(epoch, ch)) return;
    try {
      if (jsonByteLength(payload) > MAX_PACKET_BYTES) {
        setStatus('Network packet rejected: application payload exceeded 1 KB.');
        return;
      }
      await ch.send({ type: 'broadcast', event, payload });
    } catch (_) {
      if (channelStillCurrent(epoch, ch)) setStatus('Network send interrupted; local gameplay continues.');
    }
  }

  function startMarkerTimer(epoch) {
    stopMarkerTimer();
    sendMarkerNow(epoch);
    markerTimer = window.setInterval(() => {
      if (!state.active || state.epoch !== epoch || state.lifecycle !== 'running') {
        stopMarkerTimer();
        return;
      }
      // One latest-position sample per tick. Never build a queue of stale coordinates.
      sendMarkerNow(epoch);
    }, SEND_INTERVAL_MS);
  }

  function stopMarkerTimer() {
    if (markerTimer !== null) window.clearInterval(markerTimer);
    markerTimer = null;
    pendingPayload = null;
    sendInFlight = false;
  }

  function markerColor(sid) {
    let h = 0;
    for (let i = 0; i < sid.length; i++) h = (Math.imul(h, 31) + sid.charCodeAt(i)) >>> 0;
    return MARKER_COLORS[h % MARKER_COLORS.length];
  }

  function acceptMarker(payload, epoch, channel) {
    if (!channelStillCurrent(epoch, channel) || state.lifecycle !== 'running') return;
    if (!payload || typeof payload !== 'object' || payload.v !== PROTOCOL_VERSION) return;
    if (typeof payload.sid !== 'string' || payload.sid.length < 3 || payload.sid.length > 80 || payload.sid === sessionId) return;
    if (!state.members.has(payload.sid)) return;
    const nick = cleanNick(payload.nick);
    if (!nick || payload.nick !== nick) return;
    if (!Number.isFinite(payload.x) || !Number.isFinite(payload.y)) return;
    if (payload.x < 0 || payload.y < 0 || payload.x > W - 1 || payload.y > H - 1) return;
    if (!Number.isSafeInteger(payload.seq) || payload.seq < 1) return;
    const previousSeq = lastSeqBySid.get(payload.sid) || 0;
    if (payload.seq <= previousSeq) return;
    const member = state.members.get(payload.sid);
    if (!member || (member.role !== 'host' && member.role !== 'guest')) return;
    lastSeqBySid.set(payload.sid, payload.seq);
    const now = performance.now();
    let marker = remotePlayers.get(payload.sid);
    if (!marker) {
      if (remotePlayers.size >= MAX_PLAYERS - 1) return;
      marker = {
        sid: payload.sid, nick, x: payload.x, y: payload.y,
        tx: payload.x, ty: payload.y, seq: payload.seq,
        color: markerColor(payload.sid), updatedAt: now
      };
      remotePlayers.set(payload.sid, marker);
    } else {
      marker.nick = nick;
      marker.tx = payload.x;
      marker.ty = payload.y;
      marker.seq = payload.seq;
      marker.updatedAt = now;
    }
  }

  function bindChannelEvents(channel, epoch) {
    channel.on('presence', { event: 'sync' }, () => reconcilePresence(epoch, channel));
    channel.on('presence', { event: 'join' }, () => reconcilePresence(epoch, channel));
    channel.on('presence', { event: 'leave' }, () => reconcilePresence(epoch, channel));
    channel.on('broadcast', { event: 'marker' }, ({ payload }) => acceptMarker(payload, epoch, channel));
    channel.on('broadcast', { event: 'map-ok' }, ({ payload }) => {
      if (!channelStillCurrent(epoch, channel) || state.role !== 'host' || state.lifecycle !== 'running') return;
      if (!payload || payload.v !== PROTOCOL_VERSION || typeof payload.sid !== 'string' || !state.members.has(payload.sid) || payload.sid === sessionId) return;
      if (payload.signature !== state.hostSignature) {
        failRoom('A joining client reported a different map signature. Match stopped safely.', epoch, channel);
      } else {
        state.verified.add(payload.sid);
        setStatus('Map signature verified for ' + (state.members.get(payload.sid).nick || 'a player') + '.');
      }
    });
    channel.on('broadcast', { event: 'map-fail' }, ({ payload }) => {
      if (!channelStillCurrent(epoch, channel) || state.role !== 'host' || state.lifecycle !== 'running') return;
      if (!payload || payload.v !== PROTOCOL_VERSION || typeof payload.sid !== 'string' || !state.members.has(payload.sid) || payload.sid === sessionId) return;
      failRoom('Initial map signature mismatch reported by another player. Match stopped safely.', epoch, channel);
    });
    channel.on('broadcast', { event: 'room-failed' }, ({ payload }) => {
      if (!channelStillCurrent(epoch, channel) || !payload || payload.v !== 1 || payload.sid === sessionId) return;
      failLocal(cleanNick(payload.reason) || 'The host stopped the room after an integrity failure.');
    });
  }

  async function enterRoom(role, code, nick, cfg) {
    if (state.busy || state.active) return;
    const clean = cleanNick(nick);
    if (!clean) {
      setStatus('Enter a nickname with 1–24 characters and no control characters.');
      return;
    }
    if (!validRoomCode(code)) {
      setStatus('Room codes must contain six letters/numbers (excluding O, 0, I and 1).');
      return;
    }
    const f = ensureLobbyFields();
    state.nick = clean;
    f.nick.value = clean;
    state.busy = true;
    const epoch = ++state.epoch;
    state.active = true;
    state.connected = false;
    state.tracked = false;
    guestTrackPromise = null;
    state.role = role;
    state.roomCode = code;
    state.hostSid = role === 'host' ? sessionId : null;
    state.config = role === 'host' ? validateConfig(cfg) : null;
    state.lifecycle = 'lobby';
    state.hostSignature = '';
    state.localFailure = '';
    state.gameStarted = false;
    state.startingGame = false;
    state.members = new Map();
    state.verified.clear();
    remotePlayers.clear();
    lastSeqBySid.clear();
    // Keep the per-session sequence monotonic across repeated room entries.
    stopMarkerTimer();
    setStatus('Loading Supabase and connecting to room ' + code + '…');
    try {
      const client = await loadSupabase();
      if (!state.active || state.epoch !== epoch) return;
      if (role === 'host' && !state.config) throw new Error('Host configuration failed validation.');
      const ch = client.channel(roomTopic(code), {
        config: { broadcast: { self: false, ack: false }, presence: { key: sessionId } }
      });
      state.channel = ch;
      bindChannelEvents(ch, epoch);
      ch.subscribe(status => {
        if (!channelStillCurrent(epoch, ch)) return;
        if (status === 'SUBSCRIBED') {
          state.connected = true;
          if (role === 'host') {
            if (!state.tracked) {
              const lifecycle = ['lobby', 'starting', 'running', 'failed'].includes(state.lifecycle) ? state.lifecycle : 'lobby';
              void trackHost(lifecycle, epoch, ch).then(() => {
                reconcilePresence(epoch, ch);
                if (state.lifecycle === 'running' && state.gameStarted) startMarkerTimer(epoch);
              }).catch(e => {
                if (channelStillCurrent(epoch, ch)) setStatus('Presence tracking failed: ' + String(e && e.message || e));
              });
            } else {
              reconcilePresence(epoch, ch);
              if (state.lifecycle === 'running' && state.gameStarted) startMarkerTimer(epoch);
            }
          } else {
            reconcilePresence(epoch, ch);
            if (state.lifecycle === 'running' && state.gameStarted) {
              void trackGuestOnce(epoch, ch).then(ok => {
                if (ok && channelStillCurrent(epoch, ch) && state.lifecycle === 'running' && state.gameStarted) startMarkerTimer(epoch);
              });
            }
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          state.connected = false;
          state.tracked = false; // Presence must be restored after the channel rejoins.
          stopMarkerTimer();
          setStatus('Room connection interrupted (' + status + '). Local gameplay will not be frozen.');
        }
      });
      state.busy = false;
      setStatus(role === 'host' ? 'Connecting as the room host…' : 'Joining room; waiting for the current host configuration…');
      if (!pageUnloadBound) {
        pageUnloadBound = true;
        window.addEventListener('pagehide', () => { void leaveRoom(false, false); });
      }
    } catch (e) {
      if (state.epoch === epoch) {
        state.active = false;
        state.connected = false;
        state.busy = false;
        state.tracked = false;
        state.role = null;
        state.channel = null;
        state.lifecycle = 'idle';
        state.roomCode = '';
        state.config = null;
        setStatus('Multiplayer unavailable: ' + String(e && e.message || e) + ' Single-player is still available.');
      }
    } finally {
      if (state.epoch === epoch) state.busy = false;
    }
  }

  async function leaveRoom(goTitle, restoreSettings) {
    const ch = state.channel;
    const client = supabaseClient;
    ++state.epoch;
    stopMarkerTimer();
    state.active = false;
    state.connected = false;
    state.busy = false;
    state.tracked = false;
    state.role = null;
    state.hostSid = null;
    state.roomCode = '';
    state.lifecycle = 'idle';
    state.hostSignature = '';
    state.localFailure = '';
    state.gameStarted = false;
    state.startingGame = false;
    state.members.clear();
    state.verified.clear();
    remotePlayers.clear();
    lastSeqBySid.clear();
    state.channel = null;
    pendingPayload = null;
    if (ch) {
      try { await ch.untrack(); } catch (_) {}
      try { if (client) await client.removeChannel(ch); } catch (_) {}
    }
    if (restoreSettings !== false) restoreLocalSettings();
    showLobbyFields(false);
    if (goTitle !== false) mode = 'title';
    state.config = currentLocalConfig();
    setStatus('Not connected. Create a room or join using a room code.');
  }

  function failOpenRoom() {
    if (state.active) void leaveRoom(true, true);
    else {
      mode = 'title';
      showLobbyFields(false);
    }
  }

  function updateLocalSetting(row, delta) {
    if (state.active && (state.role !== 'host' || state.lifecycle !== 'lobby')) {
      setStatus('Only the host may choose map settings before the match starts.');
      return;
    }
    const cfg = state.config || currentLocalConfig();
    if (row === 4) cfg.msz = (cfg.msz + delta + 4) % 4;
    if (row === 5) cfg.mt = (cfg.mt + delta + MT.length) % MT.length;
    if (row === 6) cfg.kingdoms = cfg.kingdoms === 4 ? 2 : 4;
    state.config = cfg;
    if (!state.active) {
      applyConfig(cfg);
      if (typeof sset === 'function') sset();
    }
    setStatus('Map settings selected. The host publishes final configuration before starting.');
  }

  function actionForRow() {
    const f = ensureLobbyFields();
    if (selectedRow === 0) {
      f.nick.focus();
      setStatus('Nickname focused. Use the browser text-entry keyboard, then return to the controller menu.');
      return;
    }
    if (selectedRow === 1) {
      f.code.focus();
      setStatus('Room-code field focused. Enter six characters, then choose Join Room.');
      return;
    }
    if (selectedRow === 2) {
      if (state.active) return setStatus('Leave the current room before creating another.');
      const nick = cleanNick(f.nick.value);
      const cfg = currentLocalConfig();
      cfg.seed = randomInt24();
      return void enterRoom('host', makeRoomCode(), nick, cfg);
    }
    if (selectedRow === 3) {
      if (state.active) return setStatus('Leave the current room before joining another.');
      const code = normalizeRoomCode(f.code.value);
      if (!validRoomCode(code)) return setStatus('Enter a valid six-character room code first.');
      return void enterRoom('guest', code, cleanNick(f.nick.value), null);
    }
    if (selectedRow >= 4 && selectedRow <= 6) return setStatus('Use Left/Right to change the selected map setting.');
    if (selectedRow === 7) {
      if (!state.active || state.role !== 'host' || !state.channel) return setStatus('Only the room host can start the marker match.');
      if (state.lifecycle !== 'lobby') return setStatus('This room has started or is unavailable. Recreate it to use a different map.');
      return void startHostGame(state.epoch, state.channel);
    }
    if (selectedRow === 8) return failOpenRoom();
  }

  const rowCount = 9;

  function control() {
    ensureLobbyFields();
    showLobbyFields(true);
    if (E[12]) selectedRow = (selectedRow + rowCount - 1) % rowCount;
    if (E[13]) selectedRow = (selectedRow + 1) % rowCount;
    if (E[14]) {
      if (selectedRow >= 4 && selectedRow <= 6) updateLocalSetting(selectedRow, -1);
      else if (selectedRow === 8) failOpenRoom();
    }
    if (E[15]) {
      if (selectedRow >= 4 && selectedRow <= 6) updateLocalSetting(selectedRow, 1);
      else if (selectedRow === 8) failOpenRoom();
    }
    if (E[0]) actionForRow();
    if (E[1] || E[9]) failOpenRoom();
  }

  function lobbyRows() {
    const cfg = state.config || currentLocalConfig();
    const hostMode = state.role === 'host';
    const running = state.lifecycle === 'running';
    return [
      { label: 'Nickname field', value: state.nick || 'Not set' },
      { label: 'Room-code field', value: state.roomCode || 'Enter code to join' },
      { label: 'Create Room', value: state.active ? 'Leave current room first' : 'Create a new room' },
      { label: 'Join Room', value: state.active ? 'Leave current room first' : 'Join an existing room' },
      { label: 'Map size', value: ['Small (72)', 'Medium (96)', 'Large (128)', 'Huge (176)'][cfg.msz] },
      { label: 'Map type', value: MT[cfg.mt] ? MT[cfg.mt].n : 'Invalid' },
      { label: 'Kingdom count', value: cfg.kingdoms === 2 ? 'Two kingdoms' : 'Four kingdoms' },
      { label: 'Start Marker Match', value: !hostMode ? 'Host only' : running ? 'Already running' : 'Requires another player' },
      { label: 'Leave Multiplayer', value: state.active ? 'Disconnect and return to title' : 'Return to title' }
    ];
  }

  function displayMemberName(member) {
    const sameName = Array.from(state.members.values()).filter(p => p.nick === member.nick);
    return sameName.length > 1 ? member.nick + ' · ' + member.sid.slice(-4) : member.nick;
  }

  function drawLobby() {
    showLobbyFields(true);
    X.save();
    X.setTransform(DPR, 0, 0, DPR, 0, 0);
    X.fillStyle = '#090d16';
    X.fillRect(0, 0, CW, CH);
    const w = Math.min(920, CW - 28);
    const h = Math.min(CH - 30, Math.max(440, CH * 0.9));
    const x = (CW - w) / 2;
    const y = (CH - h) / 2;
    panel(x, y, w, h);
    tx('CROWN & KINGDOMS — MULTIPLAYER', CW / 2, y + 38, Math.min(30, w / 25), '#f2c14e', 'center');
    tx('PHASE 1: SHARED STARTING MAP + MOVING COMMAND MARKERS ONLY', CW / 2, y + 65, 15, '#cbd5e1', 'center');
    tx('Nickname', x + 26, y + h * 0.205, 17, '#fde68a');
    tx('Room code', x + 26, y + h * 0.275, 17, '#fde68a');
    tx('Room: ' + (state.roomCode || 'not connected'), x + 26, y + h * 0.36, 19, '#fff');
    tx('Role: ' + (state.role || 'not assigned') + '   Session: ' + sessionId.slice(-6), x + 26, y + h * 0.395, 15, '#cbd5e1');
    tx('Connection: ' + (state.connected ? 'CONNECTED' : 'NOT CONNECTED'), x + 26, y + h * 0.43, 16, state.connected ? '#9ae6b4' : '#fca5a5');
    const rows = lobbyRows();
    const rowY = y + h * 0.47;
    const rowH = Math.min(36, Math.max(26, (h * 0.43) / rowCount));
    rows.forEach((r, i) => {
      const yy = rowY + i * rowH;
      if (i === selectedRow) {
        X.fillStyle = '#234b8c';
        X.fillRect(x + 14, yy - 21, Math.min(510, w * 0.61), rowH - 2);
      }
      const canChange = i >= 4 && i <= 6 && (!state.active || (state.role === 'host' && state.lifecycle === 'lobby'));
      tx((i === selectedRow ? '› ' : '  ') + r.label, x + 28, yy, 17, canChange ? '#fff' : '#e2e8f0');
      tx(r.value, x + Math.min(505, w * 0.6), yy, 14, '#fde68a');
    });

    const rightX = x + Math.min(550, w * 0.65);
    tx('ROOM MEMBERS', rightX, y + h * 0.19, 17, '#f2c14e');
    const memberList = Array.from(state.members.values()).slice(0, 8);
    if (!memberList.length) tx('Waiting for presence…', rightX, y + h * 0.23, 15, '#cbd5e1');
    memberList.forEach((m, i) => {
      tx((m.role === 'host' ? '★ ' : '• ') + displayMemberName(m), rightX, y + h * 0.23 + i * 25, 15, m.sid === sessionId ? '#9ae6b4' : '#fff');
    });
    const cfg = state.config || currentLocalConfig();
    const cy = y + h * 0.23 + Math.max(1, memberList.length) * 25 + 28;
    tx('MAP CONFIGURATION', rightX, cy, 16, '#f2c14e');
    tx('Seed: ' + (cfg.seed ? cfg.seed.toString(16).padStart(6, '0').toUpperCase() : 'set on create'), rightX, cy + 26, 14, '#fff');
    tx('Schema: ' + CONFIG_VERSION + ' · Protocol: ' + PROTOCOL_VERSION, rightX, cy + 50, 14, '#cbd5e1');
    if (state.hostSignature) tx('Map signature: ' + state.hostSignature, rightX, cy + 76, 13, '#9ae6b4');
    if (state.localFailure) {
      tx('INTEGRITY FAILURE', rightX, cy + 112, 17, '#ff8b82');
      tx(state.localFailure.slice(0, 70), rightX, cy + 136, 13, '#ffb4ab');
    }
    tx(state.statusText.slice(0, 145), CW / 2, y + h - 38, 15, state.localFailure ? '#ff8b82' : '#9ae6b4', 'center');
    tx('D-pad Up/Down: select · Left/Right: settings · A: choose/focus · B or Menu: leave', CW / 2, y + h - 15, 13, '#cbd5e1', 'center');
    X.restore();
  }

  function getRenderEntries() {
    const now = performance.now();
    const dt = drawTime ? Math.min(0.1, Math.max(0, (now - drawTime) / 1000)) : 0;
    drawTime = now;
    const alpha = Math.min(1, dt * 14);
    const result = [];
    for (const marker of remotePlayers.values()) {
      marker.x += (marker.tx - marker.x) * alpha;
      marker.y += (marker.ty - marker.y) * alpha;
      result.push(marker);
    }
    return result;
  }

  function drawMarker(marker) {
    if (!marker || !Number.isFinite(marker.x) || !Number.isFinite(marker.y)) return;
    const p = w2s(marker.x, marker.y);
    if (p[0] < -120 || p[0] > CW + 120 || p[1] < -100 || p[1] > CH + 100) return;
    const col = marker.color || '#4dd0e1';
    X.save();
    X.globalAlpha = 0.95;
    X.fillStyle = 'rgba(0,0,0,.42)';
    X.beginPath(); X.ellipse(p[0], p[1] + 2, 13 * zm, 6 * zm, 0, 0, Math.PI * 2); X.fill();
    X.strokeStyle = col; X.lineWidth = 3;
    X.beginPath(); X.ellipse(p[0], p[1], 13 * zm, 7 * zm, 0, 0, Math.PI * 2); X.stroke();
    X.fillStyle = col;
    X.beginPath();
    X.moveTo(p[0], p[1] - 5 * zm);
    X.lineTo(p[0] + 6 * zm, p[1] - 22 * zm);
    X.lineTo(p[0], p[1] - 19 * zm);
    X.lineTo(p[0] - 5 * zm, p[1] - 22 * zm);
    X.closePath(); X.fill();
    const sameName = Array.from(state.members.values()).filter(m => m.nick === marker.nick);
    const label = sameName.length > 1 ? marker.nick + ' · ' + marker.sid.slice(-4) : marker.nick;
    X.font = 'bold 16px system-ui,sans-serif';
    X.textAlign = 'center';
    X.textBaseline = 'bottom';
    X.lineJoin = 'round';
    X.lineWidth = 4;
    X.strokeStyle = '#10131c';
    X.strokeText(label, p[0], p[1] - 25 * zm);
    X.fillStyle = col;
    X.fillText(label, p[0], p[1] - 25 * zm);
    X.restore();
  }

  function isRunning() {
    return !!(state.active && state.connected && state.lifecycle === 'running' && !state.localFailure);
  }

  function snapshot() {
    return {
      protocol: PROTOCOL_VERSION, sessionId, roomCode: state.roomCode, role: state.role,
      lifecycle: state.lifecycle, connected: state.connected,
      memberCount: state.members.size, remoteMarkerCount: remotePlayers.size,
      mapSignature: state.hostSignature, status: state.statusText
    };
  }

  function exposeErrorSafely(message) {
    setStatus('Multiplayer error: ' + String(message || 'Unknown error') + '. Single-player remains available.');
  }

  window.CK_NET = {
    control, drawLobby, getRenderEntries, drawMarker, isRunning, snapshot,
    openLobby() {
      state.nick = cleanNick(ensureLobbyFields().nick.value) || state.nick || 'Player';
      state.config = state.config || currentLocalConfig();
      showLobbyFields(true);
      mode = 'multiplayer';
      selectedRow = 0;
      setStatus('Not connected. Create a room or join using a room code.');
    },
    leaveToSinglePlayer() { void leaveRoom(true, true); },
    reconcilePresence,
    _acceptMarkerForTest: acceptMarker,
    _validateConfigForTest: validateConfig,
    _mapSignatureForTest: mapSignature,
    _failSafely: exposeErrorSafely
  };

  window.addEventListener('beforeunload', () => {
    stopMarkerTimer();
    try { if (state.channel) void state.channel.untrack(); } catch (_) {}
  });
})();