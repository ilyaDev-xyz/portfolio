import type { Project } from '../../../types';

export const case04Ru: Project = {
  slug: 'roblox-game',
  idx: '04',
  status: 'Demo',
  codename: 'roblox-game',
  title: 'Roblox Arena · Demo runtime',
  subtitle:
    'Вымышленный multiplayer arena slice: deterministic combat rules, server authority и tool-assisted content balancing.',
  scope: 'Demo · gameplay systems',
  proof: 'Placeholder media · public schema',
  production: 'Public demo content',
  role: 'Gameplay systems demo с server-owned rules',
  body: 'Demo arena, где combat, rewards и spawn logic остаются на сервере, а designers настраивают enemies, abilities и economy через structured data.',
  chips: ['Server authority', 'Balance tables', 'Telemetry loops'],
  foot: 'Luau · Roblox services · data tables · analytics events',
  cta: { label: 'Читать кейс', href: '/cases/roblox-game' },
  placeholder: '[ demo arena / 16:9 ]',
  cls: 'p-roblox',
  videoId: 'dQw4w9WgXcQ',
  thumbnail: '/demo/case-04.svg',
  videoMirrorUrl: 'https://rutube.ru/video/private/2afc367fc1968ed386e52665ee7a829b/?p=WcFMiE-n0wydU96W_9-nXw',
  videoTranscript: {
    synopsis:
      'Demo-обход арены: combat, rewards и spawn logic остаются на сервере. Designers тюнят врагов, способности и экономику через structured data tables; telemetry loops кормят следующий balance pass.',
    fullText:
      'Demo-транскрипт-заглушка. Видео — walkthrough публичного Roblox-демо: server authority, balance tables, telemetry loops. Замени этот транскрипт при форке движка своим контентом.',
  },
  caseStudy: {
    metrics: [{ v: '4 combat loops' }, { v: 'server-owned rewards' }, { v: 'data-driven balance' }],
    contextPull: ['Fun меняется быстро.\nRules всё равно нужен один ', 'authority', '.'],
    context: [
      'Small multiplayer prototypes быстро становятся brittle, когда gameplay rules расползаются по client scripts, UI code и designer experiments. Вымышленная arena держит loop узким: players fight, earn rewards, unlock variants и возвращаются в faster next round.',
      'Главная engineering work здесь не visual spectacle, а ownership правил. Server validates combat, rewards, cooldowns и inventory updates; client predicts только то, что можно safely correct.',
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
          { k: 'Client', v: 'Feels responsive, но не выдаёт rewards.' },
          { k: 'Server', v: 'Owns combat outcomes, drops и progression.' },
        ],
      },
    ],
    decisions: [
      {
        title: 'Server-owned rewards',
        decision: 'Rewards выдаются только server rules после validated combat events.',
        why: 'Progression bugs дорогие; economy не должна зависеть от client claims.',
        cost: 'Больше replication code для responsive feedback.',
      },
      {
        title: 'Data tables for balance',
        decision: 'Enemies, ability numbers и drop rates живут в structured tables.',
        why: 'Design iteration не должен требовать code edits для каждого tuning pass.',
        cost: 'Tables требуют validation, чтобы impossible values падали рано.',
      },
      {
        title: 'Event taxonomy before content scale',
        decision: 'Match, reward, failure и quit events названы до добавления новых modes.',
        why: 'Balance без telemetry становится guesswork, когда content растёт.',
        cost: 'Early naming discipline замедляет первый prototype.',
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
      'Server authority держит economy debuggable.',
      'Balance tables лучше scattered constants.',
      'Telemetry labels нужны до content scale.',
    ],
    lessons: [
      'Prototype validation tools раньше.',
      'Cosmetic unlocks отделять от combat numbers.',
      'Client prediction держать narrow and disposable.',
    ],
    statusNote: 'Fictionalized gameplay case для public repo review.',
  },
};
