# Google indexation runbook

## Current status

Last checked: 2026-07-27

- The live homepage returns HTTP 200 as HTML.
- Neither the homepage HTML nor its HTTP headers contain `noindex`, `nofollow`, or `none`.
- The canonical URL is `https://paintbynumbers.build/`.
- `robots.txt` returns HTTP 200, allows all crawlers, and advertises the sitemap.
- `sitemap.xml` returns HTTP 200 as XML and lists the homepage plus all four content pages.
- The Google HTML verification file returns HTTP 200 with the expected token.
- Search Console confirms that Phil Denoncourt is a verified owner.
- Search Console reports `robots.txt` as valid and 244 crawl requests in the last 90 days.
- `sitemap.xml` was submitted July 12, 2026, last read July 22, and has a **Success** status with five discovered pages.
- The page-indexing report, last updated July 23, shows one indexed page and four pages with the reason **Discovered – currently not indexed**.
- URL inspection confirms that the homepage is indexed and eligible to appear in Google Search.
- On July 27, all four content pages were individually added to Google's priority crawl queue:
  - `/paint-by-numbers-vs-pbnify`
  - `/paint-by-numbers-generator-no-upload`
  - `/photo-to-paint-by-numbers-svg`
  - `/merge-split-paint-by-numbers-regions`

The public deployment and Search Console configuration are healthy. Google must now recrawl the four queued content pages.

## 2026-08-24 update

Internal linking gap closed (previously the only inbound link to the four content
pages was one homepage line pointing at `/paint-by-numbers-vs-pbnify`):

- Homepage (both the prerendered static HTML in `scripts/prerender-home.mjs` and the
  hydrated `AppShell.tsx`) now carries a "Guides & comparisons" section linking to all
  four content pages.
- The four content pages now cross-link to each other (full mesh) via a "Related
  guides" block added in `scripts/build-content-pages.mjs`.
- Verified all four pages carry substantive unique content (H1, lead, 2–4 H2 sections,
  lists), not thin stubs.

**Still needed (requires Search Console UI access, not done here):**
1. Request indexing individually in GSC for each of the four URLs, now that the links are live.
2. Check whether each currently reads **Discovered – currently not indexed** or
   **Crawled – currently not indexed** in the Page Indexing report.
3. Recheck `site:paintbynumbers.build` and the branded query after Google reprocesses.

## Follow-up

1. Recheck the page-indexing report after Google has had several days to process the priority crawl requests.
2. Confirm that the four content pages move out of **Discovered – currently not indexed**.
3. Recheck `site:paintbynumbers.build` and the branded query `paintbynumbers.build`.
4. ~~If pages remain unindexed, strengthen internal links to the four content pages~~ — done 2026-08-24, see above — and inspect Google's live-rendered HTML for each URL.

## Regression checks

The production build now runs a local indexability audit automatically. To audit a deployed site:

```powershell
npm run check:indexability:live
```
