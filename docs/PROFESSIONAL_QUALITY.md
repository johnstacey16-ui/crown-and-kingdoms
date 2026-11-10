# Professional quality and player acceptance

This is a **release/feature acceptance checklist**, not a second roadmap. [ROADMAP.md](../ROADMAP.md) owns priorities, [graphics inventory](graphics-inventory.json) owns observed asset coverage and the [RTS skill](../.github/skills/browser-rts-game-dev/SKILL.md) explains implementation. The read-only source report `node scripts/professional-readiness.mjs` records **counts only**, not real Xbox/player acceptance.

## Definition of done for a content batch

| Dimension | Proof required to call it verified |
| --- | --- |
| Gameplay | Correct prices, age, faction rights, ability effects and resource conservation, including negative cases |
| AI | Uses legal commands and resources; bounded multi-seed success plus observed fair and varied tactics |
| Graphics | Original distinct base/Elite sprites as appropriate, animation states, usable silhouettes, atlas/cold-warm-offline integrity |
| Controller/accessibility | Clear Xbox actions and recovery, readable UI, scalable text/contrast, remapping and hold/toggle preference where supported |
| Save/network | Current-build save/load preserves effects; peer commands validate team, ownership, visibility, sequence and bounds |
| Device performance | **Physical** Series S Edge FPS/RAF/SIM/DRAW observations on matched workload and image quality |
| Player experience | Human playtest of at least one real match, feedback on misclicks, orders, challenge, tutorial and pacing |
| Production | Tested SHA, deliberate `[deploy]` release, READY alias, bounded live smoke and rollback |

Each feature can be GAMEPLAY VERIFIED / GRAPHICS PARTIAL / NETWORK UNVERIFIED / XBOX UNVERIFIED. **Never treat a green focused test as a completed feature.**

## Priority acceptance sessions (record date, SHA and actual tester)

1. **Xbox frame pacing:** run the built-in 50/100/200-unit scenes; on the same camera/picture preset run Full → Frozen full → Flat → Frozen flat → Full repeat, object-only, unit-only and 100%/75%/50%/100% pixel A/B. Record FPS, RAF GAP, SIM/DRAW, visible/total units, buildings, canvas pixels, cache hit/evict and long-battle drift. [Issue #57](https://github.com/johnstacey16-ui/crown-and-kingdoms/issues/57) is a historical measured baseline, not a proven fix.
2. **Elite sprite review:** verify researched Goth, Briton and Mongol tiers have distinct visuals **in actual painted unit rendering**. The current original vector equipment overlays are interim cues; dedicated painted Elite sprite sheets, facings, motion, physical performance and art verification still need completion.
3. **Skirmish game feel/balance:** run multiple maps, starting ages, civ matchups and difficulty settings; log game length, army composition, economy bottlenecks, AI scouting and defensive reactions, command latency, stuck troops and player enjoyment. Fixed-seed automated outcomes do **not** measure fun.
4. **Original campaign playtests:** select tutorial, siege, economy/escort, relic, coastal/naval and late-campaign missions; verify objective wording, pathing, actual win/lose and optional goals with human/controller sessions. Keep the older 19/19 scripted wins pinned to the 9 November SHA; the 8 November design review found 7 promising / 5 adequate / 7 needing rework, not a newer human quality result.
5. **Networking:** two real remote players from independent networks, match to victory, disconnect/reconnect, host loss, stale/duplicate packets, poor connectivity, NAT fallback without paid TURN, fog/ownership and affordable resource usage.
6. **Accessibility:** reduced-animation/effects preference, team identifiers not colour alone, high contrast and readable text at sofa distance, remap conflicts and controller neutral-until-release.
7. **Release/security:** review all untrusted network and save inputs, code/source origins, original art/audio ownership, HTTPS/caching, no private credentials in browser; monitor Vercel Fast Data Transfer, Deployment Storage and usage after guarded releases.

## Release blockers and professional engineering rules

- **Critical:** do not advertise physical Xbox acceptance or stable large battles until matched hardware evidence and black-screen recovery tests are recorded.
- **Critical for public multiplayer:** don't claim reliable WAN, reconnect/resume or anti-cheat until live and adversarial tests pass. Browser-host authority isn't trusted server anti-cheat.
- **Content:** the 26-civilization roster is still partial; new units need actual bonuses, counters, original visual identity, AI, save and eligible host behavior.
- **Maintainability:** refactor large `js/campaign.js`, `multiplayer.js` and other dense modules **incrementally when touched**, preserving classic-script order and behavioural tests; do not bulk rewrite.
- **Project hygiene:** maintain [contributing guidance](../CONTRIBUTING.md) and [security disclosure](../SECURITY.md). Source/art reuse terms need an owner-approved `LICENSE`; don't infer permission from public GitHub visibility or copy a commercial game's assets.
- **Economics:** no paid resources, Railway reactivation or accidental Vercel deploy. Older 12.23 GB/10 GB Deployment Storage is a dated 9 November baseline; recheck the actual dashboard before claiming retention cleanup worked.

## Evidence record template

```text
Date / commit / build alias:
Tester / machine / browser / controller:
Scenario / seed / elapsed minutes:
FPS median / RAF gap / SIM / DRAW / canvas resolution:
Visible and total units/buildings / cache counters:
Pass/fail, reproducer, screenshot/video:
GAMEPLAY / GRAPHICS / NETWORK / HARDWARE status:
Next blocker, test or deployment decision:
```

All feature-specific lessons belong in [the living skill journal](../.github/skills/browser-rts-game-dev/references/journal.md), while outstanding tasks belong in the active roadmap and GitHub issues.
