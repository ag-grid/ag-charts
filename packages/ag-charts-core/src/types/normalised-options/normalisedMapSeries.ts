import type {
    AgChartLabelCollisionPlacement,
    AgMapLineBackgroundOptions,
    AgMapLineSeriesItemStylerParams,
    AgMapLineSeriesLabelFormatterParams,
    AgMapLineSeriesOptions,
    AgMapLineSeriesStyle,
    AgMapMarkerSeriesItemStylerParams,
    AgMapMarkerSeriesLabelFormatterParams,
    AgMapMarkerSeriesOptions,
    AgMapMarkerSeriesStyle,
    AgMapShapeBackgroundOptions,
    AgMapShapeSeriesItemStylerParams,
    AgMapShapeSeriesLabelFormatterParams,
    AgMapShapeSeriesOptions,
    AgMapShapeSeriesStyle,
    CssColor,
    OverflowStrategy,
    Styler,
} from 'ag-charts-types';

import type { FeatureCollection } from '../geojson';
import type { Normalised } from './normalise';
import type { FillStrokeMorph, NormalisedColorType } from './normalisedCommonOptions';
import type { NormalisedCollisionFreeSeriesLabelOptions, NormalisedSeriesLabelOptions } from './normalisedLabelOptions';
import type { NormalisedColorScaleOptions } from './normalisedScatterSeries';

/** Keys the topology series base reads; every map series' normalised own options satisfy this. */
export interface NormalisedTopologySeriesKeys {
    topology?: FeatureCollection;
    legendItemName?: string;
}

export type NormalisedMapShapeSeriesStyle = Normalised<AgMapShapeSeriesStyle, never, FillStrokeMorph>;
export type NormalisedMapLineSeriesStyle = Normalised<AgMapLineSeriesStyle, never, { stroke?: CssColor }>;
export type NormalisedMapMarkerSeriesStyle = Normalised<AgMapMarkerSeriesStyle, never, FillStrokeMorph>;

/** Shape label; the deprecated `overflowStrategy` is folded into `truncate` by the theme. */
export type NormalisedMapShapeSeriesLabelOptions =
    NormalisedCollisionFreeSeriesLabelOptions<AgMapShapeSeriesLabelFormatterParams> & {
        lineHeight?: number;
        overflowStrategy?: OverflowStrategy;
    };

export type NormalisedMapLineSeriesLabelOptions = NormalisedSeriesLabelOptions<AgMapLineSeriesLabelFormatterParams>;

export type NormalisedMapMarkerSeriesLabelOptions =
    NormalisedSeriesLabelOptions<AgMapMarkerSeriesLabelFormatterParams> & {
        placement: AgChartLabelCollisionPlacement | AgChartLabelCollisionPlacement[];
        spacing?: number;
    };

type TopologyStrokeRequiredKeys = 'stroke' | 'strokeWidth' | 'strokeOpacity' | 'lineDash' | 'lineDashOffset';

/** Map shape options the series owns, before the common series keys are layered on. */
export type NormalisedMapShapeSeriesOwnOptions = Normalised<
    AgMapShapeSeriesOptions,
    | 'idKey'
    | 'topologyIdKey'
    | 'fill'
    | 'fillOpacity'
    | TopologyStrokeRequiredKeys
    | 'padding'
    | 'label'
    | 'colorScale',
    {
        topology?: FeatureCollection;
        fill: NormalisedColorType;
        stroke: CssColor;
        label: NormalisedMapShapeSeriesLabelOptions;
        colorScale: NormalisedColorScaleOptions;
        itemStyler?: Styler<AgMapShapeSeriesItemStylerParams<unknown, unknown>, AgMapShapeSeriesStyle>;
    }
>;

/** Map line options the series owns, before the common series keys are layered on. */
export type NormalisedMapLineSeriesOwnOptions = Normalised<
    AgMapLineSeriesOptions,
    'idKey' | 'topologyIdKey' | TopologyStrokeRequiredKeys | 'maxStrokeWidth' | 'label' | 'colorScale',
    {
        topology?: FeatureCollection;
        stroke: CssColor;
        label: NormalisedMapLineSeriesLabelOptions;
        colorScale: NormalisedColorScaleOptions;
        itemStyler?: Styler<AgMapLineSeriesItemStylerParams<unknown, unknown>, AgMapLineSeriesStyle>;
    }
>;

/** Map marker options the series owns, before the common series keys are layered on. */
export type NormalisedMapMarkerSeriesOwnOptions = Normalised<
    AgMapMarkerSeriesOptions,
    | 'topologyIdKey'
    | 'shape'
    | 'size'
    | 'maxSize'
    | 'fill'
    | 'fillOpacity'
    | TopologyStrokeRequiredKeys
    | 'label'
    | 'colorScale',
    {
        topology?: FeatureCollection;
        fill: NormalisedColorType;
        stroke: CssColor;
        label: NormalisedMapMarkerSeriesLabelOptions;
        colorScale: NormalisedColorScaleOptions;
        itemStyler?: Styler<AgMapMarkerSeriesItemStylerParams<unknown, unknown>, AgMapMarkerSeriesStyle>;
    }
>;

export type NormalisedMapShapeBackgroundSeriesOwnOptions = Normalised<
    AgMapShapeBackgroundOptions,
    'fill' | 'fillOpacity' | TopologyStrokeRequiredKeys,
    { topology?: FeatureCollection; fill: NormalisedColorType; stroke: CssColor }
>;

export type NormalisedMapLineBackgroundSeriesOwnOptions = Normalised<
    AgMapLineBackgroundOptions,
    TopologyStrokeRequiredKeys,
    { topology?: FeatureCollection; stroke: CssColor }
>;
