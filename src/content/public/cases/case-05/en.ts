import type { Project } from '../../../types';

export const case05En: Project = {
  slug: 'macos-vpn',
  idx: '05',
  status: 'Demo',
  codename: 'macos-vpn',
  title: 'macOS Network Guard · Demo client',
  subtitle:
    'Fictional macOS menu-bar client that models per-app network policy, connection state, and kill-switch behavior without shipping private infrastructure details.',
  scope: 'Demo · desktop systems',
  proof: 'Placeholder media · public schema',
  production: 'Public demo content',
  role: 'Desktop network-control demo with explicit failure states',
  body: 'A demo macOS client where users select an app policy, connect through a guarded tunnel state machine, and keep traffic blocked when the connection becomes unsafe.',
  chips: ['State machine', 'Per-app policy', 'Kill switch'],
  foot: 'SwiftUI · NetworkExtension concepts · signed helper model',
  cta: { label: 'Read case study', href: '/cases/macos-vpn' },
  placeholder: '[ macOS client / 16:9 ]',
  cls: 'p-vpn',
  imageSrc: '/demo/case-05.svg',
  caseStudy: {
    metrics: [{ v: '5 connection states' }, { v: 'explicit unsafe state' }, { v: 'policy-first UI' }],
    contextPull: ['Network tools fail.\nProduct must show ', 'what state', ' failed.'],
    context: [
      'The fictional client focuses on the user-facing side of a network-control product: state clarity, predictable app policy, and failure modes that do not silently expose traffic.',
      'Private endpoints, keys, and provider details are intentionally absent. The public case keeps the system shape: a menu-bar surface, a connection state machine, policy storage, and guardrails around unsafe transitions.',
    ],
    heroFacts: [
      { k: 'Surface', v: 'macOS menu-bar utility' },
      { k: 'Policy', v: 'Per-app allow/block routing model' },
      { k: 'State', v: 'Disconnected · connecting · protected · degraded · blocked' },
      { k: 'Safety', v: 'Kill-switch state is visible, not silent' },
    ],
    diagrams: [
      {
        title: 'Connection state model',
        ascii: `connect -> connecting -> protected
   |            | error        | tunnel lost
   v            v              v
blocked <- degraded <- reconnect attempt`,
        notes: [
          { k: 'Blocked', v: 'Unsafe traffic stays blocked until the user or policy exits.' },
          { k: 'UI', v: 'Every state maps to one visible label and one allowed action set.' },
        ],
      },
    ],
    decisions: [
      {
        title: 'State machine before UI polish',
        decision: 'Connection state is modeled as explicit states with allowed transitions.',
        why: 'Network products fail in edges; implicit booleans hide those edges.',
        cost: 'More up-front modeling before the interface looks finished.',
      },
      {
        title: 'Policy is separate from session',
        decision: 'Per-app routing policy is stored apart from the active connection session.',
        why: 'Users should be able to edit policy without mutating current tunnel state accidentally.',
        cost: 'The UI must explain pending vs active policy clearly.',
      },
      {
        title: 'Unsafe state stays visible',
        decision: 'Kill-switch activation is shown as a first-class blocked state.',
        why: 'A security feature that hides itself creates support debt and user confusion.',
        cost: 'More copy and edge-case handling in the menu-bar surface.',
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
      'Explicit states beat boolean connection flags.',
      'Policy editing needs a separate mental model from active sessions.',
      'Unsafe network behavior must be visible.',
    ],
    lessons: [
      'Model degraded mode before designing icons.',
      'Keep provider-specific logic behind a narrow adapter.',
      'Write failure copy while implementing the state machine.',
    ],
    statusNote: 'Fictionalized desktop case for public repo review.',
  },
};
