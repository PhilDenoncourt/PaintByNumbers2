import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

const SITE = 'https://www.paintbynumbers.build';

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
        <p><a href="/">← Back to the free paint by numbers generator</a></p>
        <p class="muted">Everything runs in your browser — your photo never leaves your device.</p>
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
  ['Choose algorithm (K-Means / Median Cut)', ['yes', 'Yes'], ['no', 'No'], ['no', 'No']],
  ['Match colours to Crayola paints', ['yes', 'Yes'], ['no', 'No'], ['no', 'Varies']],
  ['Merge &amp; split regions', ['yes', 'Yes'], ['no', 'No'], ['no', 'No']],
  ['Crop, rotate &amp; colour adjustments', ['yes', 'Yes'], ['no', 'Limited'], ['no', 'N/A']],
  ['No sign-up or watermark', ['yes', 'Yes'], ['yes', 'Yes'], ['no', 'Account &amp; checkout']],
  ['Open source', ['no', 'No'], ['yes', 'Yes'], ['no', 'No']],
];

const cell = ([cls, text]) => `<td class="${cls}">${text}</td>`;

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
      <h1>Free PBNify alternative: paint by numbers generator comparison</h1>
      <p class="lead">Looking for a free way to turn a photo into a paint-by-numbers template? Here's an honest look at how <strong>paintbynumbers.build</strong> compares to PBNify and to custom paint-by-numbers kit sites.</p>

      <h2>Feature comparison</h2>
