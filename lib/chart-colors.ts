// Brand palette — define once, import into every chart file.

// -- Primary (burgundy family) ----------------------------------------
export const BURGUNDY = '#9E0A71';
export const BURGUNDY_MID = '#B83C8E';
export const BURGUNDY_LIGHT = '#FF80DF';
export const BURGUNDY_FADED = '#E0BBD0';
export const BURGUNDY_LIGHTER = '#FFCEF4';
export const BURGUNDY_WASH = '#F4E8EF';

// -- Accent (blue family) ---------------------------------------------
export const BLUE = '#00568B';
export const BLUE_MID = '#3585B4';
export const BLUE_LIGHT = '#00B1D2';
export const BLUE_LIGHTER = '#B2E6F1';
export const BLUE_CI = '#5A8FAE'; // confidence-interval fills

// -- Secondary palette (used as series 3, 4, 5) -----------------------
export const ORANGE = '#F17E00';
export const ORANGE_LIGHT = '#FFC000';
export const ORANGE_LIGHTER = '#FFE0A9';
export const GREEN = '#136A4A';
export const GREEN_LIGHT = '#3FAF66';
export const GREEN_LIGHTER = '#9EDFA7';

// -- Text and structure -----------------------------------------------
export const INK = '#0A0A0A';        // headings, axis lines
export const INK_BODY = '#303030';   // body text
export const INK_MUTED = '#5C5C5C';  // descriptions, captions
export const INK_SUBTLE = '#808080'; // meta info, axis ticks

// -- Chart-card surface tokens ----------------------------------------
// These are slightly burgundy-tinted neutrals used as backgrounds and
// borders inside chart cards / stat cards / callouts.
export const CARD_BG = '#FAF7F9';
export const CARD_BORDER = '#F0E8EE';
export const CHART_GRID = '#EEE6EC';

// -- Recharts shared props --------------------------------------------
export const chartDefaults = {
  isAnimationActive: false,
} as const;

export const axisTickStyle = {
  fontFamily: 'var(--font-roboto-mono), ui-monospace, monospace',
  fontSize: 11,
  fill: INK_SUBTLE,
} as const;

/** Smaller tick style for charts with many labels along an axis. */
export const compactTickStyle = {
  fontFamily: 'var(--font-roboto-mono), ui-monospace, monospace',
  fontSize: 9.5,
  fill: INK_SUBTLE,
} as const;

export const gridProps = {
  strokeDasharray: '3 3',
  stroke: CHART_GRID,
} as const;
