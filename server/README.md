# Authenticated anonymous transport prototype

Run `node server/transport.mjs` (Node 22+; no dependencies). The default listener
is `127.0.0.1:8787`; `PORT` overrides the port. Test with
`node --test tests/server-transport.test.mjs`.

This is a server prototype, not a deployed service. The game now includes an
opt-in authenticated room setup screen that verifies the opening world. The
existing Supabase marker room is unchanged. A limited live economy preview now
connects training, cancellation, movement, stop and rally orders to the shared simulation clock; the full
RTS controller interface is not enabled.

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

POST `/messages` with `{matchId, kind, payload}`. Host kinds are `frame`, `receipt`, `setup`, `commit`, `run` and `result`; guest
kinds are `command`, `ack`, `ready`, `committed` and `run-ready`. Startup and preview handshakes remain restricted to the appropriate team;
`result` reports actual host-side command execution. The server appends `senderSid`,
`team`, per-recipient `sequence`, and `matchId` from its authenticated membership.
Never use `payload.sid` as transport identity. Adapters must pass the
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
- Extend the live preview to battlefield/controller input, team-relative camera
  and HUD, visibility checks and the remaining gameplay command types.
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
The live preview driver stops advancing whenever an operation fails.

The adapter validates the whole batch before processing, then acknowledges only
after successful callbacks. `snapshot()` exposes the state/roster and invitation,
not bearer credentials. The service worker excludes the API, authenticated
requests and no-store requests from its shell cache. The adapter itself has no
timer. The authenticated lobby polls at half-second intervals during setup and
schedules the preview loop at 34 ms after verification. Requests remain serialized;
this interval is not a guarantee of simulation speed or network throughput.

`tests/network-http-transport.test.mjs` runs the classic browser adapter in VM
contexts against real loopback HTTP sockets. It sends a paid guest training order
through the existing authoritative inbox and replays 20 frames into two actual
production simulations, comparing every world hash. It also checks forged
senders, gaps, rejected callbacks, cancellation, timeouts, concurrent polls and
service-worker cache exclusion. Browser rendering, 30 Hz network performance,
full controller gameplay and deployed TLS remain separately unverified. Human-team
AI suppression is covered separately by the live-session tests.

## Authenticated room setup screen and startup barrier

Open Multiplayer, select **Authenticated room setup**, then create a room or
paste a case-sensitive 43-character invitation. The host chooses **Verify shared
map** after the guest connects. D-pad/A/B and native keyboard/touch controls are
supported; the modal traps Tab focus and Escape leaves. The relay must be running
at the same-origin API path above. Static hosting alone does not provide it.

`CK_MATCH_STARTUP.create({transport, validateConfig, prepare})` exchanges a
versioned host setup (complete immutable numeric settings plus opening hash),
guest ready, host commit, and guest committed confirmation. It rejects invalid
settings, wrong peers/versions, unexpected message order, differing opening hashes
and a 30-second startup timeout. Call `begin(settings)` on the host and `pump()`
on each client. The host becomes verified only after the final guest confirmation.
The browser transport separately binds these messages to the server match nonce.

`CK_AUTH_LOBBY` stages the real production world with all starting settings,
including the previously omitted layout, resources, army, villagers, age,
population, game mode and score time limit. The initial checksum includes these
settings, production-world hash and terrain grid. Two kingdoms are required for
this first two-player milestone. Conflicting local guest preferences cannot leak
into the prepared world. Preparation returns to multiplayer mode synchronously
before any frame can advance, and leaving restores the previous settings without
writing a save or changing persisted preferences.

Verification leaves the world frozen at time zero until the host selects
**Run live preview** and the guest confirms the preview start. `verified` means
agreement on the initial state, not completion of multiplayer or proof against a
cheating host. The verified lobby then hands the transport consumer over to
`CK_LIVE_SESSION`; it never runs both startup and gameplay consumers concurrently.

## Live economy preview

After both opening worlds are verified, **Run live preview** performs a separate
host/guest run handshake. Each player can **Train villager** or **Cancel training**
for their own Town Centre. The panel shows their food, population/cap, villagers,
queue, frame and last execution outcome. Startup options can already fill the
population cap; such training is rejected without charging resources. Cancelling
an existing queued unit refunds its normal cost. A queue receipt is not an
execution result; the host sends `result` only after applying the requested frame.

`CK_LIVE_SESSION.create` combines the authenticated relay, command uplink,
authoritative inbox, host clock, frame replica and delivery acknowledgments.
The driver allows train, cancel, move, stop and rally orders. Attack, construction and other
battlefield commands remain unavailable, including those lacking visibility checks.
Host and guest orders both pass through identity/team/ownership validation.

