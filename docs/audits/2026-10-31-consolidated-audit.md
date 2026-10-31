# Crown & Kingdoms — consolidated independent audit and completion roadmap

**Prepared:** 31 October 2026  
**Source baseline:** [`main` at `337974492df1ddfd5f9adb339b79855f005bd532`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/337974492df1ddfd5f9adb339b79855f005bd532)  
**Repository:** https://github.com/johnstacey16-ui/crown-and-kingdoms  
**Browser build:** https://crown-and-kingdoms.vercel.app/  
**Change status:** AUDIT ONLY. No changes, commits, deployments, subscriptions or infrastructure operations have been made as part of this report.

## 1. Product contract

The **non-negotiable final goal** is an original browser RTS with functional scope matching **Age of Empires II: Definitive Edition on Xbox Series X**, including all Xbox-available gameplay DLC through the chosen reference date. It must be fully operable with the *reference game's default Xbox controller layout* on **Xbox Series S using Microsoft Edge**, including solo, scenarios, multiplayer, menus, settings, camera, economy, selection and contextual commands. Hosting is **free-only**: no paid upgrades or overages. Art, music, story and source code must be original, not copied from the commercial game. This is a functional-category parity goal, not a licence to reproduce copyrighted story campaigns, graphics or audio.

There is no permission in this audit to reduce the eventual product scope to a 26-civilisation demo, nor to bypass Xbox controller or hardware acceptance. Staged delivery is an implementation strategy, not a smaller end goal.

## 2. Input evidence, limits and credibility

Sources supplied by the owner: full audits from **Claude**, **DeepSeek**, **Gemini**, **Kimi**, **Grok**, plus **Perplexity's 2026 DLC baseline extract** (not a complete code audit). All describe the late-October `main` snapshot. Claude reports personally executing 219 standalone test files and an atlas validator; DeepSeek, Kimi and Grok largely used static inspection; Gemini did not substantiate a real Xbox runtime trial. The Perplexity extract focuses on official content requirements. This synthesis separately inspected selected files through the connected GitHub repository, and independently checked official Xbox controls and several DLC facts.

**No physical Series S / Edge test was performed here.** A prior reported ~4 FPS recording at 78 units and 94 buildings (25 October) predates later rendering changes; it is neither proof of current FPS nor something to dismiss. Current hosted GitHub Actions runs were *reported* to fail before jobs entered test steps; their root cause was not established by accessible logs. Deployed production JavaScript was not fully rehashed in this synthesis. No new regression suite was run in this synthesis. These distinctions must survive future status reports.

### Confidence in the six audit sources

| Source | Most useful | Material cautions |
|---|---|---|
| Claude | Executed 219 local tests; independent maturity, architecture and planning review | Sampled large files; some controller/animation claims stale or mistaken; bot defeats are not proof of impossible missions |
| DeepSeek | Determinism, simulation and stress-test hypotheses | Quoted `v.x=minY` defect was not present in the audited source; mistakenly denied control groups, command validation and audio; proposed unproven fixed-point rewrite |
| Gemini | TV readability, accessibility, on-console UX checklist | Several incorrect button bindings, invented percentages and unmeasured claims about Xbox crashes and lag; no reliable physical Xbox acceptance |
| Perplexity | 2026 DLC baseline, reworked civilizations, regional units and scenario families | Supplied material was only a DLC extract; August 2026 retail *listing* dates were mistakenly presented as original release dates for 2025 content |
| Kimi | Module/dependency map, keep-engine approach, content/ruleset refactor | Mistaken scenario counts for Victors and Vanquished / Alexander; some art/audio/roadmap assertions stale |
| Grok | Detailed source-level civilizations, AI, save, multiplayer threat model, bindings and reproducible defect candidates | Did not run the 219 regressions or physical Xbox; some design deviations require reference verification before being called bugs |

**Rule:** code evidence, an exact runnable test and an actual Xbox session outrank an AI's confidence or its completion percentage. Avoid arbitrary figures such as 42/100 or 5–8% until an explicit weighted requirements inventory exists.

## 3. Verified foundation worth preserving

- A working browser RTS: four age states; villagers, gathering, construction, production, core military, conversion, relics, economy, AI, fog, diplomacy, victory variants, saves and generated maps.
- **26 currently listed civilizations**, with partial unique-unit/tech support; they are not equivalent to all Xbox DE base + expansion civilizations.
- **19 original campaign missions**. A dated automated scenario suite produced **7 wins, 7 defeats, 5 timeouts**, while satisfying its existing assertions. A scripted bot is not equivalent to a human console playthrough.
- Claude independently reports **219/219 local standalone regression files passing** at the audited SHA. CI, live browser, human multiplayer and Xbox hardware success are *separate* gates.
- **47/47 current roster movement/activity art coverage**. This is not 47 full eight-direction sets, dedicated death/work animations, or DLC roster coverage.
- Painted environmental resources including **stone, gold, berry bushes**, along with trees, wildlife, fish, relics; age presentation across 22 current building kinds (house and Town Centre get dedicated age designs; most others have shared fittings); construction reveals/scaffolding; animated damage fire/smoke; multiple projectile effect families.
- A bounded native tint cache and validated art packaging/service-worker integrity. Nominal retained pixel limits do not equal measured resident/GPU memory or Xbox performance.
- **Existing procedural audio engine** with adaptive synthesis, sound effects, audio buses and spatial panning. It is *not absent*, although audio design completeness and quality are unverified.
- Solo and multiplayer **eight-slot LB control-group wheels** exist. Contextual RT radials and selection controls exist. Exact Xbox controls remain partial.
- Authenticated **two-human host/guest WebRTC preview**, command sequencing, host-side execution guards, ownership checks, frame receipts and a fog-filtered **UI** projection; it is not yet full, reconnecting, cheat-resistant multiplayer.

