# Next five actual painted sheets (not yet generated)

This pack defines the next **five source-specific image-generation briefs**,
preserving the existing original 16-frame motion style. At publication the
verified **authored-art coverage is still 19/47**, not 31/47 or 33/47.
The 28 additional unit kinds with lightweight visual transforms do not count
towards authored artwork completion.

| Unit | Key | 8×6 base reference cell (0-based) | Required action |
|---|---|---|---|
| Janissary | `jan` | 17 (row 2, column 1) | Matchlock prime / sight / fire / recover |
| Chu Ko Nu | `chuko` | 18 (row 2, column 2) | Lever-operated repeating crossbow |
| Hand Cannoneer | `hcan` | 21 (row 2, column 5) | Hand cannon firing and recoil |
| Genoese Crossbowman | `genoa` | 36 (row 4, column 4) | Heavy crossbow winding and shot |
| Plumed Archer | `plumed` | 41 (row 5, column 1) | Bow nock, draw and release |

The exact prompts and complete identity briefs are in
[`painted-next-ranged-prompts.json`](painted-next-ranged-prompts.json).
These prompts **are not** production sprite-sheet images; they should never
be presented as finished coverage.

**Before adding a sheet:**

1. Generate one 1536×1024 transparent PNG in a real 4-by-4 sheet, exactly
   8 walking and 8 action poses, using its individual source reference.
2. Visually check consistent equipment, arms, feet, baseline and
   actual independent poses. Fix any cross-cell weapon overlap rather
   than shortening weapons. Reject generated UI illustrations/posters.
3. Run `node scripts/check-motion-source.mjs /path/to/generated.png`
   with optional authoring dependency `sharp` installed. This checks
   transparency, 16 connected silhouettes, frame geometry and duplicates.
4. Update the motion atlas packer to register that kind, pack the new source
   into `assets/painted-motion-KIND.webp`, regenerate both manifests,
   update the cache precache list and relevant tests before merging.
5. Check all four team recolours, animation distinctness, both renderers,
   static fallback, source/atlas validation and Chromium/whole-regression CI.

The checker is a structural gate, not a substitute for manual character
identity/pose quality review. Existing sheets, gameplay and controller
contracts must remain unchanged until a replacement passes acceptance.
