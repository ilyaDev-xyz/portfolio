// Minimal UA parser — family + device-class only. Raw UA never written to disk.
// See docs/analytics.md §1 / §4.

export function parseUaFamily(ua) {
  if (!ua) return 'Unknown';
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'Other';
}

export function parseDeviceClass(ua) {
  if (!ua) return 'desktop';
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobile|iPhone|Android.+Mobile/i.test(ua)) return 'mobile';
  return 'desktop';
}
