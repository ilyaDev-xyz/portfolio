import type { Content } from '../types';
import { navRu } from './shared/nav';
import { heroRu } from './shared/hero';
import { aboutRu } from './shared/about';
import { stackRu, stackPrefaceRu } from './shared/stack';
import { timelineRu } from './shared/timeline';
import { contactRu } from './shared/contact';
import { footerRu } from './shared/footer';
import { uiRu } from './shared/ui';
import { cvRu } from './shared/cv';
import { case01Ru } from './cases/case-01';
import { case02Ru } from './cases/case-02';
import { case03Ru } from './cases/case-03';
import { case04Ru } from './cases/case-04';
import { case05Ru } from './cases/case-05';
import { case06Ru } from './cases/case-06';

export const ru: Content = {
  nav: navRu,
  hero: heroRu,
  about: aboutRu,
  stackPreface: stackPrefaceRu,
  stack: stackRu,
  projects: [case01Ru, case02Ru, case03Ru, case04Ru, case05Ru, case06Ru],
  experience: timelineRu,
  contact: contactRu,
  footer: footerRu,
  ui: uiRu,
  cv: cvRu,
};
