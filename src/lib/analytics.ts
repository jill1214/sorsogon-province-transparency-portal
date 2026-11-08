/**
 * Privacy-conscious GA4 adapter for the independent SPT Portal.
 * The public Measurement ID is NOT a secret. Never collect search terms,
 * budget document URLs, visitor identifiers, or arbitrary query parameters.
 * GA4 is intentionally disabled on localhost and all Vercel Preview domains.
 */
export const MEASUREMENT_ID = 'G-55F4BY0YQ8';
export const PRODUCTION_HOST = 'sorsogon-province-transparency-portal.vercel.app';

export function isTrackingHost(hostname: string): boolean {
  return hostname === PRODUCTION_HOST;
}

export function safePagePath(pathname: string): string {
  // No query string or fragment; do not send internal search/filter text.
  return pathname.startsWith('/') ? pathname.split(/[?#]/, 1)[0] : '/';
}

type Gtag = (...args: unknown[]) => void;
type AnalyticsWindow = Window & { dataLayer?: unknown[][]; gtag?: Gtag };
let started = false;

function command(...args: unknown[]) {
  (window as AnalyticsWindow).gtag?.(...args);
}

export function startAnalytics(): boolean {
  if (typeof window === 'undefined' || !isTrackingHost(window.location.hostname)) return false;
  if (started) return true;
  started = true;

  const w = window as AnalyticsWindow;
  w.dataLayer = w.dataLayer || [];
  w.gtag = (...args: unknown[]) => { w.dataLayer!.push(args); };
  command('js', new Date());
  // Manual, pathname-only page views. Before production release, disable
  // Enhanced measurement > Page views > browser history changes in GA4.
  command('config', MEASUREMENT_ID, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
  document.head.appendChild(script);
  return true;
}

export function trackEvent(name: string, parameters: Record<string, string> = {}) {
  if (!startAnalytics()) return;
  command('event', name, parameters);
}

export function trackPage(pathname: string, title: string) {
  if (!startAnalytics()) return;
  const path = safePagePath(pathname);
  const pageType = path.startsWith('/projects/') ? 'project' : path === '/gaa' ? 'enacted' : path === '/about' ? 'about' : 'projects';
  command('event', 'page_view', {
    page_location: window.location.origin + path,
    page_title: title,
    page_type: pageType,
    // Suppress previously stored full URL in SPA navigation parameters.
    page_referrer: document.referrer ? (() => {
      try {
        const ref = new URL(document.referrer);
        return ref.origin === window.location.origin ? ref.origin + safePagePath(ref.pathname) : ref.origin;
      } catch { return ''; }
    })() : '',
  });
  if (pageType === 'project') {
    const dataset = path.split('/')[2];
    if (['dpwh', 'fmr', 'hfep', 'nia'].includes(dataset)) {
      trackEvent('view_project', { project_dataset: dataset });
    }
  }
}

export function trackSourceClick(href: string) {
  try {
    const url = new URL(href, window.location.href);
    if (url.hostname === 'bettergov.ph' || url.hostname.endsWith('.bettergov.ph')) {
      trackEvent('source_link_click', { source_domain: url.hostname });
    }
  } catch { /* Ignore invalid URLs. */ }
}
