import type { Cv } from '../../types';

// Public demo CV. Fictional summary + bullets that mirror the demo case
// slugs (`ai-crm`, `roblox-game`, `ai-video-editor`). Replaces the gated
// IS_SANITIZED branch in ResumeLink — when this object is present, the
// resume chip renders and points at `pdfPath`.
export const cvEn: Cv = {
  brand: 'Demo Engineer · Public portfolio engine',
  summary:
    'Fictional product engineer used to validate the public portfolio engine end to end. Demo case studies model AI-assisted operational software where every model output enters the system as a reviewable proposal — backends own permissions, audit trails and stock math, while the assistant drafts, retrieves and routes work.',
  featuredSlugs: ['ai-crm', 'roblox-game', 'ai-video-editor'],
  featuredBullets: {
    'ai-crm': [
      'Demo CRM for inbound leads — assistant drafts summaries, qualification states and follow-ups; operators approve, edit or reject every change.',
      'Hard boundary: model output enters the system as a proposal record. Backend owns permissions, state transitions and durable audit rows.',
      'Narrow read tools, no SQL-style execution — useful capability is retrieval plus drafting, not unrestricted data access.',
      'Acceptance metrics tracked separately for accepted, edited and rejected suggestions.',
    ],
    'roblox-game': [
      'Demo arena where combat, rewards and spawn logic stay server-owned while designers tune enemies, abilities and economy through structured data.',
      'Server-authoritative balance tables — no client-side authority over rewards.',
      'Telemetry loops on session length, encounter difficulty and reward acceptance feed the next balance pass.',
      'Demo content only; placeholder media stand in for real assets.',
    ],
    'ai-video-editor': [
      'Demo editor where chat commands create proposed clip edits, captions and render jobs as diffable changesets.',
      'User reviews each changeset before it touches the committed timeline.',
      'Two-cadence playhead split: live playback time decoupled from committed editor state.',
      'One async job registry handles render and transcription queues with the same shape.',
    ],
  },
  experienceBullets: {
    'Demo · ongoing': [
      'Maintains the public portfolio engine as an inspectable artefact: typed bilingual content, agent-readable text mirrors, route-aware case pages.',
      'Drives the demo content tree — every case study is fictional but exercises the same content shape as the real portfolio.',
    ],
    'Demo · prior cycle': [
      'Prototyped the agent-mirror pipeline that emits llms.txt + per-case text mirrors for AI crawlers.',
      'Designed the privacy-first analytics server bundled with the engine — payload validation, salted visitor IDs, nightly rollup.',
    ],
  },
  education: [
    {
      when: '—',
      institution: 'Public demo content',
      program: 'Replace with real education when forking the engine.',
      status: '',
    },
  ],
  languages: [
    { name: 'English', level: 'demo placeholder' },
    { name: 'Other', level: 'demo placeholder' },
  ],
  moreCasesUrl: '/cases',
  moreCasesNote: 'Six demo case studies — explore the public portfolio engine.',
  pdfPath: '/demo/cv-en.pdf',
};

export const cvRu: Cv = {
  brand: 'Demo Engineer · Public portfolio engine',
  summary:
    'Вымышленный product engineer для валидации публичного движка портфолио end-to-end. Demo-кейсы моделируют AI-assisted operational software, где каждый model output попадает в систему как reviewable proposal — backend держит permissions, audit trail и stock math, ассистент черновит, ищет и маршрутизирует работу.',
  featuredSlugs: ['ai-crm', 'roblox-game', 'ai-video-editor'],
  featuredBullets: {
    'ai-crm': [
      'Demo CRM для inbound leads — ассистент черновит summaries, qualification states и follow-ups; оператор approve, edit или reject каждое изменение.',
      'Жёсткая граница: model output попадает в систему как proposal record. Backend держит permissions, state transitions и durable audit rows.',
      'Узкие read tools, без SQL-style execution — полезная capability это retrieval + drafting, не unrestricted data access.',
      'Acceptance metrics считаются отдельно для accepted, edited и rejected suggestions.',
    ],
    'roblox-game': [
      'Demo arena, где combat, rewards и spawn logic остаются на сервере, а designers настраивают enemies, abilities и economy через structured data.',
      'Server-authoritative balance tables — никакого client-side authority над rewards.',
      'Telemetry loops на session length, encounter difficulty и reward acceptance кормят следующий balance pass.',
      'Только demo content; placeholder media заменяют real assets.',
    ],
    'ai-video-editor': [
      'Demo editor, где chat commands создают proposed clip edits, captions и render jobs как diffable changesets.',
      'User review каждый changeset до изменения committed timeline.',
      'Two-cadence playhead split: live playback time развязан с committed editor state.',
      'Один async job registry для render и transcription queues с одной формой.',
    ],
  },
  experienceBullets: {
    'Demo · ongoing': [
      'Поддерживает публичный движок портфолио как inspectable artefact: typed bilingual content, agent-readable text mirrors, route-aware case pages.',
      'Ведёт demo-контент tree — каждый кейс вымышленный, но использует ту же форму данных что реальный portfolio.',
    ],
    'Demo · prior cycle': [
      'Прототипировал agent-mirror pipeline — эмитит llms.txt + per-case text mirrors для AI-краулеров.',
      'Спроектировал privacy-first analytics server в комплекте с движком — payload validation, salted visitor IDs, nightly rollup.',
    ],
  },
  education: [
    {
      when: '—',
      institution: 'Публичный demo-контент',
      program: 'Замените на реальное образование при форке движка.',
      status: '',
    },
  ],
  languages: [
    { name: 'Русский', level: 'demo placeholder' },
    { name: 'Другой', level: 'demo placeholder' },
  ],
  moreCasesUrl: '/cases',
  moreCasesNote: 'Шесть demo-кейсов — изучите публичный движок портфолио.',
  pdfPath: '/demo/cv-ru.pdf',
};

