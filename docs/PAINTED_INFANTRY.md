# Special infantry animation — 22 October 2026

Animation coverage is now **15/47 playable kinds**, adding Woad Raiders (`woad`),
Berserks (`bers`), Samurai (`saml`) and Teutonic Knights (`tk`). All 47 playable
kinds retain base painted artwork. Full roster animation, independent facing
directions, specialised work/death sheets and physical Xbox performance remain
open.

The four original built-in image-generation sheets are saved as
`assets/painted-motion-woad.webp`, `assets/painted-motion-bers.webp`,
`assets/painted-motion-saml.webp` and `assets/painted-motion-tk.webp`.
[Exact prompts and reference roles](painted-infantry-prompts.json) record their
authoring. The original character references, base artwork and eleven earlier
motion sheets are preserved.

The two sword sheets received targeted pose corrections. Source imports now
identify complete connected figures before isolating grid cells, then reflow
them into cells with extra transparent padding. This retains long blade tips
that extend beyond a generated source-cell edge. It changes packing, not the
painted weapon shape. Existing committed sheets are not reflowed on rebuild.
Missing or ambiguous source figures fail the import instead of publishing
partial art. Tests check cross-cell weapon retention, soft alpha, source
preservation and rejection paths.

Each new sheet supplies eight walk poses, eight melee attack poses and a
matching ready pose. Woad Raiders have a light bare-chested silhouette and
two-handed axe; Berserks have fur shoulders, a round shield and short axe;
Samurai have lamellar armour and a two-handed katana; Teutonic Knights have a
greathelm, white cape, kite shield and straight sword. Blue cloth/heraldry
supports all four kingdom palettes. White capes, metal and leather retain their
neutral colours.

Existing cooldown phase selects the strike, recovery and wind-up frames.
Walking follows game time and freezes on pause. Both renderers use the same
assets, stable body scale and facing logic. Facing is still mirrored rather
than independent directional artwork.

The authoring packer accepts `--source KIND PNG` for each new kind. Running
without arguments rebuilds bounds from committed WebPs. The manifest prioritises
15 motion sheets before the two base atlases. The offline cache includes the
four new sheets. Gameplay rules, statistics, controller bindings and camera
controls are unchanged. No promotional pictures or videos are included.

Local verification passed 184 targeted checks, including all motion kinds and
teams, ready-pose scale, extraction/reflow, controller contracts, HTTP image
loading, authenticated live play and castle production. Native Canvas2D
inspection checked 64 distinct new walk/attack samples and an actual staged
infantry battle; drawing preserved the world checkpoint. Atlas validation
accepts 17 atlases, 1,356 animation entries and 2,252 frame references.
