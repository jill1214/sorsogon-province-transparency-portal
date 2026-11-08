// Generate initial metadata for stable routes without changing budget data.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const origin = 'https://sorsogon-province-transparency-portal.vercel.app';
const template = await readFile(join('dist', 'index.html'), 'utf8');
const pages = {
  gaa: {
    title: 'Enacted budgets 2020–2026 · Sorsogon',
    description: 'Explore enacted FY2020–2026 budget appropriations associated with Sorsogon Province. Appropriations are not actual spending.',
  },
  about: {
    title: 'About the data · Sorsogon',
    description: 'Learn how this independent Sorsogon Province budget portal selects records, cites BetterGov.PH, and explains geographic and spending limitations.',
  },
};
const escapeHtml = (s) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
function replaceMeta(html, key, value, attr = 'name') {
  const pattern = new RegExp(`<meta ${attr}="${key}" content="[^"]*"\\s*/?>`);
  if (!pattern.test(html)) throw new Error(`Missing ${attr}=${key} in built HTML`);
  return html.replace(pattern, `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`);
}
if (!template.includes('rel="canonical"') || !template.includes('property="og:url"')) {
  throw new Error('Built HTML must have canonical and Open Graph URL tags');
}
for (const [route, info] of Object.entries(pages)) {
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(info.title)}</title>`);
  html = replaceMeta(html, 'description', info.description);
  html = replaceMeta(html, 'og:title', info.title, 'property');
  html = replaceMeta(html, 'og:description', info.description, 'property');
  const canonical = `${origin}/${route}`;
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`);
  html = replaceMeta(html, 'og:url', canonical, 'property');
  await mkdir(join('dist', route), { recursive: true });
  await writeFile(join('dist', route, 'index.html'), html);
}
