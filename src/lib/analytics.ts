/**
 * Consent-gated GA4 adapter for the independent Sorsogon Province portal.
 * Tracking must never start in Preview or before visitors opt in.
 */
export const MEASUREMENT_ID = 'G-55F4BY0YQ8';
export const PRODUCTION_HOST = 'sorsogon-province-transparency-portal.vercel.app';
export const CONSENT_STORAGE_KEY = 'spt-analytics-consent-v1';
export type AnalyticsConsent = 'accepted' | 'declined' | null;

export function isTrackingHost(hostname: string): boolean {
  return hostname === PRODUCTION_HOST;
}

export function parseAnalyticsConsent(raw: string | null): AnalyticsConsent {
  return raw === 'accepted' || raw === 'declined' ? raw : null;
}

export function readAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === 'undefined') return null;
  try { return parseAnalyticsConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY)); }
  catch { return null; } // storage inaccessible: fail closed
}

export function saveAnalyticsConsent(choice: Exclude<AnalyticsConsent, null>): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
    return readAnalyticsConsent() === choice;
  } catch { return false; } // cannot persist approval: never load analytics
}

export function canTrack(hostname: string, choice: AnalyticsConsent): boolean {
  return isTrackingHost(hostname) && choice === 'accepted';
}

export function safePagePath(pathname: string): string {
  // Never include search keywords, filter values or fragment identifiers.
  return pathname.startsWith('/') ? pathname.split(/[?#]/, 1)[0] : '/';
}

type Gtag = (...args: unknown[]) => void;
type AnalyticsWindow = Window & { dataLayer?: unknown[][]; gtag?: Gtag; [key: `ga-disable-${string}`]: boolean | undefined };
let started = false;

function command(...args: unknown[]) {
  (window as unknown as AnalyticsWindow).gtag?.(...args);
}

export function startAnalytics(): boolean {
  if (typeof window === 'undefined' || !canTrack(window.location.hostname, readAnalyticsConsent())) return false;
  if (started) return true;
  started = true;

  const w = window as unknown as AnalyticsWindow;
  w[`ga-disable-${MEASUREMENT_ID}`] = false;
  w.dataLayer = w.dataLayer || [];
  w.gtag = (...args: unknown[]) => { w.dataLayer!.push(args); };
  command('js', new Date());
  // Disable advertising enrichment and automatic initial page view.
  // Manually emit clean path-only page views on SPA route changes.
  command('set', { page_location: w.location.origin + safePagePath(w.location.pathname) });
  command('config', MEASUREMENT_ID, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
  document.head.appendChild(script);
  return true;
}

/** Stops hits in the current document; callers reload on revoking consent. */
export function disableAnalytics() {
  if (typeof window === 'undefined') return;
  (window as unknown as AnalyticsWindow)[`ga-disable-${MEASUREMENT_ID}`] = true;
  // Clear the GA cookies set on this host where accessible.
  for (const token of document.cookie.split(';')) {
    const name = token.trim().split('=')[0];
    if (name === '_ga' || name.startsWith('_ga_')) {
      document.cookie = name + '=; Max-Age=0; Path=/; SameSite=Lax; Secure';
    }
  }
}

export function trackEvent(name: string, parameters: Record<string, string> = {}) {
  if (!startAnalytics()) return;
  command('event', name, parameters);
}

export function trackPage(pathname: string, title: string) {
  if (!startAnalytics()) return;
  const path = safePagePath(pathname);
  const pageType = path.startsWith('/projects/') ? 'project' : path === '/gaa' ? 'enacted' : path === '/about' ? 'about' : 'projects';
  const cleanLocation = window.location.origin + path;
  // Override automatically inherited page_location, including after query-only changes.
  command('set', { page_location: cleanLocation });
  command('event', 'page_view', {
    page_location: cleanLocation,
    page_title: title,
    page_type: pageType,
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
