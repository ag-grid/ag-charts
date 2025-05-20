import type { AgInitialStateThemeableOptions } from '../api/initialStateOptions';
import type { AgLinearGaugeTarget, AgLinearGaugeThemeableOptions } from '../presets/gauge/linearGaugeOptions';
import type { AgRadialGaugeTarget, AgRadialGaugeThemeableOptions } from '../presets/gauge/radialGaugeOptions';
import type { AgAreaSeriesThemeableOptions } from '../series/cartesian/areaOptions';
import type { AgBarSeriesThemeableOptions } from '../series/cartesian/barOptions';
import type { AgBoxPlotSeriesThemeableOptions } from '../series/cartesian/boxPlotOptions';
import type { AgBubbleSeriesThemeableOptions } from '../series/cartesian/bubbleOptions';
import type { AgCandlestickSeriesThemeableOptions } from '../series/cartesian/candlestickOptions';
import type {
    AgBaseCartesianThemeOptions,
    AgCartesianAxesTheme,
    AgContinuousCartesianAxesTheme,
} from '../series/cartesian/cartesianOptions';
import type { AgCartesianSeriesOptions } from '../series/cartesian/cartesianSeriesTypes';
import type { AgColorType, AgColorTypeStrict } from '../series/cartesian/commonOptions';
import type { AgConeFunnelSeriesThemeableOptions } from '../series/cartesian/coneFunnelOptions';
import type { AgFunnelSeriesThemeableOptions } from '../series/cartesian/funnelOptions';
import type { AgHeatmapSeriesThemeableOptions } from '../series/cartesian/heatmapOptions';
import type { AgHistogramSeriesThemeableOptions } from '../series/cartesian/histogramOptions';
import type { AgLineSeriesThemeableOptions } from '../series/cartesian/lineOptions';
import type { AgOhlcSeriesThemeableOptions } from '../series/cartesian/ohlcOptions';
import type { AgRangeAreaSeriesThemeableOptions } from '../series/cartesian/rangeAreaOptions';
import type { AgRangeBarSeriesThemeableOptions } from '../series/cartesian/rangeBarOptions';
import type { AgScatterSeriesThemeableOptions } from '../series/cartesian/scatterOptions';
import type { AgWaterfallSeriesThemeableOptions } from '../series/cartesian/waterfallOptions';
import type { AgChordSeriesThemeableOptions } from '../series/flow-proportion/chordOptions';
import type { AgBaseFlowProportionThemeOptions } from '../series/flow-proportion/flowProportionOptions';
import type { AgSankeySeriesOptions, AgSankeySeriesThemeableOptions } from '../series/flow-proportion/sankeyOptions';
import type { AgBaseHierarchyThemeOptions, AgHierarchySeriesOptions } from '../series/hierarchy/hierarchyOptions';
import type { AgSunburstSeriesThemeableOptions } from '../series/hierarchy/sunburstOptions';
import type { AgTreemapSeriesThemeableOptions } from '../series/hierarchy/treemapOptions';
import type { AgDonutSeriesThemeableOptions } from '../series/polar/donutOptions';
import type { AgNightingaleSeriesThemeableOptions } from '../series/polar/nightingaleOptions';
import type { AgPieSeriesThemeableOptions } from '../series/polar/pieOptions';
import type { AgBasePolarThemeOptions, AgPolarAxesTheme, AgPolarSeriesOptions } from '../series/polar/polarOptions';
import type { AgRadarAreaSeriesThemeableOptions } from '../series/polar/radarAreaOptions';
import type { AgRadarSeriesThemeableOptions } from '../series/polar/radarOptions';
import type { AgRadialBarSeriesThemeableOptions } from '../series/polar/radialBarOptions';
import type { AgRadialColumnSeriesThemeableOptions } from '../series/polar/radialColumnOptions';
import type { AgPyramidSeriesThemeableOptions } from '../series/standalone/pyramidOptions';
import type { AgBaseStandaloneThemeOptions } from '../series/standalone/standaloneOptions';
import type { AgMapLineBackgroundThemeableOptions } from '../series/topology/mapLineBackgroundOptions';
import type { AgMapLineSeriesThemeableOptions } from '../series/topology/mapLineOptions';
import type { AgMapMarkerSeriesThemeableOptions } from '../series/topology/mapMarkerOptions';
import type { AgMapShapeBackgroundThemeableOptions } from '../series/topology/mapShapeBackgroundOptions';
import type { AgMapShapeSeriesThemeableOptions } from '../series/topology/mapShapeOptions';
import type { AgBaseTopologyThemeOptions } from '../series/topology/topologyOptions';
import type { AgAnnotationsThemeableOptions } from './annotationsOptions';
import type { AgBaseChartOptions, AgBaseThemeableChartOptions } from './chartOptions';
import type { AgChartToolbarThemeableOptions } from './chartToolbarOptions';
import type { AgChartThemeParams } from './themeParamsOptions';
import type { CssColor } from './types';

