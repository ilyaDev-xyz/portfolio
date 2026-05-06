import type { Project } from '../../../types';

export const case02Ru: Project = {
  slug: 'ai-warehouse',
  idx: '02',
  status: 'Demo',
  codename: 'ai-warehouse',
  title: 'AI Warehouse · Demo stock ops',
  subtitle:
    'Вымышленный inventory assistant превращает receipt photos и operator notes в reviewable stock operations с weighted-cost math и rollback records.',
  scope: 'Demo · эквивалент 5 недель',
  proof: 'Placeholder media · public schema',
  production: 'Public demo content',
  role: 'Operational inventory workflow с AI-assisted drafts',
  body: 'Demo warehouse surface, где AI готовит draft supply, deduction и preparation operations. Backend валидирует quantities, costs и permissions до operator confirm.',
  chips: ['Receipt intake', 'Review actions', 'Weighted average cost'],
  foot: 'FastAPI · React · PostgreSQL · OCR · worker queue',
  cta: { label: 'Читать кейс', href: '/cases/ai-warehouse' },
  placeholder: '[ stock ops / 16:9 ]',
  cls: 'p-wms',
  videoId: 'dQw4w9WgXcQ',
  thumbnail: '/demo/case-02.svg',
  videoMirrorUrl: 'https://rutube.ru/video/private/2afc367fc1968ed386e52665ee7a829b/?p=WcFMiE-n0wydU96W_9-nXw',
  videoTranscript: {
    synopsis:
      'Demo-обход складского интерфейса: AI извлекает черновик из фото чека, оператор review его в WebApp, средневзвешенная себестоимость пересчитывается только после confirm. Original evidence остаётся прикреплён к каждому proposal.',
    fullText:
      'Demo-транскрипт-заглушка. Видео — walkthrough публичного warehouse-демо: receipt intake, draft review, server-side cost math, rollback records. Замени этот транскрипт при форке движка своим контентом.',
  },
  caseStudy: {
    metrics: [{ v: '3 operation lanes' }, { v: '2-stage validation' }, { v: 'rollback records' }],
    contextPull: ['Чек — не order.\nЭто ', 'draft', ' до review.'],
    context: [
      'Inventory teams часто собирают messy inputs: receipt photos, supplier messages и короткие notes со смены. Полезная задача AI — normalize input в draft operations без bypass stock integrity.',
      'Demo держит arithmetic на сервере. Weighted-cost updates, ingredient usage и negative-stock checks происходят после review draft, не внутри model response.',
    ],
    heroFacts: [
      { k: 'Surface', v: 'Stock operations dashboard' },
      { k: 'Inputs', v: 'Receipt image · manual note · supplier text' },
      { k: 'Review', v: 'Supply · deduction · preparation lanes' },
      { k: 'Safety', v: 'Server-side validation before commit' },
    ],
    diagrams: [
      {
        title: 'Draft-to-confirm flow',
        ascii: `Image / note -> parse draft -> operator review -> validate -> commit
                     |             | edit / reject |           |
                     v             v               v           v
                raw evidence   proposal log    domain checks  stock rows`,
        notes: [
          { k: 'Evidence', v: 'Original input остаётся attached к operation.' },
          { k: 'Math', v: 'Модель предлагает fields; backend пересчитывает totals.' },
        ],
      },
    ],
    decisions: [
      {
        title: 'Evidence stays beside the draft',
        decision: 'Каждый proposed operation хранит source image или note до confirm/reject.',
        why: 'Оператор должен сравнить AI extraction с original input.',
        cost: 'Storage растёт быстрее, зато review quality видима.',
      },
      {
        title: 'Server-owned cost math',
        decision: 'Weighted average cost и stock deltas пересчитываются backend.',
        why: 'Language model не должен быть source of truth для accounting arithmetic.',
        cost: 'UI должен объяснять mismatch между model draft и validated values.',
      },
      {
        title: 'Rollback as a product surface',
        decision: 'Confirmed operations reversable через typed correction records.',
        why: 'Operational software обязан поддерживать mistakes без silent database edits.',
        cost: 'Reporting queries должны учитывать corrections.',
      },
    ],
    stackTable: [
      { k: 'Backend', v: 'FastAPI · PostgreSQL · validation layer' },
      { k: 'AI intake', v: 'OCR · structured extraction · confidence hints' },
      { k: 'Frontend', v: 'React review lanes · diffable fields' },
      { k: 'Workers', v: 'Async image processing · retry queue' },
      { k: 'Audit', v: 'Raw evidence · proposals · corrections' },
      { k: 'Demo media', v: 'Generic SVG placeholder assets' },
    ],
    lessonsKeep: [
      'Draft и evidence должны оставаться связаны.',
      'Accounting math живёт вне модели.',
      'Rollback records лучше manual database repairs.',
    ],
    lessons: [
      'Bulk review добавлять только после доверия к single-item review.',
      'Validation errors показывать раньше в draft state.',
      'Image preprocessing должен быть reproducible для debugging.',
    ],
    statusNote: 'Fictionalized case для проверки long-form operational copy.',
  },
};
