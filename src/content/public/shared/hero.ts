import type { Hero } from '../../types';

export const heroEn: Hero = {
  name: 'Demo Author',
  role: 'AI Product Engineer · auditable workflows · full-stack TypeScript + Python',
  pitch: ['I build AI systems where ', 'automation stays reviewable', ' — internal tools, agent workflows, and operational dashboards that make every model action explicit.'],
  location: 'Remote · UTC flexible',
  hours: 'EU / US overlap',
  availability: 'Demo content',
  metaLabels: {
    location: 'Location',
    hours: 'Hours',
    availability: 'Availability',
  },
  chips: [
    { k: '', v: 'Public demo content' },
    { k: '', v: 'Engine source ready for audit' },
    { k: '', v: 'Private portfolio content deployed separately' },
  ],
  cta: {
    primary: { label: 'See demo cases', href: '#cases' },
    ghost: { label: 'Contact', href: '#contact' },
  },
};

export const heroRu: Hero = {
  name: 'Demo Author',
  role: 'AI Product Engineer · проверяемые workflow · full-stack TypeScript + Python',
  pitch: ['Строю AI-системы, где ', 'автоматизация остаётся проверяемой', ' — внутренние инструменты, agent workflows и operational dashboards с явной границей каждого действия модели.'],
  location: 'Remote · гибкий UTC',
  hours: 'EU / US overlap',
  availability: 'Demo content',
  metaLabels: {
    location: 'Локация',
    hours: 'Часы',
    availability: 'Статус',
  },
  chips: [
    { k: '', v: 'Публичный demo content' },
    { k: '', v: 'Движок открыт для аудита' },
    { k: '', v: 'Приватный контент деплоится отдельно' },
  ],
  cta: {
    primary: { label: 'Смотреть demo-кейсы', href: '#cases' },
    ghost: { label: 'Контакты', href: '#contact' },
  },
};
