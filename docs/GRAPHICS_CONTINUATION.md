# Graphics continuation checkpoint — 29 October 2026

The owner authorizes continued roadmap work without routine confirmation. Read AGENTS.md, controller contract when relevant and free-only hosting requirements. Work directly on main with an expected-head lease; do not force push. A reconstructed local index may be stale, so do not stage unrelated files blindly.

## Last tested runtime
- Commit: 0af33396f6d42ca8319a939328b60337c793db4d
- Tree: a039ff0060160e2833a265243617b08171a026c8
- Manifest: painted-raster-v14-motion, 51 atlases, 47 current playable motion kinds, 1,756 entries and 4,472 frame references.
- Shell: ck-shell-v35-complete-roster-motion.
- All 211 standalone regression files passed locally (CK_SKIP_CAMPAIGN=1); complete Chromium battlefield suite passed. This does not establish 19 campaign victories.
- Browser: 388 motion action/team lookups, 168 decoded raster sequences; eight new elephant/siege kinds add 512 decoded samples across four colours with pause/phase/checksum checks. The packed 128-pose sheet was inspected.
- Source, atlas, audit and byte-identical no-argument rebuild passed. Earlier WebP Git hashes remain unchanged. Stone, gold and berry checks passed.
- Vercel reports success. Exact latest live-file hash comparison is pending due to execution-environment loss. Hosted GitHub jobs failed before any steps; cause unverified.
- Prior civic runtime 902b80ff96176af454a49c2ab56ccee6d678cadf was independently verified live by SHA-256 for its manifest, shell and all six new images.

## Next graphics item: painted fish traps
Original four-variant transparent PNG is preserved at [fishtraps-original.png](art-sources/fishtraps-original.png); exact built-in generation prompt is [painted-fishtrap-prompts.json](painted-fishtrap-prompts.json). It is NOT integrated or validated for runtime. The generated sheet is 2 columns by 2 rows; preserve full basket/frame/net/ropes and source alpha. Inspect for cell overlap/background fragments before packing.

Proposed implementation to review:
1. Add an optional authoring packer and separate neutral fishtrap manifest with four stable geographic variants, not owner/clock-dependent variants. Preserve old assets and use the existing multipart extraction only where necessary.
2. paintedEnvironmentFrame currently excludes traps. Add a trap-specific path before normal fish selection, retaining farm exclusion and missing-image procedural fallback. Use an appropriate waterline scale in solo and team-relative views; both already share this selector.
3. Keep existing fish-trap ownership, gathering, automatic replenishment, commands, fog and saves unchanged.
4. Preserve the new atlas through base/motion rebuilds, include its image in shell migration, update version/count assertions and audit evidence.
5. Add meaningful transparency/variant/fallback/nonmutation checks and browser play-scale comparison in both views. Rerun relevant/full checks before committing and verify actual production files.

## Remaining full-overhaul work
47/47 describes current movement/activity ART coverage. It is not independent facing directions, full work/death sheets, complete game/DLC parity or Xbox acceptance. Boarding/trade/greeting poses exist but dedicated event triggers remain open. Faction/age architecture, resource depletion, wildlife/fish animation, effects/destruction, full interface/icon work and physical Xbox Series S Edge checks remain in GRAPHICS_OVERHAUL_CHECKLIST.md. Keep the existing 50/75/100 picture presets and crisp HUD.

Consider measuring decoded-atlas/team-tint memory and safely reducing unused transparent padding without lowering picture quality; this is an investigation, not a measured Xbox improvement. Do not claim actual hardware performance from desktop timings.

## Environment interruption
After committing the tested 47-unit increment, exec_command returned: "No usable execution environment is available. Wait for an environment to become available before using this tool." No fish-trap runtime edits were made. Resume by restoring an execution environment, reading this checkpoint and verifying main/live state.