## 4. Confirmed code findings vs investigations

| ID | Finding | Status | Why it matters | Action |
|---|---|---|---|---|
| F-001 | `js/campaign.js` mission **First Hearth** tells players to press **X** to chop; contextual gathering is **A** | **Confirmed code defect** | First controller tutorial misleads the player | Correct message and add controller-guidance regression |
| F-002 | Starting `addU`/`addB` occur before `CIV[...].fx`; HP bonuses in `hpbF`/`bz` are read at entity creation | **Confirmed ordering flaw** | Initial HP bonuses may fail to affect starting villagers / Town Centres | Apply bonuses before starting spawns, or safely retrofit; test each relevant civilization |
| F-003 | R3 seven-preset villager priority radial, contextual X, View notification snap and LT find/waypoints not implemented to documented Xbox reference | **Confirmed feature gaps** | Controller parity, economic automation, discoverability | Capture official layout then implement per context |
| F-004 | Multiplayer `js/network-session.js` explicitly requires **two** members and has no complete resume/rejoin | **Confirmed scope gap** | Cannot meet larger multiplayer target | First prove real 1v1, then support reconnect and N seats |
| F-005 | Both multiplayer browsers hold the complete `S` simulation; projection hides only the interface | **Confirmed security limitation** | A modified guest can reveal fogged enemy state; host-authoritative input validation does not fix map hacks | Document trust model; if competitive secrecy is required, evaluate host-only hidden state / trusted authority |
| F-006 | Hosted Actions reportedly fail **before job steps** | **Documented operational failure; cause unverified** | No dependable hosted gate on newest revisions | Investigate Actions account/workflow annotations; distinguish platform/account issues from code failures |
| F-007 | Supabase relay SQL has a 2-hour absolute authenticated *relay session* lifetime | **Confirmed schema rule** | Long sessions or reconnection/signalling may be affected | Verify ongoing WebRTC effect; do **not** assert every live peer channel dies exactly at 2 hours |
| F-008 | On `focus`, `js/input.js` clears `prev=[]` but retains `pad`, allowing held buttons to reappear as fresh edges on next poll | **Supported code risk; runtime regression required** | Accidental A/RT actions on tab refocus, potentially paid placements | Write held-button refocus test and suppress edges until release |
| F-009 | Web Audio `sfx()` resumes a suspended AudioContext then returns rather than replaying that exact cue | **Confirmed code behaviour; UX impact unmeasured** | First warning after a resume may be dropped | Test resume/unlock and alert prioritization before modifying |
| F-010 | Civ data has one UT per civ, limited tech masks; unique mechanics often flat stat stand-ins | **Confirmed partial parity** | Civ-specific tactical identities are not faithful | Move to reference-backed, schema-validated bonuses/abilities, two UTs where applicable |
| F-011 | Existing unit-tech upgrades often change stats on the same base unit kind | **Confirmed representation simplification** | Distinct upgrade lines/appearance/eligibility may be absent | Reference-diff unit line and appearance; implement proper state where needed |
| F-012 | Missing ship classes and regional units, limited map scale and scenario trigger depth | **Supported partial parity** | Game is missing whole strategic systems | Prioritize a full base mechanic catalogue and cross-DLC regional eligibility |
| F-013 | Command sender/receiver rejects duplicates/gaps and validates ownership/frame constraints | **Confirmed implemented safeguards** | DeepSeek's blanket “no validation” claim is false | Keep existing safeguards; fuzz and stress test instead of replacing blindly |
| F-014 | Fog-filtered projection does not provide private adversarial state | **Confirmed limitation** | Important if eventual multiplayer supports ranked or untrusted players | Define desired anti-cheat tier and affordability of trusted execution on free hosting |
| F-015 | Campaign test allows timeout/defeat outcomes under named assertions | **Confirmed test semantics** | Green test does not establish mission completion | Record expected-result vs human-winnable separately; add intentional winning-path acceptance tests |
| F-016 | Graphics atlas count and README's older 156-test milestone describe earlier commits | **Confirmed documentary staleness** | New contributors may confuse historic checks with current state | Keep historical notes clearly labeled; publish a current evidence summary |
| D-001 | DeepSeek's `v.x=minY` assignment bug | **Rejected — not in audited source** | A fabricated fix could introduce a real bug | Do not create a task from this allegation |
| D-002 | Gemini's reported Xbox crashes, severe memory leak, RT failure and input latency | **Not evidenced** | No real physical device measurement | Treat as *test hypotheses*, not confirmed defects |
| D-003 | Automatic refund of all training queues on destroyed buildings | **Reference behavior unverified** | A “fix” might violate AoE II rules | First establish Xbox reference semantics, then specify game behaviour |
| D-004 | Fixed-point rewrite is required for determinism | **Not established** | Unnecessary wholesale rewrite may damage working game | Run cross-engine paired simulations and error diagnostics before deciding |

