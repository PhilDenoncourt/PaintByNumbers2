# Which assistants cite paintbynumbers.build, and what do they say?

Investigated 2026-09-08, for action item 10 of the 2026-09-07 weekly report — open for
three consecutive weeks and described there as "the most valuable unanswered question
about the portfolio's best-performing site".

**Headline: the "which assistants" half is already answerable from the GA property the
report reads every week. Nobody has opened the report that answers it.** The "what they
say" half is not in GA at all and needs a repeatable manual panel. Both procedures are
below.

## 1. Which assistants — a GA4 report, not a research project

GA4's **AI Assistant** default channel group is assigned from the HTTP referrer. That
means the per-assistant breakdown is already sitting in property 535792801; the weekly
report has been reading the channel total and stopping there.

To get it (property 535792801, *PaintByNumbers*):

1. **Reports → Acquisition → Traffic acquisition.**
2. Change the primary dimension from *Session default channel group* to
   **Session source / medium**.
3. Add a filter: *Session default channel group* **exactly matches** `AI Assistant`.
4. Set the date range to **Last 28 days** to match the weekly report's headline figure
   (72 new users over 28 days as of 2026-09-07).

The rows are the answer. Expect referrers along the lines of `chatgpt.com`,
`perplexity.ai`, `copilot.microsoft.com`, `gemini.google.com`, `claude.ai`. Record the
split in the weekly report from now on rather than the channel total — "40 of 72 from
Perplexity" and "40 of 72 from ChatGPT" imply completely different next moves.

**Two caveats, both material:**

- **The AI Assistant number is a floor, not a total.** Assistant surfaces that open
  links in an in-app or desktop webview often send no referrer, and those land in
  **Direct**. Direct is the second-largest channel here (37 of 132 new users over 28
  days), and some unknown share of it is the same traffic. Do not report the AI
  Assistant figure as the complete assistant contribution.
- **Channel-group definitions change.** Google has revised the AI-traffic grouping more
  than once. If a week shows a large step change in the channel with no matching change
  in source/medium rows, suspect the definition, not the traffic.

No code change is needed for any of this — `initAnalytics` in `src/utils/analytics.ts`
already lets gtag capture the referrer normally.

## 2. What they say — GA cannot tell you; ask the assistants

GA records that someone arrived from an assistant. It never records the prompt, the
answer, or whether the site was recommended first or fourth. That has to be sampled by
hand. Run this quarterly, or after any positioning change:

**The panel.** Ask each of ChatGPT, Claude, Perplexity, Gemini and Copilot, with web
search enabled, in a fresh session with no memory or personalisation:

1. "What's the best free paint by numbers generator from a photo?"
2. "I want to turn a photo into a paint-by-numbers template and export an SVG for my
   Cricut. What should I use?"
3. "Is there a paint-by-numbers generator that doesn't upload my photo anywhere?"
4. "I want to edit the regions a paint-by-numbers generator produces — merge the tiny
   ones. Which tool lets me do that?"
5. "Free paint by numbers generator that prints bigger than A4."

**Record for each:** whether paintbynumbers.build appears; its rank in the list; which
URL is cited (homepage or one of the four guide pages); the exact sentence used to
describe it; and which competitors are named alongside it. Questions 2–5 map to the
four differentiators, so a miss on one is a specific content gap, not a general
authority problem.

The results are a rank-tracker for the channel that actually delivers 55% of new users.
Nothing else the weekly report tracks measures it.

## 3. Why it is being cited at all — and the fragility in that

The site has **no external footprint to cite**. Three separate live searches this run
for `"paintbynumbers.build"` returned nothing for the domain. The listicles an assistant
would most plausibly retrieve for these queries do not mention it:

- `paintbycanvas.com/blogs/guides-articles/best-paint-by-number-generator`
  ("Best Paint By Number Generators, UPDATED 2026") names DigitPaints, Mimi Panda,
  PBNify and a mobile app. **Not paintbynumbers.build.**
- `aitoolsexplorer.com` and `vectorseek.com` rank on these terms and do not list it.

Combined with one indexed page, the most likely mechanism is that assistants are
reaching the **homepage directly through their own live web search**, not through a
third-party page that recommends it. That has two consequences:

- It explains why the homepage's factual clarity matters more than backlinks right now,
  and it is the strongest argument for the `llms.txt` and on-page definition block
  shipped alongside this document (action item 4).
- It is fragile. The site is being retrieved on the strength of one page matching a
  query. **Getting listed in two or three of those listicles is probably the single
  highest-leverage off-site action available**, and it also feeds Google.

## 4. Competitive corrections found while investigating

Two findings that change claims the 2026-09-07 report makes. Both were verified by
fetching the pages live on 2026-09-08.

### Manual region merging is NOT unique — Mimi Panda ships it

The report states that "manual region merge and split is exposed by NO competitor
checked this run" and builds the whole repositioning on it.
[mimi-panda.com](https://mimi-panda.com/paint-by-numbers-generator/) advertises a
**"Color segment editor: Recolor or merge segments, then save your canvases"**, with
per-segment recolouring, hex entry, colour locking and revert.

What survives, and it is still a real position:

- **Splitting a region is still unclaimed.** Mimi Panda merges and recolours; nothing
  found offers per-region splitting.
- **Mimi Panda is paid and server-side.** $7.91–$43.99/month, free tier limited to 2
  conversions per 7 days, and it uploads the image ("It may take a few minutes...
  please don't close the page").

So the honest claim is **free, unlimited, in-browser region editing, including split** —
not "nobody else lets you edit regions". Copy on the site has been corrected to match;
the comparison table on `/paint-by-numbers-vs-pbnify` still compares only PBNify and kit
sites and should probably gain a Mimi Panda column.

### New entrant: PaintKit

[paintkit.app](https://paintkit.app/) — free, no account, explicitly
"all processing runs in your browser — images are never sent to a server", and it offers
**A4/A3/canvas-size PDF layouts**. It has only global sliders (colour count, detail
level, style) and **no SVG export**. It does not threaten the region-editing or SVG
positions, but it is another entrant on the browser-local claim and another site
publishing paper sizes.

## 5. What to do with this

1. Run §1 in GA and put the per-assistant split into next week's report. Fifteen minutes.
2. Run the §2 panel once to establish a baseline, then quarterly.
3. Treat listicle placement (§3) as the top off-site action, ahead of generic link
   building.
4. Fold §4 into next week's competitor section, and add a Mimi Panda column to the
   comparison page.
