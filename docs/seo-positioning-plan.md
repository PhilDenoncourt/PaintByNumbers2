# Positioning & SEO Plan — paintbynumbers.build

_Last updated: 2026-09-21_

## September 21 action-item update

The September 21 competitive report supersedes the historical landscape and priorities
below. Its open items 4, 5, 6, 9 and 11 have been addressed in local source/configuration;
deployment has not been performed or verified.

- **4:** Region splitting now leads the homepage title, social metadata, localized H1,
  badges and feature cards. SVG and merging remain supporting capabilities.
- **5:** The homepage and footer link directly to privacy verification. The guide explains
  outgoing request inspection and an offline workflow, discloses analytics and local
  session storage, and no longer treats small responses as proof of no uploads.
- **6:** `C:/work/DDAStatus/sites.json` now records www redirecting to the apex, based on
  the supplied report's verification.
- **9:** Already implemented: choose **Palette > Auto-detect > Color style** to select
  K-Means or Median-Cut and read its explanation. Fixed paint sets/custom palettes use
  their supplied colors instead. Existing control and algorithm tests pass (23 tests).
- **11:** The reporting keyword list now prioritizes `edit paint by numbers regions`,
  `paint by numbers template maker`, `paint by numbers SVG`, `split paint by numbers regions`,
  and `paint by numbers generator no upload`, in that order. `paint by numbers generator`
  is a stretch target. `photo to paint by numbers` and `paint by numbers from photo` remain
  content themes, but are removed as ranking targets.

Validation: production build, prerender and indexability checks for all five URLs, ESLint,
and 23 existing algorithm/control tests passed. Browser preview was unavailable in this
session. The earlier report observations below are historical, not fresh competitor checks.

## Context

The site (https://paintbynumbers.build) converts a photo into a custom paint-by-numbers
template with manual per-region editing and true vector SVG export for maker workflows.

### Competitive landscape

Two distinct categories:

1. **Online generators (direct competitors)** — digital template only.
   - [PBNify](https://pbnify.com/) — closest rival. In-browser, no upload, open source, but dated & buggy.
   - [Davincified](https://www.davincified.com/paint-by-numbers-online-generator) — free, no signup, upsells kits.
   - [DigitPaints](https://www.digitpaints.com/en), [Mimi Panda](https://mimi-panda.com/convert-photo-to-paint-by-numbers-online/),
     [PaintMeLike](https://www.paintmelike.co/pages/paint-by-number-generator), [PhotoGrid](https://photogrid.space/photo-to-paint-by-numbers), [NicePBN](https://generator.nicepbn.com/).
2. **Custom physical kit sellers (adjacent market)** — ship canvas + paints; compete for the same search traffic.
   - [Canvas by Numbers](https://canvasbynumbers.com/), [Crafty by Numbers](https://craftybynumbers.com/),
     [Just Paint by Number](https://justpaintbynumber.com/), [Number Artist](https://numberartist.com/),
     [Paint with Number](https://paintwithnumber.com/), [Winnie's Picks](https://winniespicks.com/).

### Current SEO baseline (already in place)

Strong technical foundation: meta description, canonical, OG/Twitter cards,
`SoftwareApplication` JSON-LD, `robots.txt`, and `sitemap.xml`.

The homepage and four supporting routes are prerendered, canonicalized, included in a
submitted sitemap, and visible in Search Console. The remaining challenge is positioning:
free use, no watermark, no sign-up, and browser-only processing are now category parity.

## Historical July positioning (superseded above)

**One-liner:** _The paint-by-numbers editor that exports true vector SVG and gives you
manual control over every generated region._

Two primary wedges (repeat in title, H1, OG, content):

- **True vector SVG export** — scalable, editable paths for Cricut, laser cutting, vinyl,
  murals, and oversized print workflows.
- **Manual merge and split controls** — edit individual regions instead of accepting a
  coarse global smoothing result or regenerating the whole image.

Real-paint matching, browser processing, direct downloads, free use, and no account remain
useful supporting facts. They are not headline differentiators.

## Keyword targets

| Tier | Query | How to capture |
|---|---|---|
| Head | `paint by numbers generator`, `photo to paint by numbers` | Homepage H1 + title |
| Differentiator | `paint by numbers SVG`, `Cricut paint by numbers SVG`, `merge paint by numbers regions`, `split paint by numbers regions` | Homepage copy + feature section |
| Long-tail / content | `photo to paint by numbers SVG`, `paint by numbers for laser cutting`, `paint by numbers mural template`, `PBNify alternative` | Dedicated content pages |

## Prioritized actions

1. **Lead every primary acquisition surface with both wedges.**
   - Title/H1/meta: SVG/vector output plus manual merge and split.
   - Maker use cases: Cricut, laser cutting, vinyl, murals, and large-format print.
2. **Keep parity claims subordinate.**
   - Free, no watermark, no sign-up, and browser-only processing can appear in FAQs or
     technical explanations, but not in the title, H1, hero badges, or lead description.
3. **Strengthen internal links to the SVG and region-editing routes.**
4. **Show the editing advantage visually** with a before/after example of a messy region
   cleaned up with merge and split controls.
5. **Recheck Search Console after priority crawl requests complete** and measure impressions
   for the new maker-focused terms.

**Highest leverage:** demonstrate the manual editing workflow, then build maker-specific
content around vector SVG output.
