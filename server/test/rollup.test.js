import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyDwell, emptyClassCounts } from '../src/rollup.js';

// Multi-axis classification table — docs/analytics.md §3.

test('bounce — active < 10s regardless of scroll', () => {
  assert.equal(classifyDwell(0, 0), 'bounce');
  assert.equal(classifyDwell(9, 100), 'bounce');
});

test('quick_exit — short active, low scroll', () => {
  assert.equal(classifyDwell(20, 30), 'quick_exit');
  assert.equal(classifyDwell(59, 39), 'quick_exit');
});

test('scroll_skip — short active, scroll past 80', () => {
  assert.equal(classifyDwell(15, 95), 'scroll_skip');
  assert.equal(classifyDwell(50, 100), 'scroll_skip');
});

test('engaged_scan — F-pattern reading window', () => {
  assert.equal(classifyDwell(120, 50), 'engaged_scan');
  assert.equal(classifyDwell(170, 70), 'engaged_scan');
});

test('probable_read — 3-10 min active and substantial scroll', () => {
  assert.equal(classifyDwell(200, 75), 'probable_read');
  assert.equal(classifyDwell(599, 95), 'probable_read');
});

test('deep_read — long active and high scroll', () => {
  assert.equal(classifyDwell(700, 90), 'deep_read');
  assert.equal(classifyDwell(1500, 100), 'deep_read');
});

test('engaged_scan fallback for unmatched mid-range combinations', () => {
  // Long active but low scroll — neither probable_read nor deep_read.
  assert.equal(classifyDwell(700, 50), 'engaged_scan');
});

test('emptyClassCounts has all 6 buckets at 0', () => {
  const c = emptyClassCounts();
  assert.deepEqual(c, {
    bounce: 0,
    quick_exit: 0,
    scroll_skip: 0,
    engaged_scan: 0,
    probable_read: 0,
    deep_read: 0,
  });
});
