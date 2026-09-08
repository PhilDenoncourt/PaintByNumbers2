import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

const env = loadEnv('production', projectRoot, '');
export const SITE = env.VITE_SITE_URL;
if (!SITE) {
  throw new Error('VITE_SITE_URL is not set — check .env.production');
}

const STYLE = `
:root{color-scheme:light dark}
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#0f172a;background:#f1f5f9;line-height:1.6}
a{color:#2563eb}
header.site{background:#fff;border-bottom:1px solid #e2e8f0}
header.site .bar{max-width:880px;margin:0 auto;padding:14px 16px;display:flex;align-items:center;gap:10px}
.logo{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#2563eb,#16a34a);color:#fff;font-weight:700;display:grid;place-items:center;text-decoration:none}
.brand{font-weight:700}
.wrap{max-width:880px;margin:0 auto;padding:8px 16px 64px}
h1{font-size:1.9rem;line-height:1.2;margin:28px 0 8px}
h2{font-size:1.25rem;margin:34px 0 8px}
.lead{color:#475569;font-size:1.05rem}
table{width:100%;border-collapse:collapse;margin:18px 0;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}
th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #eef2f7;font-size:.92rem;vertical-align:top}
thead th{background:#f8fafc;font-size:.78rem;text-transform:uppercase;letter-spacing:.03em;color:#64748b}
tbody th{font-weight:600}
td.yes{color:#16a34a;font-weight:600}
td.no{color:#94a3b8}
.cta{display:inline-block;margin-top:22px;background:#16a34a;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700}
.muted{color:#64748b;font-size:.85rem}
ul{padding-left:1.1rem}
footer{margin-top:44px;padding-top:16px;border-top:1px solid #e2e8f0;color:#64748b;font-size:.85rem}
@media(prefers-color-scheme:dark){
  body{background:#0f172a;color:#e2e8f0}
  header.site{background:#1e293b;border-color:#334155}
  table{background:#1e293b;border-color:#334155}
  thead th{background:#334155;color:#cbd5e1}
  th,td{border-color:#334155}
  .muted,.lead,footer{color:#94a3b8}
  footer{border-color:#334155}
}`;

function layout({ slug, title, description, bodyHtml, structuredData }) {
  const canonical = `${SITE}/${slug}`;
  const ld = JSON.stringify(structuredData);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonical}" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="theme-color" content="#ffffff" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:site_name" content="Paint by Numbers" />
    <meta property="og:image" content="${SITE}/social-preview.svg" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${SITE}/social-preview.svg" />
    <script type="application/ld+json">${ld}</script>
    <style>${STYLE}</style>
  </head>
  <body>
    <header class="site">
      <div class="bar">
        <a class="logo" href="/" aria-label="Paint by Numbers home">P</a>
        <a class="brand" href="/" style="text-decoration:none;color:inherit">Paint by Numbers</a>
      </div>
    </header>
    <main class="wrap">
${bodyHtml}
      <footer>
        <p><a href="/">← Back to the paint-by-numbers editor</a></p>
        <p class="muted">Export true vector SVGs and refine individual regions with manual merge and split controls.</p>
      </footer>
    </main>
  </body>
