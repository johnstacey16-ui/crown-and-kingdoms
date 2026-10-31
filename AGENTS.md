# Repository workflow

## Active completion roadmap — 31 October 2026

**Read [ROADMAP.md](ROADMAP.md) first** for the complete 48 `AUD-###` task index and current development priorities. Then consult the [six-source consolidated audit](docs/audits/2026-10-31-consolidated-audit.md), [Xbox controller contract](XBOX_CONTROLLER_PARITY.md), [full Xbox DLC/product scope](XBOX_SERIES_X_FULL_PARITY_AND_MULTIPLAYER_PLAN.md), and [free-only hosting policy](FREE_HOSTING.md). The older `AOE2_PARITY_ROADMAP.md` is a historical journal; `MASTER_AUDIT_AND_DELIVERY_REGISTER.md` retains dated implementation checkpoints and existing `CK-###` identifiers. **Do not silently rename or erase CK tasks.**

Current continuation: read the newest R3 controller checkpoint in ROADMAP.md and hosted workflow statuses. The R3 economy advanced to `083864a` with seven reference-derived preset ratios, an explicit eighth Auto Farms toggle and opt-in solo/campaign Farm construction (231 standalone test files); previous scalable worker-ratio and view checks remain. Multiplayer R3, default settings, hardware acceptance, and a complete recent hosted regression pass are STILL missing. On both 2ca5e90 and d8b0401, hosted workflows stopped before any steps; last fully green code SHA is d181720. Do not claim the new wheel passed hosted or hardware tests. The last fully green gameplay SHA is d181720, with all 226 regressions and browser tests passing. UI commit 2ca5e90 adds an eligibility-accurate technology tree and the 227th test, but hosted CI failed **before any steps** twice (including retries) for an unverified external reason. Do not claim it passed or modify tests to mask an unstarted workflow. AUD-002/003/004 fixes landed with passing hosted checks at 50d86f2. The 26-civilization JSON inventory and 50 centralized unit definitions landed at 48e77a3; d181720 added actual Camel Rider regional Stable eligibility and 226th regression test. The regional architecture remains AUD-019 PARTIAL, NOT full DLC or ruleset completion. Validate the exact d181720 regression/browser jobs before claiming acceptance. Prioritize AUD-005 real Series S Edge profiling, AUD-007 pinned reference inventory, default Xbox R3/View/X/LT gaps, and independent-network 1v1 acceptance. Preserve original assets, free-only hosting, current-format save validation and network/security guards, and exact controller behavior. Old pre-job CI failure cause remains unknown.


The owner requires all work directly on `main` (21 October 2026).
Do not create feature branches or pull requests unless the owner explicitly asks.
Run relevant checks before committing, preserve unrelated work and never force-push `main`.

## Pre-release save-game policy — 31 October 2026

The owner explicitly removed **backward compatibility with saves made by earlier development builds** as a requirement until the game is complete. Development saves/test saves are disposable; do **not** delay gameplay, data-schema, civilizations, DLC, simulation or multiplayer architecture improvements to keep historical save payloads readable. Versioned save migrations and long-term backward-compatibility guarantees belong to the stable/release phase, after gameplay/data models settle.

**Important distinction:** retain functional manual save/load and autosave **within the current build**, validate current-format payloads and refuse unsupported/invalid files safely with a clear message; never silently corrupt or spend resources due to a malformed save. Preserve reproducible testing and, where straightforward, explicit format version identification. Do not delete users' saved data proactively or remove save/security tests merely because historical migration is no longer a gate. Update/replace old-format compatibility assertions when they obstruct legitimate schema changes, while testing the current format and failure handling. This changes only the cross-build migration requirement, not multiplayer protocol integrity, authenticated replay guards, visual assets, Xbox controller behavior or the free-only hosting policy.

## Standing roadmap authorization — 28 October 2026

The owner asks to keep building the game through the roadmap and to treat routine
follow-up answers as “yes” and “continue”. Proceed autonomously with investigation,
implementation, relevant checks, roadmap evidence and commits directly to main.
Do not stop after a milestone merely to request permission for the next routine
roadmap task. Preserve the existing scope, controller contract, original assets,
simulation integrity and free-only hosting requirements. This does not authorize
spending, paid upgrades, destructive account/infrastructure actions or messaging
other people. Report actual results and remaining acceptance gaps accurately.

# Controller requirements

The user requires the entire default button system and its functions to mimic
Age of Empires II: Definitive Edition on Xbox Series X. This applies to solo,
campaign, multiplayer, menus, help text, modifiers and contextual actions.

- Read `XBOX_CONTROLLER_PARITY.md` before changing controller behaviour.
- Verify bindings and functions against the official Xbox guides linked there.
  Do not invent shortcuts or copy the PC or Age of Empires IV mappings.
- Unknown behaviour remains a documented gap until verified. An unavailable
  feature does not justify assigning its button to a different operation.
- Match tap/hold/release, modifiers, menu context and resulting action, not just
  the button label. Keep controller help consistent with implemented behaviour.
- Preserve authenticated ownership, pending-command and simulation guards.
- Passing Node tests does not establish physical Xbox control parity.

# Free-only hosting requirement

The owner explicitly requires free-only hosting. Read `FREE_HOSTING.md` before
hosting or multiplayer infrastructure work. Do not upgrade subscriptions, buy
credits, enable paid overages/add-ons, provision trial-dependent replacements or
restart/redeploy Railway without explicit owner approval. Verify the existing
Supabase project's Free plan before rollout. Reaching a free quota must restrict
service rather than enable billing. Preserve authenticated ownership and replay
guards when adapting the transport. The Supabase relay schema is installed, but the authenticated two-player
battlefield currently uses Supabase admission/signalling and direct WebRTC.
The SQL relay is not confirmed as the active gameplay fallback; reconnect and
independent-network match acceptance remain open. Read FREE_HOSTING.md for
the previously verified Free plan and remaining live transport/Auth gates.


# Product delivery target

The owner reaffirmed on 21 October 2026 that the target is full functional
Age of Empires II: Definitive Edition Xbox Series X parity, including all
Xbox-available gameplay DLC, with matching default controller behavior.
Optimize for Xbox Edge with an Xbox controller. Supabase-backed multiplayer,
the complete game feature set and coherent graphics/audio are core requirements.
Do not reduce this to a lobby demo, a base-only civilization subset or PC controls.

Use MASTER_AUDIT_AND_DELIVERY_REGISTER.md and
XBOX_SERIES_X_FULL_PARITY_AND_MULTIPLAYER_PLAN.md to select and record increments.
Keep missing/partial/verified distinctions; do not infer completeness from tests
or content names. Physical Xbox controls/performance and independent-network
multiplayer require their own acceptance evidence. Preserve original assets and
the existing free-only hosting rules.


