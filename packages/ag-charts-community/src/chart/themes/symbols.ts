import type { AgChartLegendPosition, FontWeight } from '../../options/agChartOptions';

export const EXTENDS_CHART_DEFAULTS = Symbol('extends-chart-defaults') as unknown as string;
export const EXTENDS_AXES_DEFAULTS = Symbol('extends-axes-defaults') as unknown as string;
export const EXTENDS_AXES_LABEL_DEFAULTS = Symbol('extends-axes-label-defaults') as unknown as string;
export const EXTENDS_AXES_LINE_DEFAULTS = Symbol('extends-axes-line-defaults') as unknown as string;
export const EXTENDS_AXES_TICK_DEFAULTS = Symbol('extends-axes-tick-defaults') as unknown as string;
export const EXTENDS_SERIES_DEFAULTS = Symbol('extends-series-defaults') as unknown as string;
export const EXTENDS_CARTESIAN_MARKER_DEFAULTS = Symbol('extends-cartesian-marker-defaults') as unknown as string;
export const OVERRIDE_SERIES_LABEL_DEFAULTS = Symbol('override-series-label-defaults') as unknown as string;
export const DEFAULT_FONT_FAMILY = Symbol('default-font') as unknown as string;
export const DEFAULT_LABEL_COLOUR = Symbol('default-label-colour') as unknown as string;
export const DEFAULT_MUTED_LABEL_COLOUR = Symbol('default-muted-label-colour') as unknown as string;
export const DEFAULT_AXIS_GRID_COLOUR = Symbol('default-axis-grid-colour') as unknown as string;
export const DEFAULT_BACKGROUND_COLOUR = Symbol('default-background-colour') as unknown as string;
export const DEFAULT_SHADOW_COLOUR = Symbol('default-shadow-colour') as unknown as string;
export const DEFAULT_TREEMAP_TILE_BORDER_COLOUR = Symbol('default-treemap-tile-border-colour') as unknown as string;

export const BOLD: FontWeight = 'bold';
export const BOTTOM: AgChartLegendPosition = 'bottom';