export type AgChartThemeName =
    | 'ag-default'
    | 'ag-default-dark'
    | 'ag-sheets'
    | 'ag-sheets-dark'
    | 'ag-polychroma'
    | 'ag-polychroma-dark'
    | 'ag-vivid'
    | 'ag-vivid-dark'
    | 'ag-material'
    | 'ag-material-dark'
    | 'ag-financial'
    | 'ag-financial-dark';

export interface AgPaletteColors {
    fill?: AgColorTypeStrict;
    stroke?: CssColor;
}

/**
 * Palette used by the chart instance.
 */
export interface AgChartThemePalette {
    /** The array of fills to be used. */
    fills?: AgColorType[];
    /** The array of strokes to be used. */
    strokes?: CssColor[];
    up?: AgPaletteColors;
    down?: AgPaletteColors;
    neutral?: AgPaletteColors;
}

export interface AgBaseChartThemeOptions<TDatum> {
    /** The palette to use. If specified, this replaces the palette from the base theme. */
    palette?: AgChartThemePalette;
    /** Global parameters to set styles across the whole chart. */
    params?: AgChartThemeParams;
    /** Configuration from this object is merged over the defaults specified in the base theme. */
    overrides?: AgThemeOverrides<TDatum>;
}

/** This object is used to define the configuration for a custom chart theme. */
export interface AgChartTheme<TDatum> extends AgBaseChartThemeOptions<TDatum> {
    /** The name of the theme to base your theme on. Your custom theme will inherit all the configuration from the base theme, allowing you to override just the settings you wish to change using the `overrides` config (see below). */
    baseTheme?: AgChartThemeName;
}

export interface AgLineSeriesThemeOverrides<TDatum> extends AgBaseCartesianThemeOptions<TDatum> {
    series?: AgLineSeriesThemeableOptions<TDatum>;
}

export interface AgScatterSeriesThemeOverrides<TDatum> extends AgBaseCartesianThemeOptions<TDatum> {
    series?: AgScatterSeriesThemeableOptions<TDatum>;
}

export interface AgBubbleSeriesThemeOverrides<TDatum> extends AgBaseCartesianThemeOptions<TDatum> {
    series?: AgBubbleSeriesThemeableOptions<TDatum>;
}

export interface AgAreaSeriesThemeOverrides<TDatum> extends AgBaseCartesianThemeOptions<TDatum> {
    series?: AgAreaSeriesThemeableOptions<TDatum>;
}

export interface AgBarSeriesThemeOverrides<TDatum> extends AgBaseCartesianThemeOptions<TDatum> {
    series?: AgBarSeriesThemeableOptions<TDatum>;
}

export interface AgBoxPlotSeriesThemeOverrides<TDatum> extends AgBaseCartesianThemeOptions<TDatum> {
    series?: AgBoxPlotSeriesThemeableOptions<TDatum>;
}

export interface AgCandlestickSeriesThemeOverrides<TDatum> extends AgBaseCartesianThemeOptions<TDatum> {
    series?: AgCandlestickSeriesThemeableOptions<TDatum>;
}

export interface AgConeFunnelSeriesThemeOverrides<TDatum> extends AgBaseCartesianThemeOptions<TDatum> {
    series?: AgConeFunnelSeriesThemeableOptions<TDatum>;
}

