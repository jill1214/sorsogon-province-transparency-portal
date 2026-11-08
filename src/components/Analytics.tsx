import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  canTrack, disableAnalytics, readAnalyticsConsent, saveAnalyticsConsent,
  safePagePath, startAnalytics, trackPage, trackSourceClick,
  type AnalyticsConsent,
} from '../lib/analytics';

export const OPEN_ANALYTICS_PREFERENCES = 'spt:open-analytics-preferences';

/** Visitor choice is optional; the budget portal remains usable if declined. */
export default function Analytics() {
  const { pathname, search } = useLocation();
  const [consent, setConsent] = useState<AnalyticsConsent>(readAnalyticsConsent);
  const [showChoices, setShowChoices] = useState(() => readAnalyticsConsent() === null);
  const [storageError, setStorageError] = useState(false);
  const trackingEnabled = canTrack(window.location.hostname, consent);

  useEffect(() => {
    const open = () => setShowChoices(true);
    window.addEventListener(OPEN_ANALYTICS_PREFERENCES, open);
    return () => window.removeEventListener(OPEN_ANALYTICS_PREFERENCES, open);
  }, []);

  useEffect(() => {
    if (!trackingEnabled) return;
    startAnalytics();
    // Route components also update document.title; the timer runs after those effects.
    const timer = window.setTimeout(() => trackPage(pathname, document.title), 0);
    return () => window.clearTimeout(timer);
  }, [pathname, trackingEnabled]);

  useEffect(() => {
    if (!trackingEnabled) return;
    // Query-only changes update the global GA4 page_location without a new page view.
    // URL query text must not be included in later automatic events.
    const cleanLocation = window.location.origin + safePagePath(pathname);
    const w = window as Window & { gtag?: (...args: unknown[]) => void };
    w.gtag?.('set', { page_location: cleanLocation });
  }, [pathname, search, trackingEnabled]);

  useEffect(() => {
    if (!trackingEnabled) return;
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest('a[href]');
      if (anchor instanceof HTMLAnchorElement) trackSourceClick(anchor.href);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [trackingEnabled]);

  function choose(choice: Exclude<AnalyticsConsent, null>) {
    if (!saveAnalyticsConsent(choice)) {
      setStorageError(true);
      return;
    }
    setStorageError(false);
    if (choice === 'declined' && consent === 'accepted') {
      disableAnalytics();
      window.location.reload(); // discard the loaded tag after opt-out
      return;
    }
    setConsent(choice);
    setShowChoices(false);
  }

  if (!showChoices) return null;

  return (
    <section className="analytics-consent" aria-label="Analytics privacy preferences">
      <div className="analytics-consent-inner">
        <div>
          <strong>Optional website analytics</strong>
          <p>
            This independently operated portal uses Google Analytics only if you agree, to understand
            page visits and use of budget information. Google may process device, browser, usage and
            cookie information. We do not send typed search terms through our custom tracking.
            The portal works without analytics. Read the <Link to="/about#analytics-privacy">analytics privacy notice</Link>.
          </p>
          {storageError && <p role="alert">Your preference could not be saved. Analytics remains off. Check browser storage settings.</p>}
        </div>
        <div className="analytics-consent-actions">
          <button type="button" onClick={() => choose('declined')}>Decline analytics</button>
          <button type="button" className="button button-primary" onClick={() => choose('accepted')}>Accept analytics</button>
        </div>
      </div>
    </section>
  );
}
