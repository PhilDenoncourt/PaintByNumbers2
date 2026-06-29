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
        <li><strong>True vector SVG export</strong> — scale or edit your template without it going blurry. Most free generators only give you a flat image.</li>
        <li><strong>Real paint matching</strong> — map every region to a Crayola crayon preset so your template uses colours you can actually buy.</li>
        <li><strong>More control</strong> — pick the quantization algorithm, then merge or split regions to dial in exactly how detailed your painting is.</li>
        <li><strong>Private by design</strong> — the whole thing runs in your browser. Your photo is never uploaded.</li>
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

const PAGES = [
  {
    slug: 'paint-by-numbers-vs-pbnify',
    title: 'Free PBNify Alternative – Paint by Numbers Generator Comparison',
    description:
      'A fair comparison of paintbynumbers.build vs PBNify and custom kit sites — free, private, in-browser, with SVG, PDF and PNG export.',
    bodyHtml: comparisonBody,
    structuredData: comparisonStructuredData,
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