export interface AgFunnelSeriesThemeOverrides<TDatum> extends AgBaseCartesianThemeOptions<TDatum> {
    series?: AgFunnelSeriesThemeableOptions<TDatum>;
}

export interface AgOhlcSeriesThemeOverrides<TDatum> extends AgBaseCartesianThemeOptions<TDatum> {
    series?: AgOhlcSeriesThemeableOptions<TDatum>;
}

export interface AgHistogramSeriesThemeOverrides<TDatum> extends AgBaseCartesianThemeOptions<TDatum> {
    axes?: AgContinuousCartesianAxesTheme;
    series?: AgHistogramSeriesThemeableOptions<TDatum>;
}

export interface AgHeatmapSeriesThemeOverrides<TDatum> extends AgBaseCartesianThemeOptions<TDatum> {
    series?: AgHeatmapSeriesThemeableOptions<TDatum>;
}

export interface AgWaterfallSeriesThemeOverrides<TDatum> extends AgBaseCartesianThemeOptions<TDatum> {
    series?: AgWaterfallSeriesThemeableOptions<TDatum>;
}

export interface AgRangeBarSeriesThemeOverrides<TDatum> extends AgBaseCartesianThemeOptions<TDatum> {
    series?: AgRangeBarSeriesThemeableOptions<TDatum>;
}

export interface AgRangeAreaSeriesThemeOverrides<TDatum> extends AgBaseCartesianThemeOptions<TDatum> {
    series?: AgRangeAreaSeriesThemeableOptions<TDatum>;
}

export interface AgDonutSeriesThemeOverrides<TDatum> extends AgBaseThemeableChartOptions<TDatum> {
    series?: AgDonutSeriesThemeableOptions<TDatum>;
}

export interface AgPieSeriesThemeOverrides<TDatum> extends AgBaseThemeableChartOptions<TDatum> {
    series?: AgPieSeriesThemeableOptions<TDatum>;
}

export interface AgRadarLineSeriesThemeOverrides<TDatum> extends AgBasePolarThemeOptions<TDatum> {
    series?: AgRadarSeriesThemeableOptions<TDatum>;
}

export interface AgRadarAreaSeriesThemeOverrides<TDatum> extends AgBasePolarThemeOptions<TDatum> {
    series?: AgRadarAreaSeriesThemeableOptions<TDatum>;
}

export interface AgRadialBarSeriesThemeOverrides<TDatum> extends AgBasePolarThemeOptions<TDatum> {
    series?: AgRadialBarSeriesThemeableOptions<TDatum>;
}

export interface AgRadialColumnSeriesThemeOverrides<TDatum> extends AgBasePolarThemeOptions<TDatum> {
    series?: AgRadialColumnSeriesThemeableOptions<TDatum>;
}

export interface AgNightingaleSeriesThemeOverrides<TDatum> extends AgBasePolarThemeOptions<TDatum> {
    series?: AgNightingaleSeriesThemeableOptions<TDatum>;
}

export interface AgSunburstSeriesThemeOverrides<TDatum> extends AgBaseHierarchyThemeOptions<TDatum> {
    series?: AgSunburstSeriesThemeableOptions<TDatum>;
}

export interface AgTreemapSeriesThemeOverrides<TDatum> extends AgBaseHierarchyThemeOptions<TDatum> {
    series?: AgTreemapSeriesThemeableOptions<TDatum>;
}

export interface AgMapShapeSeriesThemeOverrides<TDatum> extends AgBaseTopologyThemeOptions<TDatum> {
    series?: AgMapShapeSeriesThemeableOptions<TDatum>;
}

export interface AgMapLineSeriesThemeOverrides<TDatum> extends AgBaseTopologyThemeOptions<TDatum> {
    series?: AgMapLineSeriesThemeableOptions<TDatum>;
}

export interface AgMapMarkerSeriesThemeOverrides<TDatum> extends AgBaseTopologyThemeOptions<TDatum> {
    series?: AgMapMarkerSeriesThemeableOptions<TDatum>;
}

