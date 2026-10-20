# Battlefield graphics acceptance

Verified code: [`a09c3f9`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/a09c3f9b0d2ce1585cb65dbdccc84a3ecd8414a8).
Work continues directly on main.

## Implemented stage

Multiplayer now consumes the original local unit, ship and building SVG atlases.
The team-relative view copies idle, movement, attack and work poses. Shared world
time selects frames; rendering never changes simulation facing, paths or orders.
Heading lookup uses each animation's direction count, while existing solo
direction-index callers retain their behaviour.

Both kingdoms share stable screen-depth ordering. Kingdom palettes, relation
markers, health/selection, passenger counts and rally/path indicators remain
visible. Foundations have construction tint, scaffolding and progress; damaged
completed buildings emit smoke. Missing frames and failed or undrawable images
retain procedural fallback. The camera remains a top-down strategic map with
anchored sprites; the full isometric camera/terrain overhaul is unfinished.

Chromium found 48 malformed path tags in the original building atlas. Repairing
those tags makes the full atlas load in both game modes. The static validator
now rejects unclosed opening tags, and browser checks parse every SVG.

## Effective runtime inventory

Asset presence establishes coverage, not visual quality or distinct animation
for every action. The existing artwork was integrated; this stage does not
claim a newly produced complete art catalogue.

| Catalogue | Runtime kinds | Atlas kinds | Remaining |
|---|---:|---:|---|
| Units | 50 | 35 | 15 procedural fallbacks |
| Building definitions | 22 | 20 | Palisade fallback; farms use crop/resource tiles |

Missing unit atlas keys: `cart`, `cog`, `cs`, `conq`, `genoa`,
`boyar`, `tarkan`, `huskarl`, `jaguar`, `plumed`, `kamayuk`,
`shotel`, `gbeto`, `wagon`, `huszar`.

The four atlases contain 48 upright-troop animation entries, 36 legacy
villager/troop entries, 512 detailed-force entries and 320 detailed-building
entries. Some building entries reuse static frames.

## Verification and captures

- [Source/atlas validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39485675211): passed.
- [Regression suite](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39485675028): 155 standalone files, 19 campaign
  simulations and three seeded production-AI skirmishes passed.
- [Chromium graphics suite](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39485675115): passed.
- [Rendered screenshots and metrics](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39485675115/artifacts/12292534199):
  `team-zero.png`, `team-one.png`, `fallback.png`, `metrics.json`.

The browser suite serves actual production scripts and local assets through
`server/app.mjs`. It checks Chromium SVG parsing and loading, source-frame
changes, both team projections, a hidden opponent, checksum isolation and a
render with every atlas request deliberately failed. Captured views were also
visually inspected for basic asset, fog and indicator rendering.

The 60-refresh staged measurement averaged 5 ms per refresh on the CI runner.
It is not an Xbox frame budget or a large-battle benchmark. These are staged
rendering scenes, not full two-human browser matches. Separate HTTP regressions
cover synchronized game commands.

Reproduce on supported Ubuntu 24.04 after installing the development tools:

```sh
npm install --no-save --package-lock=false playwright@1.56.1
npx playwright install --with-deps chromium
node tests/browser/battlefield-art.mjs
```

## Remaining acceptance

1. Produce original atlas art for the missing unit kinds and palisades.
2. Review each faction, state, direction and anchor at play scale; complete
   distinct construction/damage/action art and improve readability.
3. Complete isometric camera/terrain integration and benchmark large land/naval
   battles, memory and frame times on Xbox Series S/X Edge.
4. Run physical-controller solo/campaign and independent-browser multiplayer
   matches through fog, garrisons, transports and asset failure.
