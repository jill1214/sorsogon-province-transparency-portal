/**
 * Emit crawlable project snapshots for the exact FY2027 rows in the portal.
 * These HTML pages are replaced by the existing React application in browsers
 * with JavaScript. The build fails rather than publishing a partial sitemap.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import config from '../portal.config';
import { createClient } from '../src/api/client';
import { DEFAULT_API } from '../src/config';
import { resolveScope, type ScopedProject } from '../src/lib/scope';

const origin = config.siteUrl?.replace(/\/+$/, '');
if (!origin || !/^https:\/\/[^/]+$/.test(origin)) {
  throw new Error('A public HTTPS siteUrl is required for SEO page generation');
}
const client = createClient(process.env.VITE_API_BASE || config.api || DEFAULT_API);
const scope = await resolveScope(client, config);
const projects = scope.projects;
if (projects.length === 0 || scope.queries.some((q) => q.truncated)) {
  throw new Error('Cannot generate SEO pages from an empty or truncated project scope');
}

const template = await readFile(join('dist', 'index.html'), 'utf8');
const marker = '<div id="root"></div>';
if (!template.includes(marker) || !template.includes('rel="canonical"') || !template.includes('property="og:url"')) {
  throw new Error('Missing required HTML markers for project SEO pages');
}
const escapeHtml = (value: string) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');
const amount = (value: number | null) => value === null
  ? 'Not listed in this version'
  : '₱' + new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 }).format(value);
const safeHref = (value: string | null | undefined): string | null => {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
  } catch { return null; }
};
const link = (url: string | null | undefined, label: string) => {
  const href = safeHref(url);
  return href ? '<a href="' + escapeHtml(href) + '">' + escapeHtml(label) + '</a>' : '';
};
const meta = (html: string, attribute: 'name' | 'property', key: string, value: string) => {
  const re = new RegExp('<meta ' + attribute + '="' + key + '" content="[^"]*"\\s*/?>');
  if (!re.test(html)) throw new Error('Missing ' + attribute + '=' + key);
  return html.replace(re, '<meta ' + attribute + '="' + key + '" content="' + escapeHtml(value) + '" />');
};
const snapshot = new Date().toISOString().slice(0, 10);
const seen = new Set<string>();
const urls: string[] = [];

for (const project of projects) {
  const segment = encodeURIComponent(project.id);
  const path = '/projects/' + project.dataset + '/' + segment;
  if (seen.has(path)) throw new Error('Duplicate project URL: ' + path);
  seen.add(path);
  const url = origin + path;
  const title = project.title + ' · Sorsogon FY2027 budget';
  const description = (project.title + '. Proposed FY2027 NEP: ' + amount(project.nep_php)
    + '; House bill: ' + amount(project.house_php)
    + '. Source-backed budget proposal, not actual spending.').slice(0, 240);
  let html = template.replace(/<title>[^<]*<\/title>/, '<title>' + escapeHtml(title) + '</title>');
  html = meta(html, 'name', 'description', description);
  html = meta(html, 'property', 'og:title', title);
  html = meta(html, 'property', 'og:description', description);
  html = meta(html, 'property', 'og:url', url);
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/>/,
    '<link rel="canonical" href="' + escapeHtml(url) + '" />');

  const details = [
    ['Program', project.program],
    ['Sub-line', project.pap],
    ['DPWH office', project.office],
    ['Region', project.region],
    ['Status in the comparison', project.status_label],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  const rows = details.map(([label, value]) =>
    '<dt>' + escapeHtml(label) + '</dt><dd>' + escapeHtml(value) + '</dd>').join('');
  const staticContent = '<main><article>'
    + '<p><a href="/">Sorsogon Province budget portal</a></p>'
    + '<h1>' + escapeHtml(project.title) + '</h1>'
    + '<p>FY2027 proposed appropriations for the Province of Sorsogon. These figures are not actual spending.</p>'
    + '<dl>' + rows
    + '<dt>National Expenditure Program (NEP)</dt><dd>' + escapeHtml(amount(project.nep_php)) + '</dd>'
    + '<dt>House bill</dt><dd>' + escapeHtml(amount(project.house_php)) + '</dd>'
    + '</dl>'
    + '<p>' + link(project.url, 'Original project record') + ' '
    + link(project.api_url, 'Original API record') + '</p>'
    + '<p>Build-time snapshot dated ' + escapeHtml(snapshot)
    + '. The interactive portal loads current source data when JavaScript is enabled.</p>'
    + '</article></main>';
  html = html.replace(marker, '<div id="root">' + staticContent + '</div>');
  const directory = join('dist', 'projects', project.dataset, segment);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'index.html'), html);
  urls.push(url);
}

const sitemapPath = join('dist', 'sitemap.xml');
const sitemap = await readFile(sitemapPath, 'utf8');
if (!sitemap.includes('</urlset>')) throw new Error('Invalid sitemap template');
const entries = urls.map((url) => '  <url><loc>' + escapeHtml(url) + '</loc></url>').join('\n');
await writeFile(sitemapPath, sitemap.replace('</urlset>', entries + '\n</urlset>'));
const sample = await readFile(join('dist', 'projects', projects[0].dataset,
  encodeURIComponent(projects[0].id), 'index.html'), 'utf8');
if (!sample.includes('<h1>') || !sample.includes('rel="canonical"') || !sample.includes('Original project record')) {
  throw new Error('Generated project-page smoke validation failed');
}
console.log('Generated ' + projects.length + ' Sorsogon FY2027 project HTML pages and sitemap URLs');
