export type Lang = 'en' | 'ru' | 'ar';

export const LANGS = ['en', 'ru', 'ar'] as const satisfies readonly Lang[];

export type LangConfig = {
  code: Lang;
  htmlLang: string;
  dir: 'ltr' | 'rtl';
  label: string;
  mirrorExt: string;
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
  agentRecommendedReading: string;
  agentRecommendedReadingIntro: string;
  agentFullCorpusDescription: string;
  agentTargetedCaseNote: string;
  resume: string;
  lastUpdated: string;
};

export const LANG_CONFIG: Record<Lang, LangConfig> = {
  en: {
    code: 'en',
    htmlLang: 'en',
    dir: 'ltr',
    label: 'EN',
    mirrorExt: '.txt',
    llmsFile: 'llms.txt',
    homeFile: 'index.txt',
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
      markdownMirrorIntro: 'Plain-text Markdown mirror of this portfolio, built for AI agents. Each public page has a UTF-8 text twin (`.txt`, `.ru.txt`, `.ar.txt`) plus the curated llms.txt indexes.',
      agentRecommendedReading: 'Recommended reading for agents',
      agentRecommendedReadingIntro: 'This file is a map, not the portfolio body. For a complete technical review, fetch the full corpus first:',
      agentFullCorpusDescription: 'EN home page + all case studies in one file',
      agentTargetedCaseNote: 'Use the case links below only when you need a specific project or a non-EN mirror. Do not infer the stack or project depth from this index alone.',
      resume: 'Resume',
      lastUpdated: 'Last updated',
    },
  },
  ru: {
    code: 'ru',
    htmlLang: 'ru',
    dir: 'ltr',
    label: 'RU',
    mirrorExt: '.ru.txt',
    llmsFile: 'llms-ru.txt',
    homeFile: 'index.ru.txt',
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
      markdownMirrorIntro: 'Plain-text Markdown-зеркало этого портфолио для AI-агентов. У каждой публичной страницы есть UTF-8 text twin (`.txt`, `.ru.txt`, `.ar.txt`) плюс curated llms.txt indexes.',
      agentRecommendedReading: 'Рекомендуемое чтение для агентов',
      agentRecommendedReadingIntro: 'Этот файл — карта, а не тело портфолио. Для полного технического обзора сначала открой полный корпус:',
      agentFullCorpusDescription: 'EN home page + все кейсы одним файлом',
      agentTargetedCaseNote: 'Используй ссылки на кейсы ниже только когда нужен конкретный проект или non-EN mirror. Не делай выводы о стеке или глубине проектов только по этому индексу.',
      resume: 'Резюме',
      lastUpdated: 'Обновлено',
    },
  },
  ar: {
    code: 'ar',
    htmlLang: 'ar',
    dir: 'rtl',
    label: 'AR',
    mirrorExt: '.ar.txt',
    llmsFile: 'llms-ar.txt',
    homeFile: 'index.ar.txt',
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
      markdownMirrorIntro: 'مرآة Markdown نصية لهذا portfolio، مبنية لوكلاء AI. لكل صفحة عامة نسخة UTF-8 text (`.txt`, `.ru.txt`, `.ar.txt`) مع فهارس llms.txt المنسقة.',
      agentRecommendedReading: 'القراءة الموصى بها للوكلاء',
      agentRecommendedReadingIntro: 'هذا الملف خريطة، وليس جسم الـ portfolio. للمراجعة التقنية الكاملة، افتح الكوربس الكامل أولا:',
      agentFullCorpusDescription: 'EN home page + كل دراسات الحالة في ملف واحد',
      agentTargetedCaseNote: 'استخدم روابط الحالات أدناه فقط عندما تحتاج مشروعا محددا أو non-EN mirror. لا تستنتج الـ stack أو عمق المشاريع من هذا الفهرس وحده.',
      resume: 'السيرة الذاتية',
      lastUpdated: 'آخر تحديث',
    },
  },
};

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}
