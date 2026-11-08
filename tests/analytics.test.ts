import assert from 'node:assert/strict';
import test from 'node:test';
import { canTrack, isTrackingHost, parseAnalyticsConsent, safePagePath } from '../src/lib/analytics';

const prod = 'sorsogon-province-transparency-portal.vercel.app';
test('GA4 is isolated to exact public Production hostname', () => {
  assert.equal(isTrackingHost(prod), true);
  for (const hostname of [
    'sorsogon-province-transparency-portal-git-main-amabini.vercel.app',
    'sorsogon-province-transparency-portal-hvvivswk8-amabini.vercel.app',
    'localhost',
    'sorsogon-province-transparency-portal.vercel.app.example.com',
  ]) assert.equal(isTrackingHost(hostname), false);
});

test('unknown or malformed preferences default to no consent', () => {
  for (const raw of [null, '', 'yes', 'true', 'ACCEPTED', 'undefined']) {
    assert.equal(parseAnalyticsConsent(raw), null);
  }
  assert.equal(parseAnalyticsConsent('accepted'), 'accepted');
  assert.equal(parseAnalyticsConsent('declined'), 'declined');
});

test('no tracking before consent or after decline, including Production', () => {
  assert.equal(canTrack(prod, null), false);
  assert.equal(canTrack(prod, 'declined'), false);
  assert.equal(canTrack(prod, 'accepted'), true);
  assert.equal(canTrack('localhost', 'accepted'), false);
  assert.equal(canTrack('sorsogon-province-transparency-portal-hvvivswk8-amabini.vercel.app', 'accepted'), false);
});

test('page tracking strips query strings and fragments', () => {
  assert.equal(safePagePath('/?q=private&year=2026'), '/');
  assert.equal(safePagePath('/gaa?dept=hidden#programs'), '/gaa');
  assert.equal(safePagePath('/projects/dpwh/example'), '/projects/dpwh/example');
  assert.equal(safePagePath('https://invalid.example/'), '/');
});


test('tag initialization is blocked when permission is absent, declined, or in Preview', async () => {
  const { startAnalytics, PRODUCTION_HOST } = await import('../src/lib/analytics');
  const prior = Object.getOwnPropertyDescriptor(globalThis, 'window');
  try {
    for (const [host, stored] of [
      [PRODUCTION_HOST, null],
      [PRODUCTION_HOST, 'declined'],
      ['sorsogon-province-transparency-portal-hvvivswk8-amabini.vercel.app', 'accepted'],
    ] as const) {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: { location: { hostname: host }, localStorage: { getItem: () => stored } },
      });
      // No mocked document exists: accessing it would throw. No script is inserted.
      assert.equal(startAnalytics(), false);
    }
  } finally {
    if (prior) Object.defineProperty(globalThis, 'window', prior);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});

test('tag initialization uses Google\'s arguments queue after consent on Production', async () => {
  const { startAnalytics, trackPage, MEASUREMENT_ID, PRODUCTION_HOST } = await import('../src/lib/analytics');
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const inserted: Array<{ async: boolean; src: string }> = [];
  const storage = new Map([['spt-analytics-consent-v1', 'accepted']]);
  const fakeWindow = {
    location: { hostname: PRODUCTION_HOST, origin: 'https://' + PRODUCTION_HOST, pathname: '/', search: '?q=private' },
    localStorage: { getItem: (key: string) => storage.get(key) ?? null },
  };
  const fakeDocument = {
    title: 'Sorsogon Province Portal',
    referrer: '',
    head: { appendChild: (element: { async: boolean; src: string }) => inserted.push(element) },
    createElement: (tag: string) => {
      assert.equal(tag, 'script');
      return { async: false, src: '' };
    },
  };
  try {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: fakeWindow });
    Object.defineProperty(globalThis, 'document', { configurable: true, value: fakeDocument });
    assert.equal(startAnalytics(), true);
    const queued = (fakeWindow as typeof fakeWindow & { dataLayer: IArguments[] }).dataLayer;
    assert.equal(queued.length, 3);
    for (const item of queued) {
      assert.equal(Object.prototype.toString.call(item), '[object Arguments]');
    }
    assert.deepEqual(Array.from(queued[0]).slice(0, 1), ['js']);
    assert.equal(queued[2][0], 'config');
    assert.equal(queued[2][1], MEASUREMENT_ID);
    assert.equal((queued[2][2] as { send_page_view: boolean }).send_page_view, false);
    assert.equal(inserted.length, 1);
    assert.equal(inserted[0].src, 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID);
    trackPage('/?q=private', 'Portal homepage');
    const events = queued.filter((item) => item[0] === 'event');
    assert.equal(events.length, 1);
    assert.equal(events[0][1], 'page_view');
    assert.equal((events[0][2] as { page_location: string }).page_location, 'https://' + PRODUCTION_HOST + '/');
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else Reflect.deleteProperty(globalThis, 'window');
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
    else Reflect.deleteProperty(globalThis, 'document');
  }
});
