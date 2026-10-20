# Authenticated battlefield relay prototype

Run `node server/transport.mjs` (Node 22+; no dependencies). The default listener
is `127.0.0.1:8787`; `PORT` overrides the port. Test with
`node --test tests/server-transport.test.mjs`.

This is a server prototype, not a deployed service. The game now includes an
opt-in authenticated room setup screen that verifies the opening world. The
existing Supabase marker room is unchanged. The opt-in battlefield connects gathering, construction, training/research, movement, combat and rally orders to a shared, acknowledged simulation clock. It is still a prototype requiring deployment and browser/hardware acceptance.

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
- Finish remaining gameplay commands, team-relative main-world presentation, reconnect/resume and persistent recovery snapshots.
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

## Authenticated battlefield

The run handshake is `ck-live-preview-7`; older clients fail before accepting live commands. The bounded version-2 packet and journal envelopes remain in use. The legacy Supabase marker room is separate and unchanged.

The driver admits move, stop, gather, build, train, cancel, research, rally, attack, attack-move and stance. Every order is scheduled and checked against server-bound session/team membership and authoritative entity ownership. Attack/gather targets and full building footprints are checked against the acting team's current circular sight (units 8 tiles; Town Centres 11; outposts 14; other buildings 8), including allied vision. Shared `S.vs/S.ex` arrays never grant another team permission. Terrain occlusion and exact reference sight fidelity remain separate acceptance work.

Resources have persistent `n<number>` IDs from the shared monotonic entity counter; unit/building IDs remain `u<number>`/`b<number>`. Resource IDs cannot be used as controllable entity IDs. Gathering requires a current, visible, non-depleted resource at its authoritative grid position and compatible workers/fishing ships. Replaced nodes and foreign farms are rejected. Every route is planned before an all-member order mutates units. Normal production harvesting/depot deposits then run on the shared clock. Save validation rejects duplicate resource IDs and counters that could reuse them.

Construction accepts only implemented economic/military building choices, integral visible sites, current prerequisites/age, sufficient resources and eligible reachable villagers. The host validates the complete footprint and routes before creating an entity or charging. New foundations have stable IDs; farms use the existing owned-food-node model. Town Centres are not exposed as a free build option. Construction order queuing and full special-building parity still require work.

The battlefield UI copies only owned selection data and currently visible opponent/allied details. It renders observed terrain/resources, water, explored fog, units, ships, buildings, health bars, selected movement destinations and visible projectiles. Terrain memory contains last-seen tile/resource art, never remembered enemy locations; hidden territory is not projected from the solo explored array. This is a team-relative top-down battlefield stage, not the final isometric/high-resolution graphics overhaul or protection against a cheating host/client inspecting a complete replica.

- A selects/commands; A on a visible compatible resource gathers; A on a visible hostile attacks.
- Hold A and drag with the left stick for a selection box; LT adds owned units/boxes.
- RT opens contextual commands. For villagers, RT+Y changes economic/military build pages; A chooses a blueprint, A places it and LT retains the preview for another scheduled request.
- Completed owned production/research buildings are selectable. RT and the left stick choose a standard training/research action; A confirms; LT+A requests a five-unit training batch. Costs, population, prerequisites and queue checks execute on the host.
- A with one selected production building sets a rally point. Group rally and LT addition of individual buildings remain unavailable.
- B cancels a blueprint/gesture/menu or deselects. D-pad retains idle/support/town-centre/military roles. Multiplayer LB groups, RB minimap, ordinary Y shortcuts and R3 priorities remain open.
- The typed adapter also supports attack-move and stance, but their complete controller-wheel entries and special abilities remain unfinished. No undocumented replacement binding is assigned.

A normal victory/defeat/draw is part of the world checksum. The guest replays and hashes the terminal frame, then acknowledges it; the host only declares the match finished after that acknowledgment. Both simulations freeze at the same final frame, reject new gameplay orders and retain the team-relative result until leaving. Future-frame pending input is discarded by match termination. A missing final acknowledgment still fails by timeout; there is no reconnect/recovery.

## Verification and remaining acceptance

At `13ec08c8606691b7dee2bf88ba2a718d1e4af30a`, [validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39476141637) and [regressions](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39476141681) passed. `tests/network-battlefield.test.mjs` covers sight, mutation isolation, command rejection, resource identity/save round trips, actual deposits, paid construction/production/research and contextual drawing/input. `tests/network-battlefield-live.test.mjs` uses two production contexts and real loopback HTTP for the UI-driven economic/military loop and combat-to-terminal-ACK flow. Fixture timing is accelerated and worlds are staged for bounded regression scenarios.

These tests do not establish deployed HTTPS, independent rendered browsers, a human full match, Xbox controller/visual acceptance, reconnect, host failover or production-scale throughput. The stop-and-wait clock trades simulation speed for synchronization and still needs real-network performance measurement.

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
