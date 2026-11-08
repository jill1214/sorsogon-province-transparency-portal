import assert from 'node:assert/strict';
import test from 'node:test';
import { isTrackingHost, safePagePath } from '../src/lib/analytics';

test('GA4 only runs on the exact public Production hostname', () => {
  assert.equal(isTrackingHost('sorsogon-province-transparency-portal.vercel.app'), true);
  assert.equal(isTrackingHost('sorsogon-province-transparency-portal-git-main-amabini.vercel.app'), false);
  assert.equal(isTrackingHost('sorsogon-province-transparency-portal-poomr8s67-amabini.vercel.app'), false);
  assert.equal(isTrackingHost('localhost'), false);
  assert.equal(isTrackingHost('sorsogon-province-transparency-portal.vercel.app.example.com'), false);
});

test('page tracking strips query strings and fragments', () => {
  assert.equal(safePagePath('/?q=private&year=2026'), '/');
  assert.equal(safePagePath('/gaa?dept=hidden#programs'), '/gaa');
  assert.equal(safePagePath('/projects/dpwh/example'), '/projects/dpwh/example');
  assert.equal(safePagePath('https://invalid.example/'), '/');
});
