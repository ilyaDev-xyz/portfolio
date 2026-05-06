import type { Project } from '../../../types';

export const case03En: Project = {
  slug: 'ai-video-editor',
  idx: '03',
  status: 'Demo',
  codename: 'ai-video-editor',
  title: 'AI Video Editor · Demo timeline',
  subtitle:
    'Fictional media workspace where prompts generate timeline edits as diffable changesets instead of mutating the project directly.',
  scope: 'Demo · R&D prototype',
  proof: 'Placeholder media · public schema',
  production: 'Public demo content',
  role: 'AI-assisted timeline editor with audit-first changesets',
  body: 'A demo editor where chat commands create proposed clip edits, captions, and render jobs. The user reviews a changeset before it touches the committed timeline.',
  chips: ['Timeline diffs', 'Render jobs', 'Undo stack'],
  foot: 'React · Remotion · worker queue · local media tools',
  cta: { label: 'Read case study', href: '/cases/ai-video-editor' },
  placeholder: '[ timeline ui / 16:9 ]',
  cls: 'p-ai-video',
  videoId: 'dQw4w9WgXcQ',
  thumbnail: '/demo/case-03.svg',
  videoMirrorUrl: 'https://rutube.ru/video/private/2afc367fc1968ed386e52665ee7a829b/?p=WcFMiE-n0wydU96W_9-nXw',
  videoTranscript: {
    synopsis:
      'Demo timeline walkthrough: a chat command produces a proposed clip edit as a diffable changeset; the user inspects the diff before it touches the committed timeline. Render and transcription jobs flow through one async registry.',
    fullText:
      'Demo placeholder transcript. The video walks through the public AI video editor demo — prompt-driven changesets, two-cadence playhead, diff preview, async job lanes. Replace this transcript when forking the engine with your own content.',
  },
  caseStudy: {
    metrics: [{ v: 'Diff-first editing' }, { v: '2 async job lanes' }, { v: 'review before commit' }],
    contextPull: ['Prompts can edit fast.\nA timeline still needs ', 'diffs', '.'],
    context: [
      'Media tools become fragile when AI writes directly into live timeline state. A prompt may be useful, but the user needs to see the proposed edit, compare it against the current timeline, and reject it without losing work.',
      'The demo treats each AI response as a changeset over clips, captions, and render settings. Nothing becomes committed until the user accepts the diff.',
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
          { k: 'State split', v: 'Live playback time never drives committed editor state.' },
          { k: 'Review', v: 'The user sees exactly which clips and captions change.' },
        ],
      },
    ],
    decisions: [
      {
        title: 'Changesets, not hidden mutations',
        decision: 'AI edits are represented as explicit timeline patches.',
        why: 'Creative tools need trust; invisible mutation destroys trust quickly.',
        cost: 'Patch generation and preview UI add complexity.',
      },
      {
        title: 'Separate live playback state',
        decision: 'Playback time lives outside the committed editor store.',
        why: 'Frame-rate updates should not re-render the whole editor tree.',
        cost: 'More coordination code around the player bridge.',
      },
      {
        title: 'Async job registry',
        decision: 'Rendering and transcription share one job tracking shape.',
        why: 'The UI should not learn a new transport for every background task.',
        cost: 'The registry must be generic enough without becoming vague.',
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
      'Diff-first AI editing is easier to trust.',
      'Heavy playback state needs isolation.',
      'One job registry pays off after the second async lane.',
    ],
    lessons: [
      'Patch validation should be schema-versioned earlier.',
      'Preview thumbnails should be cached by changeset id.',
      'Chat history should link directly to accepted timeline patches.',
    ],
    statusNote: 'Fictionalized case for the public repository.',
  },
};
