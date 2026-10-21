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
Its public Auth settings endpoint returned 200 and reported anonymous user sign-in
disabled on 21 October 2026. The connected Supabase plugin confirmed this project is ACTIVE_HEALTHY and its
organization `rchuzzfoqscnjvhbctjt` is on `free` / `tier_free` on 21 October 2026.
No plan upgrades or paid resources were created. Two apply_migration attempts
failed with `Invalid or expired requestState`; a subsequent catalog read confirmed
`ck_relay` does not exist. No schema/auth changes or new users were created.

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

## Prepared relay v1 (not live)

- `server/supabase-relay.sql` is an atomic deployment definition for migration
  `ck_free_relay_v1`. It has not been applied to the real project. Do not run the
  test bootstrap there. New privileged state is in an unexposed RLS-enabled schema;
  the public invoker RPC calls a private definer implementation that checks
  `auth.uid()` and a hashed, Auth-bound relay credential. No browser table grants.
- The existing empty `public.player` marker table has no owner column and broad
  grants/policies. The proposed SQL revokes browser access while retaining data
  and structure. This revocation is pending along with the rest of the migration.
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
  an Auth-token callback and fixed project/publishable key. It is opt-in and is
  not loaded by the game UI yet. No secrets, cookies or persistent token storage.
- `Supabase relay validation` runs the real SQL and JS adapter against disposable
  PostgreSQL 17 with simulated verified JWT claims, including simulation parity,
  sender spoofing, permissions, receipts, expiry and caps. This does not establish
  real Auth/JWT verification, HTTPS/CORS, two-browser operation or free capacity.

Next gates: get the supported migration write working, apply and verify the SQL,
run security advisors, enable anonymous Auth only after access controls are checked,
then implement/test guest Auth lifecycle and measure actual two-browser traffic.
The connector currently exposes no Auth configuration update tool. Static hosting
on a confirmed free plan and Railway shutdown still need to be completed before
claiming the switch to free-only hosting is finished.

Verification on main: [Supabase relay validation run 39543776188](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39543776188)
passed all 14 tests (11 existing HTTP adapter checks and 3 PostgreSQL integration
cases). Both simulated Auth identities produced matching game hashes through
20 frames including a paid guest training order. The separate local HTTP/live
session/server suite passed all 43 checks. These are transport/database tests;
real-project Auth, browser, capacity and live migration gates above remain open.
