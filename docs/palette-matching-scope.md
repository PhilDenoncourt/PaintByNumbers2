# Scope: palette matching against real paint sets

Written 2026-09-08, in response to action item 8 of the 2026-09-07 weekly report.

The report calls palette matching "the strongest *product* opportunity on the site"
and "confirmed unclaimed by every competitor checked". That framing is right about the
opportunity and wrong about the starting point: **most of the machinery already
exists.** This document says what is built, what the real gap is, and what to build
next.

## What already ships

| Piece | Where | State |
| --- | --- | --- |
| Preset paint-set palettes | `src/data/paletteRegistry.ts` | 12 sets across 4 brands |
| Crayola crayons | `src/data/crayolaPalettes.ts` | 8 / 16 / 24 / 48 / 64 / 96 / 120 |
| Prismacolor Premier pencils | `src/data/prismacolorPalettes.ts` | 72, 150 |
| Winsor & Newton Cotman watercolour | `src/data/winsornewtonPalettes.ts` | 24-pan, 45-pan |
| Tombow Dual Brush markers | `src/data/tombowPalettes.ts` | 96 |
| Perceptual colour matching | `fixedPaletteQuantize` in `src/algorithms/kmeans.ts` | ΔE2000 in LAB, via a 32³ RGB lookup table |
| Named colours in exports | `svgExporter.ts`, `pdfExporter.ts` | Legend prints "7 – Burnt Sienna", not "7 – #8a3324" |
| Custom palette import | `src/components/controls/CustomPaletteControls.tsx` | Paste or upload hex codes / JSON |
| Buy-the-set link | `PresetPalette.vendorUrl` | Amazon affiliate link per set |

The matching itself is good and is worth saying out loud in marketing copy: colours are
compared with **ΔE2000 in LAB space**, not nearest-RGB. That is why skin tones do not
snap to a greenish crayon. Competitors that hand over hex codes are not doing this.

## The actual gap

The report's phrasing is the important part: matching against **"paints the user already
owns"**. Today you can only pick a *whole retail box*.

`PipelineController.ts:40` maps the entire preset into `fixedPalette`, so choosing
"Crayola 120" forces the template to consider all 120 crayons. Someone who owns a
24-pack plus four loose tubes has no way to express that. The three concrete holes:

1. **No subset selection.** There is no way to check off the colours you actually have
   from within a named set. This is the single biggest gap and the cheapest to close —
   the data is already there; it needs a UI and a filter on the array passed to
   `fixedPalette`.
2. **Custom palettes lose their names.** `parseHexColors` returns bare RGB triples, so
   a user-supplied paint list falls back to hex codes in the legend
   (`svgExporter.ts:91`, `pdfExporter.ts` legend). A painter's own set is exactly the
   case where names matter most — "Cadmium Red Medium" is what is printed on the tube
   they are holding.
3. **No acrylics.** Acrylic is the dominant paint-by-numbers medium, and not one of the
   four brands is an acrylic. Crayons, coloured pencils, watercolour and markers are
   all covered; the medium most of the audience actually paints with is not.

## Proposed increment

In priority order. Each step is independently shippable.

### 1. "I own these" subset picker — highest value, lowest risk

Add checkboxes to the preset colour swatches already rendered in
`PaletteControls.tsx:100-116`, plus select-all / select-none. Store the selection as
`settings.presetPaletteSubset: string[] | null` (colour names, not indices, so it
survives a palette-data edit) and filter in `PipelineController.ts` before building
`fixedPalette`.

This is the feature the report is actually describing, and it compounds with region
editing exactly as the report says: **pick your paints, then merge regions until the
count matches what you can mix.**

Notes:
- Guard against selecting fewer than ~3 colours.
- Show the live count ("11 of 24 selected") next to the swatches.
- Persist it in the saved session (`sessionStorage`) alongside `presetPaletteId`.

### 2. Named custom palettes

Extend the custom-palette import to carry names:

- CSV/TSV: accept `name,hex` rows as well as bare hex.
- JSON: accept `[{ "name": "...", "hex": "#..." }]` alongside today's shapes.
- Change `settings.customPalette` from `[number, number, number][]` to a typed
  `PresetColor[]`, or add a parallel `customPaletteNames`. The first is cleaner; it
  touches `PipelineController`, both exporters, and the session import/export, so check
  the saved-session migration path.

This also makes step 3 nearly free — an acrylic set is just another named list.

### 3. Add acrylic sets

Candidates, chosen for how commonly they turn up in paint-by-numbers threads:
Liquitex BASICS 24/48, Arteza acrylics 24/60, FolkArt and Apple Barrel craft acrylics.

Sourcing swatch RGB values is the work here, and it must be honest: manufacturer swatch
images are compressed and lit inconsistently. Prefer published sRGB values where the
manufacturer gives them, and mark anything eyeballed as approximate in a comment, the
way `crayolaPalettes.ts` already cites its Wikipedia source.

### 4. Publish the matching quality

Once 1–3 land, say plainly on `/photo-to-paint-by-numbers-svg` and in `llms.txt` that
matching is ΔE2000-based. It is a real technical differentiator and no competitor
states one.

## Defect found while scoping

`Crayola 16` reports **17 colours** and `Crayola 64` reports **65** in the palette
picker. The cause is in the source data, not the matching: the additive packs hold more
entries than their box names imply — `pack16extras` has 9 entries where it should have
8, and `pack64extras` has 17 where it should have 16. `buildPalette` de-duplicates by
RGB, which absorbs the overshoot at some sizes but not those two, and
`crayolaPalettes.ts:36` carries a comment admitting one entry was hand-substituted.
So the labels claim a box size the list does not match. Worth fixing before promoting
palette matching as a headline feature, since the whole promise is that the list
matches a box you can actually buy.

## Out of scope

- Mixing guidance ("2 parts white to 1 part red"). Real demand, much larger problem,
  and it needs pigment data the RGB values do not carry.
- Physical colour-card scanning to build a palette from a photo of your paints. Nice
  demo, poor accuracy without a calibration target.
