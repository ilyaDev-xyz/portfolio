import type { Project } from '../../../types';

export const case03Ru: Project = {
  slug: 'ai-video-editor',
  idx: '03',
  status: 'Demo',
  codename: 'ai-video-editor',
  title: 'AI Video Editor · Demo timeline',
  subtitle:
    'Вымышленный media workspace, где prompts создают timeline edits как diffable changesets, а не мутируют project напрямую.',
  scope: 'Demo · R&D prototype',
  proof: 'Placeholder media · public schema',
  production: 'Public demo content',
  role: 'AI-assisted timeline editor с audit-first changesets',
  body: 'Demo editor, где chat commands создают proposed clip edits, captions и render jobs. User review changeset до изменения committed timeline.',
  chips: ['Timeline diffs', 'Render jobs', 'Undo stack'],
  foot: 'React · Remotion · worker queue · local media tools',
  cta: { label: 'Читать кейс', href: '/cases/ai-video-editor' },
  placeholder: '[ timeline ui / 16:9 ]',
  cls: 'p-ai-video',
  videoId: 'dQw4w9WgXcQ',
  thumbnail: '/demo/case-03.svg',
  videoMirrorUrl: 'https://rutube.ru/video/private/2afc367fc1968ed386e52665ee7a829b/?p=WcFMiE-n0wydU96W_9-nXw',
  videoTranscript: {
    synopsis:
      'Demo-обход таймлайна: chat command создаёт proposed clip edit как diffable changeset; пользователь review diff до изменения committed timeline. Render и transcription jobs проходят через один async registry.',
    fullText:
      'Demo-транскрипт-заглушка. Видео — walkthrough публичного AI-видеоредактора: prompt-driven changesets, two-cadence playhead, diff preview, async job lanes. Замени этот транскрипт при форке движка своим контентом.',
  },
  caseStudy: {
    metrics: [{ v: 'Diff-first editing' }, { v: '2 async job lanes' }, { v: 'review before commit' }],
    contextPull: ['Prompts могут редактировать быстро.\nTimeline всё равно нужны ', 'diffs', '.'],
    context: [
      'Media tools становятся fragile, когда AI пишет напрямую в live timeline state. Prompt может быть полезным, но user должен увидеть proposed edit, сравнить его с current timeline и reject без потери работы.',
      'Demo трактует каждый AI response как changeset над clips, captions и render settings. Ничего не становится committed до accept.',
    ],
    heroFacts: [
      { k: 'Surface', v: 'Timeline + chat side panel' },
      { k: 'AI lane', v: 'Clip edits · captions · render instructions' },
      { k: 'State', v: 'Committed timeline vs proposed changeset' },
      { k: 'Async', v: 'Render jobs and transcription jobs' },
    ],
    diagrams: [
      {
        title: 'Changeset boundary',
        ascii: `Prompt -> edit planner -> changeset preview -> accept/reject
                         |              |
                         v              v
                 live timeline stays    committed timeline updates only on accept`,
        notes: [
          { k: 'State split', v: 'Live playback time не двигает committed editor state.' },
          { k: 'Review', v: 'User видит какие clips и captions изменятся.' },
        ],
      },
    ],
    decisions: [
      {
        title: 'Changesets, not hidden mutations',
        decision: 'AI edits представлены как explicit timeline patches.',
        why: 'Creative tools требуют trust; invisible mutation быстро его ломает.',
        cost: 'Patch generation и preview UI добавляют complexity.',
      },
      {
        title: 'Separate live playback state',
        decision: 'Playback time живёт вне committed editor store.',
        why: 'Frame-rate updates не должны re-render whole editor tree.',
        cost: 'Больше coordination code вокруг player bridge.',
      },
      {
        title: 'Async job registry',
        decision: 'Rendering и transcription используют один job tracking shape.',
        why: 'UI не должен учить новый transport для каждой background task.',
        cost: 'Registry должен быть generic, но не vague.',
      },
    ],
    stackTable: [
      { k: 'UI', v: 'React · timeline components · diff preview' },
      { k: 'Playback', v: 'Remotion-style player boundary' },
      { k: 'AI', v: 'Prompt planner · JSON patches' },
      { k: 'Jobs', v: 'Render queue · transcription queue' },
      { k: 'State', v: 'Committed editor store · live playback store' },
      { k: 'Media', v: 'Local placeholder assets only' },
    ],
    lessonsKeep: [
      'Diff-first AI editing проще доверять.',
      'Heavy playback state нуждается в isolation.',
      'Один job registry окупается после второй async lane.',
    ],
    lessons: [
      'Patch validation нужно schema-version раньше.',
      'Preview thumbnails лучше cache by changeset id.',
      'Chat history должен ссылаться прямо на accepted timeline patches.',
    ],
    statusNote: 'Fictionalized case для public repository.',
  },
};
