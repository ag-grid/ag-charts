import type { Styler } from '../../chart/callbackOptions';
import type { AgNumberAxisOptions, AgSeriesAreaBackgroundRegion } from '../../chart/cartesianOptions';
import type { AgNumericValue } from '../../chart/dataValues';
import type { DatumKey, PixelSize } from '../../chart/types';
import type {
    AgScatterSeriesItemStylerParams,
    AgScatterSeriesOptionsKeys,
    AgScatterSeriesOptionsNames,
    AgScatterSeriesThemeableOptions,
} from '../../series/cartesian/scatterOptions';
import type { AgSeriesMarkerStyle } from '../../series/markerOptions';

export interface AgScatterQuadrantPreset<TDatum, TContext>
    extends
        Omit<AgScatterSeriesOptionsKeys<TDatum>, 'colorKey'>,
        Omit<AgScatterSeriesOptionsNames, 'colorName'>,
        Omit<
            AgScatterSeriesThemeableOptions<TDatum, TContext>,
            'colorScale' | 'itemStyler' | 'showInMiniChart' | 'title'
        > {
    /** TODO */
    alignAxesToPivot?: boolean;
    /** TODO */
    itemStyler?: Styler<AgScatterQuadrantItemStylerParams<TDatum, TContext>, AgQuadrantRegionMarkerStyle>;
    /** TODO */
    pivot?: AgQuadrantPivotOptions;
    /** TODO */
    regions?: AgQuadrantRegionsOptions;
    /** The key to use to retrieve size values from the data, used to control the size of the markers. */
    sizeKey?: DatumKey<TDatum>;
    /** Determines the smallest size a marker can be in pixels when `sizeKey` is present. Defaults to `size` when not set. */
    minSize?: PixelSize;
    /** Determines the largest size a marker can be in pixels when `sizeKey` is present. */
    maxSize?: PixelSize;
    /** TODO */
    xAxis?: AgScatterQuadrantAxisOptions<TContext>;
    /** TODO */
    yAxis?: AgScatterQuadrantAxisOptions<TContext>;
}

export interface AgQuadrantPivotOptions {
    x?: AgNumericValue;
    y?: AgNumericValue;
}

export interface AgQuadrantRegionsOptions {
    topLeft?: AgQuadrantRegionOptions;
    topRight?: AgQuadrantRegionOptions;
    bottomLeft?: AgQuadrantRegionOptions;
    bottomRight?: AgQuadrantRegionOptions;
}

export interface AgQuadrantRegionOptions extends Omit<AgSeriesAreaBackgroundRegion, 'xRange' | 'yRange'> {
    marker?: AgQuadrantRegionMarkerStyle;
}

export interface AgQuadrantRegionMarkerStyle extends AgSeriesMarkerStyle {}

export interface AgScatterQuadrantAxisOptions<TContext> extends Omit<
    AgNumberAxisOptions<TContext>,
    'crossAt' | 'crossLines' | 'crosshair' | 'keys' | 'reverse' | 'position' | 'type'
> {}

export interface AgScatterQuadrantItemStylerParams<TDatum, TContext> extends AgScatterSeriesItemStylerParams<
    TDatum,
    TContext
> {
    region: AgQuadrantRegion;
}

export type AgQuadrantRegion = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
