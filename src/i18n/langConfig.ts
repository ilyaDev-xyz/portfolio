export type Lang = 'en' | 'ru' | 'ar';

export const LANGS = ['en', 'ru', 'ar'] as const satisfies readonly Lang[];

export type LangConfig = {
  code: Lang;
  htmlLang: string;
  dir: 'ltr' | 'rtl';
  label: string;
  mdExt: string;
  llmsFile: string;
  homeFile: string;
  ogLocale: string;
  cvFile: string;
  markdown: MarkdownLabels;
};

export type MarkdownLabels = {
  about: string;
  stack: string;
  cases: string;
  timeline: string;
  contact: string;
  languages: string;
  optional: string;
  scope: string;
  proof: string;
  surface: string;
  role: string;
  video: string;
  videoWalkthrough: string;
  readFullCase: string;
  source: string;
  index: string;
  caseStudyList: string;
  fullCaseStudyList: string;
  previous: string;
  upNext: string;
  author: string;
  thisFile: string;
  fullCorpus: string;
  markdownMirrorIntro: string;
  resume: string;
  lastUpdated: string;
};

export const LANG_CONFIG: Record<Lang, LangConfig> = {
  en: {
    code: 'en',
    htmlLang: 'en',
    dir: 'ltr',
    label: 'EN',
    mdExt: '.md',
    llmsFile: 'llms.txt',
    homeFile: 'index.md',
    ogLocale: 'en_US',
    cvFile: 'cv-en.pdf',
    markdown: {
      about: 'About',
      stack: 'Stack',
      cases: 'Cases',
      timeline: 'Timeline',
      contact: 'Contact',
      languages: 'Languages',
      optional: 'Optional',
      scope: 'Scope',
      proof: 'Proof',
      surface: 'Surface',
      role: 'Role',
      video: 'Video',
      videoWalkthrough: 'Video walkthrough',
      readFullCase: 'Read full case study',
      source: 'Source',
      index: 'Index',
      caseStudyList: 'case-study list for agents',
      fullCaseStudyList: 'full case-study list',
      previous: 'Previous',
      upNext: 'Up next',
      author: 'Author',
      thisFile: 'this file',
      fullCorpus: 'Full corpus (single fetch)',
      markdownMirrorIntro: 'Markdown mirror of ilyadev.xyz, built for AI agents. Each public page has a Markdown twin at the same path with `.md` (replace with `.ru.md` or `.ar.md` for translations).',
      resume: 'Resume',
      lastUpdated: 'Last updated',
    },
  },
  ru: {
    code: 'ru',
    htmlLang: 'ru',
    dir: 'ltr',
    label: 'RU',
    mdExt: '.ru.md',
    llmsFile: 'llms-ru.txt',
    homeFile: 'index.ru.md',
    ogLocale: 'ru_RU',
    cvFile: 'cv-ru.pdf',
    markdown: {
      about: 'Обо мне',
      stack: 'Стек',
      cases: 'Кейсы',
      timeline: 'Таймлайн',
      contact: 'Контакты',
      languages: 'Языки',
      optional: 'Опционально',
      scope: 'Скоуп',
      proof: 'Доказательство',
      surface: 'Поверхность',
      role: 'Роль',
      video: 'Видео',
      videoWalkthrough: 'Разбор видео',
      readFullCase: 'Читать полный кейс',
      source: 'Источник',
      index: 'Индекс',
      caseStudyList: 'список кейсов для агентов',
      fullCaseStudyList: 'полный список кейсов',
      previous: 'Назад',
      upNext: 'Дальше',
      author: 'Автор',
      thisFile: 'этот файл',
      fullCorpus: 'Полный корпус одним файлом',
      markdownMirrorIntro: 'Markdown-зеркало ilyadev.xyz для AI-агентов. У каждой публичной страницы есть Markdown-twin по тому же пути с `.md` (замени на `.ru.md` или `.ar.md` для переводов).',
      resume: 'Резюме',
      lastUpdated: 'Обновлено',
    },
  },
  ar: {
    code: 'ar',
    htmlLang: 'ar',
    dir: 'rtl',
    label: 'AR',
    mdExt: '.ar.md',
    llmsFile: 'llms-ar.txt',
    homeFile: 'index.ar.md',
    ogLocale: 'ar_AE',
    cvFile: 'cv-ar.pdf',
    markdown: {
      about: 'نبذة',
      stack: 'التقنيات',
      cases: 'الحالات',
      timeline: 'المسار',
      contact: 'التواصل',
      languages: 'اللغات',
      optional: 'اختياري',
      scope: 'النطاق',
      proof: 'الدليل',
      surface: 'السطح',
      role: 'الدور',
      video: 'الفيديو',
      videoWalkthrough: 'شرح الفيديو',
      readFullCase: 'اقرأ دراسة الحالة كاملة',
      source: 'المصدر',
      index: 'الفهرس',
      caseStudyList: 'قائمة دراسات الحالة للوكلاء',
      fullCaseStudyList: 'قائمة دراسات الحالة الكاملة',
      previous: 'السابق',
      upNext: 'التالي',
      author: 'المؤلف',
      thisFile: 'هذا الملف',
      fullCorpus: 'الكوربس الكامل في ملف واحد',
      markdownMirrorIntro: 'مرآة Markdown لموقع ilyadev.xyz، مبنية لوكلاء AI. لكل صفحة عامة نسخة Markdown على نفس المسار بامتداد `.md` (استبدله بـ `.ru.md` أو `.ar.md` للترجمات).',
      resume: 'السيرة الذاتية',
      lastUpdated: 'آخر تحديث',
    },
  },
};

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}
