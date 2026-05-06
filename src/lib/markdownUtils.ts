export function escapeTableCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n+/g, ' ');
}
