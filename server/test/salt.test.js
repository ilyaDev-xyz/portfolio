import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashVisitor } from '../src/salt.js';

const SITE = 'ilyadev.xyz';

test('hashVisitor returns 32 hex chars', () => {
  const id = hashVisitor('s1', '1.2.3.4', 'Chrome', SITE);
  assert.equal(id.length, 32);
  assert.match(id, /^[0-9a-f]{32}$/);
});

test('hashVisitor is deterministic for the same inputs', () => {
  const a = hashVisitor('s1', '1.2.3.4', 'Chrome', SITE);
  const b = hashVisitor('s1', '1.2.3.4', 'Chrome', SITE);
  assert.equal(a, b);
});

test('hashVisitor changes after salt rotation', () => {
  const a = hashVisitor('s1', '1.2.3.4', 'Chrome', SITE);
  const b = hashVisitor('s2', '1.2.3.4', 'Chrome', SITE);
  assert.notEqual(a, b);
});

test('hashVisitor never echoes raw IP into the output (even partially)', () => {
  // 32 hex chars cannot embed the IP literally; this guards against accidental
  // refactor that swaps hashing for concatenation.
  const id = hashVisitor('s1', '203.0.113.55', 'Chrome', SITE);
  assert.ok(!id.includes('203'));
  assert.ok(!id.includes('113'));
});

test('hashVisitor distinguishes by ip / ua / domain independently', () => {
  const base = hashVisitor('s1', '1.2.3.4', 'Chrome', SITE);
  assert.notEqual(base, hashVisitor('s1', '1.2.3.5', 'Chrome', SITE));
  assert.notEqual(base, hashVisitor('s1', '1.2.3.4', 'Safari', SITE));
  assert.notEqual(base, hashVisitor('s1', '1.2.3.4', 'Chrome', 'other.test'));
});

test('hashVisitor tolerates undefined / null / empty inputs', () => {
  const id = hashVisitor('s1', undefined, null, '');
  assert.equal(id.length, 32);
  // Field separators must keep undefined-vs-empty inputs distinguishable
  // from a single concatenated blank — guards against trimming bugs.
  assert.notEqual(
    hashVisitor('s1', 'a', 'b', 'c'),
    hashVisitor('s1', '', 'a|b', 'c'),
  );
});
