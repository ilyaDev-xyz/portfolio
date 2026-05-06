import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePayload } from '../src/ingest.js';

// validatePayload is a pure function — no DB, no fs, no network.
// Returns null on any whitelist / shape failure.

test('pageview — happy path with known route', () => {
  const out = validatePayload('pageview', {
    path: '/cases/ai-crm',
    referrer_host: 'google.com',
    lang: 'en',
    theme: 'dark',
  });
  assert.deepEqual(out, {
    path: '/cases/ai-crm',
    referrer_host: 'google.com',
    lang: 'en',
    theme: 'dark',
    payload: null,
  });
});

test('pageview — unknown path is rejected', () => {
  assert.equal(
    validatePayload('pageview', { path: '/cases/unknown-slug', lang: 'en', theme: 'dark' }),
    null,
  );
});

test('pageview — long referrer_host is dropped to null', () => {
  const long = 'a'.repeat(201);
  const out = validatePayload('pageview', {
    path: '/',
    referrer_host: long,
    lang: 'en',
    theme: 'dark',
  });
  assert.equal(out.referrer_host, null);
});

test('pageview — invalid lang/theme silently nulled', () => {
  const out = validatePayload('pageview', {
    path: '/',
    lang: 'fr',
    theme: 'sepia',
  });
  assert.equal(out.lang, null);
  assert.equal(out.theme, null);
});

test('pageview — Arabic lang is accepted', () => {
  const out = validatePayload('pageview', {
    path: '/',
    lang: 'ar',
    theme: 'dark',
  });
  assert.equal(out.lang, 'ar');
});

test('dwell — happy path floors numerics and clamps scroll', () => {
  const out = validatePayload('dwell', {
    path: '/',
    active_seconds: 12.7,
    total_seconds: 30.3,
    max_scroll_pct: 200,
    interaction_count: 5,
  });
  assert.equal(out.payload.active_seconds, 12);
  assert.equal(out.payload.total_seconds, 30);
  assert.equal(out.payload.max_scroll_pct, 100);
  assert.equal(out.payload.interaction_count, 5);
});

test('dwell — negative numbers rejected', () => {
  assert.equal(
    validatePayload('dwell', {
      path: '/',
      active_seconds: -1,
      total_seconds: 10,
      max_scroll_pct: 50,
      interaction_count: 1,
    }),
    null,
  );
});

test('dwell — non-finite numerics rejected', () => {
  assert.equal(
    validatePayload('dwell', {
      path: '/',
      active_seconds: Infinity,
      total_seconds: 10,
      max_scroll_pct: 50,
      interaction_count: 1,
    }),
    null,
  );
});

test('video — known slug + action, position floored', () => {
  const out = validatePayload('video', {
    slug: 'ai-crm',
    action: 'play',
    position_s: 12.6,
  });
  assert.equal(out.payload.slug, 'ai-crm');
  assert.equal(out.payload.action, 'play');
  assert.equal(out.payload.position_s, 12);
});

test('video — unknown slug rejected', () => {
  assert.equal(
    validatePayload('video', { slug: 'mystery', action: 'play' }),
    null,
  );
});

test('video — unknown action rejected', () => {
  assert.equal(
    validatePayload('video', { slug: 'ai-crm', action: 'pause' }),
    null,
  );
});

test('video — out-of-range position_s dropped (not whole event)', () => {
  const out = validatePayload('video', {
    slug: 'ai-crm',
    action: 'play',
    position_s: 999_999,
  });
  // Spec: invalid position is dropped from payload but event itself stays valid.
  assert.equal(out.payload.position_s, undefined);
});

test('outbound — known kind, href truncated to 500', () => {
  const long = 'https://example.com/' + 'a'.repeat(600);
  const out = validatePayload('outbound', { kind: 'github', href: long });
  assert.equal(out.payload.kind, 'github');
  assert.equal(out.payload.href.length, 500);
});

test('outbound — unknown kind rejected', () => {
  assert.equal(validatePayload('outbound', { kind: 'twitter', href: 'x' }), null);
});

test('interaction — known kind, value truncated to 100', () => {
  const out = validatePayload('interaction', {
    kind: 'lang_toggle',
    value: 'a'.repeat(150),
  });
  assert.equal(out.payload.kind, 'lang_toggle');
  assert.equal(out.payload.value.length, 100);
});

test('interaction — unknown kind rejected', () => {
  assert.equal(validatePayload('interaction', { kind: 'rage_click' }), null);
});

test('unknown top-level kind returns null (defence in depth)', () => {
  assert.equal(validatePayload('mystery', { foo: 'bar' }), null);
});
