import type { StackCategory } from '../../types';

export const stackPrefaceEn =
  'Generic stack labels used by the public demo content. Private builds can replace the copy without changing the UI.';

export const stackPrefaceRu =
  'Общие stack labels для публичного demo content. Private build может заменить copy без изменений UI.';

export const stackEn: StackCategory[] = [
  { label: 'AI & Agents', items: ['Tool contracts', 'LLM orchestration', 'Human review', 'Audit trails', 'Cost tracking', 'RAG'] },
  { label: 'Backend', items: ['Python', 'FastAPI', 'Django', 'Celery', 'PostgreSQL', 'Redis', 'Pydantic', 'SQLAlchemy'] },
  { label: 'Frontend', items: ['React', 'TypeScript', 'Vite', 'React Router', 'Zustand', 'CodeMirror', 'Remotion'] },
  { label: 'Telemetry', items: ['sendBeacon', 'SQLite WAL', 'Daily rollups', 'Basic Auth', 'Retention windows'] },
  { label: 'Design', items: ['CSS tokens', 'OKLCH', 'Grid systems', 'View transitions', 'Reduced motion'] },
  { label: 'Automation', items: ['Node scripts', 'GitHub Actions', 'Static generation', 'Markdown mirrors'] },
  { label: 'Media', items: ['ffmpeg', 'Canvas', 'Image optimization', 'Lite embeds', 'SVG placeholders'] },
  { label: 'Ops', items: ['Docker', 'Caddy', 'systemd', 'Backups', 'Log rotation'] },
  { label: 'Workflow', items: ['Specs first', 'Small PRs', 'CI guards', 'Reviewable diffs', 'Runbooks'] },
];

export const stackRu: StackCategory[] = [
  { label: 'AI & Agents', items: ['Tool contracts', 'LLM orchestration', 'Human review', 'Audit trails', 'Cost tracking', 'RAG'] },
  { label: 'Backend', items: ['Python', 'FastAPI', 'Django', 'Celery', 'PostgreSQL', 'Redis', 'Pydantic', 'SQLAlchemy'] },
  { label: 'Frontend', items: ['React', 'TypeScript', 'Vite', 'React Router', 'Zustand', 'CodeMirror', 'Remotion'] },
  { label: 'Telemetry', items: ['sendBeacon', 'SQLite WAL', 'Daily rollups', 'Basic Auth', 'Retention windows'] },
  { label: 'Design', items: ['CSS tokens', 'OKLCH', 'Grid systems', 'View transitions', 'Reduced motion'] },
  { label: 'Automation', items: ['Node scripts', 'GitHub Actions', 'Static generation', 'Markdown mirrors'] },
  { label: 'Media', items: ['ffmpeg', 'Canvas', 'Image optimization', 'Lite embeds', 'SVG placeholders'] },
  { label: 'Ops', items: ['Docker', 'Caddy', 'systemd', 'Backups', 'Log rotation'] },
  { label: 'Workflow', items: ['Specs first', 'Small PRs', 'CI guards', 'Reviewable diffs', 'Runbooks'] },
];