</html>`;
}

// ---- Page: PBNify alternative / comparison ---------------------------------

const COMPARISON_ROWS = [
  ['Price', ['yes', 'Free'], ['yes', 'Free'], ['no', 'Paid (physical kit)']],
  ['Runs in your browser (no upload)', ['yes', 'Yes'], ['yes', 'Yes'], ['no', 'No — server-side']],
  ['Your photo stays private', ['yes', 'Yes'], ['yes', 'Yes'], ['no', 'Uploaded to order']],
  ['Instant download — nothing emailed to you', ['yes', 'Yes'], ['no', 'Emails you the PDF'], ['no', 'N/A']],
  ['Vector SVG export', ['yes', 'Yes'], ['no', 'No'], ['no', 'N/A']],
  ['Printable PDF &amp; PNG export', ['yes', 'Yes'], ['no', 'Image only'], ['no', 'Ships physical canvas']],
  ['Color style controls', ['yes', 'Natural blend or defined blocks'], ['no', 'No'], ['no', 'No']],
  ['Match colours to Crayola paints', ['yes', 'Yes'], ['no', 'No'], ['no', 'Varies']],
  ['Merge &amp; split regions', ['yes', 'Yes'], ['no', 'No'], ['no', 'No']],
  ['Crop, rotate &amp; colour adjustments', ['yes', 'Yes'], ['no', 'Limited'], ['no', 'N/A']],
  ['No sign-up or watermark', ['yes', 'Yes'], ['yes', 'Yes'], ['no', 'Account &amp; checkout']],
  ['Open source', ['no', 'No'], ['yes', 'Yes'], ['no', 'No']],
];

const cell = ([cls, text]) => `<td class="${cls}">${text}</td>`;

// ---- Cross-linking: every content page links to the other three -------------

const GUIDES = [
  {
    slug: 'paint-by-numbers-vs-pbnify',
    title: 'Paint by numbers generator comparison',
    blurb: 'how this editor stacks up against PBNify and custom kit sites.',
  },
  {
    slug: 'paint-by-numbers-generator-no-upload',
    title: 'No-upload processing, and how to verify it',
    blurb: 'check for yourself that your photo never leaves your device.',
  },
  {
    slug: 'photo-to-paint-by-numbers-svg',
    title: 'Photo to paint by numbers SVG',
    blurb: 'export a true vector template for Cricut, lasers, and murals.',
  },
  {
    slug: 'merge-split-paint-by-numbers-regions',
    title: 'Merge & split paint-by-numbers regions',
    blurb: 'manually clean up auto-generated regions.',
  },
];

const relatedGuidesBlock = (currentSlug) => `
      <h2>Related guides</h2>
      <ul>
${GUIDES.filter((g) => g.slug !== currentSlug)
  .map((g) => `        <li><a href="/${g.slug}">${g.title}</a> — ${g.blurb}</li>`)
  .join('\n')}
      </ul>`;

const comparisonTable = `
      <table>
        <thead>
          <tr>
            <th scope="col">Feature</th>
            <th scope="col">paintbynumbers.build</th>
            <th scope="col">PBNify</th>
            <th scope="col">Custom kit sites</th>
          </tr>
        </thead>
        <tbody>
${COMPARISON_ROWS.map(
  ([label, a, b, c]) =>
    `          <tr><th scope="row">${label}</th>${cell(a)}${cell(b)}${cell(c)}</tr>`,
).join('\n')}
        </tbody>
      </table>`;

const comparisonBody = `
      <h1>PBNify alternative with SVG export and manual region editing</h1>
      <p class="lead">Need an editable vector template instead of a flat preview? Here's how <strong>paintbynumbers.build</strong> compares with PBNify and custom kit sites on SVG output and direct control over individual regions.</p>

      <h2>Feature comparison</h2>
${comparisonTable}
      <p class="muted">Comparison based on publicly available features as of June 2026. Competitor features change over time — if something here is out of date, we'd genuinely like to fix it.</p>

      <h2>Where paintbynumbers.build stands out</h2>
      <ul>
        <li><strong>True vector SVG export</strong> — scale or edit your template without it going blurry. Send the paths to Cricut, laser-cutting, vinyl, or mural workflows. See our <a href="/photo-to-paint-by-numbers-svg">photo to paint by numbers SVG guide</a>.</li>
        <li><strong>Manual merge and split controls</strong> — <a href="/merge-split-paint-by-numbers-regions">edit individual regions</a> instead of accepting a global smoothing result or starting over.</li>
      </ul>
      <p>Paint matching, browser processing, and direct downloads remain useful supporting capabilities. They are included in the table for completeness, but SVG output and manual region editing are the reasons to choose this editor.</p>

      <h2>When PBNify or a kit might suit you better</h2>
      <p>We think it's only fair to say: <strong>PBNify</strong> is open source, so if you want to read or self-host the code, it's a great choice. And if you'd rather not paint from your own printout at all, a <strong>custom kit site</strong> will print your image on canvas and ship it with matched paints and brushes — a finished product, for a price.</p>
      <p>But if you want true vector output and direct control over the generated regions, this editor is built for that workflow.</p>
