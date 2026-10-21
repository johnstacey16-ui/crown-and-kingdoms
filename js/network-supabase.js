/* Opt-in Free-plan provider for CK_AUTH_TRANSPORT. No connection on load.
 * Supports a supplied Auth token or an isolated guest Auth lease kept in memory.
 * UI cutover remains gated on real Auth + two-browser/static-origin verification. */
(function(root){
  'use strict';
  const project = 'https://isfzrqtbsbqlaojtpkxr.supabase.co';
  const publishableKey = 'sb_publishable_wj7wH708NGPxJscwv77pug_8Lf6XR7u';
  const routes = Object.freeze({
    'POST /sessions': 'sessions', 'POST /rooms': 'create', 'POST /join': 'join',
    'GET /room': 'roster', 'POST /messages': 'send', 'GET /messages': 'poll',
    'POST /messages/ack': 'ack', 'DELETE /session': 'close'
  });
  function createClient({ getAccessToken, timeoutMs = 8000 } = {}) {
    if (typeof getAccessToken !== 'function') throw Error('Supabase Auth required');
    if (!root.CK_AUTH_TRANSPORT) throw Error('Load network-transport.js first');
    return root.CK_AUTH_TRANSPORT.createClient({ timeoutMs, request: async ({path,method,data,credential,signal}) => {
      const op = routes[method + ' ' + path];
      if (!op) throw Error('Unsupported relay operation');
      const accessToken = await getAccessToken({ signal });
      if (signal.aborted) throw Error('Relay request cancelled');
      if (typeof accessToken !== 'string' || !accessToken || accessToken.startsWith('sb_')) throw Error('Supabase Auth required');
      return root.fetch(project + '/rest/v1/rpc/ck_relay_request', {
        method: 'POST', redirect: 'error', credentials: 'omit', cache: 'no-store', signal,
        headers: { 'Content-Type': 'application/json', apikey: publishableKey, Authorization: 'Bearer ' + accessToken },
        body: JSON.stringify({ op, credential: credential ?? null, data: data ?? {} })
      });
    }});
  }

  // REST endpoints follow supabase/auth-js GoTrueClient signInAnonymously and
  // _refreshAccessToken. No retries: an ambiguous signup/rotation ends this client.
  function createGuestAuth({ timeoutMs = 8000, captchaToken } = {}) {
    const origin = new URL(root.location.origin);
    if (origin.protocol !== 'https:' && !(origin.protocol === 'http:' &&
        ['localhost','127.0.0.1','[::1]'].includes(origin.hostname))) throw Error('HTTPS required');
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) throw Error('Invalid timeout');
    if (captchaToken !== undefined && (typeof captchaToken !== 'string' || captchaToken.length > 8192)) throw Error('Invalid CAPTCHA token');
    let session = null, pending = null, controller = null, closed = false, closing = null;
    const active = () => { if (closed) throw Error('Guest Auth ended'); };
    const token = value => typeof value === 'string' && value.length > 0 && value.length <= 16384;
    const jwt = value => token(value) && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);
    async function authRequest(path, body, signal, accessToken) {
      return root.fetch(project + '/auth/v1/' + path, {
        method: 'POST', redirect: 'error', credentials: 'omit', cache: 'no-store', signal,
        headers: { 'Content-Type': 'application/json', apikey: publishableKey,
          ...(accessToken ? { Authorization: 'Bearer ' + accessToken } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
      });
    }
    async function logout(accessToken) {
      if (!accessToken) return;
      const abort = new AbortController(), timer = root.setTimeout(()=>abort.abort(),timeoutMs);
      try { await authRequest('logout?scope=local',undefined,abort.signal,accessToken); }
      catch (_) { /* Network failure: server expiry remains the fallback. */ }
      finally { root.clearTimeout(timer); }
    }
    function close() {
      if (closing) return closing;
      closed = true;
      controller?.abort();
      const accessToken = session?.accessToken;
      session = null;
      closing = logout(accessToken);
      return closing;
    }
    async function renew() {
      const started = Date.now();
      const old = session;
      let candidate = null;
      controller = new AbortController();
      const abort = controller, timer = root.setTimeout(()=>abort.abort(),timeoutMs);
      try {
        const response = await authRequest(old ? 'token?grant_type=refresh_token' : 'signup',
          old ? { refresh_token: old.refreshToken } : { data: {}, gotrue_meta_security: {
            ...(captchaToken ? { captcha_token: captchaToken } : {}) } },abort.signal);
        if (!response.ok) throw Error(response.status === 422 ? 'Guest sign-in is unavailable in Supabase' : 'Guest authentication failed (' + response.status + ')');
        const result = await response.json();
        candidate = jwt(result?.access_token) ? result.access_token : null;
        if (closed || abort.signal.aborted) {
          throw Error('Guest Auth ended');
        }
        if (!result || !jwt(result.access_token) ||
            !token(result.refresh_token) || result.token_type !== 'bearer' ||
            !Number.isSafeInteger(result.expires_in) || result.expires_in < 1 || result.expires_in > 86400 ||
            !result.user || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result.user.id) ||
            result.user.is_anonymous !== true || old && result.user.id !== old.uid) throw Error('Invalid guest session');
        session = { uid:result.user.id, accessToken:result.access_token, refreshToken:result.refresh_token,
          expires:started + result.expires_in * 1000 };
        return session.accessToken;
      } catch (error) {
        await close();
        if (candidate && candidate !== old?.accessToken) await logout(candidate);
        throw error;
      } finally { root.clearTimeout(timer); if (controller === abort) controller = null; }
    }
    async function getAccessToken({ signal } = {}) {
      active();
      if (signal?.aborted) throw Error('Guest request cancelled');
      if (session && session.expires - Date.now() > 60000) return session.accessToken;
      if (!pending) pending = renew().finally(()=>{ pending = null; });
      // Concurrent RPCs share one signup/refresh. Any abort ends that shared lease.
      const cancel = () => { void close(); };
      signal?.addEventListener('abort',cancel,{once:true});
      try { const value = await pending; active(); return value; }
      finally { signal?.removeEventListener('abort',cancel); }
    }
    return Object.freeze({ getAccessToken, close });
  }
  function createGuestClient(options = {}) {
    const auth = createGuestAuth(options);
    let connection;
    try { connection = createClient({ timeoutMs:options.timeoutMs, getAccessToken:auth.getAccessToken }); }
    catch(error) { void auth.close(); throw error; }
    let closing = null, polling = null;
    function close() {
      if (!closing) closing = Promise.resolve(connection.close()).finally(()=>auth.close());
      return closing;
    }
    const guarded = method => async (...args) => {
      try { return await connection[method](...args); }
      catch(error) { await close(); throw error; }
    };
    function poll(handle) {
      if (!polling) polling = guarded('poll')(handle).finally(()=>{ polling = null; });
      return polling;
    }
    return Object.freeze({ connect:guarded('connect'), refreshRoster:guarded('refreshRoster'),
      send:guarded('send'), poll, snapshot:connection.snapshot, close });
  }
  root.CK_SUPABASE_TRANSPORT = Object.freeze({ createClient, createGuestAuth, createGuestClient });
})(typeof window !== 'undefined' ? window : globalThis);
