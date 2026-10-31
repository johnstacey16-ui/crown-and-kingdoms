# Crown & Kingdoms — active repository refactoring inventory

**Status: PARTIAL · baseline source commit `a2f50e4` · 31 October 2026**

This is a live cleanup register, **not an assertion that every item is ready for deletion**. The owner requested architecture/code tidiness before further features. Do not mix old save migration with this: prerelease saved games may be invalidated, but current-build save/load, malformed-input rejection, multiplayer security and replay tests must remain.

## Established dependency footprint

| Area | Evidence | Decision |
|---|---|---|
| Browser entrypoint | 33 ordered classic scripts in `index.html`; `sw.js` precaches those paths; `scripts/audit-runtime-graph.mjs` checks offline/asset references | **ACTIVE** — never delete or reorder without tests/cache updates |
| Art and resources | `assets/atlas-manifest.json` and original WebP source/painted atlases; stone, gold, berry, terrain and fallback rendering require coverage | **ACTIVE** — no art removal; source-generator dependencies also count |
| Headless/CI | 232 standalone `tests/*.test.mjs` files at checkpoint; test helper intentionally omits canvas `js/ui.js` and atlas `js/assets.js` | **ACTIVE** — source loader consolidated in `scripts/runtime-sources.mjs` |
| Historical docs | Older checkpoints moved from active ROADMAP into `docs/audits/2026-10-31-gameplay-checkpoints.md`; delivery register/git history retained | **ARCHIVED** — retain for audit, not the active prioritization |
| Old multiplayer adapters | `multiplayer.js` and `js/network-*.js` may still be transitively active, even when named legacy; authenticated WebRTC and signaling must remain secure | **UNCERTAIN** — do not delete without a complete reachability and transport audit |
| Save-version migrations | Older development saves need not migrate; `js/save.js` still validates/loading current saves | **MIGRATION DEFERRED**, not save-system deletion |

**Local offline verification:** `scripts/run-checks.mjs` provides one cross-platform command for the same five source checks and optional complete regression/AI/campaign suite, without Bash-only loops. This does not fix or replace the externally failing hosted runners.

## Refactor queue (before adding features)

| Priority | Workstream | Exit criteria |
|---|---|---|
| 1 — in progress | **Single source for browser script ownership:** `index.html` -> runtime script loader -> game validation, headless and browser foundation | 33/20/18 entries agree, all referenced files present, dependency ordering tests and full standalone Node validation |
| 2 — next | **Separate overly dense runtime modules:** `js/render.js` (~104 KB), `engine.js` (~61 KB), `js/simulation.js` (~59 KB), `multiplayer.js` (~56 KB), `js/network-unit-map.js` (~51 KB), `js/ai.js` (~48 KB) | Each extracted responsibility has one owner; production script ordering, offline cache and headless tests updated; no gameplay/output changes |
| 3 — next | **Deduplicate repeated economy/placement/controller helpers, global state mutations and content tables** | Explicit dependency/behavior proof; no new Xbox shortcuts or resource changes; repeated source checks replaced by focused behavior tests |
| 4 — pending | **Unused/legacy file proof:** mark modules/doc/asset inputs as truly unused only after search across browser, offline cache, generator, tests and network/security paths | Evidence for each deletion; preserve historical `CK-###` and 48 `AUD-###` IDs |
| 5 — pending | **Verification and release hygiene:** stabilize GitHub Actions and audit actual Xbox Edge behavior | Recent commit passes all 232+ standalone files, seeded AI/campaigns and Chromium; performance and network gates separately recorded |

The earlier `check-game.mjs` compiled some modules from a handwritten roster while the browser had **33** scripts; that could skip syntax failures in WebRTC/Supabase integrations. The new checker discovers and parses all actual browser entries instead. The test harness keeps only the deliberately headless subset, in production order. This is an observable maintainability improvement, not an accepted whole-game refactor.

## Constraints during cleanup

- Work directly on main with expected-head non-force commits, and check new SHA before the next change.
- Do **not** change art scale, terrain, gold/stone/berry sprites, controller defaults, simulation outcomes, multiplayer authority, free-only hosting or save/load within the current build.
- Source and test naming alone are **not** evidence of obsolete code. Delete only with dependency proof; keep historical journals/delivery records discoverable.
- The last fully passing hosted source/campaign/graphics baseline is `d181720`; later workflow jobs did not run steps. Independent syntax/dependency fixtures are useful but not equivalent to full CI, Xbox hardware or 1v1 network acceptance.
