import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distIndexPath = path.join(projectRoot, 'dist', 'index.html');

const prerenderMarkup = `
    <div id="root">
      <div class="min-h-screen bg-gray-50 text-gray-900">
        <header class="border-b border-gray-200 bg-white">
          <div class="mx-auto max-w-6xl px-4 py-4 sm:px-6">
            <div class="text-lg font-bold sm:text-xl">Paint by Numbers</div>
          </div>
        </header>
        <main>
          <section class="mx-auto max-w-2xl px-4 py-8 sm:px-6">
            <div class="text-center">
              <div class="flex flex-wrap items-center justify-center gap-2 mb-3">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-700">📐 True vector SVG — crisp at any size</span>
                <span class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-700">✂️ Manual region control — merge and split</span>
              </div>
              <h1 class="text-2xl font-bold text-gray-800">Create an SVG paint-by-numbers template with manual merge and split controls</h1>
              <p class="mt-3 text-sm leading-relaxed text-gray-500">Shape every numbered region before you export: merge tiny areas, split broad ones, and download a true vector SVG for Cricut, laser cutting, murals, or any print size.</p>
            </div>
          </section>

          <section class="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <article class="rounded-lg border border-gray-200 bg-white p-4">
                <h3 class="text-sm font-semibold text-gray-700">True vector SVG export</h3>
                <p class="mt-1 text-xs leading-relaxed text-gray-500">Download editable vector paths for Cricut, laser cutting, vinyl, murals, or any print size.</p>
              </article>
              <article class="rounded-lg border border-gray-200 bg-white p-4">
                <h3 class="text-sm font-semibold text-gray-700">Manual merge and split</h3>
                <p class="mt-1 text-xs leading-relaxed text-gray-500">Click individual regions to combine unwanted fragments or split broad areas before export.</p>
              </article>
              <article class="rounded-lg border border-gray-200 bg-white p-4">
                <h3 class="text-sm font-semibold text-gray-700">Match your own paints</h3>
                <p class="mt-1 text-xs leading-relaxed text-gray-500">Map every region to a Crayola crayon preset, or build your own custom palette from scratch.</p>
              </article>
              <article class="rounded-lg border border-gray-200 bg-white p-4">
                <h3 class="text-sm font-semibold text-gray-700">Print-ready PDF and PNG</h3>
                <p class="mt-1 text-xs leading-relaxed text-gray-500">Export an outline template or a coloured reference in the format that fits your painting workflow.</p>
              </article>
            </div>
          </section>

          <section class="mx-auto max-w-4xl px-4 pb-8 sm:px-6">
            <div class="rounded-lg border border-gray-200 bg-white p-5">
              <h3 class="text-sm font-semibold text-gray-700">How to get started</h3>
              <ol class="mt-3 space-y-2 text-xs text-gray-600">
                <li><strong>1.</strong> Drag and drop an image below, click to browse, or paste from clipboard.</li>
                <li><strong>2.</strong> Adjust the palette size and other settings in the left-hand panel.</li>
                <li><strong>3.</strong> Click &quot;Generate Paint by Numbers&quot; to process the image.</li>
                <li><strong>4.</strong> Merge or split any regions, then export your template as SVG, PDF, or PNG.</li>
              </ol>
            </div>
          </section>

          <section class="mx-auto max-w-4xl px-4 pb-8 sm:px-6">
            <div class="rounded-lg border border-gray-200 bg-white p-5">
              <h3 class="text-sm font-semibold text-gray-700">Frequently asked questions</h3>
              <dl class="mt-3 space-y-3 text-xs">
                <div>
                  <dt class="font-semibold text-gray-700">Can I export a true vector SVG?</dt>
                  <dd class="mt-1 text-gray-500">Yes. Export editable SVG paths that stay crisp for Cricut, laser cutting, murals, and oversized prints.</dd>
                </div>
                <div>
                  <dt class="font-semibold text-gray-700">Can I merge or split individual regions?</dt>
                  <dd class="mt-1 text-gray-500">Yes. Refine the generated template by merging small regions or splitting broad ones before export.</dd>
                </div>
                <div>
                  <dt class="font-semibold text-gray-700">What else can I export?</dt>
                  <dd class="mt-1 text-gray-500">Export your finished template as a printable PDF, a PNG image, or a scalable SVG.</dd>
                </div>
                <div>
                  <dt class="font-semibold text-gray-700">Can I use my own colors or match real paints?</dt>
                  <dd class="mt-1 text-gray-500">Yes. Build a custom palette or map each region to a Crayola crayon preset.</dd>
                </div>
                <div>
                  <dt class="font-semibold text-gray-700">What kind of photo works best?</dt>
                  <dd class="mt-1 text-gray-500">Photos with a clear subject and strong contrast work best. Fewer colors make simpler templates.</dd>
                </div>
              </dl>
            </div>
          </section>

          <section class="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
            <p class="text-center text-xs text-gray-500">Comparing editors? See how SVG export and manual region controls stack up in our <a class="font-semibold text-blue-600 underline" href="/paint-by-numbers-vs-pbnify">paint by numbers generator comparison</a>.</p>
          </section>
        </main>
      </div>
    </div>`;

const injectionRegex = /<div id="root"><\/div>/;

async function main() {
  let html = await fs.readFile(distIndexPath, 'utf8');

  if (!injectionRegex.test(html)) {
    throw new Error('Could not find empty #root container in dist/index.html');
  }

  html = html.replace(injectionRegex, prerenderMarkup);
  await fs.writeFile(distIndexPath, html, 'utf8');
  console.log('Prerendered homepage content into dist/index.html');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