${comparisonTable}
      <p class="muted">Comparison based on publicly available features as of June 2026. Competitor features change over time — if something here is out of date, we'd genuinely like to fix it.</p>

      <h2>Where paintbynumbers.build stands out</h2>
      <ul>
        <li><strong>True vector SVG export</strong> — scale or edit your template without it going blurry. Most free generators only give you a flat image. See our <a href="/photo-to-paint-by-numbers-svg">photo to paint by numbers SVG guide</a>.</li>
        <li><strong>Real paint matching</strong> — map every region to a Crayola crayon preset so your template uses colours you can actually buy.</li>
        <li><strong>More control</strong> — pick the quantization algorithm, then <a href="/merge-split-paint-by-numbers-regions">merge or split regions</a> to dial in exactly how detailed your painting is.</li>
        <li><strong>Private by design</strong> — the whole thing runs in your browser, even offline once loaded. Your photo is never uploaded. See our <a href="/paint-by-numbers-generator-no-upload">no-upload generator page</a>.</li>
        <li><strong>Instant, nothing emailed</strong> — your template downloads immediately. We never ask for your email or send it to you later.</li>
      </ul>

      <h2>When PBNify or a kit might suit you better</h2>
      <p>We think it's only fair to say: <strong>PBNify</strong> is open source, so if you want to read or self-host the code, it's a great choice. And if you'd rather not paint from your own printout at all, a <strong>custom kit site</strong> will print your image on canvas and ship it with matched paints and brushes — a finished product, for a price.</p>
      <p>But if you want a free, private template — especially one you can export as a clean SVG — give ours a try.</p>

      <a class="cta" href="/">Create your paint by numbers template →</a>`;

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
      <h1>Free paint by numbers generator — no upload, no sign-up, works offline</h1>
      <p class="lead"><strong>paintbynumbers.build</strong> turns a photo into a paint-by-numbers template entirely inside your browser. There's no upload, no account, no email address, and once the page has loaded the generator keeps working even if you lose your connection.</p>

      <h2>Why "no upload" matters</h2>
      <p>Most free paint-by-numbers tools send your photo to a server to do the colour processing, then send a result back. That means a copy of your photo — often a picture of your kid, your pet, or your home — sits on someone else's machine. paintbynumbers.build never does that: every step (colour quantization, region detection, contour tracing, labelling) runs as JavaScript in your own browser tab.</p>

      <h2>It works offline, too</h2>
      <p>Because nothing is sent to a server, the generator keeps working without an internet connection once the page and its assets have loaded. Open it, load your photo from local storage, and you can generate and export a template on a plane, on a train, or anywhere else without signal.</p>

      <h2>No sign-up, no watermark, no email</h2>
      <ul>
        <li>No account or sign-up required.</li>
        <li>No watermark on your exported template.</li>
        <li>No email address requested, and nothing is ever emailed to you — your download is instant.</li>
        <li>No usage limits or paywalled features.</li>
      </ul>

      <p>Want to see exactly how this compares to other free generators? Read our <a href="/paint-by-numbers-vs-pbnify">paint by numbers generator comparison</a>, or learn about our <a href="/photo-to-paint-by-numbers-svg">scalable SVG export</a>.</p>

      <a class="cta" href="/">Try the private, no-upload generator →</a>`;

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
      <h1>Photo to paint by numbers SVG — free vector export</h1>
      <p class="lead">Turn any photo into a paint-by-numbers template and export it as a true vector <strong>SVG</strong> — not just a flat PDF or PNG.</p>

      <h2>Why SVG beats a flat PDF or PNG</h2>
      <ul>
        <li><strong>Scales without blurring</strong> — print your template at poster size or shrink it to a postcard, and every outline and number stays crisp.</li>
        <li><strong>Editable</strong> — open the SVG in Illustrator, Inkscape, or any vector editor to tweak regions, colours, or labels after export.</li>
        <li><strong>Great for laser/vinyl cutters and Cricut</strong> — vector paths are exactly what cutting machines expect.</li>
        <li><strong>Small file size</strong> — region outlines are just paths and numbers, not pixels.</li>
      </ul>

      <h2>How to export your template as SVG</h2>
      <ol>
        <li>Upload your photo — it's processed locally, never uploaded.</li>
        <li>Adjust the palette and detail level until you're happy with the regions.</li>
        <li>Open the export panel and choose <strong>SVG</strong> (PDF and PNG are also available).</li>
        <li>Download — the file is generated instantly, nothing is emailed.</li>
      </ol>

      <p>Most free paint-by-numbers generators only offer a flat image export. See the full breakdown in our <a href="/paint-by-numbers-vs-pbnify">generator comparison</a>.</p>

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
      <h1>Merge &amp; split paint by numbers regions — fine-tune your template</h1>
      <p class="lead">Auto-generated colour regions aren't always exactly what you want. paintbynumbers.build lets you <strong>merge</strong> small or unwanted regions together, or <strong>split</strong> a region that's too broad — directly on the generated result.</p>

      <h2>Why region editing matters</h2>
      <p>Automatic quantization sometimes leaves tiny flecks of colour in a smooth area, or lumps two visually distinct areas into one region. No competitor we've found offers manual region clean-up — you either accept the algorithm's output or start over with different settings. Region editing lets you fix it directly instead.</p>

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

const PAGES = [
  {
    slug: 'paint-by-numbers-vs-pbnify',
    title: 'Free PBNify Alternative – Paint by Numbers Generator Comparison',
    description:
      'A fair comparison of paintbynumbers.build vs PBNify and custom kit sites — free, private, in-browser, with SVG, PDF and PNG export.',
    bodyHtml: comparisonBody,
    structuredData: comparisonStructuredData,
  },
  {
    slug: 'paint-by-numbers-generator-no-upload',
    title: 'Free Paint by Numbers Generator — No Upload, No Sign-Up, Works Offline',
    description:
      'Turn a photo into a paint-by-numbers template entirely in your browser. No upload, no account, no email, and it keeps working offline.',
    bodyHtml: noUploadBody,
    structuredData: noUploadStructuredData,
  },
  {
    slug: 'photo-to-paint-by-numbers-svg',
    title: 'Photo to Paint by Numbers SVG — Free Vector Export',
    description:
      'Turn a photo into a paint-by-numbers template and export a true vector SVG, free — scalable, editable, and ready for cutting machines.',
    bodyHtml: svgBody,
    structuredData: svgStructuredData,
  },
  {
    slug: 'merge-split-paint-by-numbers-regions',
    title: 'Merge & Split Paint by Numbers Regions — Free Region Editor',
    description:
      'Fine-tune your paint-by-numbers template by merging or splitting auto-generated colour regions, free and in-browser.',
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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
