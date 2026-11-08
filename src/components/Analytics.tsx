import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isTrackingHost, startAnalytics, trackPage, trackSourceClick } from '../lib/analytics';

/** A single router observer, with no dependency on the BetterGov API. */
export default function Analytics() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!isTrackingHost(window.location.hostname)) return;
    startAnalytics();
    // Route components update document.title in effects; observe after commit.
    // Timer cleanup also avoids duplicate StrictMode mount events.
    const timer = window.setTimeout(() => trackPage(pathname, document.title), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!isTrackingHost(window.location.hostname)) return;
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest('a[href]');
      if (anchor instanceof HTMLAnchorElement) trackSourceClick(anchor.href);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
