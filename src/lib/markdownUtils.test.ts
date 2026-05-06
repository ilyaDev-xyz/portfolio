import { describe, it, expect } from 'vitest';
import { escapeTableCell } from './markdownUtils';

describe('escapeTableCell', () => {
  it('escapes pipe characters so cell stays in one column', () => {
    expect(escapeTableCell('a | b | c')).toBe('a \\| b \\| c');
  });

  it('collapses single newlines into a space', () => {
    expect(escapeTableCell('one\ntwo')).toBe('one two');
  });

  it('collapses runs of newlines into one space', () => {
    expect(escapeTableCell('one\n\n\ntwo')).toBe('one two');
  });

  it('handles mixed pipes and newlines together', () => {
    expect(escapeTableCell('a |\nb')).toBe('a \\| b');
  });

  it('passes through plain text unchanged', () => {
    expect(escapeTableCell('hello world')).toBe('hello world');
  });

  it('handles empty string', () => {
    expect(escapeTableCell('')).toBe('');
  });
});
