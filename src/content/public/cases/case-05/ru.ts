import type { Project } from '../../../types';

export const case05Ru: Project = {
  slug: 'macos-vpn',
  idx: '05',
  status: 'Demo',
  codename: 'macos-vpn',
  title: 'macOS Network Guard · Demo client',
  subtitle:
    'Вымышленный macOS menu-bar client: per-app network policy, connection state и kill-switch behavior без private infrastructure details.',
  scope: 'Demo · desktop systems',
  proof: 'Placeholder media · public schema',
  production: 'Public demo content',
  role: 'Desktop network-control demo с explicit failure states',
  body: 'Demo macOS client, где user выбирает app policy, подключается через guarded tunnel state machine и держит traffic blocked, когда connection unsafe.',
  chips: ['State machine', 'Per-app policy', 'Kill switch'],
  foot: 'SwiftUI · NetworkExtension concepts · signed helper model',
  cta: { label: 'Читать кейс', href: '/cases/macos-vpn' },
  placeholder: '[ macOS client / 16:9 ]',
  cls: 'p-vpn',
  imageSrc: '/demo/case-05.svg',
  caseStudy: {
    metrics: [{ v: '5 connection states' }, { v: 'explicit unsafe state' }, { v: 'policy-first UI' }],
    contextPull: ['Network tools fail.\nProduct должен показать ', 'which state', ' failed.'],
    context: [
      'Вымышленный client сфокусирован на user-facing стороне network-control product: state clarity, predictable app policy и failure modes, которые не expose traffic silently.',
      'Private endpoints, keys и provider details намеренно отсутствуют. Public case оставляет system shape: menu-bar surface, connection state machine, policy storage и guardrails вокруг unsafe transitions.',
    ],
    heroFacts: [
      { k: 'Surface', v: 'macOS menu-bar utility' },
      { k: 'Policy', v: 'Per-app allow/block routing model' },
      { k: 'State', v: 'Disconnected · connecting · protected · degraded · blocked' },
      { k: 'Safety', v: 'Kill-switch state visible, not silent' },
    ],
    diagrams: [
      {
        title: 'Connection state model',
        ascii: `connect -> connecting -> protected
   |            | error        | tunnel lost
   v            v              v
blocked <- degraded <- reconnect attempt`,
        notes: [
          { k: 'Blocked', v: 'Unsafe traffic остаётся blocked до user или policy exit.' },
          { k: 'UI', v: 'Каждый state maps to one visible label and one allowed action set.' },
        ],
      },
    ],
    decisions: [
      {
        title: 'State machine before UI polish',
        decision: 'Connection state modeled as explicit states with allowed transitions.',
        why: 'Network products fail в edges; implicit booleans hide those edges.',
        cost: 'Больше upfront modeling до finished-looking UI.',
      },
      {
        title: 'Policy is separate from session',
        decision: 'Per-app routing policy хранится отдельно от active connection session.',
        why: 'User должен менять policy без accidental mutation current tunnel state.',
        cost: 'UI должен clearly explain pending vs active policy.',
      },
      {
        title: 'Unsafe state stays visible',
        decision: 'Kill-switch activation показывается как first-class blocked state.',
        why: 'Security feature, которая hides itself, создаёт support debt и confusion.',
        cost: 'Больше copy и edge-case handling в menu-bar surface.',
      },
    ],
    stackTable: [
      { k: 'App', v: 'SwiftUI-style menu-bar surface' },
      { k: 'Network', v: 'NetworkExtension concepts · guarded tunnel state' },
      { k: 'Policy', v: 'Per-app routing table · persisted preferences' },
      { k: 'Helper', v: 'Signed helper model · privileged boundary notes' },
      { k: 'Testing', v: 'State transition fixtures · disconnect scenarios' },
      { k: 'Privacy', v: 'No private endpoints, keys, or real client media' },
    ],
    lessonsKeep: [
      'Explicit states лучше boolean connection flags.',
      'Policy editing нужен отдельный mental model от active sessions.',
      'Unsafe network behavior должен быть visible.',
    ],
    lessons: [
      'Model degraded mode до icon design.',
      'Provider-specific logic держать за narrow adapter.',
      'Failure copy писать вместе со state machine.',
    ],
    statusNote: 'Fictionalized desktop case для public repo review.',
  },
};
