# SEO Execution Plan — paintbynumbers.build

_Created: 2026-08-07_

Companion to [seo-positioning-plan.md](./seo-positioning-plan.md) (which settles *what we say*)
and [indexation-runbook.md](./indexation-runbook.md) (which tracks *crawl health*).
This document covers *what to build, in what order, and why*.

---

## 1. Diagnosis

**Technical SEO is done, and it is not the bottleneck.**

The build already enforces canonicals, prerenders the homepage, generates
`sitemap.xml` / `robots.txt` from a single `VITE_SITE_URL`, emits `SoftwareApplication`
+ `FAQPage` + `BreadcrumbList` JSON-LD, and fails CI on regressions via
`check-indexability.mjs`. That is a better technical baseline than most competitors in
this niche. Continuing to polish it will not move traffic.

**The actual state, as of 2026-08-07:**

| Signal | Status |
|---|---|
| `site:paintbynumbers.build` in search | Returns **nothing** |
| Pages indexed (per July 27 runbook) | **1 of 5** — the other four sat at *Discovered – currently not indexed* |
| Total indexable URLs | **5** |
| Locales shipped in the app | **22** |
| Locales visible to a crawler | **0** |
| Inbound links | Effectively none |

**Root cause.** *Discovered – currently not indexed* on a five-page site is Google saying
"we know these URLs exist and have chosen not to spend crawl budget on them." That is an
**authority** verdict, not a markup verdict. The July plan's follow-up — request priority
crawls, then strengthen internal links — treats a symptom. A zero-backlink domain with
five pages will keep getting this result no matter how clean the HTML is.

**Three things actually constrain growth**, in order of leverage:

1. **22 complete translations are invisible to search engines.** Language is chosen
   client-side from `navigator.language`; every locale serves the same URL (`/`) with the
   same English prerendered HTML. Meanwhile Davincified ranks #1 in Germany for
   *malen nach zahlen generator* off a plain `/de/` subdirectory. This is the largest
   gap between work already done and value captured.
2. **Nothing links here.** No directory listings, no listicle placements, no community presence.
3. **Broken social previews** suppress the one channel that would generate those links
   organically (see §3.1).

---

## 2. Workstream A — Ship the locales *(highest leverage)*

### Why this first

The expensive part is already finished. All 22 locale files carry **415 keys each, fully
translated**, including the entire hero, feature grid, how-to steps, and FAQ:

```
[de] Erstelle eine SVG-Malen-nach-Zahlen-Vorlage mit manueller Zusammenführungs- und Teilungskontrolle
[es] Crea una plantilla SVG de pintura por números con control manual de fusión y división
[fr] Créez un modèle SVG de peinture par numéros avec un contrôle manuel de fusion et de division
```

This is a **build-script change, not a translation project**. And the competitive math is
better abroad: English head terms (*paint by numbers generator*) are held by Shopify kit
sellers with years of domain authority and a commercial incentive to defend them.
Non-English long-tail is contested by a handful of the same tools running machine
translation — winnable from a standing start.

### Scope

Ship **6 locales first**, not all 22:

> `de`, `es`, `fr`, `pt-BR`, `it`, `nl`

Chosen for large craft/maker markets, Latin-script keyword research you can sanity-check
without a native speaker, and low incumbent quality. Defer `ja` / `ko` / `zh` / `ar`
— they need genuinely different keyword research and RTL/CJK layout QA, and they are not
where the volume is for this category. Expand once the first six prove out.

**Why not all 22 at once:** 22 near-identical machine-assisted pages appearing overnight on a
domain with no authority is the classic doorway-page pattern. Six good pages that earn
impressions is a safer and more informative first bet.

### Work items

1. **Localized prerendered homepages** at `/de/`, `/es/`, … — generalize
   `scripts/prerender-home.mjs` to take a locale code and read strings from the locale
   JSON rather than the hardcoded English template. The markup is already the right shape;
   it just needs its strings parameterized.
2. **Add SEO keys to each locale file.** `welcome.*` and `faq.*` exist, but there is no
   translated `<title>` or `<meta description>`. Add ~4 keys per locale
   (`seo.title`, `seo.description`, `seo.ogTitle`, `seo.ogDescription`). These need real
   keyword-aware wording per language, not a literal translation of the English title —
   *malen nach zahlen* is the German search term, not a translation of "paint by numbers."
   **This is the one genuinely manual part of the workstream.**
3. **hreflang cluster** on every localized page plus `/`, reciprocal and complete, with
   `x-default` → `/`. Incomplete or non-reciprocal hreflang is worse than none.
4. **Read locale from the URL path first**, falling back to `navigator.language` only at
   `/`. Today a German user landing on `/de/` would get re-detected client-side; that is
   fine today but breaks the moment someone links to `/de/` from an English browser.
5. **`render.yaml` rewrites** for each locale prefix, ahead of the `/*` catch-all.
6. **Sitemap entries** for each locale URL, with hreflang alternates.
7. **Extend `check-indexability.mjs`** to assert, per locale: one canonical, a complete
   reciprocal hreflang set, correct `<html lang>`, and no untranslated English leakage in
   the prerendered block. The existing checker is the right place for this and will keep
   the whole thing from silently rotting.

