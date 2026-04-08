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
            <h1 class="text-lg font-bold sm:text-xl">Paint by Numbers</h1>
          </div>
        </header>
        <main>
          <section class="mx-auto max-w-2xl px-4 py-8 sm:px-6">
            <div class="text-center">
              <h2 class="text-2xl font-bold text-gray-800">Turn any photo into a paint-by-numbers masterpiece</h2>
              <p class="mt-3 text-sm leading-relaxed text-gray-500">Upload a photo and this tool will analyse the colours, simplify the image into numbered regions, and generate a ready-to-print paint-by-numbers template — all inside your browser, with no data ever leaving your device.</p>
            </div>
          </section>

          <section class="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <article class="rounded-lg border border-gray-200 bg-white p-4">
                <h3 class="text-sm font-semibold text-gray-700">Smart colour quantization</h3>
                <p class="mt-1 text-xs leading-relaxed text-gray-500">Choose from K-Means or Median Cut algorithms to reduce your photo to the perfect set of colours.</p>
              </article>
              <article class="rounded-lg border border-gray-200 bg-white p-4">
                <h3 class="text-sm font-semibold text-gray-700">Custom palettes</h3>
                <p class="mt-1 text-xs leading-relaxed text-gray-500">Use a Crayola crayon preset or build your own palette from scratch.</p>
              </article>
              <article class="rounded-lg border border-gray-200 bg-white p-4">
                <h3 class="text-sm font-semibold text-gray-700">Region editing</h3>
                <p class="mt-1 text-xs leading-relaxed text-gray-500">Merge or split colour regions on the result to fine-tune the complexity of your painting.</p>
              </article>
              <article class="rounded-lg border border-gray-200 bg-white p-4">
                <h3 class="text-sm font-semibold text-gray-700">Export anywhere</h3>
                <p class="mt-1 text-xs leading-relaxed text-gray-500">Download the finished template as a PDF, PNG, or scalable SVG.</p>
              </article>
            </div>
          </section>

          <section class="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
            <div class="rounded-lg border border-gray-200 bg-white p-5">
              <h3 class="text-sm font-semibold text-gray-700">How to get started</h3>
              <ol class="mt-3 space-y-2 text-xs text-gray-600">
                <li><strong>1.</strong> Drag and drop an image below, click to browse, or paste from clipboard.</li>
                <li><strong>2.</strong> Adjust the palette size and other settings in the left-hand panel.</li>
                <li><strong>3.</strong> Click &quot;Generate Paint by Numbers&quot; to process the image.</li>
                <li><strong>4.</strong> Review and refine the result, then export your template.</li>
              </ol>
            </div>
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
