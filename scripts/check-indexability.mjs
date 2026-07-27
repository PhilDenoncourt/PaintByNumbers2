import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES, SITE } from './build-content-pages.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const localeDir = path.join(projectRoot, 'src', 'i18n', 'locales');
const verificationFile = 'googlefc903bca6f6705cc.html';
const verificationBody = `google-site-verification: ${verificationFile}`;
const homeUrl = `${SITE}/`;
const expectedUrls = [homeUrl, ...PAGES.map((page) => `${SITE}/${page.slug}`)];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return match?.[1] ?? null;
}

function assertIndexableHtml(html, expectedCanonical, label) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of metaTags) {
    const name = readAttribute(tag, 'name')?.toLowerCase();
    if (name !== 'robots' && name !== 'googlebot') {
      continue;
    }

    const content = readAttribute(tag, 'content')?.toLowerCase() ?? '';
    assert(!/\b(?:noindex|nofollow|none)\b/.test(content), `${label} blocks crawlers with ${name}="${content}"`);
  }

  const canonicalTags = html.match(/<link\b[^>]*>/gi) ?? [];
  const canonicalUrls = canonicalTags
    .filter((tag) => readAttribute(tag, 'rel')?.toLowerCase() === 'canonical')
    .map((tag) => readAttribute(tag, 'href'));

  assert(
    canonicalUrls.length === 1 && canonicalUrls[0] === expectedCanonical,
    `${label} must have exactly one canonical URL pointing to ${expectedCanonical}`,
  );
  assert(!html.includes('%VITE_'), `${label} contains an unresolved Vite environment placeholder`);
  assert(/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html), `${label} does not contain an H1`);
  assert(
    !/\bk[- ]?means\b|\bmedian[- ]?cut\b/i.test(html),
    `${label} exposes implementation-specific color algorithm names`,
  );
}

function assertHomepagePositioning(html, label) {
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '';
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '';
  const descriptionTag = (html.match(/<meta\b[^>]*>/gi) ?? []).find(
    (tag) => readAttribute(tag, 'name')?.toLowerCase() === 'description',
  );
  const description = descriptionTag ? (readAttribute(descriptionTag, 'content') ?? '') : '';

  for (const [field, value] of [
    ['title', title],
    ['meta description', description],
    ['H1', h1],
  ]) {
    assert(/\bsvg\b/i.test(value), `${label} ${field} must lead with SVG/vector export`);
    assert(/\bmerge\b/i.test(value), `${label} ${field} must mention manual region merging`);
    assert(/\bsplit\b/i.test(value), `${label} ${field} must mention manual region splitting`);
    assert(
      !/\b(?:free|private|no[- ]?sign[- ]?up|no[- ]?watermark)\b/i.test(value),
      `${label} ${field} still leads with an old parity claim`,
    );
  }
}

async function assertLocaleCopy() {
  const localeFiles = (await fs.readdir(localeDir)).filter((file) => file.endsWith('.json'));

  for (const localeFile of localeFiles) {
    const locale = JSON.parse(await fs.readFile(path.join(localeDir, localeFile), 'utf8'));
    const values = [];
    const collectValues = (value) => {
      if (typeof value === 'string') {
        values.push(value);
      } else if (Array.isArray(value)) {
        value.forEach(collectValues);
      } else if (value && typeof value === 'object') {
        Object.values(value).forEach(collectValues);
      }
    };

    collectValues(locale);
    assert(
      !values.some((value) => /\bk[- ]?means\b|\bmedian[- ]?cut\b/i.test(value)),
      `${localeFile} exposes implementation-specific color algorithm names`,
    );
  }
}

function assertRobots(robots) {
  assert(/^User-agent:\s*\*$/im.test(robots), 'robots.txt is missing the wildcard user agent');
  assert(/^Allow:\s*\/\s*$/im.test(robots), 'robots.txt does not explicitly allow crawling');
  assert(!/^Disallow:\s*\/\s*$/im.test(robots), 'robots.txt blocks the entire site');
  assert(
    new RegExp(`^Sitemap:\\s*${homeUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}sitemap\\.xml\\s*$`, 'im').test(robots),
    `robots.txt does not advertise ${homeUrl}sitemap.xml`,
  );
}

function assertSitemap(sitemap) {
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert(urls.length === expectedUrls.length, `sitemap.xml should contain ${expectedUrls.length} URLs, found ${urls.length}`);
  assert(new Set(urls).size === urls.length, 'sitemap.xml contains duplicate URLs');

  for (const expectedUrl of expectedUrls) {
    assert(urls.includes(expectedUrl), `sitemap.xml is missing ${expectedUrl}`);
  }
}

async function fetchText(url, expectedContentType) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'PaintByNumbers-Indexability-Audit/1.0' },
    redirect: 'follow',
  });

  assert(response.ok, `${url} returned HTTP ${response.status}`);
  assert(response.url === url, `${url} redirected to ${response.url}`);

  const contentType = response.headers.get('content-type') ?? '';
  assert(contentType.includes(expectedContentType), `${url} returned unexpected content type "${contentType}"`);

  const xRobotsTag = response.headers.get('x-robots-tag')?.toLowerCase() ?? '';
  assert(!/\b(?:noindex|nofollow|none)\b/.test(xRobotsTag), `${url} blocks crawlers with X-Robots-Tag: ${xRobotsTag}`);

  return response.text();
}

async function auditDist() {
  const [homeHtml, robots, sitemap, verification] = await Promise.all([
    fs.readFile(path.join(distDir, 'index.html'), 'utf8'),
    fs.readFile(path.join(distDir, 'robots.txt'), 'utf8'),
    fs.readFile(path.join(distDir, 'sitemap.xml'), 'utf8'),
    fs.readFile(path.join(distDir, verificationFile), 'utf8'),
  ]);

  assertIndexableHtml(homeHtml, homeUrl, 'Homepage');
  assertHomepagePositioning(homeHtml, 'Homepage');
  await assertLocaleCopy();
  assertRobots(robots);
  assertSitemap(sitemap);
  assert(verification.trim() === verificationBody, `${verificationFile} does not contain the expected verification token`);

  for (const page of PAGES) {
    const html = await fs.readFile(path.join(distDir, page.slug, 'index.html'), 'utf8');
    assertIndexableHtml(html, `${SITE}/${page.slug}`, `/${page.slug}`);
  }

  console.log(`Indexability build audit passed for ${expectedUrls.length} URLs.`);
}

async function auditLive() {
  const [homeHtml, robots, sitemap, verification] = await Promise.all([
    fetchText(homeUrl, 'text/html'),
    fetchText(`${SITE}/robots.txt`, 'text/plain'),
    fetchText(`${SITE}/sitemap.xml`, 'application/xml'),
    fetchText(`${SITE}/${verificationFile}`, 'text/html'),
  ]);

  assertIndexableHtml(homeHtml, homeUrl, 'Live homepage');
  assertHomepagePositioning(homeHtml, 'Live homepage');
  assertRobots(robots);
  assertSitemap(sitemap);
  assert(verification.trim() === verificationBody, `Live ${verificationFile} does not contain the expected token`);

  for (const page of PAGES) {
    const url = `${SITE}/${page.slug}`;
    const html = await fetchText(url, 'text/html');
    assertIndexableHtml(html, url, `Live /${page.slug}`);
  }

  console.log(`Live indexability audit passed for ${expectedUrls.length} URLs.`);
}

const audit = process.argv.includes('--live') ? auditLive : auditDist;

audit().catch((error) => {
  console.error(`Indexability audit failed: ${error.message}`);
  process.exitCode = 1;
});