### Open decisions for you

- **Subdirectory vs. subdomain.** Recommend **subdirectory** (`/de/`) — it inherits
  whatever domain authority accrues, versus splitting it across hosts. `paintbynumbers.net`
  uses `de.` subdomains; Davincified uses `/de/` and outranks them.
- **Locale list.** The six above are a recommendation, not a constraint.

---

## 3. Workstream B — Unblock the fundamentals *(cheap, do immediately)*

### 3.1 Fix `og:image` — confirmed defect

`index.html` and every content page point `og:image` at `/social-preview.svg`.
**No major platform renders SVG Open Graph images** — not Facebook, X, LinkedIn, Slack,
Discord, iMessage, or WhatsApp. Every share of this site today produces a **blank card**.

The existing SVG is well-made and correctly sized at 1200×630; it just needs to be
rasterized to PNG at build time and referenced instead. Keep the SVG as the source of truth.

This is small, but it gates Workstream C — link acquisition runs through people sharing
links, and a blank card measurably suppresses that.

### 3.2 Add images, with alt text

There are currently **zero images** on any content page. For a visual tool this forfeits
Google Images entirely — a real channel for "what does the output look like" queries — and
makes the content pages read as thin.

The highest-value one is still the unshipped item from the July plan: a **before/after of
a messy auto-generated region cleaned up with merge and split.** That single asset is the
proof for the primary differentiator, and it serves the homepage, the merge/split page, the
comparison page, social cards, and outreach simultaneously.

### 3.3 Deepen the four content pages

They run ~300–500 words on an identical template. Priorities: the before/after imagery
above, a concrete worked example per page, and `HowTo` JSON-LD on the two pages that
already contain step lists (`photo-to-paint-by-numbers-svg`, `merge-split-paint-by-numbers-regions`).

### 3.4 Internal linking

Content pages are reachable from one footer line on the homepage and from each other.
Give them a real linked section in the prerendered homepage body. Worth doing — but note
this was the July plan's remedy for non-indexation and it did not work, because the
constraint is external. Do it, don't expect it to be the fix.

---

## 4. Workstream C — Earn the first ten links *(the real bottleneck)*

Nothing in Workstreams A and B will index reliably until this moves. Ranked by
effort-to-value:

1. **Listicle placement.** Queries like *best paint by number generator* are dominated by
   roundups — e.g. paintbycanvas.com's *"Best Paint By Number Generators | UPDATED 2026"*.
   These are maintained, they accept submissions, and they deliver a link *plus* qualified
   referral traffic. Identify the top ~10 and pitch each. The pitch writes itself: nobody
   else on those lists exports vector SVG or allows region editing.
2. **Tool directories.** AlternativeTo (explicitly as a *PBNify alternative* — the comparison
   page already exists and can be the landing target), Product Hunt, and the AI/tool
   aggregators. Low effort, immediate.
3. **Maker communities.** This is the differentiated angle and the one no competitor can
   follow: r/cricut, r/lasercutting, r/somethingimade, r/CNC, Glowforge forums, Cricut
   Facebook groups. These audiences need *vector paths*, which is exactly and uniquely
   what this tool produces. Lead with a finished artifact — a cut mural or a laser-etched
   panel — not a tool announcement.
4. **The PBNify angle.** PBNify is open source, widely linked, and visibly dated. Pages
   linking to it are natural candidates for "also worth knowing about."

**Expect this to be the slowest workstream and start it first.** Links compound, and
indexation of everything else depends on them.

---

## 5. Workstream D — Content aligned to the wedge

Once the above is moving, expand around the maker positioning where there is no incumbent:

- *paint by numbers for laser cutting*
- *paint by numbers mural template* (large-format / wall-scale)
- *Cricut paint by numbers SVG*
- *AI paint by number generator* — an emerging query the roundups are already using

Each maps to the SVG wedge, and each is a topic the kit sellers structurally cannot cover.

---

## 6. Sequencing

| When | Work |
|---|---|
| **Now** | og:image PNG fix; start listicle + directory outreach (long lead time) |
| **Week 1** | Before/after imagery; image alt text; homepage internal-link section |
| **Weeks 2–3** | Locale prerender infrastructure; ship `de`/`es`/`fr` |
| **Week 4** | `pt-BR`/`it`/`nl`; extend `check-indexability.mjs` for hreflang |
| **Ongoing** | Community posting; content pages from §5 |

## 7. Measurement

Track leading indicators, not rankings — rankings will not move for months.

- **Weekly:** Search Console — indexed page count (the number to watch: 1 → 5 → 11),
  total impressions, and impressions on non-English queries once locales ship.
- **Monthly:** `site:paintbynumbers.build`; referring-domain count; GA4 `export` events
  segmented by language.

**The single clearest success signal:** the four existing content pages moving out of
*Discovered – currently not indexed*. That flip means the domain has crossed Google's
authority threshold, and everything after it gets easier.
