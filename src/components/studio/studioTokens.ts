import { useAppStore } from '../../state/appStore';

/**
 * "Open Studio" design tokens (handoff: design_handoff_studio_redesign).
 *
 * The Open Studio direction is hand-tuned to exact hex values, so rather than
 * fight Tailwind's `dark:` variant for dozens of bespoke colors we resolve a
 * single token object from the active theme and apply the colors inline. Layout
 * still uses Tailwind utility classes — only the warm/charcoal palette lives here.
 *
 * - Light tokens = direction 1c (Open Studio, light & tactile)
 * - Dark tokens  = direction 2a (Open Studio, warm charcoal night studio)
 */
export interface StudioTokens {
  /** Page + outer card background. */
  pageBg: string;
  /** Header / stepper strip background. */
  headerBg: string;
  /** Canvas card + raised surface background. */
  cardBg: string;
  /** Inner "well" the artwork sits in. */
  canvasWell: string;
  /** Hairline borders. */
  border: string;
  /** Strong text. */
  text: string;
  /** Secondary text. */
  muted: string;
  /** Faint text (captions, fine print). */
  faint: string;
  /** Stepper / view-toggle track background. */
  track: string;
  /** Inactive stepper dot background. */
  dotIdleBg: string;
  /** Stepper connector line color. */
  connector: string;
  /** Amazon "match a real set" card background. */
  amazonCardBg: string;
  /** Amazon card border. */
  amazonCardBorder: string;
  /** Amazon set sub-label color. */
  amazonSubFg: string;
  /** Primary Generate button background (CSS background value). */
  generateBg: string;
  /** Primary Generate button text. */
  generateFg: string;
  /** Generate button shadow. */
  generateShadow: string;
  /** Replay pill background. */
  replayBg: string;
  /** Replay pill text. */
  replayFg: string;
  /** Active view-toggle / segment background. */
  activeBg: string;
  /** Active view-toggle / segment text. */
  activeFg: string;
  /** Reveal template "paper" fill. */
  revealMat: string;
  /** Reveal template outline. */
  revealStroke: string;
  /** Reveal template number color. */
  revealNum: string;
  /** Separator stroke between colored regions in the reveal base. */
  revealSep: string;
  /** Extra ring on paint drops (only visible in dark to make them glow). */
  dropRing: string;
  /** Box shadow applied to paint drops. */
  dropShadow: string;
  /** "needs a bigger set" note styles (3a). */
  noteBg: string;
  noteBorder: string;
  noteFg: string;
  /** Spectrum / swatch-index panel background (3a). */
  spectrumBg: string;
}

const light: StudioTokens = {
  pageBg: '#faf5ec',
  headerBg: '#fffaf0',
  cardBg: '#fffaf0',
  canvasWell: '#ffffff',
  border: '#efe4d2',
  text: '#23201b',
  muted: '#857a66',
  faint: '#a99a80',
  track: '#f3ebdc',
  dotIdleBg: '#f0e7d6',
  connector: '#ece1cd',
  amazonCardBg: 'linear-gradient(160deg,#fff6df,#ffeec4)',
  amazonCardBorder: '#f4dfa6',
  amazonSubFg: '#9c7e3e',
  generateBg: '#23201b',
  generateFg: '#ffffff',
  generateShadow: '0 10px 22px -10px rgba(35,32,27,.7)',
  replayBg: '#23201b',
  replayFg: '#ffffff',
  activeBg: '#23201b',
  activeFg: '#ffffff',
  revealMat: '#fffaf0',
  revealStroke: '#d8cdb6',
  revealNum: '#a99a80',
  revealSep: '#ffffff',
  dropRing: 'transparent',
  dropShadow: '0 5px 11px -4px rgba(35,32,27,.45), inset 0 -4px 8px rgba(0,0,0,.16)',
  noteBg: 'rgba(255,216,20,.14)',
  noteBorder: 'rgba(220,180,40,.35)',
  noteFg: '#92703a',
  spectrumBg: '#f3ebdc',
};

const dark: StudioTokens = {
  pageBg: '#1a1714',
  headerBg: '#211d18',
  cardBg: '#211d18',
  canvasWell: '#14110f',
  border: '#322d26',
  text: '#f3ede1',
  muted: '#a89c8c',
  faint: '#8a7f6e',
  track: '#171411',
  dotIdleBg: '#2e2a24',
  connector: '#332f28',
  amazonCardBg: 'linear-gradient(160deg,#2c2620,#211d18)',
  amazonCardBorder: '#3a342b',
  amazonSubFg: '#bda66f',
  generateBg: 'linear-gradient(135deg,#ffe24d,#ffd814)',
  generateFg: '#1a1714',
  generateShadow: '0 12px 26px -10px rgba(255,216,20,.6)',
  replayBg: '#ffd814',
  replayFg: '#1a1714',
  activeBg: '#ffd814',
  activeFg: '#1a1714',
  revealMat: '#2c2823',
  revealStroke: '#4d473d',
  revealNum: '#a89c8c',
  revealSep: '#ffffff',
  dropRing: 'rgba(255,255,255,.06)',
  dropShadow: '0 6px 14px -3px rgba(0,0,0,.6), inset 0 -4px 8px rgba(0,0,0,.22)',
  noteBg: 'rgba(255,216,20,.1)',
  noteBorder: 'rgba(255,216,20,.22)',
  noteFg: '#e6cf86',
  spectrumBg: '#171411',
};

/** Amazon CTA yellow is shared across both themes. */
export const AMAZON_YELLOW = '#ffd814';

export function getStudioTokens(darkMode: boolean): StudioTokens {
  return darkMode ? dark : light;
}

/** Resolve the active Open Studio token set from the store's theme flag. */
export function useStudioTokens(): StudioTokens {
  const darkMode = useAppStore((s) => s.ui.darkMode);
  return getStudioTokens(darkMode);
}
