import type {
    AgBaseSeriesOptions,
    AgSeriesListeners,
    AgSeriesHighlightStyle,
    AgSeriesTooltip,
    AgCartesianSeriesTooltipRendererParams,
    AgTooltipRendererResult,
    AgCartesianSeriesLabelOptions,
    CssColor,
    PixelSize,
    Opacity,
    AgDropShadowOptions,
} from 'ag-charts-community';

export interface AgRangeAreaSeriesMarkerFormatterParams<DatumType> {
    readonly datum: DatumType;
    readonly lowValue: number;
    readonly highValue: number;
    readonly size: number;
    readonly fill?: CssColor;
    readonly stroke?: CssColor;
    readonly strokeWidth?: PixelSize;
    readonly highlighted: boolean;
    readonly xKey: string;
    readonly yLowKey: string;
    readonly yHighKey: string;
    readonly seriesId: string;
    readonly itemId: string;
}

export interface AgRangeAreaSeriesFormat {
    fill?: CssColor;
    stroke?: CssColor;
    strokeWidth?: PixelSize;
}

export interface AgRangeAreaSeriesTooltipRendererParams
    extends Omit<AgCartesianSeriesTooltipRendererParams, 'yKey' | 'yValue'> {
    /** The Id to distinguish the type of datum. This can be `positive`, `negative`, `total` or `subtotal`. */
    itemId: string;

    /** yKey as specified on series options. */
    readonly yLowKey: string;
    /** yValue as read from series data via the yKey property. */
    readonly yLowValue?: any;
    /** yLowName as specified on series options. */
    readonly yLowName?: string;

    /** yKey as specified on series options. */
    readonly yHighKey: string;
    /** yValue as read from series data via the yKey property. */
    readonly yHighValue?: any;
    /** yHighName as specified on series options. */
    readonly yHighName?: string;
}

export interface AgRangeAreaSeriesTooltip extends AgSeriesTooltip {
    /** Function used to create the content for tooltips. */
    renderer?: (params: AgRangeAreaSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}

export interface AgRangeAreaSeriesLabelOptions extends AgCartesianSeriesLabelOptions {
    /** Padding in pixels between the label and the edge of the marker. */
    padding?: PixelSize;
}

export type AgRangeAreaSeriesLabelPlacement = 'inside' | 'outside';

/** Configuration for RangeArea series. */
export interface AgRangeAreaSeriesOptions<DatumType = any> extends AgBaseSeriesOptions<DatumType> {
    /** Configuration for the RangeArea series. */
    type?: 'range-area';
    /** The key to use to retrieve x-values from the data. */
    xKey?: string;
    /** The key to use to retrieve y-low-values from the data. */
    yLowKey?: string;
    /** The key to use to retrieve y-high-values from the data. */
    yHighKey?: string;
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** A human-readable description of the y-low-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yLowName?: string;
    /** A human-readable description of the y-high-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yHighName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
    /** The title to use for the series. Defaults to `yName` if it exists, or `yKey` if not. */
    title?: string;
    /** Series-specific tooltip configuration. */
    tooltip?: AgRangeAreaSeriesTooltip;
    /** A map of event names to event listeners. */
    listeners?: AgSeriesListeners<DatumType>;
    /** Configuration for the range series items when they are hovered over. */
    highlightStyle?: AgSeriesHighlightStyle;
    /** Configuration for the labels shown on top of data points. */
    label?: AgRangeAreaSeriesLabelOptions;
    /** The fill colour to use for the area. */
    fill?: CssColor;
    /** Opacity of the area. */
    fillOpacity?: Opacity;
    /** The colour to use for the line. */
    stroke?: CssColor;
    /** The width in pixels of the stroke. */
    strokeWidth?: PixelSize;
    /** Opacity of the stroke. */
    strokeOpacity?: Opacity;
    /** Defines how the strokes are rendered. Every number in the array specifies the length in pixels of alternating dashes and gaps. For example, `[6, 3]` means dashes with a length of `6` pixels with gaps between of `3` pixels. */
    lineDash?: PixelSize[];
    /** The initial offset of the dashed line in pixels. */
    lineDashOffset?: PixelSize;
    /** Configuration for the shadow used behind the series items. */
    shadow?: AgDropShadowOptions;
    /** Function used to return formatting for individual RangeArea series item cells, based on the given parameters. If the current cell is highlighted, the `highlighted` property will be set to `true`; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    formatter?: (params: AgRangeAreaSeriesMarkerFormatterParams<DatumType>) => AgRangeAreaSeriesFormat;
}

/**
 * Internal Use Only: Used to ensure this file is treated as a module until we can use moduleDetection flag in Ts v4.7
 */
export const __FORCE_MODULE_DETECTION = 0;
