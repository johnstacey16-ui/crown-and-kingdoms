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
disabled on 21 October 2026. The Supabase plugin was found but is not yet connected.
No Supabase schema/auth changes, new users or paid resources have been created.

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
