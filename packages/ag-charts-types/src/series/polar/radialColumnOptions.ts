import type { AgDropShadowOptions } from '../../chart/dropShadowOptions';
import type { ContextDefault, DatumDefault, Ratio } from '../../chart/types';
import type { AgBaseSeriesOptions, AgMultiSeriesShadowHighlightOptions } from '../seriesOptions';
import type {
    AgBaseRadialSeriesThemeableOptions,
    AgRadialHighlightStyleOptions,
    AgRadialSeriesOptionsKeys,
    AgRadialSeriesOptionsNames,
} from './radialOptions';

export interface AgBaseRadialColumnSeriesOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends
        Omit<AgBaseSeriesOptions<TDatum, TContext>, 'highlight'>,
        AgRadialSeriesOptionsKeys<TDatum>,
        AgRadialSeriesOptionsNames,
        Omit<AgBaseRadialSeriesThemeableOptions<TDatum, TContext>, 'highlight'> {
    /** Base configuration for Radial Column series. */
    type: 'radial-column' | 'nightingale';

    /** The number to normalise the bar stacks to. Has no effect unless series are stacked. */
    normalizedTo?: number;
    /** Whether to group together (adjacently) separate sectors. */
    grouped?: boolean;
    /** An option indicating if the sectors should be stacked. */
    stacked?: boolean;
    /** An ID to be used to group stacked items. */
    stackGroup?: string;
}

export interface AgRadialColumnSeriesThemeableOptions<
    TDatum = DatumDefault,
    TContext = ContextDefault,
> extends AgBaseRadialSeriesThemeableOptions<TDatum, TContext> {
    /** The ratio used to calculate the column width based on the circumference and padding between items. */
    columnWidthRatio?: Ratio;
    /** Prevents columns from becoming too wide. This value is relative to the diameter of the polar chart. */
    maxColumnWidthRatio?: Ratio;
    /** Configuration for the shadow used behind the series items. */
    shadow?: AgDropShadowOptions;
    /** Configuration for highlighting when a series or legend item is hovered over. */
    highlight?: AgMultiSeriesShadowHighlightOptions<AgRadialHighlightStyleOptions, AgRadialHighlightStyleOptions>;
}

export interface AgRadialColumnSeriesOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgRadialColumnSeriesThemeableOptions<TDatum, TContext>, AgBaseRadialColumnSeriesOptions<TDatum, TContext> {
    /** Configuration for Radial Column Series. */
    type: 'radial-column';
}
