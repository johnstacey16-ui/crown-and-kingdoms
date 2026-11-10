# Build another original browser RTS from scratch

Transfer the engineering **method**, not this game's code, sprites, factions, commercial inspiration or acceptance counts.

## 0 — Define the small first game

Write a one-page target: player fantasy, match length, camera/art style, target browser/gamepad/console, budget, offline/network requirements and a complete gather → build → train → battle → victory loop. Limit the vertical slice to two teams, worker, two resources, base, barracks, two combat units, one map, one win condition.

## 1 — Boot and play one whole deterministic match

Suggested architecture (names are examples):

```text
index.html
src/
  boot.js          # fixed timestep and menu states
  config.js        # unit/building/technology data
  state.js         # teams, seeded RNG, world
  commands.js      # authoritative legality and costs
  simulation.js    # economy, production, path, combat, victory
  ai.js            # first lawful enemy
  input.js         # gamepad/keyboard → same commands
  render.js        # camera, HUD, original sprite/fallback
  save.js          # versioned current-build save
assets/atlas-manifest.json
tests/seeded-match.test.mjs
tests/illegal-order.test.mjs
```

Implement boot → select → move → gather → build → train → fight → win → reload. Prove one headless seeded match and one genuine browser input case. Do not implement 100 civilizations before a match finishes.

## 2 — Make rules data-driven

Create a single valid data schema: stable IDs, costs, prerequisites, ages, speed, classes, armor/counters, tech effects and time. One legal-option owner serves UI, AI, simulation and multiplayer host. Test enemy ownership, duplicates, no-money and non-finite values. Research effects apply to current *and future* units; saves restore without double buffs.

## 3 — Create original graphics while implementing units

Choose original art direction, base/Elite silhouettes, lighting, anchors, team mask, idle/walk/attack/work/death states and facings. Pack named atlas frames, keep fallback, validate image hashes/worker upgrade if offline is required, and profile Canvas2D performance before many sheets. Record uncreated poses and device acceptance as partial.

## 4 — Expand gameplay in complete increments

Implement ages/techs, 2–4 factions, economy/trade, siege, water/naval connectivity, AI tactics, original missions and objective/victory logic. Each increment includes legal actions, simulation, UI, AI, current-build save, graphics, tests, and network validation if needed. A boat with no reachable water path or a campaign without functioning success/defeat isn't done.

## 5 — Add tested multiplayer and deliberate publishing

Choose a casual host-authoritative architecture or a trusted server with an explicit threat model. Validate sender/team/ownership/sight/cost/sequence, duplicates/stale packets, snapshot/rejoin and real WAN behavior. Add actual hardware FPS/focus/accessibility tests; separate cheap per-push checks from milestone-wide skirmishes/campaign/browser. Release an accepted SHA with rollback rather than every commit.

| Milestone | Minimum evidence |
| --- | --- |
| First match | Real input, win, seeded headless and browser smoke |
| New unit or technology | Legal cost/age, math, AI, save, original base/upgrade visuals |
| New civ | Bonuses, restrictions, counters, unique tech and distinct art |
| Campaign/naval | Reachable goals, script win/lose and true scenario run |
| Multiplayer | Validated hostile input and actual WAN/rejoin tests |
| Console | Physical controller focus, FPS and readability |
| Release | Tested commit, live alias, smoke, rollback and quota |

To reuse, copy this skill folder, adapt tech names and source paths, retain [history](history.md) as a **case study**, and begin a fresh [journal](journal.md) for the new project.
