import type { Contact } from '../../types';

export const contactEn: Contact = {
  title: ['Fork the engine, inspect the ', 'architecture', ', or use the live portfolio link.'],
  sub: 'Public demo contact data. Private builds replace this block from ignored content.',
  ways: [
    { k: 'Email', v: 'hello@example.com', href: 'mailto:hello@example.com' },
    { k: 'Telegram', v: '@username', href: 'https://t.me/username' },
    { k: 'GitHub', v: 'ilyaDev-xyz/portfolio', href: 'https://github.com/ilyaDev-xyz/portfolio' },
    { k: 'Live', v: 'ilyadev.xyz', href: 'https://ilyadev.xyz' },
  ],
};

export const contactRu: Contact = {
  title: ['Можно форкнуть движок, изучить ', 'архитектуру', ' или открыть live portfolio.'],
  sub: 'Публичные demo contacts. Private build заменяет этот блок из ignored content.',
  ways: [
    { k: 'Email', v: 'hello@example.com', href: 'mailto:hello@example.com' },
    { k: 'Telegram', v: '@username', href: 'https://t.me/username' },
    { k: 'GitHub', v: 'ilyaDev-xyz/portfolio', href: 'https://github.com/ilyaDev-xyz/portfolio' },
    { k: 'Live', v: 'ilyadev.xyz', href: 'https://ilyadev.xyz' },
  ],
};
