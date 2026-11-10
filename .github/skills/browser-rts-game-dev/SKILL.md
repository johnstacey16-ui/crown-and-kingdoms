---
name: browser-rts-game-dev
description: Reusable skill for building original browser RTS games, based on the Crown & Kingdoms build history. Use for gameplay, deterministic simulation, civilizations, technology trees, AI, economy, campaigns, original sprites and animation, Xbox controllers and frame rates, multiplayer validation, save games, testing, and deliberate deployment.
compatibility: Examples use JavaScript, Canvas2D, Node.js, GitHub and Vercel. Adapt to new engines and platforms.
---

# Build a browser RTS — a reusable game-development skill

This living skill captures **how Crown & Kingdoms got to its current stage**, what worked, what failed, and how to build a similar original strategy game. It is a **method**, not another to-do list or a declaration that the game is complete.

## Pick the right chapter

| Goal | Read |
| --- | --- |
| How we arrived here, dated milestones and lessons | [Build history](references/history.md) |
| Engine ownership, real features, civilizations/AI/network | [Gameplay architecture](references/gameplay.md) |
| Original sprites, animation sheets, atlases, caching and graphics FPS | [Graphics workflow](references/graphics.md) |
| Tests, debugging, Xbox/multiplayer acceptance, Vercel | [Verification and releases](references/verification.md) |
| A project plan to build another RTS from scratch | [From-zero blueprint](references/blueprint.md) |
| Capture new techniques from each milestone | [Living journal](references/journal.md) |
| Copy a full-feature review checklist | [Feature template](assets/feature-checklist.md) |

## Development method, every meaningful feature

1. Read current `main`, [AGENTS](../../../AGENTS.md), [ROADMAP](../../../ROADMAP.md) and [full-game checklist](../../../docs/FULL_GAME_COMPLETION_CHECKLIST.md). These sources own actual priorities and safety; this skill explains the process.
2. Define one player-visible *vertical slice*: input → legality and cost → deterministic world change → AI/enemy response → HUD feedback → save/network → original art and animation → tests.
3. Find the canonical owner and reuse shared rule calculations. Human controls, AI, network host and simulation must agree about unit production, research and costs; a client button is not authority.
4. Develop **gameplay and sprites together**. Check distinct base/Elite appearances, idle/walk/attack/work/death/facing states, team tint, original art source, atlas, offline cache and target-device readability. Mark graphics **PARTIAL** if unfinished.
5. Prove happy and failure cases: wrong age/civ/team, not enough resources, duplicate/invalid orders, hostile input, actual combat values, save/load and isolated consumers. Run risk-scoped quick/focused, browser, AI, campaign, multiplayer and physical Xbox checks.
6. Commit small, non-force updates against expected branch head. Routine commits have **no `[deploy]`**; no paid upgrades. Report tested SHA and what remains unverified.
7. Add a concise dated entry to [the journal](references/journal.md) after each substantial batch; revise the relevant chapter only when the method evolves.

## Principles worth transferring to another game

- Build one complete gather → construct → produce → fight → win loop before hundreds of content entries.
- Fixed-step time, seeded RNG and bounded state allow real regression testing.
- Authoritative simulation and command validation must not trust remote clients or UI values.
- Renderer pose caches must never change the simulation, save, or network truth.
- Use original/licensed imagery and audio; a borrowed genre mechanic does not authorize copying another game's sprites.
- A missing image, corrupt offline cache or canceled deploy must not destroy working gameplay.
- **Gameplay, graphics, network, hardware and production** have separate acceptance states.
- Physical Xbox performance and controller acceptance require physical Xbox evidence, not desktop or Node estimates.

## Evidence checkpoint (10 November 2026)

Crown & Kingdoms currently has a classic HTML/Canvas2D JavaScript runtime, 26 **partial** civilizations, original painted artwork, AI, campaigns and authenticated two-person multiplayer **preview**. Goth/Briton/Mongol Elite gameplay upgrades work, but **dedicated verified Elite sprites are outstanding**. [`629dd437` quick/focused CI](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/42883636464) passed 5/5 source gates and 1,339/1,339 focused assertions; the complete suite, newest campaign matrix and physical Series S acceptance remain separate requirements. No assumption that production matches `main`.

When creating a different game, reuse the workflow, not these faction IDs, counts, art or deployment settings.
