import type { AgDropShadowOptions } from '../../chart/dropShadowOptions';
import type { ContextDefault, DatumDefault, PixelSize } from '../../chart/types';
import type { AgMultiSeriesShadowHighlightOptions } from '../seriesOptions';
import type { AgBaseRadialColumnSeriesOptions } from './radialColumnOptions';
import type { AgBaseRadialSeriesThemeableOptions, AgRadialHighlightStyleOptions } from './radialOptions';

export interface AgNightingaleSeriesThemeableOptions<
    TDatum = DatumDefault,
    TContext = ContextDefault,
> extends AgBaseRadialSeriesThemeableOptions<TDatum, TContext> {
    /** Configuration for the shadow used behind the series items. */
    shadow?: AgDropShadowOptions;
    /** Configuration for highlighting when a series or legend item is hovered over. */
    highlight?: AgMultiSeriesShadowHighlightOptions<AgRadialHighlightStyleOptions, AgRadialHighlightStyleOptions>;
}

export interface AgNightingaleSeriesOptions<TDatum = DatumDefault, TContext = ContextDefault>
    extends AgNightingaleSeriesThemeableOptions<TDatum, TContext>, AgBaseRadialColumnSeriesOptions<TDatum, TContext> {
    /** Configuration for Nightingale Series. */
    type: 'nightingale';
    /** Apply rounded corners to each sector. */
    cornerRadius?: PixelSize;
}
