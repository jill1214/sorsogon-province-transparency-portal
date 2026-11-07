import { useEffect } from 'react';

/** Keep client-side navigation metadata aligned with each public route. */
export function useTitle(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    const origin = 'https://sorsogon-province-transparency-portal.vercel.app';
    const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
    const canonical = origin + pathname;
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical;
    const meta = (attribute: 'name' | 'property', key: string, value: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attribute, key);
        document.head.appendChild(el);
      }
      el.content = value;
    };
    meta('property', 'og:url', canonical);
    meta('property', 'og:title', title);
    if (description) {
      meta('name', 'description', description);
      meta('property', 'og:description', description);
    }
  }, [title, description]);
}
