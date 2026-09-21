import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distIndexPath = path.join(projectRoot, 'dist', 'index.html');

const requiredSnippets = [
  'Split paint by numbers regions, merge small areas, and export SVG',
  'True vector SVG — crisp at any size',
  'Split regions by hand — merge small areas',
  'Download editable vector paths for Cricut',
  'Split broad regions to separate details',
  'Verify that your photo stays on your device',
  'Inspect network requests and try generating offline',
  'How to get started',
  'Generate Paint by Numbers',
  'Frequently asked questions',
  'Can I export a true vector SVG?',
  'Can I merge or split individual regions?',
  // Definition + quick-facts block: the surface AI assistants quote, and the
  // published specs (colour range, paper sizes) competitors already publish.
  'What is paint by numbers?',
  'Quick facts',
  '3&ndash;100 for an automatic palette',
  'A4, A3, A2, A1, A0, US Letter, and US Tabloid',
  'cut and engrave lines on separate layers',
];

const forbiddenSnippets = [
  'free paint-by-numbers generator turns any photo',
  '100% private — your photo never leaves your browser',
  'No sign-up or watermark',
];

async function main() {
  const html = await fs.readFile(distIndexPath, 'utf8');
  const missing = requiredSnippets.filter((snippet) => !html.includes(snippet));
  const forbidden = forbiddenSnippets.filter((snippet) => html.includes(snippet));

  if (missing.length > 0 || forbidden.length > 0) {
    console.error('Homepage prerender validation failed.');
  }

  if (missing.length > 0) {
    console.error('Missing snippets:');
    for (const snippet of missing) {
      console.error(`- ${snippet}`);
    }
  }

  if (forbidden.length > 0) {
    console.error('Old primary positioning is still present:');
    for (const snippet of forbidden) {
      console.error(`- ${snippet}`);
    }
  }

  if (missing.length > 0 || forbidden.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log('Homepage prerender validation passed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
