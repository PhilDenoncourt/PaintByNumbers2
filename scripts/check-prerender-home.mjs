import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distIndexPath = path.join(projectRoot, 'dist', 'index.html');

const requiredSnippets = [
  'Turn any photo into a paint-by-numbers masterpiece',
  'free paint-by-numbers generator turns any photo',
  '100% private — your photo never leaves your browser',
  'Instant download — nothing emailed, nothing uploaded',
  'Smart colour quantization',
  'How to get started',
  'Generate Paint by Numbers',
  'Frequently asked questions',
  'Do you upload my photo?',
];

async function main() {
  const html = await fs.readFile(distIndexPath, 'utf8');
  const missing = requiredSnippets.filter((snippet) => !html.includes(snippet));

  if (missing.length > 0) {
    console.error('Homepage prerender validation failed. Missing snippets:');
    for (const snippet of missing) {
      console.error(`- ${snippet}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('Homepage prerender validation passed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