${relatedGuidesBlock('paint-by-numbers-vs-pbnify')}
      <a class="cta" href="/">Create and edit your SVG template →</a>`;

const comparisonStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Paint by Numbers Generator Comparison',
      item: `${SITE}/paint-by-numbers-vs-pbnify`,
    },
  ],
};

// ---- Page: No-upload / offline generator ------------------------------------

const noUploadBody = `
      <h1>No-upload paint by numbers: how to verify it yourself</h1>
      <p class="lead">"Runs locally in your browser" has become a standard line — several free generators now print it. It is an easy claim to make and a hard one to check, so this page does not ask you to take our word for it. Here is how to confirm it, in about thirty seconds, with tools already built into your browser.</p>

      <h2>Check 1 &mdash; watch the network while it works</h2>
      <ol>
        <li>Open your browser's developer tools (<strong>F12</strong>, or <strong>&#8984;&#8997;I</strong> on a Mac) and choose the <strong>Network</strong> tab.</li>
        <li>Go to <a href="/">the editor</a>, let it finish loading, then clear the request list.</li>
        <li>Load a photo and click Generate. Merge a few regions. Export the SVG.</li>
        <li>Sort the list by <strong>Size</strong>.</li>
      </ol>
      <p>Two things to look at. First, <strong>nothing leaving the page is bigger than a few kilobytes</strong> &mdash; your photo is megabytes, so it plainly is not among them. Second, <strong>not one request goes to paintbynumbers.build</strong> after the page has loaded: there is no upload endpoint to send a photo to, because there is no server behind this site. It is a set of static files.</p>
      <p>You will see a handful of small pings to Google Analytics, a few hundred bytes each. Those are visit counts, and every request the site makes is listed in full below. Everything else is silence.</p>
      <p class="muted">If you would rather read the source than the traffic: the application code contains no <code>fetch()</code> call, no <code>XMLHttpRequest</code>, and no form submission anywhere.</p>

      <h2>Check 2 — turn your network off</h2>
      <ol>
        <li>Load the editor, generate one template and export it once, so every part of the app has loaded.</li>
        <li>Switch your network off — <strong>Network &rarr; Offline</strong> in developer tools, or just turn off Wi-Fi.</li>
        <li>Load a different photo and generate again. Merge some regions. Export the SVG.</li>
      </ol>
      <p>All of it still works, with no connection at all. That is only possible if the processing is happening on your machine.</p>

      <h2>Every request this site makes, and what it is for</h2>
      <p>The strongest version of a privacy claim is a complete list, so here is ours. This is every network request the site makes, and none of them carries your photo.</p>
      <table>
        <thead>
          <tr>
            <th scope="col">Request</th>
            <th scope="col">What it is for</th>
            <th scope="col">Sees your photo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">paintbynumbers.build</th>
            <td>The page itself, plus its JavaScript, CSS, and icons. Static files.</td>
            <td class="no">No</td>
          </tr>
          <tr>
            <th scope="row">fonts.googleapis.com, fonts.gstatic.com</th>
            <td>Web fonts.</td>
            <td class="no">No</td>
          </tr>
          <tr>
            <th scope="row">googletagmanager.com</th>
            <td>Google Analytics, with IP anonymisation on. Counts visits and which export buttons get used. No photo, no image data, no account.</td>
            <td class="no">No</td>
          </tr>
          <tr>
            <th scope="row">amazon.com</th>
            <td>Only if you click a paint-set link. These are affiliate links; nothing loads from Amazon unless you choose to follow one.</td>
            <td class="no">No</td>
          </tr>
        </tbody>
      </table>
      <p>That is the entire list. We would rather disclose the analytics than claim a purity we do not have — the point that matters is the one you can check: <strong>no request carries your image, because no request is ever made with it.</strong></p>

      <h2>What actually happens to your photo</h2>
      <ul>
        <li>Your browser's file picker hands the page a local file reference. Nothing is transferred anywhere.</li>
        <li>The file is decoded into a canvas and read as raw pixel data, in your tab's memory.</li>
        <li>Palette reduction, region detection, contour tracing, and number placement run in Web Workers — background threads inside your own browser, on your own processor.</li>
        <li>Merging and splitting regions recomputes the affected outlines locally.</li>
        <li>The SVG, PDF, and PNG files are assembled in the page and handed straight to your browser's download mechanism.</li>
      </ul>
      <p>Close the tab and every trace of the image is gone. There is nothing to delete from a server, because nothing ever reached one.</p>

      <h2>Why this is worth checking at all</h2>
      <p>Most free paint-by-numbers tools do send your photo to a server, process it there, and send a result back — which means a copy of a picture of your kid, your pet, or your home sits on someone else's machine. Increasingly, tools that <em>do</em> work that way describe themselves in language that sounds local. The two checks above take under a minute and settle it either way, for this site or any other.</p>

      <p>The processing model is the floor, not the reason to use this editor. The reasons are <a href="/merge-split-paint-by-numbers-regions">manual control over individual regions</a> and <a href="/photo-to-paint-by-numbers-svg">true vector SVG export</a>. See the full <a href="/paint-by-numbers-vs-pbnify">paint by numbers generator comparison</a>.</p>
