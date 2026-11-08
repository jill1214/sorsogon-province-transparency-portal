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
