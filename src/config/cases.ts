export const CASE_SLUGS = [
  'ai-crm',
  'ai-warehouse',
  'ai-video-editor',
  'roblox-game',
  'macos-vpn',
  'portfolio-site',
] as const;

export type CaseSlug = typeof CASE_SLUGS[number];

// Server has duplicate lists in server/src/{ingest,admin,rollup}.js. Keep in sync.