The host keeps at most **one unacknowledged simulation frame**. The guest replays
that journal, advances one production step and compares its world hash before
acknowledging. The host checks the returned hash before stepping again. Duplicate
frames/ACKs are idempotent; a mismatch, timeout, rejected transport message or
closed peer stops the preview. A failed post-step checksum is not rolled back;
the stopped match must be discarded. Frames reserve space in the relay budget
for the hash wrapper, and execution outcomes travel separately.

The normal render loop stays in multiplayer mode, so it cannot double-step,
autosave or accept legacy team-zero gameplay input. The production command/step
callbacks enter play mode only synchronously and immediately restore multiplayer
mode. `S.humanTeams = [0,1]` disables AI decisions for both human kingdoms and is
removed on leaving; normal single-player worlds keep their existing AI behavior.

This deliberately conservative stop-and-wait clock slows down with network latency
rather than advancing an unsynchronized world. Polling, request limits, repeated
commands and longer real-network sessions still need performance testing. There
is no reconnect, full battlefield UI, victory acceptance or deployed service yet.
`tests/network-live-session.test.mjs` covers actual HTTP startup-to-preview flow,
paid orders for both teams, refunds, population rejection reporting, world parity,
AI suppression, duplicate delivery, backpressure, timeout, desync, unauthorized
ownership and DOM/controller event-driven preview buttons and teardown. The DOM
fixture does not establish visual browser or Xbox hardware acceptance.

## Own-kingdom unit map

The live preview now includes **Control units on map**. This is a simple
team-relative tactical grid, not the full game renderer: only the current
player's living, ungarrisoned units and buildings are projected. Enemy entities,
resources, terrain and the shared team-zero fog array are not exposed by this UI.
Blue dots are owned units; gold rectangles are owned buildings.

Click a unit and then a destination to submit one typed move order. Pointer
coordinates scale to the map dimensions. Loaded/dead selections are discarded;
the projection copies display data and never mutates the simulation.

The controller follows the required Xbox button roles: the **left stick** moves
the cursor and **A** selects/orders. **D-pad Up** selects an idle villager,
**Right** a support unit, **Down** a completed town centre, and **Left** a military
unit. This preview currently cycles individual entities rather than selecting
whole groups. **B** closes the command menu or deselects; with no selection it
returns focus to the surrounding controls.

**Hold RT** to open the selected entity's limited command wheel; **A** confirms
its action while RT remains held. Town centres offer villager training; units
offer Stop. Opening or releasing RT alone submits nothing. The old RT-to-train,
LT-to-select-town, LB/RB-to-cycle, Y-to-stop and X-to-deselect shortcuts have been
removed. Unsupported Xbox functions are not assigned replacement bindings.
The surrounding Previous/Next unit, Select town centre and Stop buttons remain
available to pointer/accessibility navigation without claiming to be Xbox binds.

Move, Stop, training and rally commands retain authenticated ownership checks,
scheduled host execution, replay and checksum acknowledgements. Pending orders
block another submission. No UI action optimistically changes units, food or
queues. Stop preserves cargo and resources; stance remains unchanged.

A completed selected town centre accepts **A** on the map to set its rally point.
The confirmed rally marker applies only to future trained units; an unreachable
rally leaves the new unit idle. Unfinished buildings cannot set rally points.
The version-4 run handshake remains unchanged: these changes affect local input,
not the command protocol.

The required target for the whole game is documented in
[../XBOX_CONTROLLER_PARITY.md](../XBOX_CONTROLLER_PARITY.md). The one-action wheel,
single selection and existing setup buttons are still an incomplete preview.
LB groups, RB minimap, Y shortcuts, R3 priorities, full multiplayer menu pages, construction,
combat and full visual/hardware parity remain outstanding. The relay still needs
separate deployment.

## Multiplayer Menu button

While the live preview is running, **Menu** opens the multiplayer menu rather
than leaving the room. The shared simulation, message polling, frame replay and
checksum acknowledgements continue even if both players have the menu open.
The screen states that multiplayer continues. **Menu**, **B**, or **A** on
**Resume match** returns to the previous control; **D-pad** navigates the menu.
Leaving requires selecting **Leave match**, which closes the room normally.

Gameplay controls behind the menu are inert, commands are blocked, and any open
RT wheel is dismissed without losing selection. Tab focus stays inside the menu;
Escape resumes. A peer disconnect or synchronization failure dismisses the menu
and focuses the stopped-room controls. Full objectives, chat/diplomacy,
technology-tree and options pages are still outstanding; this is not a complete
Xbox pause-menu reproduction.