export interface AgMapShapeBackgroundThemeOverrides<TDatum> extends AgBaseTopologyThemeOptions<TDatum> {
    series?: AgMapShapeBackgroundThemeableOptions;
}

export interface AgMapLineBackgroundThemeOverrides<TDatum> extends AgBaseTopologyThemeOptions<TDatum> {
    series?: AgMapLineBackgroundThemeableOptions;
}

export interface AgSankeyThemeOverrides<TDatum> extends AgBaseFlowProportionThemeOptions<TDatum> {
    series?: AgSankeySeriesThemeableOptions<TDatum>;
}

export interface AgChordThemeOverrides<TDatum> extends AgBaseFlowProportionThemeOptions<TDatum> {
    series?: AgChordSeriesThemeableOptions<TDatum>;
}

export interface AgPyramidThemeOverrides<TDatum> extends AgBaseStandaloneThemeOptions<TDatum> {
    series?: AgPyramidSeriesThemeableOptions<TDatum>;
}

export type AgBaseGaugePresetThemeOptions = Pick<
    AgBaseChartOptions<never>,
    | 'animation'
    | 'background'
    | 'contextMenu'
    | 'footnote'
    | 'height'
    | 'listeners'
    | 'locale'
    | 'minHeight'
    | 'minWidth'
    | 'padding'
    | 'subtitle'
    | 'title'
    | 'tooltip'
    | 'width'
>;

// Interface needed for docs generation, but listeners conflicts using the extends clause
type AgRadialGaugeTheme = AgBaseGaugePresetThemeOptions & AgRadialGaugeThemeableOptions;
export interface AgRadialGaugeTargetTheme extends Omit<AgRadialGaugeTarget, 'value' | 'text'> {}
export interface AgRadialGaugeThemeOverrides extends AgRadialGaugeTheme {
    targets?: AgRadialGaugeTargetTheme;
}

type AgLinearGaugeTheme = AgBaseGaugePresetThemeOptions & AgLinearGaugeThemeableOptions;
export interface AgLinearGaugeTargetTheme extends Omit<AgLinearGaugeTarget, 'value' | 'text'> {}
export interface AgLinearGaugeThemeOverrides extends AgLinearGaugeTheme {
    targets?: AgLinearGaugeTargetTheme;
}

export interface AgCommonThemeableAxisOptions extends AgCartesianAxesTheme, AgPolarAxesTheme {}

export interface AgCommonThemeableChartOptions<TDatum> extends AgBaseThemeableChartOptions<TDatum> {
    axes?: AgCommonThemeableAxisOptions;
    annotations?: AgAnnotationsThemeableOptions;
    chartToolbar?: AgChartToolbarThemeableOptions;
    initialState?: AgInitialStateThemeableOptions;
}

export interface AgChartThemeOverrides<TDatum> {
    /** Common theme overrides for series. */
    common?: AgCommonThemeableChartOptions<TDatum>;

