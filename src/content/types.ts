export type NavLink = { href: string; label: string };

export type Nav = {
  links: NavLink[];
};

export type Cta = { label: string; href: string; external?: boolean };

export type HeroChip = { k: string; v: string };

export type ProjectStatus =
  | 'Delivered'
  | 'Published'
  | 'R&D'
  | 'MVP'
  | 'Personal tool'
  | 'Open source'
  | 'Demo'
  | 'Open engine';

export type Hero = {
  name: string;
  role: string;
  pitch: [string, string, string];
  location: string;
  hours: string;
  availability: string;
  metaLabels: { location: string; hours: string; availability: string };
  chips: HeroChip[];
  cta: { primary: Cta; ghost: Cta };
};

export type About = {
  pullQuote: [string, string, string];
  paragraphs: string[];
  bestFit?: { title: string; items: string[] };
  howWork?: { title: string; items: string[] };
};

export type StackCategory = {
  label: string;
  items: string[];
};

export type Project = {
  slug: string;
  idx: string;
  status: ProjectStatus;
  codename: string | null;
  title: string;
  subtitle: string;
  scope: string;
  proof?: string;
  production?: string;
  role: string;
  body: string;
  chips?: string[];
  foot: string;
  cta?: Cta;
  cta2?: Cta;
  placeholder: string;
  cls: string;
  isVideo?: boolean;
  videoId?: string;
  videoMirrorUrl?: string;
  /** Local preview path. For video projects: thumbnail behind the LiteYouTube
   *  facade (avoids RU's `i.ytimg.com` throttling, no third-party request
   *  before click). For static-image projects (no videoId): home-tile image
   *  used when `imageSrc` carries a different full case-page hero. Path is
   *  relative to public/. */
  thumbnail?: string;
  imageSrc?: string;
  videoTranscript?: VideoTranscript;
  caseStudy?: CaseStudy;
};

export type VideoTranscript = {
  synopsis: string;
  fullText: string;
};

export type CaseStudyMetric = { v: string };

export type CaseStudyDecision = {
  title: string;
  decision: string;
  why: string;
  cost: string;
};

export type CaseStudyHeroFact = { k: string; v: string };

export type CaseStudyDiagramNote = { k: string; v: string };

export type CaseStudyDiagramImage = {
  src: string;
  alt: string;
  caption?: string;
};

export type CaseStudyDiagram = {
  title: string;
  ascii?: string;
  images?: CaseStudyDiagramImage[];
  imageCols?: string;
  notes?: CaseStudyDiagramNote[];
};

export type CaseStudyStackRow = { k: string; v: string };

export type CaseStudy = {
  metrics: CaseStudyMetric[];
  contextPull?: string | [string, string, string];
  context: string[];
  heroFacts?: CaseStudyHeroFact[];
  diagrams?: CaseStudyDiagram[];
  decisions: CaseStudyDecision[];
  stackTable: CaseStudyStackRow[];
  lessonsKeep?: string[];
  lessons: string[];
  statusNote?: string;
};

export type ExperienceRow = {
  when: string;
  title: string;
  tag: string;
  body: string;
};

export type Contact = {
  title: [string, string, string];
  sub: string;
  ways: { k: string; v: string; href?: string }[];
};

export type Footer = {
  left: string;
  leftHref?: string;
  mid: string;
  right: string;
};

export type Ui = {
  videoMirror: string;
  videoMirrorYoutube: string;
  videoPlay: string;
  videoLoading: string;
  backToHome: string;
  navBack: string;
  navCases: string;
  sectionAbout: string;
  sectionCases: string;
  sectionTimeline: string;
  sectionStack: string;
  caseSectionContext: string;
  caseHeroFacts: string;
  caseSectionArchitecture: string;
  caseSectionDecisions: string;
  caseSectionStack: string;
  caseSectionLessons: string;
  caseLessonsKeep: string;
  caseLessonsChange: string;
  caseDecision: string;
  caseWhy: string;
  caseCost: string;
  caseNextEyebrow: string;
  caseNextHomeEyebrow: string;
  caseNextHomeTitle: string;
  caseNextHomeSubtitle: string;
  copyMarkdown: string;
  copyMarkdownDone: string;
  heroResumeDownload: string;
  notFoundTitle: string;
  notFoundMessage: string;
  notFoundBack: string;
  projectStatusLabels: Record<ProjectStatus, string>;
};

export type CvEducationRow = {
  when: string;
  institution: string;
  program: string;
  status: string;
};

export type CvLanguageRow = {
  name: string;
  level: string;
};

export type Cv = {
  brand: string;
  summary: string;
  featuredSlugs: string[];
  featuredBullets?: Record<string, string[]>;
  experienceBullets?: Record<string, string[]>;
  education: CvEducationRow[];
  languages: CvLanguageRow[];
  moreCasesUrl: string;
  moreCasesNote: string;
  /** Public path for the rendered PDF. Defaults to `/private/cv-<lang>.pdf`
   *  when omitted (private build). Public demo overrides this so the
   *  resume link points at a committed path under `public/demo/`. */
  pdfPath?: string;
};

export type Content = {
  nav: Nav;
  hero: Hero;
  about: About;
  stackPreface?: string;
  stack: StackCategory[];
  projects: Project[];
  experience: ExperienceRow[];
  contact: Contact;
  footer: Footer;
  ui: Ui;
  cv?: Cv;
};
