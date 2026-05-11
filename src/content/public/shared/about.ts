import type { About } from '../../types';

export const aboutEn: About = {
  pullQuote: [
    'This public repository ships the ',
    'engine',
    ', not the private portfolio data.',
  ],
  paragraphs: [
    'The committed content is fictional demo copy designed to exercise the same layouts, text mirrors, navigation states, and telemetry events as the live site.',
    'The private build can drop in a mirrored content tree without touching components, routing, styles, analytics, or the static mirror generator.',
    'That split keeps the open-source artifact useful while preventing client names, screenshots, contact details, and project-specific claims from leaking into Git history.',
  ],
  bestFit: {
    title: 'What this repo demonstrates',
    items: [
      'Typed bilingual content without a runtime i18n dependency',
      'Case-study pages that render from a structured schema',
      'Build-time text mirrors for agents and reviewers',
      'Privacy-first telemetry with a same-origin ingest endpoint',
      'Token-first CSS with no UI framework',
    ],
  },
  howWork: {
    title: 'Public/private split',
    items: [
      'Public content is committed under src/content/public',
      'Private content lives in src/content/.private and is ignored by git',
      'A generated active barrel selects private content when it exists',
      'CI guards block private files and media from public pushes',
    ],
  },
};

export const aboutRu: About = {
  pullQuote: [
    'Публичный репозиторий отдаёт ',
    'движок',
    ', а не приватные данные портфолио.',
  ],
  paragraphs: [
    'Закоммиченный контент — вымышленный demo-copy, который нагружает те же layouts, text mirrors, состояния навигации и telemetry events, что и live-сайт.',
    'Приватная сборка подставляет зеркальное content-дерево без правок компонентов, роутинга, стилей, аналитики и генератора text mirrors.',
    'Так open-source артефакт остаётся полезным, но client names, screenshots, контакты и проектные claims не утекают в Git history.',
  ],
  bestFit: {
    title: 'Что показывает репо',
    items: [
      'Типизированный bilingual content без runtime i18n dependency',
      'Case-study страницы из structured schema',
      'Build-time text mirrors для агентов и ревьюеров',
      'Privacy-first telemetry через same-origin endpoint',
      'Token-first CSS без UI framework',
    ],
  },
  howWork: {
    title: 'Public/private split',
    items: [
      'Public content закоммичен в src/content/public',
      'Private content лежит в src/content/.private и игнорится git',
      'Generated active barrel выбирает private content если он есть',
      'CI guards блокируют private files и media в public push',
    ],
  },
};