    /** Line series theme overrides. */
    line?: AgLineSeriesThemeOverrides<TDatum>;
    /** Scatter series theme overrides. */
    scatter?: AgScatterSeriesThemeOverrides<TDatum>;
    /** Bubble series theme overrides. */
    bubble?: AgBubbleSeriesThemeOverrides<TDatum>;
    /** Area series theme overrides. */
    area?: AgAreaSeriesThemeOverrides<TDatum>;
    /** Bar series theme overrides. */
    bar?: AgBarSeriesThemeOverrides<TDatum>;
    /** Box-plot series theme overrides. */
    'box-plot'?: AgBoxPlotSeriesThemeOverrides<TDatum>;
    /** Candlestick series theme overrides. */
    candlestick?: AgCandlestickSeriesThemeOverrides<TDatum>;
    /** Cone Funnel series theme overrides. */
    'cone-funnel'?: AgConeFunnelSeriesThemeOverrides<TDatum>;
    /** Funnel series theme overrides. */
    funnel?: AgFunnelSeriesThemeOverrides<TDatum>;
    /** ohlc series theme overrides. */
    ohlc?: AgOhlcSeriesThemeOverrides<TDatum>;
    /** Histogram series theme overrides. */
    histogram?: AgHistogramSeriesThemeOverrides<TDatum>;
    /** Heatmap series theme overrides. */
    heatmap?: AgHeatmapSeriesThemeOverrides<TDatum>;
    /** Waterfall series theme overrides. */
    waterfall?: AgWaterfallSeriesThemeOverrides<TDatum>;
    /** Range-bar series theme overrides. */
    'range-bar'?: AgRangeBarSeriesThemeOverrides<TDatum>;
    /** Range-area series theme overrides. */
    'range-area'?: AgRangeAreaSeriesThemeOverrides<TDatum>;
    /** Donut series theme overrides. */
    donut?: AgDonutSeriesThemeOverrides<TDatum>;
    /** Pie series theme overrides. */
    pie?: AgPieSeriesThemeOverrides<TDatum>;
    /** Radar-line series theme overrides. */
    'radar-line'?: AgRadarLineSeriesThemeOverrides<TDatum>;
    /** Radar-area series theme overrides. */
    'radar-area'?: AgRadarAreaSeriesThemeOverrides<TDatum>;
    /** Radial-bar series theme overrides. */
    'radial-bar'?: AgRadialBarSeriesThemeOverrides<TDatum>;
    /** Radial-column series theme overrides. */
    'radial-column'?: AgRadialColumnSeriesThemeOverrides<TDatum>;
    /** Nightingale series theme overrides. */
    nightingale?: AgNightingaleSeriesThemeOverrides<TDatum>;
    /** Sunburst series theme overrides. */
    sunburst?: AgSunburstSeriesThemeOverrides<TDatum>;
    /** Treemap series theme overrides. */
    treemap?: AgTreemapSeriesThemeOverrides<TDatum>;
    /** Map shape series theme overrides. */
    'map-shape'?: AgMapShapeSeriesThemeOverrides<TDatum>;
    /** Map line series theme overrides. */
    'map-line'?: AgMapLineSeriesThemeOverrides<TDatum>;
    /** Map marker series theme overrides. */
    'map-marker'?: AgMapMarkerSeriesThemeOverrides<TDatum>;
    /** Map shape background series theme overrides. */
    'map-shape-background'?: AgMapShapeBackgroundThemeOverrides<TDatum>;
    /** Map line background series theme overrides. */
    'map-line-background'?: AgMapLineBackgroundThemeOverrides<TDatum>;
    /** Sankey series theme overrides. */
    sankey?: AgSankeyThemeOverrides<TDatum>;
    /** Chord series theme overrides. */
    chord?: AgChordThemeOverrides<TDatum>;
    /** Pyramid series theme overrides. */
    pyramid?: AgPyramidThemeOverrides<TDatum>;
}

export interface AgPresetOverrides {
    /** Radial gauge theme overrides. */
    'radial-gauge'?: AgRadialGaugeThemeOverrides;
    /** Linear Gauge theme overrides. */
    'linear-gauge'?: AgLinearGaugeThemeOverrides;
}

export interface AgThemeOverrides<TDatum> extends AgChartThemeOverrides<TDatum>, AgPresetOverrides {}

// Use Typescript function types to verify that all series types are present in the manually
// maintained AgBaseChartThemeOverrides type.
type VerifyAgBaseChartThemeOverrides<T = AgBaseChartOptions<never>> = {
    [K in NonNullable<AgCartesianSeriesOptions<never, never>['type']>]?: T;
} & {
    [K in NonNullable<AgPolarSeriesOptions<never, never>['type']>]?: T;
} & {
    [K in NonNullable<AgHierarchySeriesOptions<never, never>['type']>]?: T;
} & {
    [K in NonNullable<AgSankeySeriesOptions<never, never>['type']>]?: T;
} & {
    common?: Partial<T>;
};

// Verification checks for completeness/correctness.
const __THEME_OVERRIDES = undefined as any as Required<AgChartThemeOverrides<never>>;
// @ts-expect-error TS6133 - this is used to validate completeness by the compiler, but is deliberately unused.
let __VERIFY_THEME_OVERRIDES: Required<VerifyAgBaseChartThemeOverrides> = undefined as any;
__VERIFY_THEME_OVERRIDES = __THEME_OVERRIDES;