${relatedGuidesBlock('paint-by-numbers-generator-no-upload')}
      <a class="cta" href="/">Create an editable SVG template &rarr;</a>`;

const noUploadStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'No-Upload Paint by Numbers Generator',
      item: `${SITE}/paint-by-numbers-generator-no-upload`,
    },
  ],
};

// ---- Page: Photo to paint by numbers SVG -------------------------------------

const svgBody = `
      <h1>Photo to paint by numbers SVG for Cricut, lasers, and murals</h1>
      <p class="lead">Turn a photo into a paint-by-numbers template, refine individual regions with manual merge and split controls, then export a true vector <strong>SVG</strong> instead of a flat raster image.</p>

      <h2>Why SVG beats a flat PDF or PNG</h2>
      <ul>
        <li><strong>Scales without blurring</strong> — print your template at poster size or shrink it to a postcard, and every outline and number stays crisp.</li>
        <li><strong>Editable</strong> — open the SVG in Illustrator, Inkscape, or any vector editor to tweak regions, colours, or labels after export.</li>
        <li><strong>Great for laser/vinyl cutters and Cricut</strong> — vector paths are exactly what cutting machines expect.</li>
        <li><strong>Small file size</strong> — region outlines are just paths and numbers, not pixels.</li>
      </ul>

      <h2>How to export your template as SVG</h2>
      <ol>
        <li>Upload your photo and generate the numbered regions.</li>
        <li>Adjust the palette and detail level until you're happy with the regions.</li>
        <li>Merge unwanted fragments or split broad regions in the Refine step.</li>
        <li>Open the export panel and choose <strong>SVG</strong> (PDF and PNG are also available).</li>
      </ol>

      <p>Raster-first paint-by-numbers tools cannot preserve editable paths at mural or cutting-machine scale. See the full breakdown in our <a href="/paint-by-numbers-vs-pbnify">generator comparison</a>.</p>
