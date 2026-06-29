# Positioning & SEO Plan — paintbynumbers.build

_Last updated: 2026-06-29_

## Context

The site (https://paintbynumbers.build) converts a photo into a custom paint-by-numbers
template entirely in the browser, with color reduction (K-Means / Median Cut), Crayola
palette presets, region editing, and PDF / PNG / SVG export.

### Competitive landscape

Two distinct categories:

1. **Free online generators (direct competitors)** — digital template only.
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

**Gaps:**
1. Single-page SPA — `/` is the only indexable URL, and most marketing copy lives inside the
   React bundle rather than initial HTML.
2. Meta copy is undifferentiated ("Convert Photo to Template") — reads like every competitor.
   The real edges (free SVG, 100% local, Crayola palette) aren't in the indexed words.

## Positioning

**One-liner:** _The free, private paint-by-numbers generator that runs entirely in your
browser and exports clean, editable SVG._

Three pillars (repeat in title, H1, OG, content):

- **Private** — your photo never leaves your device (beats Davincified / DigitPaints / Mimi Panda).
- **Vector SVG export** — scalable & editable (almost no free competitor offers this).
- **Real paint matching** — Crayola presets map to colors you actually own (unique angle).

Don't fight kit sellers on "buy a kit." Own the **"just want the template, free and private"**
lane, where the only serious rival is the dated PBNify.

## Keyword targets

| Tier | Query | How to capture |
|---|---|---|
| Head | `paint by numbers generator`, `photo to paint by numbers` | Homepage H1 + title |
| Differentiator | `paint by numbers SVG`, `free paint by numbers no upload`, `private paint by numbers generator` | Homepage copy + feature section |
| Long-tail / content | `how to turn a photo into paint by numbers`, `best free paint by numbers generator`, `paint by numbers with Crayola colors`, `PBNify alternative` | Dedicated content pages |

## Prioritized actions

1. **Rewrite title & description with the wedge.**
   - Title → `Free Paint by Numbers Generator – Photo to Printable Template (SVG, Private)`
   - Description → lead with "100% in your browser, nothing uploaded" + "export SVG, PDF, PNG."
2. **Add crawlable content to the homepage** (in HTML, not JS-rendered modals): H1, a 3-step
   "how it works," and a features list naming SVG / private / Crayola. _(Highest leverage.)_
3. **Build 3–4 lightweight, pre-rendered content/landing routes** (use `vite-plugin-ssg` or a
   prerender step — otherwise they won't index well):
   - "How to turn a photo into a paint by numbers template" (big informational query)
   - "Free PBNify alternative" comparison page (easy competitor-name wins)
   - "Paint by numbers with Crayola colors" (unique feature)
4. **Add a feature-comparison table** on a `/compare` page — captures "best free paint by
   numbers generator" comparison intent.
5. **Add `FAQPage` JSON-LD** with real questions: "Is it free?", "Do you upload my photo?",
   "Can I print it?", "What's the best photo to use?" — wins featured snippets.
6. **Submit the sitemap in Google Search Console** (property is verified per git log — confirm
   the sitemap itself is submitted).

**Highest leverage:** #2 (crawlable homepage content) and #3's PBNify-alternative page — both
low effort, targeting intent competitors leave wide open.
