import type { Project } from '../../../types';

export const case01Ru: Project = {
  slug: 'ai-crm',
  idx: '01',
  status: 'Demo',
  codename: 'ai-crm',
  title: 'AI CRM · Demo lead desk',
  subtitle:
    'Вымышленный operator desk: AI черновит summary, предлагает next action и ждёт подтверждения человека перед изменением customer state.',
  scope: 'Demo · эквивалент 6 недель',
  proof: 'Placeholder media · public schema',
  production: 'Public demo content',
  role: 'Full-stack CRM workflow demo с auditable AI actions',
  body: 'Demo CRM для inbound leads. Assistant суммаризирует диалог, предлагает qualification state и готовит follow-up. Оператор approve, edit или reject каждое изменение.',
  chips: ['Human approval', 'Tool contracts', 'Audit log'],
  foot: 'FastAPI · React · PostgreSQL · Redis · LLM tools',
  cta: { label: 'Читать кейс', href: '/cases/ai-crm' },
  placeholder: '[ demo crm / 16:9 ]',
  cls: 'p-ai-crm featured',
  videoId: 'dQw4w9WgXcQ',
  thumbnail: '/demo/case-01.svg',
  videoMirrorUrl: 'https://rutube.ru/video/private/2afc367fc1968ed386e52665ee7a829b/?p=WcFMiE-n0wydU96W_9-nXw',
  videoTranscript: {
    synopsis:
      'Demo-обход CRM: AI черновит summary лида, предлагает qualification state и готовит follow-up. Оператор review proposal в очереди и approve/edit/reject — никакой state change не коммитится без ручного подтверждения.',
    fullText:
      'Demo-транскрипт-заглушка. Видео — walkthrough публичного CRM-демо: черновики ассистента, review-очередь, approve оператором, audit trail. Customer data в кадре нет. Замени этот транскрипт при форке движка своим контентом.',
  },
  caseStudy: {
    metrics: [{ v: '9 demo tools' }, { v: '4 review states' }, { v: '0 autonomous writes' }],
    contextPull: ['AI черновит следующий шаг.\nКоммитит только ', 'человек', '.'],
    context: [
      'Вымышленный продукт моделирует small operations team, которая получает больше inbound сообщений, чем успевает разобрать вручную. Полезная автоматизация здесь не chatbot, который делает вид что закрывает сделки, а review queue: messy context превращается в operator-ready decisions.',
      'Demo держит границу видимой: output модели попадает в систему как proposal. Backend отвечает за permissions, state transitions и durable audit rows.',
    ],
    heroFacts: [
      { k: 'Surface', v: 'CRM dashboard + review queue' },
      { k: 'AI lane', v: 'Draft summaries, statuses, follow-ups' },
      { k: 'Write model', v: 'Только human-approved' },
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
          { k: 'Boundary', v: 'Модель никогда не пишет напрямую в lead table.' },
          { k: 'Audit', v: 'Каждое предложенное и принятое изменение хранит actor, reason и timestamp.' },
        ],
      },
    ],
    decisions: [
      {
        title: 'Proposal records before domain writes',
        decision: 'AI output сохраняется как proposal object с typed action и payload.',
        why: 'Операторам нужно видеть intent до mutation, а reviewer должен видеть что модель пыталась сделать.',
        cost: 'Больше screens и state transitions, зато debugging прямой.',
      },
      {
        title: 'Small tool surface',
        decision: 'Assistant получает узкие read tools без broad SQL-style execution.',
        why: 'Полезная capability — retrieval + drafting, не unrestricted data access.',
        cost: 'Больше purpose-built endpoints.',
      },
      {
        title: 'Accepted draft metrics',
        decision: 'Dashboard отдельно считает accepted, edited и rejected suggestions.',
        why: 'Raw AI usage — vanity; acceptance quality показывает пользу workflow.',
        cost: 'Нужна event taxonomy discipline с первого дня.',
      },
    ],
    stackTable: [
      { k: 'Backend', v: 'FastAPI · PostgreSQL · Redis queue' },
      { k: 'Frontend', v: 'React · typed forms · review queue UI' },
      { k: 'AI', v: 'LLM tool contracts · constrained JSON payloads' },
      { k: 'Ops', v: 'Docker Compose · structured logs · nightly export' },
      { k: 'Testing', v: 'Payload fixtures · approval-state tests' },
      { k: 'Privacy', v: 'Нет real customer data в public repo' },
    ],
    lessonsKeep: [
      'Proposal-first shape держит automation explainable.',
      'Typed actions удешевляют rendering review states.',
      'Acceptance metrics важнее prompt demos.',
    ],
    lessons: [
      'Reviewer notes нужно делать first-class data раньше.',
      'Model confidence показывать как weak signal, не decision.',
      'Tool schemas требуют versioning после persistence proposals.',
    ],
    statusNote: 'Fictionalized case для проверки public portfolio engine.',
  },
};