${relatedGuidesBlock('photo-to-paint-by-numbers-svg')}
      <a class="cta" href="/">Create your paint by numbers SVG →</a>`;

const svgStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Photo to Paint by Numbers SVG',
      item: `${SITE}/photo-to-paint-by-numbers-svg`,
    },
  ],
};

// ---- Page: Merge & split regions ---------------------------------------------

const mergeSplitBody = `
      <h1>Manual merge &amp; split controls for paint-by-numbers regions</h1>
      <p class="lead">Auto-generated colour regions aren't always exactly what you want. <strong>Merge</strong> small or unwanted regions, <strong>split</strong> areas that are too broad, then preserve those edits in a true vector SVG.</p>

      <h2>Why region editing matters</h2>
      <p>Automatic processing sometimes leaves tiny flecks of colour in a smooth area, or lumps two visually distinct areas into one region. Most generators give you a detail slider and nothing else: you either accept the automatic result or start over with different settings. Region editing lets you fix it directly instead.</p>
      <p class="muted">To be accurate about it: we are not the only tool that can merge segments &mdash; Mimi Panda has a segment editor too, though it processes on a server and is paid beyond a couple of conversions a week. What we have not found anywhere else is <strong>splitting</strong> a region, and free, unlimited region editing that runs on your own machine. Checked September 2026.</p>

      <h2>How to merge regions</h2>
      <ol>
        <li>Generate your template, then switch to the <strong>Merge</strong> tool in the Refine step.</li>
        <li>Click two adjacent regions to select them.</li>
        <li>Confirm the merge — the regions combine into one, and the colour count updates.</li>
      </ol>

      <h2>How to split a region</h2>
      <ol>
        <li>Switch to the <strong>Split</strong> tool.</li>
        <li>Click a region that's too large or contains more than one colour you'd like to separate.</li>
        <li>The tool analyses the region's colour variance and proposes a split.</li>
      </ol>

      <p>Pair region editing with a <a href="/photo-to-paint-by-numbers-svg">vector SVG export</a> so your edits stay crisp at any print size.</p>
${relatedGuidesBlock('merge-split-paint-by-numbers-regions')}
      <a class="cta" href="/">Try the region editor →</a>`;

const mergeSplitStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Merge & Split Paint by Numbers Regions',
      item: `${SITE}/merge-split-paint-by-numbers-regions`,
    },
  ],
};

export const PAGES = [
  {
    slug: 'paint-by-numbers-vs-pbnify',
    title: 'PBNify Alternative with SVG Export & Manual Region Editing',
    description:
      'Compare paintbynumbers.build with PBNify on true vector SVG export and manual merge and split controls for individual paint-by-numbers regions.',
    bodyHtml: comparisonBody,
    structuredData: comparisonStructuredData,
  },
  {
    slug: 'paint-by-numbers-generator-no-upload',
    title: 'No-Upload Paint by Numbers Generator — And How to Verify It',
    description:
      'Every generator now claims local processing. Check this one in 30 seconds: an empty network tab, an offline test, and the full list of requests the site makes.',
    bodyHtml: noUploadBody,
    structuredData: noUploadStructuredData,
  },
  {
    slug: 'photo-to-paint-by-numbers-svg',
    title: 'Photo to Paint by Numbers SVG for Cricut, Lasers & Murals',
    description:
      'Create an editable paint-by-numbers SVG for Cricut, laser cutting, vinyl, murals, and oversized prints, with manual region refinement before export.',
    bodyHtml: svgBody,
    structuredData: svgStructuredData,
  },
  {
    slug: 'merge-split-paint-by-numbers-regions',
    title: 'Manual Merge & Split Controls for Paint by Numbers Regions',
    description:
      'Fine-tune individual paint-by-numbers regions with manual merge and split controls, then preserve the edited result in a true vector SVG.',
    bodyHtml: mergeSplitBody,
    structuredData: mergeSplitStructuredData,
  },
];

async function main() {
  for (const page of PAGES) {
    const html = layout(page);
    const dir = path.join(distDir, page.slug);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'index.html'), html, 'utf8');
    console.log(`Built content page: /${page.slug}`);
  }
}

const isMain = path.resolve(process.argv[1] ?? '') === __filename;
if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
