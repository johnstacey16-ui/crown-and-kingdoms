# Crown & Kingdoms — Single Development Queue

**Target:** Controller-first browser RTS for Xbox Series S / Microsoft Edge.

This file is the one source of truth for unfinished work. Do not create a second backlog, repeat the same item under several headings, or restart an audit because a new conversation began. Work the queue from top to bottom, and move to the next item as soon as its focused regression test and required CI pass. Manual-only checks are recorded separately; they must not block unrelated code improvements.

## Current state

- **Active item:** Farm lifecycle correction.
- **Latest code change:** Farm config changed from 1 HP / instant build to 200 HP / 15-second build; a focused regression test was added. CI for that latest commit is not yet confirmed.
- **Completed support fixes:** service-worker core cache no longer requests the missing atlas manifest; campaign regression harness was corrected for the current 15-soldier objective. These are support fixes, not gameplay-feature completion.
- **Do not reopen:** a completed item unless new evidence identifies a regression.
- **Verification rule:** CI results apply only to the exact commit tested. Do not rerun the whole audit after every change. Run the normal suite after each small commit, fix failures, then continue.

## Ordered implementation queue

Each numbered item is one work package. Implement only the next package, keep the commit under 300 changed lines where practical, add/adjust focused regression coverage, wait for CI, then advance. Split a package if it cannot fit safely in a small commit.

1. **Farm lifecycle — IN PROGRESS**
   - Correct durability and construction duration; verify construction health remains finite and reaches full HP on completion.
   - Verify farm food depletion and auto-reseed still work with the new build duration.
   - Exit: focused farm test and complete automated CI pass.

2. **Technology effects**
   - Audit existing technology data and effect application before adding entries.
   - Fix the first concrete broken or missing technology effect, including newly created and already-existing units where relevant.
   - Then work through core gaps: Loom, Wheelbarrow, Hand Cart, Ballistics, Squires, Arson, monk upgrades and naval upgrades, adding only those confirmed absent.
   - Exit: each implemented effect has a focused test for prerequisites/research and actual gameplay-state change; no claimed completion based on a name in the tech table alone.

3. **Combat correctness**
   - Address verified defects in damage/armour application, elevation, friendly fire, trebuchet pack/unpack and minimum range, and Town Center garrison-scaled arrows.
   - Exit: each changed rule has a regression test and passes CI.

4. **Progression and civilisation rules**
   - Check age-up/building requirements, population and production queues, upgrade stacking, unique technologies and civilisation bonuses.
   - Specifically verify the Spanish Supremacy/Inquisition behaviour against the intended design before changing it.
   - Exit: fix demonstrated mismatches and cover them with focused tests.

5. **AI strategy**
   - Improve one measurable decision at a time: worker allocation, counter-unit composition, technology timing, scouting, siege, target choice, retreat and repair.
   - Avoid test harnesses that grant hidden resources or damage bonuses while claiming normal AI success.
   - Exit: focused deterministic tests pass; broader campaign outcomes remain marked unverified until played through.

6. **Naval and map reliability**
   - Fix concrete pathing, shore access, transport, trade/fishing, repair, island logistics or map connectivity failures.
   - Exit: regression cases cover the fixed edge cases; don't claim full naval parity from isolated unit tests.

7. **Graphics and controller readability**
   - Improve distinguishable units/buildings, terrain/water layering, team/selection states and fallback rendering in small targeted passes.
   - Preserve controller-only navigation and browser script load order.
   - Exit: source/asset checks pass; real browser/Xbox visual quality remains a separate manual verification item.

8. **Performance and multiplayer**
   - Profile and optimise measured simulation/rendering bottlenecks at 100/200/400 units.
   - Clearly separate lobby/presence from authoritative multiplayer simulation; improve networking only with a testable, bounded change.
   - Exit: report actual CI/profile evidence; never infer Xbox frame time or complete multiplayer from Node tests.

## Manual verification register

These items require direct gameplay or hardware evidence and are not a reason to stop making code-level progress:

- [ ] Play all 19 campaign missions through real victory/defeat; verify objectives, timed events, save/load and progression.
- [ ] Play full matches against multiple AI kingdoms without test-only bonuses.
- [ ] Test land/naval pathfinding and map connectivity in the browser.
- [ ] Test multiplayer host/guest disconnect and reconnect behaviour in live sessions.
- [ ] Measure rendering, simulation and input responsiveness on a physical Xbox Series S / Edge.
- [ ] Update this register with the exact commit and results when those checks are actually performed.

## Automated checks

Run after each small commit:

```sh
node scripts/check-game.mjs
for test in tests/*.test.mjs; do node "$test" || exit 1; done
node tests/validate-atlas.mjs
```

A CI failure is a blocker to the next commit, not a reason to restart the project audit. A CI pass is permission to move forward, not proof that the whole game is complete.

## Definition of done

The game is complete only when the implementation queue is resolved and the relevant manual verification register is supported by real evidence. Until then, report the current queue item and the next action in one concise update. Do not repeat the entire backlog in status reports.