export const cvAr: Cv = {
  brand: 'Demo Engineer · Public portfolio engine',
  summary:
    'مهندس منتجات وهمي يستخدم للتحقق من محرك portfolio العام بالكامل. دراسات الحالة التجريبية تنمذج برامج تشغيلية مدعومة بـ AI حيث يدخل كل model output إلى النظام كـ proposal قابل للمراجعة — backend يملك الصلاحيات، audit trails، وحسابات المخزون، بينما يكتب المساعد ويستعلم ويوجه العمل.',
  featuredSlugs: ['ai-crm', 'roblox-game', 'ai-video-editor'],
  featuredBullets: {
    'ai-crm': [
      'CRM تجريبي لـ inbound leads — المساعد يكتب summaries وqualification states وfollow-ups؛ المشغل يوافق أو يعدل أو يرفض كل تغيير.',
      'حد صارم: output النموذج يدخل النظام كـ proposal record. Backend يملك permissions وstate transitions وaudit rows دائمة.',
      'Read tools ضيقة، بلا SQL-style execution — capability المفيدة هي retrieval + drafting، وليس unrestricted data access.',
      'Acceptance metrics محسوبة منفصلة لـ accepted وedited وrejected suggestions.',
    ],
    'roblox-game': [
      'Arena تجريبية حيث combat وrewards وspawn logic تبقى مملوكة للسيرفر، بينما المصممون يضبطون enemies وabilities واقتصاد عبر structured data.',
      'Balance tables بسلطة السيرفر — بلا client-side authority على rewards.',
      'Telemetry loops على session length وencounter difficulty وreward acceptance تغذي balance pass التالي.',
      'demo content فقط؛ placeholder media تحل محل real assets.',
    ],
    'ai-video-editor': [
      'محرر تجريبي حيث chat commands تنشئ proposed clip edits وcaptions وrender jobs كـ diffable changesets.',
      'المستخدم يراجع كل changeset قبل أن يلامس committed timeline.',
      'Two-cadence playhead split: live playback time منفصل عن committed editor state.',
      'Async job registry واحد يتعامل مع render وtranscription queues بنفس الشكل.',
    ],
  },
  experienceBullets: {
    'Demo · ongoing': [
      'يحافظ على portfolio engine العام كـ inspectable artefact: typed bilingual content، agent-readable text mirrors، route-aware case pages.',
      'يدير demo content tree — كل دراسة حالة وهمية لكنها تتمرن على نفس شكل البيانات الذي يستخدمه portfolio الحقيقي.',
    ],
    'Demo · prior cycle': [
      'صمم agent-mirror pipeline — يصدر llms.txt + text mirror لكل حالة لـ AI crawlers.',
      'صمم privacy-first analytics server المرفق مع المحرك — payload validation، salted visitor IDs، nightly rollup.',
    ],
  },
  education: [
    {
      when: '—',
      institution: 'محتوى تجريبي عام',
      program: 'استبدله بتعليم حقيقي عند fork المحرك.',
      status: '',
    },
  ],
  languages: [
    { name: 'العربية', level: 'demo placeholder' },
    { name: 'لغة أخرى', level: 'demo placeholder' },
  ],
  moreCasesUrl: '/cases',
  moreCasesNote: 'ست دراسات حالة تجريبية — استكشف portfolio engine العام.',
  pdfPath: '/demo/cv-ar.pdf',
};
