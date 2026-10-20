# Battlefield graphics acceptance

Verified code: [`f8eee4d`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/f8eee4dae8d725dafaf9965289b4919e8333912e).
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
| Units | 50 | 50 | All runtime keys resolve; includes castle combat proxy |
| Building definitions | 22 | 21 | Farms use crop/resource tiles |

Dedicated new original art now covers trade carts/cogs and the twelve missing
unique troops: Conquistador, Genoese Crossbowman, Boyar, Tarkan, Huskarl, Jaguar
Warrior, Plumed Archer, Kamayuk, Shotel Warrior, Gbeto, War Wagon and Magyar
Huszar. The `cs` key is a castle attack proxy rather than another playable
troop; it reuses the existing original castle frames. Palisades have their own
timber/flag atlas.

Trade and unique-force entries provide eight addressable directions and two
frames for idle, walk, attack and work, for each of four kingdom palettes.
This establishes coverage; perspective-specific facing quality, additional
motion frames and reference fidelity still require review. Atlas cells are
clipped to prevent adjacent-frame bleed. Some existing building entries are
static frames.

There are seven atlases and 1,172 animation entries: upright troops (48), legacy
troops (36), detailed forces (512), detailed buildings including proxy aliases
(336), trade (32), new unique forces (192) and palisades (16).

## Reproducible assets and update behaviour

`scripts/build-extended-atlas.mjs` generates the original trade, unique-force and
palisade SVG files and updates their manifest metadata. `--check` verifies the
committed outputs without writing them. The catalogue regression checks every
effective unit key/team/state and every sprite-backed building rather than
silently accepting newly introduced placeholders.

The manifest request now revalidates cached HTTP metadata (`cache: no-cache`).
Service-worker shell version `ck-shell-v10` retires old cached SVG artwork.
Chromium tests prime an obsolete long-lived HTTP manifest and an old shell
cache, activate the replacement worker, then verify all seven atlases load on
reload.

## Verification and captures

- [Source/atlas validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39514666040): passed.
- [Regression suite](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39514665643): 156 standalone files, 19 campaign
  simulations and three seeded production-AI skirmishes passed.
- [Chromium graphics suite](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39514665634): passed.
- [Rendered screenshots and metrics](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39514665634/artifacts/12307765695):
  `team-zero.png`, `team-one.png`, `fallback.png`, `extended-art.png`, `metrics.json`.

The browser suite serves actual production scripts and local assets through
`server/app.mjs`. It checks Chromium SVG parsing and loading, source-frame
changes, both team projections, a hidden opponent, checksum isolation and a
render with every atlas request deliberately failed. Captured views were also
visually inspected for basic asset, fog and indicator rendering.

The 60-refresh staged timing is recorded in the current browser artifact.
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

1. Improve the directional silhouettes, motion frame count, unit proportions and faction architecture beyond basic complete catalogue coverage.
2. Review each faction, state, direction and anchor at play scale; complete
   distinct construction/damage/action art and improve readability.
3. Complete isometric camera/terrain integration and benchmark large land/naval
   battles, memory and frame times on Xbox Series S/X Edge.
4. Run physical-controller solo/campaign and independent-browser multiplayer
   matches through fog, garrisons, transports and asset failure.
