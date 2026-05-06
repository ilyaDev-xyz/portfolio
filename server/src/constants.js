export const CASE_SLUGS = [
  'ai-crm',
  'ai-warehouse',
  'ai-video-editor',
  'roblox-game',
  'macos-vpn',
  'portfolio-site',
];

export const KNOWN_PATHS = new Set([
  '/',
  ...CASE_SLUGS.map((slug) => `/cases/${slug}`),
]);

export const KNOWN_SLUGS = new Set(CASE_SLUGS);
