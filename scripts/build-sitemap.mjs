import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, PAGES } from './build-content-pages.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

function buildSitemap() {
  const urls = [
    { loc: `${SITE}/`, changefreq: 'weekly', priority: '1.0' },
    ...PAGES.map((page) => ({ loc: `${SITE}/${page.slug}`, changefreq: 'monthly', priority: '0.7' })),
  ];

  const entries = urls
    .map(
      ({ loc, changefreq, priority }) =>
        `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

function buildRobots() {
  // The llms.txt pointer is a comment: it is not part of the robots.txt grammar,
  // but it is where several assistant crawlers look for one.
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n\n# llms.txt: ${SITE}/llms.txt\n`;
}

async function main() {
  await fs.writeFile(path.join(distDir, 'sitemap.xml'), buildSitemap(), 'utf8');
  await fs.writeFile(path.join(distDir, 'robots.txt'), buildRobots(), 'utf8');
  console.log(`Built sitemap.xml and robots.txt for ${SITE}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
