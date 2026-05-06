import type { Content } from '../types';
import { en } from './en';
import { cvAr } from './shared/cv';

export const ar: Content = {
  ...en,
  nav: {
    links: [
      { href: '#home', label: 'الرئيسية' },
      { href: '#about', label: 'نبذة' },
      { href: '#cases', label: 'الأعمال' },
      { href: '#timeline', label: 'المسار' },
      { href: '#stack', label: 'التقنيات' },
      { href: '#contact', label: 'التواصل' },
    ],
  },
  hero: {
    ...en.hero,
    role: 'AI Product Engineer · workflows قابلة للتدقيق · full-stack TypeScript + Python',
    pitch: [
      'أبني أنظمة AI حيث ',
      'تبقى الأتمتة قابلة للمراجعة',
      ' — أدوات داخلية، agent workflows، وoperational dashboards تجعل كل فعل من النموذج صريحا.',
    ],
    location: 'عن بعد · UTC مرن',
    hours: 'تداخل أوروبا / الولايات المتحدة',
    availability: 'Demo content',
    metaLabels: {
      location: 'الموقع',
      hours: 'الساعات',
      availability: 'التوفر',
    },
    chips: [
      { k: '', v: 'Public demo content' },
      { k: '', v: 'Engine source ready for audit' },
      { k: '', v: 'Private portfolio content deployed separately' },
    ],
    cta: {
      primary: { label: 'استعرض demo cases', href: '#cases' },
      ghost: { label: 'تواصل', href: '#contact' },
    },
  },
  about: {
    ...en.about,
    pullQuote: ['هذا المستودع العام يشحن ', 'المحرك', ' لا بيانات البورتفوليو الخاصة.'],
    paragraphs: [
      'المحتوى الموجود في repo هو demo copy خيالي مصمم لاختبار نفس layouts وMarkdown mirrors وحالات navigation وtelemetry events الموجودة في الموقع live.',
      'الـ private build يستطيع إسقاط content tree موازية بدون تعديل components أو routing أو styles أو analytics أو static mirror generator.',
      'هذا الفصل يبقي open-source artifact مفيدا، ويمنع client names وscreenshots وcontact details وproject-specific claims من التسرب إلى Git history.',
    ],
    bestFit: {
      title: 'ما الذي يوضحه هذا repo',
      items: [
        'Typed trilingual content بدون runtime i18n dependency',
        'Case-study pages من structured schema',
        'Build-time Markdown mirrors للوكلاء والمراجعين',
        'Privacy-first telemetry عبر same-origin ingest endpoint',
        'Token-first CSS بلا UI framework',
      ],
    },
    howWork: {
      title: 'Public/private split',
      items: [
        'Public content محفوظ في src/content/public',
        'Private content يعيش في src/content/.private ويجاهله git',
        'Generated active barrel يختار private content عندما يكون موجودا',
        'CI guards تمنع private files وmedia من public pushes',
      ],
    },
  },
  contact: {
    ...en.contact,
    title: ['هل تريد ', 'نظاما واضح الحدود', ' لوكلاء الذكاء الاصطناعي؟'],
    sub: 'أرسل رسالة قصيرة مع السياق، السطح المطلوب، والقيود التشغيلية.',
    ways: en.contact.ways.map((way) => {
      if (way.href?.startsWith('mailto:')) return { ...way, k: 'البريد' };
      if (way.href?.includes('t.me')) return { ...way, k: 'تيليجرام' };
      return { ...way, k: 'رابط' };
    }),
  },
  footer: {
    ...en.footer,
    mid: '© 2026 Demo Author',
    right: 'Public demo content',
  },
  cv: cvAr,
  ui: {
    ...en.ui,
    videoMirror: 'مرآة على RuTube',
    videoMirrorYoutube: 'مرآة على YouTube',
    videoPlay: 'تشغيل الفيديو',
    videoLoading: 'جار التحميل',
    backToHome: 'العودة للرئيسية',
    navBack: 'الرئيسية',
    navCases: 'حالة',
    sectionAbout: 'نبذة',
    sectionCases: 'أعمال مختارة',
    sectionTimeline: 'المسار',
    sectionStack: 'التقنيات',
    caseSectionContext: 'السياق',
    caseHeroFacts: 'حقائق',
    caseSectionArchitecture: 'المعمارية',
    caseSectionDecisions: 'قرارات هندسية',
    caseSectionStack: 'التقنيات',
    caseSectionLessons: 'الدروس والحالة',
    caseLessonsKeep: 'ما يستحق التكرار',
    caseLessonsChange: 'ما سيتغير',
    caseDecision: 'القرار',
    caseWhy: 'السبب',
    caseCost: 'الكلفة',
    caseNextEyebrow: 'التالي',
    caseNextHomeEyebrow: 'العودة للرئيسية',
    caseNextHomeTitle: 'كل الأعمال المختارة',
    caseNextHomeSubtitle: 'ستة مشاريع مختارة في صفحة واحدة.',
    copyMarkdown: 'نسخ .md',
    copyMarkdownDone: 'تم النسخ',
    heroResumeDownload: 'CV PDF',
    projectStatusLabels: {
      Delivered: 'تم التسليم',
      Published: 'منشور',
      'R&D': 'بحث وتطوير',
      MVP: 'MVP',
      'Personal tool': 'أداة شخصية',
      'Open source': 'مفتوح المصدر',
      Demo: 'تجريبي',
      'Open engine': 'محرك مفتوح',
    },
  },
};
