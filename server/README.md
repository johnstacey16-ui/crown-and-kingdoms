# Authenticated anonymous transport prototype

Run `node server/transport.mjs` (Node 22+; no dependencies). The default listener
is `127.0.0.1:8787`; `PORT` overrides the port. Test with
`node --test tests/server-transport.test.mjs`.

This is a separate server prototype, not a deployed service or a browser-game
integration. The existing Supabase marker room is unchanged. It does not make
the game playable online yet.

## Identity and membership

POST JSON `{}` to `/sessions` to obtain a server-generated anonymous `sid`, secret
bearer `token`, and absolute expiry. All subsequent requests require
`Authorization: Bearer <token>`. These credentials prove possession of a session,
not a real person's identity. Sessions expire after 30 minutes without renewal.
Keep tokens in memory and never share them, include them in URLs, or log them.

The host POSTs `{}` to `/rooms` and shares only the returned `roomId` privately
with the guest. This 256-bit invitation is a capability: anyone holding it can
claim the one guest slot. It is intentionally not the legacy six-character code.
The guest POSTs `{roomId}` to `/join`. GET `/room` returns the server-owned roster,
team and match nonce. Membership is immutable; either player's DELETE `/room`,
DELETE `/session`, session expiry, or queue overflow ends the whole room.

## Relay contract

POST `/messages` with `{matchId, kind, payload}`. Host kinds are `frame` and
`receipt`; guest kinds are `command` and `ack`. The server appends `senderSid`,
`team`, per-recipient `sequence`, and `matchId` from its authenticated membership.
Never use `payload.sid` as transport identity. Future adapters must pass the
envelope's verified `senderSid` to the existing strict command/frame validators.
This relay does not validate game commands or make the host cheat-proof.

GET `/messages` returns up to 32 queued envelopes without removing them. After
processing, POST `/messages/ack` with `{matchId, sequence}` to discard envelopes
through that sequence. Repeated polls and receipts are safe. A relay receipt only
confirms transport handling, not game execution. Lost POST responses may produce
duplicate envelopes on retry: existing command IDs/frame checks must deduplicate
payloads. Do not acknowledge beyond the last successfully handled envelope.

Requests are capped at 4 KiB, payloads at 1 KiB, queues at 256 messages, rooms at
500, sessions at 1000, and authenticated traffic at 120 requests/second/session.
Full queues terminate the match rather than silently dropping game frames.

## Deployment gates

- Deploy a long-running Node process behind HTTPS on the game's origin; never
  expose bearer credentials over plain HTTP. No cross-origin access is provided.
- Add proxy-level connection, request-body and anonymous session-creation rate
  limits. The in-memory capacity cap is not protection against distributed abuse.
- Use one process: storage is in memory, restart ends every match, and multiple
  workers do not share state. There is no reconnect/resume or persistence yet.
- Integrate browser session/room lifecycle, authenticated envelope handling,
  gameplay controls for both teams, host clocks and AI suppression before play.
- Measure polling latency/throughput at the target simulation cadence and test
  actual disconnects, two-browser gameplay and Xbox controllers. Local HTTP tests
  establish none of those acceptance criteria.

Do not advertise this prototype as production-ready multiplayer.

## Browser adapter

`js/network-transport.js` is loaded by the game and exposes
`CK_AUTH_TRANSPORT.createClient()`. Loading it performs no network requests. The
adapter uses `/api/multiplayer` on the page's origin; the Node server accepts this
prefix directly, so a same-origin reverse proxy can preserve the request path.
HTTPS is required except on loopback development origins. Redirects and cookies
are disabled; credentials stay in memory and every request bypasses caches.

```js
const host = CK_AUTH_TRANSPORT.createClient();
const room = await host.connect(); // phase: waiting
// Privately pass room.roomId to the guest on another browser.
const guest = CK_AUTH_TRANSPORT.createClient();
await guest.connect(room.roomId);
await host.refreshRoster(); // phase: ready; server-owned roster is now locked
```

Call `send(kind, payload)` with the existing command/frame protocol envelopes.
Call `poll(async (kind, payload, trustedSenderSid) => { ...; return true; })`
to process a batch. Pass `trustedSenderSid` to the command/frame validator;
never take it from the payload. Returning anything other than `true`, throwing,
a malformed batch, an HTTP failure or an eight-second request timeout fails the
session closed and attempts to revoke its credential. Overlapping polls share
one operation. `close()` aborts pending work and revokes the session. A fresh
client and match are required after any failure; there is no automatic reconnect.
The future game driver must stop advancing whenever an operation fails.

The adapter validates the whole batch before processing, then acknowledges only
after successful callbacks. `snapshot()` exposes the state/roster and invitation,
not bearer credentials. The service worker excludes the API, authenticated
requests and no-store requests from its shell cache. There is no timer or game
menu integration yet; the adapter does not replace `CK_NET` or start a match.

`tests/network-http-transport.test.mjs` runs the classic browser adapter in VM
contexts against real loopback HTTP sockets. It sends a paid guest training order
through the existing authoritative inbox and replays 20 frames into two actual
production simulations, comparing every world hash. It also checks forged
senders, gaps, rejected callbacks, cancellation, timeouts, concurrent polls and
service-worker cache exclusion. Browser rendering, 30 Hz network performance,
human controls, AI suppression and deployed TLS remain separately unverified.
