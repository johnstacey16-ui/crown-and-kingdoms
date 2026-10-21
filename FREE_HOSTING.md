# Free-only hosting requirement

The owner chose free-only hosting on 21 October 2026. This supersedes earlier
Railway deployment instructions and is a constraint on future work, not a claim
that multiplayer migration is already complete.

## Cost rules

- Do not upgrade plans, add payment methods, buy credits, enable paid add-ons or
  uncap usage. Do not provision another paid/trial-dependent host to bypass this rule.
- Use the existing Supabase project only after confirming its Free plan and quotas.
  Keep static hosting within an existing confirmed free plan.
- If a free quota is reached, stop/restrict the feature rather than enable paid
  overages. Measure message, connection, database and egress usage before making
  claims about player capacity or uninterrupted free operation.
- Do not redeploy/re-enable the Railway game service without explicit owner approval.
  Its GitHub repo is the source of truth; keep working directly on main.

## Current state and shutdown

The Railway service is still present. A zero-replica request was rejected because
Railway requires at least one replica. Permanent service deletion was blocked by
automatic approval review: stopping the service/free-only hosting was authorized,
but permanent removal of domains, deployments, variables and triggers was not
explicitly authorized. No deletion occurred.

The production config now has a nonmatching build watch pattern,
`/__railway_disabled_free_only__/**`, `sleepApplication: true` and restart policy
`NEVER`. These were read back successfully. They do not prove the current process
has stopped; deploy-time settings require a deployment, which is not being started.
The existing host may continue consuming trial credits until it is actually stopped
or the owner explicitly authorizes deleting this standalone service.

Service: `5d37d197-7064-4a88-9ce7-39f8851f07d1`; project:
`c9182bd4-8f96-4f39-82f4-7e86756b5729`; production environment:
`cefb9e69-2d18-4760-bb2d-c461d940903e`. There are no attached volumes,
no database, and no service variables. The application code remains on GitHub.

## Supabase migration requirements

The existing client configuration points to project `isfzrqtbsbqlaojtpkxr`.
Its public Auth settings endpoint initially reported anonymous sign-in disabled;
the owner enabled it on 21 October 2026 and the endpoint now confirms it is enabled. The connected Supabase plugin confirmed this project is ACTIVE_HEALTHY and its
organization `rchuzzfoqscnjvhbctjt` is on `free` / `tier_free` on 21 October 2026.
No plan upgrades or paid resources were created. After two earlier connector
errors, retrying `apply_migration` succeeded on 21 October 2026. Migration
`ck_free_relay_v1` is recorded in the actual project. The migration itself changed no Auth settings and created no Auth users.
The owner subsequently enabled anonymous Auth; live probes below create guest users.

The legacy `multiplayer.js` lobby/presence/marker path is not a replacement for the
new synchronized relay. The latter currently calls the Node HTTP API. Preserve the
existing shared simulation and immutable roster, frame sequencing, deduplication,
identity, ownership, fog and final-ACK guards when replacing that transport.

The free replacement must:

1. Confirm the project's Free plan; inspect existing schema/auth policies without
   overwriting unrelated data. Establish an explicit anonymous or signed-in Auth flow.
2. Put room admission and sender/team binding behind trusted Supabase identity and
   database policies/server functions. Never trust Broadcast payload SID/team fields
   or expose service-role keys. Keep invitations separate from credentials.
3. Provide the existing transport contract (connect, roster, send, poll/receive,
   close), bounded queues, room nonce and per-sender delivery checks. Define room
   expiry/cleanup and keep credentials out of logs, URLs and shell caches.
4. Measure/throttle/batch signaling/game traffic for the verified free allowances;
   handle exhausted quotas without upgrading. Choose the transport only after this
   measurement and authorization design, not simply reuse unauthenticated markers.
5. Run independent two-client integration tests including spoofing, duplicate input,
   disconnects, startup/terminal barriers and matching production checkpoints. Then
   validate against the actual free Supabase project and static game origin before
   switching the UI default. Do not claim that migration is live from offline tests.

Current Supabase documentation says Free-plan users are not billed, with free
Realtime limits including 2 million messages and 200 peak connections. Limits and
project configuration must be verified again at rollout; this is not unlimited
multiplayer capacity.

