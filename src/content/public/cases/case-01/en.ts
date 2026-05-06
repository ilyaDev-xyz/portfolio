import type { Project } from '../../../types';

export const case01En: Project = {
  slug: 'ai-crm',
  idx: '01',
  status: 'Demo',
  codename: 'ai-crm',
  title: 'AI CRM · Demo lead desk',
  subtitle:
    'Fictional operator desk where an AI assistant drafts lead summaries, suggests next actions, and waits for human approval before touching customer state.',
  scope: 'Demo · 6 weeks equivalent',
  proof: 'Placeholder media · public schema',
  production: 'Public demo content',
  role: 'Full-stack CRM workflow demo with auditable AI actions',
  body: 'A demo CRM for inbound leads. The assistant can summarize conversations, propose a qualification state, and prepare a follow-up message. Operators approve, edit, or reject every state change before it is committed.',
  chips: ['Human approval', 'Tool contracts', 'Audit log'],
  foot: 'FastAPI · React · PostgreSQL · Redis · LLM tools',
  cta: { label: 'Read case study', href: '/cases/ai-crm' },
  placeholder: '[ demo crm / 16:9 ]',
  cls: 'p-ai-crm featured',
  videoId: 'dQw4w9WgXcQ',
  thumbnail: '/demo/case-01.svg',
  videoMirrorUrl: 'https://rutube.ru/video/private/2afc367fc1968ed386e52665ee7a829b/?p=WcFMiE-n0wydU96W_9-nXw',
  videoTranscript: {
    synopsis:
      'Demo CRM walkthrough: AI assistant drafts a lead summary, proposes a qualification state and prepares a follow-up. Operator reviews the proposal in a queue and approves, edits or rejects before any state change is committed.',
    fullText:
      'Demo placeholder transcript. The video is a walkthrough of the public CRM demo — assistant drafts, queue review, operator approval, audit trail. No customer data is shown. Replace this transcript when forking the engine with your own content.',
  },
  caseStudy: {
    metrics: [{ v: '9 demo tools' }, { v: '4 review states' }, { v: '0 autonomous writes' }],
    contextPull: ['AI can draft the next step.\nOnly a ', 'human', ' commits it.'],
    context: [
      'The fictional product models a small operations team that receives more inbound messages than it can triage in real time. The useful automation is not a chatbot that pretends to close deals; it is a review queue that turns messy context into operator-ready decisions.',
      'The demo keeps the hard boundary visible: model output enters the system as a proposal. The backend owns permissions, state transitions, and durable audit rows.',
    ],
    heroFacts: [
      { k: 'Surface', v: 'CRM dashboard + review queue' },
      { k: 'AI lane', v: 'Draft summaries, statuses, and follow-ups' },
      { k: 'Write model', v: 'Human-approved only' },
      { k: 'Telemetry', v: 'Review latency, accepted drafts, rejected drafts' },
    ],
    diagrams: [
      {
        title: 'Review-first action path',
        ascii: `Inbound lead -> AI draft -> Review queue -> Operator decision
                                | approve | edit | reject |
                                v         v      v
                          audited state transition`,
        notes: [
          { k: 'Boundary', v: 'The model never writes directly to the lead table.' },
          { k: 'Audit', v: 'Every proposed and accepted change keeps actor, reason, and timestamp.' },
        ],
      },
    ],
    decisions: [
      {
        title: 'Proposal records before domain writes',
        decision: 'AI output is stored as a proposal object with a typed action and payload.',
        why: 'Operators need to inspect intent before mutation, and reviewers need a record of what the model attempted.',
        cost: 'Extra screens and state transitions, but debugging becomes straightforward.',
      },
      {
        title: 'Small tool surface',
        decision: 'The assistant gets narrow read tools and no broad SQL-style execution.',
        why: 'The useful capability is retrieval plus drafting, not unrestricted data access.',
        cost: 'More purpose-built endpoints to maintain.',
      },
      {
        title: 'Accepted draft metrics',
        decision: 'The dashboard tracks accepted, edited, and rejected suggestions separately.',
        why: 'Raw AI usage is vanity; acceptance quality tells whether the workflow helps operators.',
        cost: 'Requires event taxonomy discipline from day one.',
      },
    ],
    stackTable: [
      { k: 'Backend', v: 'FastAPI · PostgreSQL · Redis queue' },
      { k: 'Frontend', v: 'React · typed forms · review queue UI' },
      { k: 'AI', v: 'LLM tool contracts · constrained JSON payloads' },
      { k: 'Ops', v: 'Docker Compose · structured logs · nightly export' },
      { k: 'Testing', v: 'Payload fixtures · approval-state tests' },
      { k: 'Privacy', v: 'No real customer data in the public repo' },
    ],
    lessonsKeep: [
      'Proposal-first shape keeps automation explainable.',
      'Typed actions make UI review states cheap to render.',
      'Acceptance metrics matter more than prompt demos.',
    ],
    lessons: [
      'Add reviewer notes as first-class data earlier.',
      'Model confidence should be displayed as weak signal, not a decision.',
      'Tool schemas need versioning once proposals are persisted.',
    ],
    statusNote: 'Fictionalized case used to validate the public portfolio engine.',
  },
};
