/**
 * theme.ts — design tokens for "Movement" (sleep timer)
 *
 * Direction: a mechanical watch movement, seen at night.
 * - Backgrounds are a warm "movement-plate" charcoal, not pure black
 *   (kinder on OLED, warmer to the eye in the dark).
 * - Brass = the physical parts of the watch (bezel, ticks, hand, balance wheel).
 * - Lume = the signature. The warm gold-green glow of aged watch luminant.
 *   This is the ONE place colour lives: the active duration, the running hand,
 *   the completion pulse. Everything else is brass and charcoal.
 * - No blues. Cool light disrupts sleep; a warm dial is the whole mood.
 *
 * Single source of truth. Tailwind token names in tailwind.config.js mirror
 * these keys so bg-bg-2 / text-lume-glow stay in sync.
 */

export const colors = {
  bg: {
    0: '#0B0A09',   // app background, deepest
    1: '#131110',
    2: '#1C1917',   // primary surface (the dial face)
    3: '#262220',   // raised surface (chips, sheet)
    line: '#34302B', // hairlines / unlit ticks edge
  },
  brass: {
    dim:  '#6B5836', // unlit ticks, idle bezel
    base: '#A8854E', // main brass — dial ring, numerals
    hi:   '#D4B074', // polished highlight — the hand, lit edges
  },
  lume: {
    rest: '#C9BE82', // luminant at rest (dim gold-green)
    glow: '#E8DBA0', // lit / active / "charged"
  },
  text: {
    primary:   '#ECE3D2',
    secondary: '#A99C84',
    muted:     '#6C6353',
  },
} as const;

export const fonts = {
  display: 'SpaceGrotesk',
  mono:    'SpaceMono',
} as const;

export const fontSize = {
  caption: 12,  // mono captions
  sm:      14,
  base:    16,
  lg:      20,
  xl:      28,
  preset:  18,  // preset chip numerals
  dial:    128, // the hero minutes number
} as const;

export const fontWeight = {
  regular: '400',
  medium:  '500',
  bold:    '700',
} as const;

// 4-pt grid
export const space = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const radius = {
  sm:   8,
  md:   16,
  lg:   24,
  full: 999,
} as const;

/**
 * Motion — Reanimated `withSpring` configs.
 * snappy = UI feedback (chips, taps).
 * gentle = state transitions.
 * bouncy = the start "wind".
 * Balance-wheel oscillation and minute detents are tuned in their components.
 */
export const spring = {
  snappy: { damping: 18, stiffness: 240, mass: 0.7 },
  gentle: { damping: 22, stiffness: 120, mass: 1 },
  bouncy: { damping: 10, stiffness: 180, mass: 0.9 },
} as const;

// Long, calm fades — timings, not springs
export const duration = {
  dim:             800,
  windDownDefault: 60_000, // overridable in settings (30/60/90 s)
  completeFade:    1_200,
} as const;

// Dial geometry shared across components
export const dial = {
  maxMinutes: 90,
  presets:    [20, 25, 30, 45, 60, 90] as const,
  ticks:      90, // one per minute; every 5th drawn longer
} as const;

export const theme = {
  colors,
  fonts,
  fontSize,
  fontWeight,
  space,
  radius,
  spring,
  duration,
  dial,
} as const;

export type Theme = typeof theme;
export default theme;
