import type { Project } from '../../../types';

export const case02En: Project = {
  slug: 'ai-warehouse',
  idx: '02',
  status: 'Demo',
  codename: 'ai-warehouse',
  title: 'AI Warehouse · Demo stock ops',
  subtitle:
    'Fictional inventory assistant that turns receipt photos and operator notes into reviewable stock operations with weighted-cost math and rollback records.',
  scope: 'Demo · 5 weeks equivalent',
  proof: 'Placeholder media · public schema',
  production: 'Public demo content',
  role: 'Operational inventory workflow with AI-assisted drafts',
  body: 'A demo warehouse surface where AI prepares draft supply, deduction, and preparation operations. The backend validates quantities, costs, and permissions before the operator confirms anything.',
  chips: ['Receipt intake', 'Review actions', 'Weighted average cost'],
  foot: 'FastAPI · React · PostgreSQL · OCR · worker queue',
  cta: { label: 'Read case study', href: '/cases/ai-warehouse' },
  placeholder: '[ stock ops / 16:9 ]',
  cls: 'p-wms',
  videoId: 'dQw4w9WgXcQ',
  thumbnail: '/demo/case-02.svg',
  videoMirrorUrl: 'https://rutube.ru/video/private/2afc367fc1968ed386e52665ee7a829b/?p=WcFMiE-n0wydU96W_9-nXw',
  videoTranscript: {
    synopsis:
      'Demo warehouse walkthrough: AI extracts a draft from a receipt photo, the operator reviews it in the WebApp, and weighted-average cost recalculates only after confirmation. Original evidence stays attached to every proposal.',
    fullText:
      'Demo placeholder transcript. The video walks through the public warehouse demo — receipt intake, draft review, server-side cost math, rollback records. Replace this transcript when forking the engine with your own content.',
  },
  caseStudy: {
    metrics: [{ v: '3 operation lanes' }, { v: '2-stage validation' }, { v: 'rollback records' }],
    contextPull: ['A receipt is not an order.\nIt is a ', 'draft', ' until review.'],
    context: [
      'Inventory teams often collect messy inputs: receipt photos, supplier messages, and short notes from a busy shift. The useful AI job is to normalize that input into draft operations without bypassing stock integrity.',
      'The demo keeps arithmetic server-owned. Weighted-cost updates, ingredient usage, and negative-stock checks happen after the draft is reviewed, not inside the model response.',
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
          { k: 'Evidence', v: 'The original input stays attached to the operation.' },
          { k: 'Math', v: 'The model can suggest fields; the backend recomputes totals.' },
        ],
      },
    ],
    decisions: [
      {
        title: 'Evidence stays beside the draft',
        decision: 'Every proposed operation keeps the source image or note until it is confirmed or rejected.',
        why: 'Operators need to compare AI extraction against the original input.',
        cost: 'Storage grows faster, but review quality is visible.',
      },
      {
        title: 'Server-owned cost math',
        decision: 'Weighted average cost and stock deltas are recomputed by the backend.',
        why: 'A language model should not be the source of truth for accounting arithmetic.',
        cost: 'The UI must explain mismatches between model draft and validated values.',
      },
      {
        title: 'Rollback as a product surface',
        decision: 'Confirmed operations can be reversed through typed correction records.',
        why: 'Operational software must support mistakes without silent database edits.',
        cost: 'Reporting queries need to account for corrections.',
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
      'Draft and evidence must stay linked.',
      'Accounting math belongs outside the model.',
      'Rollback records beat manual database repairs.',
    ],
    lessons: [
      'Add bulk review only after single-item review is trusted.',
      'Expose validation errors earlier in the draft state.',
      'Keep image preprocessing reproducible for debugging.',
    ],
    statusNote: 'Fictionalized case used to stress long-form operational copy.',
  },
};