References: [cost control](https://supabase.com/docs/guides/platform/cost-control),
[Realtime pricing](https://supabase.com/docs/guides/realtime/pricing),
[anonymous Auth](https://supabase.com/docs/guides/auth/auth-anonymous),
[database functions](https://supabase.com/docs/guides/database/functions),
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Installed relay v1 (game UI not switched)

- `server/supabase-relay.sql` is an atomic deployment definition for migration
  `ck_free_relay_v1`, now applied to the real Free-plan project. Do not run the
  test bootstrap there. New privileged state is in an unexposed RLS-enabled schema;
  the public invoker RPC calls a private definer implementation that checks
  `auth.uid()` and a hashed, Auth-bound relay credential. No browser table grants.
- The existing empty `public.player` marker table has no owner column and broad
  grants/policies. The applied SQL revoked browser access while retaining data
  and structure. Catalog checks verified these grants are removed.
- Limits: 16 sessions / 8 rooms, 256 queued messages per recipient, 32 per poll,
  120 successful authenticated requests/second/session, 30-minute idle expiry,
  2-hour absolute session lifetime. Expired sessions cascade-delete their rooms
  and messages on the next successful relay request. No paid Cron is needed.
- Monthly application caps: 1 million successful RPCs, 100,000 messages and
  250 MB of estimated response bytes (JSON plus 1 KiB allowance/request). This is
  application accounting, not provider metering or a guaranteed player capacity;
  failed requests, Auth, headers and other project traffic are not fully metered.
  Quota errors stop the match; authenticated close is still permitted.
- `js/network-supabase.js` supplies the existing validated transport contract with
  an Auth-token callback and fixed project/publishable key. It also provides
  `createGuestAuth` and `createGuestClient`: lazy anonymous signup, shared token
  refresh with identity pinning, optional CAPTCHA token, bounded requests,
  cancellation, and relay revocation before local Auth sign-out. No automatic
  signup/refresh retry or identity replacement after failure. Credentials stay in
  memory; snapshots omit them. It remains opt-in and is not loaded by the game UI.
- `Supabase relay validation` runs the real SQL and JS adapter against disposable
  PostgreSQL 17 with simulated verified JWT claims, including simulation parity,
  sender spoofing, permissions, receipts, expiry and caps. This does not establish
  real Auth/JWT verification, HTTPS/CORS, two-browser operation or free capacity.

Next gates: verify the complete live startup/terminal flow and independent
browser clients, and measure actual traffic
before deciding whether this REST relay meets gameplay latency and Free quotas.
The connector currently exposes no Auth configuration update tool. Static hosting
on a confirmed free plan and Railway shutdown still need to be completed before
claiming the switch to free-only hosting is finished.

Verification on main: [Supabase relay validation run 39543776188](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39543776188)
passed all 14 tests (11 existing HTTP adapter checks and 3 PostgreSQL integration
cases). Both simulated Auth identities produced matching game hashes through
20 frames including a paid guest training order. The separate local HTTP/live
session/server suite passed all 43 checks. These are transport/database tests;
real-project Auth, browser, capacity and live migration gates above remain open.

## Actual-project verification

After applying the migration, role-scoped rollback tests on the real project
verified two identities, token-theft rejection, host/guest message roles, stamped
sender identity, stable non-destructive polls, duplicate transport ACKs and closure.
No test sessions, rooms or messages remained; Auth users were never created by
these SQL tests. These are simulated verified JWT claims, not real Auth sign-ins.
The actual HTTPS REST endpoint rejected both no-Auth and invalid-JWT requests
with 401; the latter reported cryptographic verification failure.

Catalog checks confirmed RLS on all four private tables, no direct authenticated
SELECT privilege, no unauthenticated RPC EXECUTE privilege, and no legacy marker
UPDATE privilege. Security Advisor returned four informational
[RLS-without-policy notices](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
for these private tables. This deny-by-default setup is intentional: only the
identity-checking private function may access them. Do not add permissive policies
to silence the notices. Performance Advisor returned no findings.

The owner enabled **Anonymous Sign-Ins**. Settings are under [Authentication providers](https://supabase.com/dashboard/project/isfzrqtbsbqlaojtpkxr/auth/providers).
The connector exposes no Auth-settings update operation. Do not bypass supported
Auth configuration by editing managed Auth tables. Validate any CAPTCHA/rate-limit
settings before public rollout. Guest signup/refresh use the official auth-js REST
routes (`/signup`, `/token?grant_type=refresh_token` and `/logout?scope=local`).
The new local guest Auth suite passed 11 cases, plus all 11 existing HTTP transport
checks. The PostgreSQL CI workflow also runs this Auth suite.

Repository metadata identifies `https://crown-and-kingdoms.vercel.app` as the homepage.
This identifies a possible existing static origin, not a verified Free hosting plan;
confirm the hosting account and actual deployed revision before UI cutover.

Guest lifecycle update verification:
[Supabase relay validation 39544723296](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39544723296)
passed all 25 checks with no skips (3 real PostgreSQL integration cases, 11 guest
Auth lifecycle cases and 11 HTTP adapter cases). The separate local transport,
live-session, server and Auth run passed 54 tests. Code commit:
`b83ae93912cfb1afa766fafa277e8ad4276976b8`. Game validation also passed for that
commit. Anonymous Auth was still disabled at that commit; it is now enabled by the owner. Real Auth/two-browser/static
hosting gates remain open, and the default game connection remains unchanged.

## Live Auth smoke and startup timing fix

The enabled anonymous setting and Free plan were reverified. Three local live
probes created two independent guest identities each (six Auth records total),
refreshed both credentials while retaining the immutable room roster, then hit the
original startup deadline. Every probe closed its own relay sessions/room and
signed out both Auth leases. The managed anonymous Auth user records remain;
no managed Auth tables were edited to remove them. These records need a retention
policy before broad public rollout.

The instrumented local probes observed median HTTPS request times of 231–246 ms
and p95 of 5.0–6.0 seconds. These include this execution environment and are not
measurements of Supabase database execution time or player-to-player browser latency.
The old startup timer covered the entire handshake, even while valid stages were
progressing. Startup now renews its existing timeout only for a validated new
ready/commit stage. Identity, version, hash, ordering and final confirmation checks
remain mandatory. Stalls still expire and duplicate confirmations fail closed;
two new deterministic HTTP regression cases cover slow progress, stalls and replay.

`scripts/verify-supabase-relay.mjs` is an explicit live probe gated by
`CK_RUN_SUPABASE_SMOKE=1`. It creates two real guest users, checks token refresh,
map agreement, both teams' paid training orders, matching production checkpoints,
and final acknowledgment of a deterministic terminal fixture. It logs aggregate
counts/timings only. It is not a browser/CORS or natural combat-victory test.

The dedicated `Live Supabase guest smoke` workflow runs on changes to the probe or
its workflow, and on manual dispatch; ordinary game pushes do not run it. It creates
two additional anonymous Auth records per execution and retains its non-secret
log artifact for seven days. No paid resources or plan changes are involved.
Results must be recorded before claiming the live handshake or battlefield works.
The game UI default and Railway shutdown status remain unchanged.

## Live acceptance result and transport decision

[Live Supabase guest smoke 39546204721](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39546204721)
passed against the real Free-plan project at commit
`c53a4be6af8d0138b4858fb3ece8335917385e82`. The evidence log contains no credentials
or invitations. Both real guest Auth leases refreshed once; both starting worlds
verified; both teams paid for training; all 24 production checkpoints matched; and
both clients stopped at the acknowledged deterministic draw fixture's final frame.
Two local startup regression cases cover the timeout fix. All 62 local startup,
HTTP, live-session, server and Auth checks passed, and Game validation passed.
This is headless Node acceptance, not physical-controller, browser/CORS or natural
combat-victory acceptance.

Measured totals: 177 RPCs, 26,177 response-body bytes, 29,567 request-body bytes,
170 ms median request time, 261 ms p95, 35.363 s total, 27.703 s gameplay, **0.87
observed simulation frames/s**. Headers, TLS and other project traffic are excluded
from byte counts. The post-test catalog check found zero relay sessions, rooms and
messages. This CI run created two more anonymous Auth user records (eight known
smoke-created records total); local sign-out revokes leases, not managed user rows.

**Do not switch the game UI to this HTTP gameplay relay.** The measured throughput
is unsuitable for the game's 30-Hz simulation. Its 100,000-message application cap
would also cover only about 28 minutes of frame+ACK traffic at 30 Hz, before command
or handshake traffic. A working Auth/checkpoint test is not a playable public launch.

The next transport should retain verified Supabase room admission, immutable roster,
nonce, Auth lifecycle and bounded signaling, while moving frequent game packets to
a faster channel. An authenticated WebRTC data channel is a candidate: bind its SDP
fingerprints to the admitted room identities, keep replay/ownership/hash and final
ACK checks, bound buffers and disconnects, and test two independent browsers plus
real network/NAT cases. No paid TURN service, plan upgrade or unverified public
Broadcast identity may be introduced to bypass these requirements. An opt-in implementation is being validated; it is not the game default. The static host's Free plan, browser/CORS
acceptance and Railway shutdown also remain outstanding.

## Opt-in peer transport implementation

`js/network-webrtc.js` implements the existing connect/roster/send/poll/close
contract using authenticated Supabase admission plus a reliable ordered WebRTC
data channel. `server/supabase-rtc.sql` is an additive signaling migration; it
reuses the existing credential validation, idle/absolute expiry, rate limits,
monthly budgets and transaction lock. Only admitted Auth identities may publish
their own offer/answer, once, bound to the match nonce; later changes are rejected.
SDP is bounded to 8 KiB and its DTLS fingerprint is delivered only to room members.
The public wrapper remains invoker-only, with no anonymous grant or table access.
This migration passed PostgreSQL tests and is now installed in the real Free-plan project.

The channel hello must match the server-owned SID/team/match roster, and native
DTLS must match the authenticated SDP fingerprint. Gameplay packets carry no
selectable SID/team; the receiver stamps the admitted peer identity. Both the
new channel validator and existing transport/simulation guards check sequence,
role, sizes and checksums. Receive queues cap at 256 packets and send buffers at
64 KiB; unexpected channels, malformed packets, disconnects and overload terminate
the session. Gameplay uses no database message/receipt RPCs. A 10-second roster
heartbeat renews only the current Auth-bound lease; room expiry/revocation ends play.

The default ICE configuration uses the public Google STUN endpoint shown in the
[official WebRTC guide](https://webrtc.org/getting-started/peer-connections).
No TURN account, paid relay, subscription or new host is provisioned. Some networks
require TURN and therefore may fail to connect; there is no automatic paid fallback.
Native Chromium tests on one runner can establish local DTLS/SCTP and protocol
behavior, but do not prove connectivity through different routers, mobile NATs or
production browser CORS. Real Supabase/two-browser acceptance remains a rollout
gate. The UI still uses the original connection until these gates and the static
host's Free plan are verified.

## Peer transport verification and live-browser probe

Migration `ck_authenticated_rtc_signaling_v1` passed PostgreSQL tests and was
applied to the real Free project. Role-scoped rollback checks there confirmed
match/role binding, immutable SDP and rejection of a stolen relay token from a
different Auth identity. Anonymous RPC execution remains denied. A separate
`ck_lock_unused_player_policies` migration removed the four permissive policies
from the unused legacy player table while preserving rows and schema. Its browser
grants remain revoked. Security Advisor's private-table deny-policy notices are
intentional; its password-leak-check setting is unchanged for this passwordless
path ([reference](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)).

Native Chromium [transport run 39548560310](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39548560310)
passed all 10 cases: ordinary delivery, sender injection, sequence gap, wrong role,
oversize, receive overflow, unexpected second channel, replay, send backpressure
and disconnect. 120 packets took 435 ms (276 packets/s) on one runner with local
signaling fixtures and no gameplay database calls. This is not a game frame-rate
or real-NAT measurement. The controlled runner disables local mDNS obfuscation;
production behavior is unchanged. Browser-start timing exposed a one-shot hello
race; a bounded two-way identity-confirmation exchange now handles already-open
remote channels and a missed initial hello. Duplicate control packets are bounded
and forbidden after gameplay is received. Three deterministic Node tests cover
these timing/cancellation cases. Existing packet/ownership/hash guards remain.

The explicit `Live WebRTC multiplayer acceptance` workflow uses two isolated
Chromium contexts with real Supabase Auth, HTTPS/CORS and immutable SDP signaling,
then exercises production startup, paid orders, 120 world checkpoints and a final
ACK barrier. It creates two anonymous Auth records per execution, revokes relay
and Auth leases afterwards, and logs no SDP, tokens or invitations. Only changes
to its dedicated probe/workflow (or manual dispatch) trigger it. Ordinary game
pushes do not create these live test users. The probe's localhost/local-ICE topology
cannot prove different-router/mobile NAT reachability or the deployed static origin.
Record its outcome before claiming live browser gameplay works.

## Real peer-browser acceptance (API path)

[Live WebRTC acceptance 39548726176](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39548726176)
passed on commit `ec99bf2a30c5c1d585e9ba6ccef4da699257c617`: two real guest browsers,
120 matching production world checkpoints, both teams' paid training and the final
ACK barrier. Observed simulation throughput was **20 frames/s** over 5.999 seconds,
with 6 signaling RPCs, 11 admission/roster/close RPCs and **zero database gameplay
calls**. Both Auth leases signed out. The post-test database check found zero
relay sessions, rooms and queued messages. Two managed anonymous Auth records
remain (ten known smoke-created records after this probe). This controlled localhost
single-runner test used numeric local ICE; it does not establish internet/NAT
coverage or the production Vercel origin. No 30-Hz or universal-connectivity claim.
All 65 local startup/HTTP/live-session/server/Auth/peer timing checks also passed.

The setup dialog now accepts an explicit `createTransport` option, preserving the
original default and button/controller bindings. The next browser probe uses the
actual Create / Join / Verify / Run / Train / Leave dialog actions with the peer
provider injected; no console-only replacement for UI lifecycle testing. It still
creates only two Auth records per execution and tears down relay/Auth leases.
The public menu/default remains unchanged. Vercel access was requested solely to
verify the existing static host's Free plan and deployed revision before cutover;
it was not connected at that point and no plan/deployment changes were made there.

## Real peer-browser UI acceptance

[Live UI acceptance 39549248705](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39549248705)
passed on code commit `255901b58d8247ab817e45f298129f5abea68e0d`. It clicked the actual
Create / Join / Verify / Run / Train / Leave controls in two isolated Chromium
contexts, using real guest Auth, HTTPS/CORS and Supabase signaling. Both maps
verified without advancing simulation first. All 120 production world checkpoints
matched, both teams paid for their training orders, and the final fixture frame
was acknowledged before play stopped. Leave closed the peer connection.

Observed UI simulation throughput: **25.79 frames/s** over 4.652 seconds. Traffic:
6 signaling RPCs, 16 room/admission/roster/close RPCs and **zero database gameplay
calls**. Both Auth leases signed out. Two more anonymous Auth records remain
(twelve known smoke-created records total). This is a controlled one-runner,
localhost-origin, numeric local-ICE measurement. It is not proof of public internet
NAT traversal, production-origin acceptance, physical Xbox parity or universal
25.79-fps performance. No paid relay or plan change was introduced.

Post-hardening Security Advisor confirmed the broad legacy anonymous-player-policy
warning is gone. Five deny-by-default RLS-without-policy informational notices
remain (the four private relay tables and the unused player table). The existing
password leak-protection warning remains unchanged; the game guest path has no
password. See the linked security references above rather than adding permissive
policies or paid features to silence these notices.

The tested provider is opt-in through the dialog's transport factory. The public
menu/default has not switched. The Vercel connection is now present, but plan/revision verification is blocked by
missing access to the owning team, as recorded below.
Separate-router/mobile NAT acceptance and Railway shutdown remain outstanding.


## Connection feedback and Vercel access check

On 21 October 2026 the Vercel connection returned project
`prj_N8KwgIrHAXefpAtb71LTs4hMcUok`, owned by team
`team_Txg1o6fSmDy9XvhUlnETTxT4` (`acme-a675`), with production deployment
`dpl_136Y78BxPsYv2R5Su19gs2iETe9D` marked READY. Team and deployment-list reads
returned 403 because the connection lacks access to that team; the team list was
empty. No authenticated Vercel CLI is available locally. This does not verify the
plan, source revision or public-origin acceptance. The owner must grant this
connection access to the owning team before those checks can proceed. No hosting
settings, plan or deployments were changed.

The opt-in peer dialog now shows direct-connection progress and distinguishes a
connection timeout from a lost peer. Retry guidance asks players to leave and make
a new room; it notes that some networks block direct connections. Diagnostic
stages/reasons are fixed strings with no tokens, room IDs or SDP. Explicit Leave
remains an ordinary close, without a timeout/failure reason. A stalled-connection
regression checks bounded failure and closure on both peers. Controller mappings
and the public transport default remain unchanged.

Validation: the 66-check local transport/startup/live/Auth suite passed, plus the
new DOM regression for progress, safe timeout text, disabled actions and timer
cleanup. Code commit `def75f5de2189e97c25bcc465eb1975d50555dca` passed
[WebRTC browser transport](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39549941825),
[Battlefield browser graphics](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39549941682)
and [Game validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39549941648).
These checks do not establish public-origin/NAT acceptance.


## Vercel project-access workaround verified — 21 October 2026

The owner completed OAuth authorization repeatedly with the correct project selected.
Do not ask the owner to repeat those steps. Their dashboard screenshots confirm
team ACME (`acme-a675`) is Hobby, the project ID is
`prj_N8KwgIrHAXefpAtb71LTs4hMcUok`, and production is READY on main.
The connected identity was also verified as the owning account.

Explicit `teamId` or `slug` arguments caused project lookup to return 404,
project listing to return empty, and deployment listing to return 403, despite
team metadata being readable. Omitting the optional team selector while retaining
the exact authorized project ID succeeded. This is a verified request-context
workaround, not a change to OAuth grants or an authorization bypass: the returned
project `accountId` is the intended `team_Txg1o6fSmDy9XvhUlnETTxT4`.

Working read calls:
- `get_project({idOrName:"prj_N8KwgIrHAXefpAtb71LTs4hMcUok"})`
- `list_deployments({projectId:"prj_N8KwgIrHAXefpAtb71LTs4hMcUok",limit:1,target:"production"})`

The deployment read confirmed `dpl_7gikhXNE6emUw4Sb4BmHh55KCzoc`, READY production,
GitHub source main at `b6e3a7bef6288936e1379eca1f9ae03138ef753d`,
and the crown-and-kingdoms repository/organization. No plan, permission or hosting
settings were changed. Earlier statements that this connection could not read
the project are superseded by this result. Do not broaden project permissions,
disable deployment protection, create API tokens or upgrade the plan to fix it.
For any future operation, keep the exact intended project ID and verify the
returned owner/environment; this read workaround alone does not verify mutation
permissions. Public-origin peer acceptance, separate-network/NAT testing and
Railway shutdown remain outstanding.


## Production-origin acceptance and controller menu preview

The production-origin probe now checks 15 deployed HTML/JS/service-worker assets
against the checked-out source before creating Auth users. It runs from the
public HTTPS Vercel game origin, not localhost. An initial attempt timed out during
host room creation and created no Auth users (verified by the creation-time
aggregate); its cause was not established. Safe stage/status/network diagnostics
were added before subsequent successful runs. No authentication retries or guards
were weakened.

[Production UI + Objectives acceptance 39556611925](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39556611925)
passed on `d533dbf22d117269c89a7124a980a3e88b09a3f3`. It verified 13 deployed assets,
120 matching world frames, both paid training orders, final ACK and Objectives
while simulation continued. It measured 23.19 simulation frames/s in this controlled
topology with six signaling calls, 15 room/control calls and zero gameplay RPCs.

The menu's existing explicit setup entry is now **Two-player battlefield preview**.
It supplies the peer factory to the dialog; the transport core's default remains
available for existing HTTP tests/local integration. The production shell loads
both providers without connecting, and service-worker cache v11 includes them
while continuing to bypass authenticated and cross-origin traffic. The preview
explains restricted-network failures and offers no paid fallback. Legacy marker
rooms are not synchronized gameplay and are not the tested route.

[Controller menu production acceptance 39578735274](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39578735274)
passed on game commit `7ed3de058a1d950060bd86e819a2aecba3c53076`. It reached the
preview through the actual menu control path, with no injected script tags, then
completed Create / Join / Verify / Run / Objectives / Train / Leave. All 15 deployed
assets matched, all 120 world frames matched, both teams paid for training, and
the final frame was acknowledged. Observed simulation throughput was 20.44 frames/s
over 5.870 seconds: six signaling calls, 17 room/control calls, zero gameplay RPCs,
two signups and two local logouts. Opening the menu caused no signups. This test
uses simulated controller edges in two Chromium contexts on one runner with
numeric local ICE; it does not verify physical Xbox input, different-router NAT,
natural combat victory, 30-Hz performance or broad-launch capacity.

After the test, sessions/rooms/messages were all zero. There are 18 managed
anonymous Auth users from these probes; local logout revokes sessions, not rows.
Retention/abuse handling is still required before broader release. Supabase's
organization was rechecked as `free` / `tier_free`; the owner screenshots confirm
Vercel Hobby. No paid service, permission widening, plan change or Railway redeploy
was used. Different-network testing, Xbox hardware, retention and Railway shutdown
remain open. This opt-in preview is not a claim that free-only migration or the
complete game is finished.
