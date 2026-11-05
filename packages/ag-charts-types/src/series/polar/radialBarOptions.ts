import type { AgDropShadowOptions } from '../../chart/dropShadowOptions';
import type { ContextDefault, DatumDefault } from '../../chart/types';
import type { AgBaseSeriesOptions, AgMultiSeriesGlowHighlightOptions } from '../seriesOptions';
import type {
    AgBaseRadialSeriesThemeableOptions,
    AgRadialHighlightStyleOptions,
    AgRadialSeriesOptionsKeys,
    AgRadialSeriesOptionsNames,
} from './radialOptions';

export interface AgRadialBarSeriesThemeableOptions<TDatum = DatumDefault, TContext = ContextDefault> extends Omit<
    AgBaseRadialSeriesThemeableOptions<TDatum, TContext>,
    'highlight'
> {
    /** Configuration for the shadow used behind the series items. */
    shadow?: AgDropShadowOptions;
    /** Configuration for highlighting when a series or legend item is hovered over. */
    highlight?: AgMultiSeriesGlowHighlightOptions<AgRadialHighlightStyleOptions, AgRadialHighlightStyleOptions>;
}

export interface AgRadialBarSeriesOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends
        Omit<AgBaseSeriesOptions<TDatum, TContext>, 'highlight'>,
        AgRadialSeriesOptionsKeys<TDatum>,
        AgRadialSeriesOptionsNames,
        AgRadialBarSeriesThemeableOptions<TDatum, TContext> {
    /** Configuration for Radial Bar Series. */
    type: 'radial-bar';
    /** The number to normalise the bar stacks to. Has no effect unless series are stacked. */
    normalizedTo?: number;
    /** Whether to group together (adjacently) separate sectors. */
    grouped?: boolean;
    /** An option indicating if the sectors should be stacked. */
    stacked?: boolean;
    /** An ID to be used to group stacked items. */
    stackGroup?: string;
}
