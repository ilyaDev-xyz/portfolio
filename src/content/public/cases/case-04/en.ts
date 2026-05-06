import type { Project } from '../../../types';

export const case04En: Project = {
  slug: 'roblox-game',
  idx: '04',
  status: 'Demo',
  codename: 'roblox-game',
  title: 'Roblox Arena · Demo runtime',
  subtitle:
    'Fictional multiplayer arena slice focused on deterministic combat rules, server authority, and tool-assisted content balancing.',
  scope: 'Demo · gameplay systems',
  proof: 'Placeholder media · public schema',
  production: 'Public demo content',
  role: 'Gameplay systems demo with server-owned rules',
  body: 'A demo arena where combat, rewards, and spawn logic stay server-owned while designers tune enemies, abilities, and economy values through structured data.',
  chips: ['Server authority', 'Balance tables', 'Telemetry loops'],
  foot: 'Luau · Roblox services · data tables · analytics events',
  cta: { label: 'Read case study', href: '/cases/roblox-game' },
  placeholder: '[ demo arena / 16:9 ]',
  cls: 'p-roblox',
  videoId: 'dQw4w9WgXcQ',
  thumbnail: '/demo/case-04.svg',
  videoMirrorUrl: 'https://rutube.ru/video/private/2afc367fc1968ed386e52665ee7a829b/?p=WcFMiE-n0wydU96W_9-nXw',
  videoTranscript: {
    synopsis:
      'Demo arena walkthrough: combat, rewards and spawn logic stay server-owned. Designers tune enemies, abilities and economy through structured data tables; telemetry loops feed the next balance pass.',
    fullText:
      'Demo placeholder transcript. The video walks through the public Roblox arena demo — server authority, balance tables, telemetry loops. Replace this transcript when forking the engine with your own content.',
  },
  caseStudy: {
    metrics: [{ v: '4 combat loops' }, { v: 'server-owned rewards' }, { v: 'data-driven balance' }],
    contextPull: ['Fun changes fast.\nRules still need one ', 'authority', '.'],
    context: [
      'Small multiplayer prototypes often become brittle when gameplay rules leak across client scripts, UI code, and designer experiments. The fictional arena keeps the loop narrow: players fight, earn rewards, unlock variants, and return to a faster next round.',
      'The useful engineering work is less about visual spectacle and more about rule ownership. The server validates combat, rewards, cooldowns, and inventory updates; the client predicts only what can be safely corrected.',
    ],
    heroFacts: [
      { k: 'Surface', v: 'Round-based arena prototype' },
      { k: 'Rules', v: 'Server-owned damage, rewards, cooldowns' },
      { k: 'Content', v: 'Enemy and ability tables' },
      { k: 'Feedback', v: 'Match events, economy sinks, retention hints' },
    ],
    diagrams: [
      {
        title: 'Authority split',
        ascii: `Client input -> server rule check -> replicated result -> UI feedback
      prediction        authority          correction       effects only`,
        notes: [
          { k: 'Client', v: 'Feels responsive but does not grant rewards.' },
          { k: 'Server', v: 'Owns combat outcomes, drops, and progression.' },
        ],
      },
    ],
    decisions: [
      {
        title: 'Server-owned rewards',
        decision: 'Rewards are granted only by server rules after validated combat events.',
        why: 'Progression bugs are expensive; the economy must not depend on client claims.',
        cost: 'More replication code for responsive feedback.',
      },
      {
        title: 'Data tables for balance',
        decision: 'Enemies, ability numbers, and drop rates live in structured tables.',
        why: 'Design iteration should not require code edits for every tuning pass.',
        cost: 'Tables need validation so impossible values fail early.',
      },
      {
        title: 'Event taxonomy before content scale',
        decision: 'Match, reward, failure, and quit events are named before adding more modes.',
        why: 'Balance without telemetry becomes guesswork once content grows.',
        cost: 'Early naming discipline slows first prototype speed.',
      },
    ],
    stackTable: [
      { k: 'Runtime', v: 'Roblox services · Luau modules' },
      { k: 'Rules', v: 'Server combat checks · cooldown registry' },
      { k: 'Content', v: 'Enemy tables · ability tables · reward tables' },
      { k: 'Client', v: 'Prediction hints · replicated UI state' },
      { k: 'Telemetry', v: 'Round events · reward events · quit points' },
      { k: 'Demo media', v: 'Generic SVG placeholder assets' },
    ],
    lessonsKeep: [
      'Server authority keeps the economy debuggable.',
      'Balance tables beat scattered constants.',
      'Telemetry labels must arrive before content scale.',
    ],
    lessons: [
      'Prototype validation tools earlier.',
      'Separate cosmetic unlocks from combat numbers.',
      'Keep client prediction narrow and disposable.',
    ],
    statusNote: 'Fictionalized gameplay case for public repo review.',
  },
};
