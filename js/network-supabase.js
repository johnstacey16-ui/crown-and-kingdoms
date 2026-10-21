/* Opt-in Free-plan provider for CK_AUTH_TRANSPORT. No connection on load.
 * Caller supplies an Auth access-token callback; no service key or local storage.
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
  root.CK_SUPABASE_TRANSPORT = Object.freeze({ createClient });
})(typeof window !== 'undefined' ? window : globalThis);
