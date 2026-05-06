import type { Content } from '../types';
import { navEn } from './shared/nav';
import { heroEn } from './shared/hero';
import { aboutEn } from './shared/about';
import { stackEn, stackPrefaceEn } from './shared/stack';
import { timelineEn } from './shared/timeline';
import { contactEn } from './shared/contact';
import { footerEn } from './shared/footer';
import { uiEn } from './shared/ui';
import { cvEn } from './shared/cv';
import { case01En } from './cases/case-01';
import { case02En } from './cases/case-02';
import { case03En } from './cases/case-03';
import { case04En } from './cases/case-04';
import { case05En } from './cases/case-05';
import { case06En } from './cases/case-06';

export const en: Content = {
  nav: navEn,
  hero: heroEn,
  about: aboutEn,
  stackPreface: stackPrefaceEn,
  stack: stackEn,
  projects: [case01En, case02En, case03En, case04En, case05En, case06En],
  experience: timelineEn,
  contact: contactEn,
  footer: footerEn,
  ui: uiEn,
  cv: cvEn,
};