### Source anchors for independently checked findings

- [Campaign: inaccurate X chopping instruction](https://github.com/johnstacey16-ui/crown-and-kingdoms/blob/337974492df1ddfd5f9adb339b79855f005bd532/js/campaign.js#L69-L72)
- [Starting spawns before civilization effects](https://github.com/johnstacey16-ui/crown-and-kingdoms/blob/337974492df1ddfd5f9adb339b79855f005bd532/js/mapgen.js#L96-L98); [entity constructors](https://github.com/johnstacey16-ui/crown-and-kingdoms/blob/337974492df1ddfd5f9adb339b79855f005bd532/js/entities.js#L11-L12); [bonus helper](https://github.com/johnstacey16-ui/crown-and-kingdoms/blob/337974492df1ddfd5f9adb339b79855f005bd532/engine.js#L108-L116)
- [Xbox controller parity contract](https://github.com/johnstacey16-ui/crown-and-kingdoms/blob/337974492df1ddfd5f9adb339b79855f005bd532/XBOX_CONTROLLER_PARITY.md); [official Xbox controller cards](https://support.ageofempires.com/hc/en-us/articles/37041870568468-Age-of-Empires-II-Definitive-Edition-Default-Controller-Layouts)
- [Network session seat restriction](https://github.com/johnstacey16-ui/crown-and-kingdoms/blob/337974492df1ddfd5f9adb339b79855f005bd532/js/network-session.js#L9-L27), [full-world multiplayer simulation](https://github.com/johnstacey16-ui/crown-and-kingdoms/blob/337974492df1ddfd5f9adb339b79855f005bd532/js/network-lobby.js#L57-L67), [UI projection](https://github.com/johnstacey16-ui/crown-and-kingdoms/blob/337974492df1ddfd5f9adb339b79855f005bd532/js/network-unit-map.js#L4-L52)
- [Input focus edge handling](https://github.com/johnstacey16-ui/crown-and-kingdoms/blob/337974492df1ddfd5f9adb339b79855f005bd532/js/input.js#L8-L10); [AudioContext handling](https://github.com/johnstacey16-ui/crown-and-kingdoms/blob/337974492df1ddfd5f9adb339b79855f005bd532/js/audio.js#L47)

## 5. Base-game parity inventory (current status, not a completion score)

| Requirement | Present state | Key remaining acceptance |
|---|---|---|
| Four ages and advancement | PARTIAL | Exact prerequisites, build gates, research times, age-dependent tech trees and visuals |
| Civilizations | PARTIAL: 26 now | **Nine missing pre-DLC DE base civilizations** (Berbers, Portuguese, Burmese, Malay, Vietnamese, Bulgarians, Cumans, Lithuanians, Tatars); full bonuses/UTs/teams |
| Core economy and farms | PARTIAL | Reference resource timings, reseeding/auto-farm, herdables, trade fees and balance |
| Buildings & multiple TCs | PARTIAL | Additional TCs, unique buildings, upgrade lines, reference placement and prerequisites |
| Military and armor classes | PARTIAL | Full line upgrades, counter classes, civ restrictions, projectile/charge/volley/trample/regen behaviours |
| Siege | PARTIAL | Onager/capped/siege ram, petard, siege tower, ram garrison, pack/unpack and special siege abilities |
| Naval | PARTIAL | Fire/demo/cannon/galleon lines, regional ships, ship upgrades, amphibious and dock rules |
| Monks and relics | PARTIAL | Civilization-specific availability, timing, technology modifiers and multiplayer acceptance |
| Fortifications & gates | PARTIAL | Open/close, allied passage, palisade gates, pathfinding and defensive AI where reference-supported |
| Diplomacy/tribute | PARTIAL | Team options, victory exploits, multiplayer diplomacy, trade fees and controller menus |
| Map generation | PARTIAL | Xbox reference scripts, huge maps, water and cliffs/elevation where reference-enabled |
| AI | PARTIAL | Consistent complete matches, naval invasions, anti-stall, strategic plans, difficulty benchmarks |
| Campaigns | PARTIAL: 19 original scenarios | Human/controller wins, scenario framework, advanced triggers, branching, multi-faction diplomacy |
| Tutorials | MISSING full console-first programme | Accurate introduction, economy, combat, naval, monk, technology, multiplayer controls |
| Save/load | IMPLEMENTED, still acceptance-limited | Long save/load soak, mid-battle and browser storage/quota, corrupted-save recovery |
| Replays/spectating/editor | MISSING or unverified | Verify each Xbox feature and build supported equivalents, not PC-only assumptions |
| Multiplayer | PARTIAL 1v1 preview | Independent-network normal match, reconnect, robust error/forfeit, later more players |
| UI, HUD, accessibility | PARTIAL | TV distance, palettes, safe area, wheel sectors, settings persistence, controller text entry |
| Original sound/music | PARTIAL synth engine | Detailed audio-event matrix, mixing and suspended resume, complete original score/stems |
| Original graphics | PARTIAL | Directions, work/death, faction architecture, icons, destroyed states, production performance |
| Free-only delivery | PARTIAL | Quota accounting, Railway shutdown clarification, live network capacity, service-worker gates |

**Important:** Civilizations and campaign content in the commercial game must be translated into *original equivalent content/mechanics*, not copied names, stories or media if protected; the reference matrix can name what is being compared.

## 6. Full Xbox controller audit targets

Reference authority: official **General Gameplay** and **LT Held** diagrams, updated 8 May 2026: https://support.ageofempires.com/hc/en-us/articles/37041870568468-Age-of-Empires-II-Definitive-Edition-Default-Controller-Layouts

| Input or context | Current game | Open reference/hardware gap |
|---|---|---|
| LS | Camera pan exists | Sensitivity, response, reticle, center-cursor semantics |
| RS | General zoom 0.8–3× exists | LT-held waypoint navigation; polarity and reference feel |
| L3 | Solo focus has logic | Multiplayer behaviour; reference snap-to-selection/notifications distinction |
| R3 | Villager-priority wheel absent | Seven presets, resource weights/manual ratios, auto-farm, gestures |
| A tap/hold/double | Selection, contextual orders and boxes exist | Timing/eligibility, group rally, cancelled gestures |
| B | Cancel and back mostly implemented | All wheel, targeting, multiplayer and focus contexts |
| X | Contextual Xbox X action missing | Attack Move/special by proper context; do **not** alter LB X assign |
| Y | Solo shortcut and military Line/Split exists | Multiplayer build/train Y, reference timing and geometry |
| LT | Add selection, repeat building, train-five in contexts | Find/categories, waypoint semantics, individual-building additions |
| RT | Contextual wheel exists in solo/preview | Actual radial sectors, pages, release behaviour, full action availability |
| LB | Eight control-group slots exist | Xbox wheel layout, exact focus/recall and multiplayer persistence |
| RB | Expanded minimap exists | Multiplayer D-pad flare/detail/mode and clear-waypoints gestures |
| D-pad | Four quick categories implemented | Group-versus-individual, camera/framing and livestock rules |
| View/Menu | Menu pause difference implemented | View notification snap; complete local multiplayer menu pages |
| Remap/gamepad focus | Partial handling exists | Focus press-edge regression, controller swap, reserved console buttons |

All rows require **recorded real Xbox Series S Edge verification**. A passing VM or Chromium test is evidence of implementation, not physical parity.

## 7. Full DLC baseline (11 separately tracked packs)

| Xbox DLC family | Reference mechanical requirements | Current Crown & Kingdoms | Required implementation family |
|---|---|---|---|
| Lords of the West | Burgundians, Sicilians, unique units/techs, Donjon, Flemish-type mechanic categories | MISSING | Shared civ schema + unique-building/transform mechanics + original campaigns |
| Dawn of the Dukes | Poles, Bohemians, Folwark, Obuch/Hussite Wagon-type mechanics | MISSING | Spatial economy/building bonuses, unit special effects |
| Dynasties of India | Bengalis, Dravidians, Gurjaras; restructured Hindustanis; elephant/regional unit lines | MISSING | Civ replacement/split and eligibility/unique regional mechanics |
| Return of Rome | Separate self-contained antiquity ruleset | MISSING | Independent era tech, buildings, units, economic and victory variants |
| The Mountain Royals | Armenians, Georgians, additional regional/cleric/building special systems | MISSING | Civ/region abilities and originals |
| Victors and Vanquished | **19 scenarios**, unique event/choice/hero mechanics | MISSING | Full scenario engine and original 19-feature-equivalent scenario set |
| Chronicles: Battle for Greece | Separate antiquity Chronicles experience | MISSING | Chronicles rules, campaign systems and original graphics/audio |
| The Three Kingdoms | Five new East Asian civilization families incl. Shu, Wei, Wu, Jurchens, Khitans; hero/scenario systems | MISSING | Data-driven civs, unique actions, branching campaign archetypes |
| Chronicles: Alexander the Great | **3 civilizations**, **18-scenario** Grand Campaign, distinct Chronicle progression | MISSING | Second Chronicles content pack, army persistence/progression |
| The Last Chieftains | **Mapuche, Muisca, Tupi**; **Inca rework**; South American architecture; 15 scenarios | MISSING | Replacement bonuses, unique units, regional architecture, original missions |
| The Viking Sagas | **Danes, Saxons, Varangians**; **Vikings rework**; regional Varangian Guard/Mounted Crossbowman/Longship access; **15 scenarios** | MISSING | Regional-unit eligibility, shared civ/rework modifiers, architecture, original missions |

An external reference version/entitlement matrix must separate *available on Xbox*, *included in the base entitlement* and *requires a paid add-on*. Never assume buying the base game automatically grants every DLC. Confirm individual unit/technology statistics against patch-specific official data.

**Official anchors:**
- The Last Chieftains (17 February 2026): https://www.ageofempires.com/news/new-dlc-available-now-the-last-chieftains
- The Viking Sagas (22 September 2026): https://www.ageofempires.com/news/the-viking-sagas-available-now-for-age-of-empires-ii-definitive-edition/
- Viking architecture/availability/rework: https://www.ageofempires.com/news/faq-the-viking-sagas/
- Victors and Vanquished **19** scenarios: https://www.ageofempires.com/games/aoeiide/victors-and-vanquished/
- Alexander **18** scenarios and **3** civilizations: https://www.ageofempires.com/news/what-to-expect-from-chronicles-alexander-the-great/

## 8. Multiplayer, anti-cheat and free hosting design decisions

1. **Current honest-client 1v1:** preserve the authenticated host/guest, guarded commands, deduplication and frame ACKs; stop calling it a full human multiplayer product until a natural win on two genuinely independent networks is recorded.
2. **Fog threat model:** current guest has the complete authoritative simulation, so the projected fog cannot prevent map hacks. Decide whether competitive secrecy is a must-have. If yes, move hidden state to a trusted authority and send client projections; research feasibility *within free-only hosting*, without asserting a free real-time authoritative service exists.
3. **N-player design:** do not bolt a third player onto two-seat schemas. Specify admission/roster, sequence order, simulation ownership, fog/team vision, winner resolution, reconnect, host loss and quotas before implementation. Prove stable 1v1 first.
4. **Transport:** live gameplay is WebRTC; Supabase Auth/signalling are not proof that the SQL REST relay can sustain 30 Hz gameplay. Treat the REST relay and WebRTC path as distinct. Some NATs need relay-capable connectivity; enforce the no-paid-service rule even if that means explicit matchmaking exclusions.
5. **Quotas and expiry:** verify actual provider plan limits and the project's stricter internal quotas; show errors before admission, never turn on paid overages. Test the SQL 2-hour Auth session limit against ongoing WebRTC sessions rather than guessing.
6. **Desync resilience:** state what should happen on lost frame, repeated failed sends, missing ACK, hash mismatch, browser suspension, session expiry, one-sided victory and host disconnect. If recovery cannot be made safe, explicitly fail/forfeit without split worlds.
7. **Security acceptance:** guest forgery, ownership changes, hidden target orders, replayed packets, cross-room reuse, resource forgery, duplicate delivery, token lifecycle and malformed packet fuzzing. Distinguish integrity of commands from anti-cheat or hidden-information confidentiality.
8. **Ranked/Xbox ecosystem:** browser-hosted game cannot simply claim Xbox native multiplayer, achievements, cloud saves, Xbox Live matchmaking or cross-platform entitlements; these require separate platform capabilities.

## 9. Hardware and graphics strategy

The recorded **~4 FPS / 613 ms rendering** observation on 25 October is important *historical* evidence, not a current performance verdict. Later rendering cache improvements have local browser tests; no same-scene physical Series S comparison closes the performance gap. Do not prescribe an arbitrary 60-FPS requirement without first measuring actual console behaviour and choosing an explicit acceptable target.

**Minimum profile scenes:** initial match, late economy, 50/150/200 same-kind soldiers, 200 mixed-kind units, 800 mixed units as a stress scenario, coastal/naval scene with transports and heavy effects, four-color all-civ test scene. At each 50/75/100 picture preset record frame-time p50/p95, draw vs simulation time, network queue/RTT, tint-cache misses, decoded artwork footprint where measurable, browser tab failures and controller response.

**Art completion:** independent directions rather than mirrored single view; dedicated death/corpse, work, boarding, trade and repair poses; faction and age architecture; construction/damage sheets beyond shared overlays; impact/destroy effects, weather only if reference-required, all gameplay/DLC unit art; full original interface icons, tech-tree, menu art, TV-readability tests. Preserve stone, gold, berry and existing wildlife coverage. Do not add atlas volume without measured memory and draw-budget evidence.

**Audio completion:** preserve original synthesis as a foundation. Build an event-by-event matrix (selection, orders, trains, build, research, siege, water, religion, economy, alerts, music and transition). Decide where authored original sound recordings/music outperform procedural synthesis. Test AudioContext unlock, resume, voice limits, cue priorities, bus volume and accessibility.

## 10. Ordered development programme and explicit release gates

These phases are dependency-ordered **but may overlap safely**; Xbox hardware baselines and CI investigation begin immediately. No phase authorizes paid spending or unrelated destructive actions.

| Phase | Dependencies | Deliverables | Gate |
|---|---|---|---|
| **0 — Evidence and safety** | None | Restore hosted checks or document platform blocker, baseline hardware scenario, accurate one-page status, reference version and parity inventory | Reliable commit-linked evidence, no false pass claims |
| **1 — Reproducible correctness** | Phase 0 harness | Correct tutorial, starting bonuses, held-button refocus; save/production/queue reference tests | Old and new behavioural regressions green; no new control conflict |
| **2 — Controller equivalence** | Official diagrams and Series S captures | R3, X, View, LT waypoints, RT wheel exactness, all solo/MP contexts, controller-only lobby | Every specified reference action demonstrated on physical console |
| **3 — Data/ruleset architecture** | Stable test baseline | Validated civ, unit, tech, regional availability and expansion packs; preserve original engine interfaces | Existing 26 civs still work unchanged where intended; first additional civ is data-driven with regression proof |
| **4 — Base RTS completeness** | Phase 3 | Missing nine base civs, two UTs where applicable, full upgrade classes, navy, siege, AI, maps, scenarios/tutorials | Base requirements matrix passes scripted + human controller scenarios |
| **5 — Real multiplayer** | Phases 0–2 and authoritative design | Honest-client complete 1v1; reconnect/loss; quota-bound transport and security model; later 3–4+ humans if feasible | Two independent-network normal completed matches, reconnection policy, state agreement |
| **6 — Every DLC** | Phases 3–5 relevant hooks | Eleven mechanically complete expansion families, separate Return of Rome and Chronicles rulesets; original campaign equivalents | Per-pack tech, AI, controller, graphics, campaigns and game-mode test matrix |
| **7 — Production polish/performance** | Baseline profiling; runs alongside later phases | All art and sound categories, memory/render scaling, UI accessibility and offline-update correctness | Recorded Series S acceptance at agreed budgets, long sessions and regression screenshot review |
| **8 — Final release** | Every prior gate | Complete feature matrix, controller-only launch-to-win, mature multiplayer/free quotas, documentation, copyright/licensing records | All mandatory rows are verified at one tagged build; unresolved issues explicitly block release |

### Detailed priority task backlog

IDs `AUD-###` are suggestions for the existing master register; **do not overwrite or silently renumber** existing CK tasks.

| ID | Priority | Task and affected files | Acceptance / dependency |
|---|---|---|---|
| AUD-001 | P0 | Diagnose GitHub Actions pre-step failures: `.github/workflows/` and owner Actions settings | Exact failure cause and successful **hosted** validation/regression/browser runs; if service issue, record blocker |
| AUD-002 | P0 | Fix First Hearth X-versus-A tutorial: `js/campaign.js`; controller help tests | Scenario guidance matches actual contextual order; campaign regression + controller VM |
| AUD-003 | P0 | Fix starting civ HP bonuses: `js/mapgen.js`, `js/entities.js`, `engine.js` | Starting villagers/TC have appropriate civ-modified HP without double application on future spawns; seeded save/regressions |
| AUD-004 | P0 | Test and handle held-button refocus: `js/input.js`, `engine.js` | No synthetic A/RT/X order until release after browser refocus; menu/placement saved; tests in `xbox-controller-contract` |
| AUD-005 | P0 | Establish physical Series S baseline, capture saved reproducible scene and HUD | Preset 50/75/100, measured FPS/draw/sim, Xbox build/Edge version/controller video, no invented performance claims |
| AUD-006 | P0 | Publish current status and replace obsolete Railway links in README/server README | Current browser URL/transport/code SHA/test count and superseded docs unmistakable |
| AUD-007 | P0 | Create official reference feature register: data + docs | Every base/DLC/category/console binding has VERIFIED/PARTIAL/MISSING/UNVERIFIED disposition and citation |
| AUD-008 | P1 | Review audio suspend/resume: `js/audio.js` | First alert/mood restoration and rate limit verified in synthetic and browser tests |
| AUD-009 | P1 | Correct campaign acceptance: `tests/simulation-smoke.test.mjs`, `js/campaign.js` | No timeout/defeat misreported as a human win; each mission has feasible documented controller win path |
| AUD-010 | P1 | R3 priorities UI + worker automation: `js/input.js`, `js/ui.js`, `js/kingdom.js` | Seven presets, manual ratios, farm behavior, cancellation and paid orders match captured reference; Xbox proof |
| AUD-011 | P1 | Contextual X and View notification: `engine.js`, `js/input.js`, `js/ui.js` | No conflict with LB X group assignment; complete context matrix with Xbox evidence |
| AUD-012 | P1 | LT-held categories and waypoint tools: input, minimap and MP map | Exact Xbox gestures and data limits; no incorrect shortcuts |
| AUD-013 | P1 | Exact RT/LB wheel comparison and multiplayer Y build/train: input and network UI | Each official sector/gesture/confirmation available and host-validated, hardware recorded |
| AUD-014 | P1 | Controller-only multiplayer invitation entry: `js/network-lobby.js` | Can create, join and play via Xbox controller with no external keyboard/mouse |
| AUD-015 | P1 | Stabilize 1v1 natural victory over independent networks | One full match to normal terminal result with frame/hash/ACK evidence, no local-loopback substitution |
| AUD-016 | P1 | Define multiplayer fog/anti-cheat threat model | Explicit choice between trust-based full-world peers vs trusted state redaction and free feasibility |
| AUD-017 | P1 | Disconnect/rejoin, timeout, hash mismatch and frame stall protocol | Reconnect if safe; otherwise both clients terminate visibly without divergence; loss injection tests |
| AUD-018 | P1 | Review Auth relay expiry, quotas and NAT failure policy | Proven effect of 2h session on already-connected peers; fail-closed UX; no paid TURN enabled |
| AUD-019 | P1 | Data-driven civ schema and validator: `engine.js`, `js/config.js`, new `data/` | Existing civs unaffected; upgrades, bonuses, unique techs, team/regional units fully expressible |
| AUD-020 | P1 | Current Xbox civ and DLC baseline diff harness | Machine-readable reference version; no false completeness from a name or icon |
| AUD-021 | P1 | Benchmark large-army actual device before renderer redesign | Profile same-kind/mixed scenes and identify CPU, GPU, atlas, GC and path bottlenecks |
| AUD-022 | P2 | Nine missing base civilizations + bonuses and unique units | Each civ can complete a full skirmish; availability, AI, controller and art checks |
| AUD-023 | P2 | Second unique techs and complete civ restrictions | All effective tech trees, bonuses and age rules reference-diffed |
| AUD-024 | P2 | Full unit and armor-class upgrade trees | Separate tactical behaviour and visuals where needed, tiered cost/effect tests |
| AUD-025 | P2 | Expand naval line and dock tech | Fire/demo/cannon etc, pathing, transport/shore, AI and controller-only victory |
| AUD-026 | P2 | Siege, defensive structures and gates | Ram/siege tower/petard/upgrades, packed trebuchet, gate interaction; tests |
| AUD-027 | P2 | Multiple TCs, boar/sheep, farming and civ economy exceptions | Costs, prerequisites, ownership, auto-economy, pathing and save/load tested |
| AUD-028 | P2 | AI strategy and long-game reliability | AI ages, builds, scouts, spends and attacks; reproducible anti-stall benchmarks |
| AUD-029 | P2 | Map sizes, cliff/elevation and complete fog semantics | Performance + map-validity tests at Xbox reference sizes |
| AUD-030 | P2 | Advanced original scenario engine | Multi-faction triggers, cinematics/event categories, mission choices, controller presentation |
| AUD-031 | P2 | Full controller-first tutorials and accessibility | Every reference control explained accurately; usability-tested TV distances |
| AUD-032 | P2 | 3–4 human rooms after 1v1 proven | Admission/host ordering, scalable architecture and quota stress tests |
| AUD-033 | P2 | More multiplayer settings, diplomacy, replay/spectator where Xbox-supported | Reference comparison; fully controller accessible |
| AUD-034 | P2 | DLC wave I: Lords of the West + Dawn of the Dukes | Civs, unique buildings/effects, tech trees, AI, original scenarios, Xbox tests |
| AUD-035 | P2 | DLC wave II: Dynasties of India + Mountain Royals | Correct civ split, elephant/regional lines, mountain abilities, architecture, original scenarios |
| AUD-036 | P2 | DLC wave III: The Three Kingdoms + Last Chieftains + Viking Sagas | Civs, reworks, regional-unit access, original campaigns and UI |
| AUD-037 | P2 | DLC scenarios: Victors and Vanquished | 19 original mechanically equivalent scenario categories with advanced triggers and accessibility |
| AUD-038 | P2 | Separate `Return of Rome` antiquity ruleset | Independent unit/building/age/economy data, AI and original scenarios |
| AUD-039 | P2 | Separate Chronicles pack 1: Battle for Greece | Dedicated systems and campaign, testing distinct from medieval core |
| AUD-040 | P2 | Separate Chronicles pack 2: Alexander the Great | Three civs + 18 original scenario equivalents and campaign progression |
| AUD-041 | P2 | Complete unit direction/work/death/boarding graphics | Consistent scale/anchors/performance, originals, visual acceptance incl. DLC units |
| AUD-042 | P2 | Finish faction/age architecture and building impact/destroy states | Source catalogue, full art and native fallback tests; preserve current resource art |
| AUD-043 | P2 | TV HUD, icons, contrast, graphics preset/performance acceptance | Physical 1080p/TV checks, UI not blurred at 50% field preset |
| AUD-044 | P2 | Original full audio/music production and accessibility | Event matrix completed, bus mixing, no duplicated/late sounds on resume |
| AUD-045 | P2 | Service-worker, actual-origin and offline-upgrade validation | Consistent versions, integrity tests, restore after interrupted installs |
| AUD-046 | P2 | Final security/operational/asset-provenance review | No credentials in logs, free quotas respected, licenses for original assets, no paid dependencies |
| AUD-047 | P3 | Physical Series S whole-game acceptance | Complete solo/skirmish/campaign and MP tests, no keyboard/mouse, long soak |
| AUD-048 | P3 | Whole-product parity sign-off | All official Xbox gameplay categories and DLC rows verified or specifically identified as true platform impossibilities |

### Recommended next 10 small commits (when development resumes)

1. Fix First Hearth X-to-A guidance and add behavioural regression.
2. Fix civilization starting HP modifier ordering, with test for starter villager and Town Centre.
3. Add held-button refocus edge-case regression; fix only after reproduction.
4. Add one living current-status README banner and superseded legacy link notices.
5. Improve CI diagnostics/verification without hiding hosted failure.
6. Add a pinned official Xbox reference feature index and status schema.
7. Add Xbox controller audit fixtures and route 1's missing R3 priorities to a tracked implementation task.
8. Add one scripted full campaign victory acceptance fixture (not replacing existing smoke coverage).
9. Add deterministic cross-browser paired-run benchmark; **do not** change number representation yet.
10. Start schema-validating civ/tech/regional-unit data behind existing runtime interfaces.

If a current commit's CI cannot start, diagnose that problem before claiming new shipped changes are safe. Staging changes for review is not equivalent to successful production deployment.

## 11. Physical Xbox Series S acceptance script

Perform these on a physical Series S in Edge and record date, browser build, game SHA, controller model and TV output resolution.

1. Cold boot from Vercel URL to solo skirmish, no keyboard/mouse.
2. Verify every General Gameplay and LT Held official control in the same game-version layout, including context and tap/hold/release.
3. Select, double-select, box-select and assign/recall groups; compare menu interruption and gamepad refocus behaviour.
4. Train, upgrade, build, research, gather, farm, garrison, unload, convert and issue formations from the controller only.
5. Complete one original campaign mission to **victory** without incorrect prompts; then all 19 over the acceptance programme.
6. Save, reload, age up and finish a long skirmish with no entity/queue/technology corruption.
7. Play a naval mission: dock, fishing, trading, combat, transport, beach landing and unloading.
8. At picture presets 50/75/100, measure p50/p95 frame time and visually inspect HUD/menu sharpness at normal TV distance.
9. Run 50/150/200 units, mixed-unit stress and a separate 800-unit failure threshold trial. Record sim/render latency and browser failure without inventing device-memory figures.
10. Open the Xbox Guide, suspend/resume Edge, disconnect/reconnect controller, and verify gestures and sound recover without accidental paid orders.
11. Complete full 1v1 from different networks, including a natural win, with both frame/hash logs.
12. Inject disconnect, lost frames and stale Auth; verify reconnection or clean/visible failure, not split worlds.
13. Verify no paid host/overage used and quotas produce graceful refusal rather than automatic billing.
14. Review TV contrast, controller-only text entry, status alerts and color-vision alternatives.

Performance numbers and quality thresholds should be set **after** the first baseline capture. A desired frame target is a proposal until the owner accepts it and Series S traces show feasibility.

## 12. Definition of done

**Feature-complete:** all Xbox-specific *functional* requirements from a versioned base + 11-pack baseline are implemented with original content; each mechanic is demonstrated beyond a name/icon; all required campaign archetypes are human completable; no accidental replacement of DLC mechanics with stat placeholders.

**Controller-complete:** every relevant official default Xbox action, modifier, wheel, contextual prompt and menu is tested in a full controller-only Series S Edge playthrough; solo and multiplayer are consistent where the reference requires it.

**Multiplayer-complete:** complete independent-network human games through normal victory; correct ownership/fog policy, validated messages, bounded free quotas, predictable timeout/reconnect, and required player count/modes; no claim of cheat-resistant competitive play while guests hold secret state.

**Visually/audio complete:** original coherent assets for all shipped content, dedicated necessary animation states and factions; the full audio event matrix; known physical hardware performance and readability within agreed budgets.

**Release-ready:** exact tagged SHA, successful hosted checks *that actually executed*, Xbox acceptance evidence, safe update/offline behaviour, save/restore soak, original asset provenance, working free-only hosting without paid upgrades, and no unresolved P0/P1 blocker.

---

**Audit conclusion:** preserve and extend the existing engine; fix confirmed small correctness bugs now; make Xbox input and whole-match network acceptance first-class; build a data-driven reference/versioned content system; complete base RTS systems and all Xbox DLC; then sign off graphics, audio and the actual Series S Edge console. The final target remains comprehensive, but **no current audit establishes it as achieved**.