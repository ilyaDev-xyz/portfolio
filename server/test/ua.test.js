import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseUaFamily, parseDeviceClass } from '../src/ua.js';

test('parseUaFamily — Edge wins over Chrome substring', () => {
  // Edge UAs contain "Chrome/" too — Edg/ check must run first.
  const edge =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.2210.91';
  assert.equal(parseUaFamily(edge), 'Edge');
});

test('parseUaFamily — Chrome desktop', () => {
  const chrome =
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
  assert.equal(parseUaFamily(chrome), 'Chrome');
});

test('parseUaFamily — Firefox', () => {
  assert.equal(
    parseUaFamily('Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0'),
    'Firefox',
  );
});

test('parseUaFamily — Safari without Chrome substring', () => {
  const safari =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15';
  assert.equal(parseUaFamily(safari), 'Safari');
});

test('parseUaFamily — Opera', () => {
  assert.equal(
    parseUaFamily('Mozilla/5.0 (Windows NT 10.0) Chrome/120.0 Safari/537.36 OPR/106.0'),
    'Opera',
  );
});

test('parseUaFamily — empty/unknown', () => {
  assert.equal(parseUaFamily(''), 'Unknown');
  assert.equal(parseUaFamily(undefined), 'Unknown');
  assert.equal(parseUaFamily('curl/8.0'), 'Other');
});

test('parseDeviceClass — iPhone is mobile', () => {
  assert.equal(
    parseDeviceClass(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    ),
    'mobile',
  );
});

test('parseDeviceClass — Android Mobile', () => {
  assert.equal(
    parseDeviceClass(
      'Mozilla/5.0 (Linux; Android 14; Pixel 7) Chrome/120.0.0.0 Mobile Safari/537.36',
    ),
    'mobile',
  );
});

test('parseDeviceClass — iPad is tablet', () => {
  assert.equal(
    parseDeviceClass(
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    ),
    'tablet',
  );
});

test('parseDeviceClass — desktop default', () => {
  assert.equal(parseDeviceClass('Mozilla/5.0 (X11; Linux x86_64) Chrome/120.0'), 'desktop');
  assert.equal(parseDeviceClass(''), 'desktop');
});
