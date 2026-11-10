# How Crown & Kingdoms was built: retrospective and lessons

This timeline is reconstructed from **committed historical notes and dated evidence through 10 November 2026**. It is neither an exhaustive event history nor a statement that all game features are finished.

## Foundation — one working controller-first RTS

The game bootstraps from `index.html` and `engine.js`, with `js/state.js` world state, `js/config.js` definitions, deterministic simulation, gamepad input, AI, rendering, production and victory. The destination is Microsoft Edge on Xbox Series S, which made focus, input semantics and readability part of gameplay design.

**Reusable choice:** choose hardware and the full resource → construction → unit → combat → victory loop before multiplying factions.

## 21–22 October — original sprites and movement

[Painted art](../../../../docs/PAINTED_ART.md) records the 21 October original hand-painted isometric troop/building/terrain sheets, coherent lighting, material/shadow scale, silhouettes and recolourable team cloth. [Motion history](../../../../docs/PAINTED_MOTION.md) records initial infantry, knights and villagers with walk/attack/work cycles and later expansion.

**Lesson:** define style, feet anchors, body proportions and pose vocabulary early. A base pose or mirrored animation is not full independent facings, hit/death or Elite armour variants.

## 29 October — robust offline art updates

[Verified artwork reuse](../../../../docs/VERIFIED_ART_CACHE.md) describes art-byte hashing and `sw.js` worker cache updates. Changed/corrupt images are revalidated; a failed installation preserves the last working shell; code/JSON remains network-first.

**Lesson:** version asset *content*, not filenames alone, and test corrupt/warm/offline updates on a real service worker.

## Late October–early November — extracting an expanding game

[Module ownership inventory](../../../../docs/REFACTORING_INVENTORY.md) records `simulation-*.js`, `render-*.js`, `ai-*.js`, `ui-*.js` and `network-*.js` owners. `index.html` retains the real ordered classic-script graph, while `scripts/runtime-sources.mjs` derives test/headless source from it.

**Lesson:** split coherent responsibilities without breaking the script order, saves, controller mapping, procedural fallback or offline assets. Avoid separate copies of the same research rules.

## 31 October–5 November — fix reproducible problems

[Consolidated audit](../../../../docs/audits/2026-10-31-consolidated-audit.md) and [roadmap](../../../../ROADMAP.md) preserve the earlier defects. Merged PRs [#61–#64](https://github.com/johnstacey16-ui/crown-and-kingdoms/pulls?q=is%3Apr+is%3Amerged) addressed command/radial index crashes, rubble lifetime, async error reporting and AI save continuity. [2 November CI](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41459519687) checked the fixes at its revision.

[Terrain blend recovery](../../../../docs/verification/terrain-blend-recovery-2026-11-05.json) and [sprite warm-up evidence](../../../../docs/verification/sprite-warmup-2026-11-05.json) document browser/graphics diagnosis on 5 November. Black terrain, blank-screen and substantial frame-time reports on physical Series S remained separate hardware concerns.

**Lesson:** capture seed, game seconds, units/buildings, mode, canvas size, stack trace and matched performance scene; retest the actual device, not merely a fast synthetic simulation.

## Early–9 November — continuous checks without continuous deployment

`scripts/run-checks.mjs` owns quick/focused, full isolated regressions, three seeded production-AI games, 19 scripted campaigns, Chromium, soak and Xbox software contracts. [Per-push game-validation](../../../../.github/workflows/game-validation.yml) runs quick/focused; [game-regression](../../../../.github/workflows/game-regression.yml) keeps heavy tests weekly/manual to protect free minutes.

[9 November campaign evidence](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/42542326209) recorded 19/19 scripted wins **on its earlier SHA**; that does not imply current-head human/hardware acceptance. The free-only Vercel `[deploy]` ignored-build gate stopped routine commits from publishing automatically; see [release playbook](../../../../docs/VERCEL_RELEASES.md).

**Lesson:** keep expensive tests, run them deliberately, and distinguish latest GitHub code from the actual live deployment.

## 10 November — building civilization features from shared rules

[Content completion checklist](../../../../docs/FULL_GAME_COMPLETION_CHECKLIST.md) prioritizes the shared tech tree, 26 currently partial civilizations, further rulepacks, gameplay, AI, campaigns, graphics and Xbox.

[Goth Elite Huskarl](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/db26b474e3f950c8b613290f51e9b42ef4909f71) added a real Imperial technology with combat effects, legal options and save/load. [Briton Elite Longbowman and Mongol Elite Mangudai](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/515403cf77e82c508f10fb77dbb6b39549583e24) extended shared armor, range, counters, naming and AI rules. That change exposed isolated AI/combat fixtures without the global civilization module; [fix `629dd437`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/629dd437d9e6f056ffd2d1447506f975e84e8b1c) restored the contract. [Quick 5/5, focused 1,339/1,339 passed](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/42883636464).

**Lesson:** after multiple uses, generalize shared content instead of copying each unit branch. Verify isolated dependencies, enemy civ restrictions, AI and saves. The Elite **gameplay** exists, but **distinct Elite sprite sheets remain unverified**.

**Open, not completed:** full civ catalogue/DLC, visual direction/state coverage, broader multiplayer/reconnect, current-head full/campaign, and physical Xbox Series S acceptance.
