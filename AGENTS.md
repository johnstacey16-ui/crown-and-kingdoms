# Repository workflow

## Active completion roadmap — 31 October 2026

**Read [ROADMAP.md](ROADMAP.md) first** for the complete 48 `AUD-###` task index and current development priorities. Then consult the [six-source consolidated audit](docs/audits/2026-10-31-consolidated-audit.md), [Xbox controller contract](XBOX_CONTROLLER_PARITY.md), [full Xbox DLC/product scope](XBOX_SERIES_X_FULL_PARITY_AND_MULTIPLAYER_PLAN.md), and [free-only hosting policy](FREE_HOSTING.md). The older `AOE2_PARITY_ROADMAP.md` is a historical journal; `MASTER_AUDIT_AND_DELIVERY_REGISTER.md` retains dated implementation checkpoints and existing `CK-###` identifiers. **Do not silently rename or erase CK tasks.**

Immediate sequence: AUD-001 verify hosted CI failure cause; AUD-002 correct First Hearth X/A instruction; AUD-003 ensure starting civilization HP modifiers apply; AUD-004 test gamepad focus press edges; AUD-005 physical Xbox baseline; AUD-006/007 accurate current status and pinned reference requirements. Continue controller/1v1 acceptance and scalable content after these. Preserve verified gameplay/art/saves/network code; refute suspected defects with actual tests. Local tests are not current hosted CI or physical Xbox sign-off.


The owner requires all work directly on `main` (21 October 2026).
Do not create feature branches or pull requests unless the owner explicitly asks.
Run relevant checks before committing, preserve unrelated work and never force-push `main`.

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
guards when adapting the transport. The Supabase relay schema is installed; the game UI is not yet switched to it.
Read FREE_HOSTING.md for the verified state and remaining Auth/browser gates.


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


