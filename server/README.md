# Authenticated battlefield relay prototype

Run `node server/transport.mjs` (Node 22+; no dependencies). The default listener
is `127.0.0.1:8787`; `PORT` overrides the port. Test with
`node --test tests/server-transport.test.mjs`.

The combined game/relay prototype is [deployed on Railway](https://crown-and-kingdoms-production.up.railway.app). The game now includes an
opt-in authenticated room setup screen that verifies the opening world. The
existing Supabase marker room is unchanged. The opt-in battlefield connects gathering, construction, training/research, movement, combat and rally orders to a shared, acknowledged simulation clock. It is still a prototype requiring full browser/hardware match acceptance.

## Identity and membership

POST JSON `{}` to `/sessions` to obtain a server-generated anonymous `sid`, secret
bearer `token`, and absolute expiry. All subsequent requests require
`Authorization: Bearer <token>`. These credentials prove possession of a session,
not a real person's identity. Each player's session has a 30-minute idle lease. A successful authenticated request renews that player's lease; rejected requests do not renew it. Active matches can run longer than 30 minutes, but one player's traffic cannot renew an idle peer. The initial `expires` value is the initial lease deadline, not a fixed maximum match duration.
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
a malformed batch, an unrecovered HTTP failure or an eight-second request timeout fails the
session closed and attempts to revoke its credential. Overlapping polls share
one operation. `close()` aborts pending work and revokes the session. A fresh
client and match are required after any failure; there is no automatic reconnect.
GET requests and POST `/messages/ack` retry HTTP 502/503/504 at most twice, using the same abort controller and original request deadline. Transport acknowledgments are idempotent; callbacks do not run again while a receipt retries. Command/frame/startup submissions, session creation and room joins are never automatically retried. Authentication errors, rate limits, redirects, malformed JSON and network exceptions still fail closed. The live preview driver stops advancing whenever an operation ultimately fails.

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

The run handshake is `ck-live-preview-8`; older clients fail before accepting live commands. The bounded version-2 packet and journal envelopes remain in use. The legacy Supabase marker room is separate and unchanged.

The driver admits move, stop, gather, build, train, cancel, research, rally, attack, attack-move, stance, garrison, repair, unload and disembark. Every order is scheduled and checked against server-bound session/team membership and authoritative entity ownership. Attack/gather targets and full building footprints are checked against the acting team's current circular sight (units 8 tiles; Town Centres 11; outposts 14; other buildings 8), including allied vision. Shared `S.vs/S.ex` arrays never grant another team permission. Terrain occlusion and exact reference sight fidelity remain separate acceptance work.

Resources have persistent `n<number>` IDs from the shared monotonic entity counter; unit/building IDs remain `u<number>`/`b<number>`. Resource IDs cannot be used as controllable entity IDs. Gathering requires a current, visible, non-depleted resource at its authoritative grid position and compatible workers/fishing ships. Replaced nodes and foreign farms are rejected. Every route is planned before an all-member order mutates units. Normal production harvesting/depot deposits then run on the shared clock. Save validation rejects duplicate resource IDs and counters that could reuse them.

Construction accepts only implemented economic/military building choices, integral visible sites, current prerequisites/age, sufficient resources and eligible reachable villagers. The host validates the complete footprint and routes before creating an entity or charging. New foundations have stable IDs; farms use the existing owned-food-node model. Town Centres are not exposed as a free build option. Construction order queuing and full special-building parity still require work.

Garrison orders require owned, living, unloaded land units, an owned completed garrison or transport, capacity for the entire selection, a valid living manifest and a route for every unit. Orders use normal boarding simulation; passengers cannot receive independent commands. A later boarding race can fill a target before arrival, in which case ordinary simulation cancels excess boarding rather than exceeding capacity. Allied garrison sharing is unavailable because cross-owner unload semantics remain unfinished.

Repair orders accept villagers for friendly damaged buildings or unfinished foundations, and villagers/ships for damaged friendly ships. Neutral and hostile targets, self-targets, hidden targets, full-health completed targets and unreachable selections are rejected. Existing simulation repair/construction rates apply. Trade ships now honor repair before resuming their trading logic.

Building unload operates on one owned completed garrison and uses the normal distinct-tile placement routine. Transport disembark requires living owned passengers and a visible land target with an accessible water route to a free beach. All requested transport routes are planned before any order changes; normal landing checks prevent placement in water, obstructions or occupied tiles. These commands do not grant unexplored-shore targeting.

The battlefield UI copies only owned selection data and currently visible opponent/allied details. It renders observed terrain/resources, water, explored fog, original animated unit/ship/building atlases, health bars, selected movement destinations and visible projectiles. Copied poses use the shared world clock without changing simulation facing. Both kingdoms share screen-depth ordering; construction scaffolding/progress, damage smoke and relation markers supplement the art. Missing or failed frames use procedural fallback. See [GRAPHICS_ACCEPTANCE.md](../GRAPHICS_ACCEPTANCE.md) for Chromium screenshots, coverage and remaining work. Terrain memory contains last-seen tile/resource art, never remembered enemy locations; hidden territory is not projected from the solo explored array. This is a team-relative top-down battlefield stage, not the final isometric/high-resolution graphics overhaul or protection against a cheating host/client inspecting a complete replica.

- A selects/commands; A on a visible compatible resource gathers; A on a visible hostile attacks.
- Hold A and drag with the left stick for a selection box; LT adds owned units/boxes.
- RT opens contextual commands. For villagers, RT+Y changes economic/military build pages; A chooses a blueprint, A places it and LT retains the preview for another scheduled request.
- Completed owned production/research buildings are selectable. RT and the left stick choose a standard training/research action; A confirms; LT+A requests a five-unit training batch. Costs, population, prerequisites and queue checks execute on the host.
- A with one selected production building sets a rally point. Group rally and LT addition of individual buildings remain unavailable.
- Garrison/board, repair and unload-at-shore are explicit contextual RT entries. Choose an entry, release A, then use A on a friendly target or visible shore; B cancels targeting. Building RT includes unload when passengers are present. RT chooses the action without mutating the world; host acknowledgment governs execution. Only common eligible actions appear for mixed unit selections. Passenger badges show owned cargo counts; loaded units leave ordinary selection.
- B cancels targeting, a blueprint/gesture/menu or deselects. D-pad retains idle/support/town-centre/military roles. Multiplayer LB groups, RB minimap, ordinary Y shortcuts and R3 priorities remain open.
- The typed adapter also supports attack-move and stance, but their complete controller-wheel entries and special abilities remain unfinished. No undocumented replacement binding is assigned.

A normal victory/defeat/draw is part of the world checksum. The guest replays and hashes the terminal frame, then acknowledges it; the host only declares the match finished after that acknowledgment. Both simulations freeze at the same final frame, reject new gameplay orders and retain the team-relative result until leaving. Future-frame pending input is discarded by match termination. A missing final acknowledgment still fails by timeout; there is no reconnect/recovery.

## Verification and remaining acceptance

At `f8eee4dae8d725dafaf9965289b4919e8333912e`, [validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39514666040) and [regressions](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39514665643) passed. `tests/network-battlefield.test.mjs` covers sight, mutation isolation, command rejection, resource identity/save round trips, actual deposits, paid construction/production/research, garrison approach/capacity, repair, safe passenger landings and contextual drawing/input. `tests/network-battlefield-live.test.mjs` uses two production contexts and real loopback HTTP for the UI-driven economic/military loop, combat-to-terminal-ACK flow and guest-menu garrison/unload/repair/transport landing. Every live frame compares independent production checkpoints. Fixture timing is accelerated and worlds are staged for bounded regression scenarios.

Deployed HTTPS game/health and two-session room membership were smoke-tested on 21 October 2026. These automated tests do not establish independent rendered browsers, a human full match, Xbox controller/visual acceptance, reconnect, host failover or production-scale throughput. The stop-and-wait clock trades simulation speed for synchronization and still needs real-network performance measurement.

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

## Combined Railway host

The repository includes `Dockerfile` and
`server/app.mjs` for a single game-and-relay origin. Start locally with
`node server/app.mjs` and open `http://localhost:8787`. Railway supplies
`PORT`; the combined host binds `0.0.0.0` by default. Optional `HOST`
overrides the interface for local use.

The healthcheck is `GET /healthz`. Public files are restricted to the
game shell, browser JavaScript, styles and local art. Server source,
tests, repository metadata and deployment configuration return 404.
The authenticated API remains at `/api/multiplayer/*` and is never
cached. The container runs as the unprivileged Node user and has no
third-party runtime dependencies.

Deploy the **main** branch with the Dockerfile and use one replica.
Configure the service with Dockerfile `Dockerfile`, start command `node server/app.mjs`, healthcheck `/healthz`, healthcheck timeout 30 seconds, restart policy `ON_FAILURE` with three retries, one replica and sleeping disabled. These settings have been applied to the production service through the Railway API. The former `railway.json` was removed: [Config as Code is deprecated](https://docs.railway.com/config-as-code) and new services cannot opt into it. A future checked-in platform configuration should use Railway's supported Infrastructure as Code workflow.
Do not enable sleeping or scale to multiple replicas while rooms and
sessions live in process memory. Deployments, restarts and process
failures end active matches; reconnect and durable room storage remain
separate delivery tasks. Use the same public Railway game URL on both
devices; invitations are scoped to that service instance.

`tests/server-app.test.mjs` checks actual HTTP game/assets delivery,
private-path rejection, readiness, uncached responses, anonymous session
creation, two-player room join and authenticated message identity through
the combined host.

## Original atlas catalogue extension

Trade carts/cogs, twelve unique troops and palisades now have original local vector atlases. All runtime unit keys resolve to frames; the castle attack proxy reuses castle art, and farms remain resource tiles. The generator and catalogue tests are documented in [GRAPHICS_ACCEPTANCE.md](../GRAPHICS_ACCEPTANCE.md). HTTP metadata revalidation and `ck-shell-v10` migrate stale cached artwork; the Chromium suite exercises an old HTTP manifest and old shell cache before reload.

## Production status — 21 October 2026

[Play Crown & Kingdoms](https://crown-and-kingdoms-production.up.railway.app). The existing production service is connected to `johnstacey16-ui/crown-and-kingdoms@main`; future pushes deploy automatically. Deployment `18a93b9c-8b96-4714-aab3-e9f1443a33c8` at `d3952c28e994c2dc11e877d7d84b8eb4c61a62fa` reached SUCCESS. The earlier GitHub App permission blocker is resolved. HTTPS `/` and `/healthz` returned 200, and two anonymous sessions created/joined one private room with teams 0/1; smoke-test credentials were revoked afterward.

Public deployment is not full-match acceptance. Independent human browser/controller play, prolonged latency/disconnect testing and Xbox performance remain open. The current reliability increment adds renewable idle leases and bounded safe gateway retries; it does not implement reconnect, persistence or host failover. Targeted transport/live-session tests pass locally (42 checks), including idle peer expiry, rejected-request non-renewal, retry bounds, no repeated gameplay callback after a lost receipt response, and no automatic retry of gameplay submissions.
