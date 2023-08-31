import type { AgChartLabelOptions, AgDropShadowOptions } from '../../agChartOptions';
import type { AgSeriesListeners } from '../../options/eventOptions';
import type { AgSeriesTooltip } from '../../options/tooltipOptions';
import type {
    CssColor,
    FontFamily,
    FontSize,
    FontStyle,
    FontWeight,
    Opacity,
    PixelSize,
    Ratio,
} from '../../options/types';
import type { AgBaseSeriesOptions } from '../seriesOptions';
import type { AgPolarSeriesTooltipRendererParams } from './polarOptions';

export interface AgPieSeriesTheme extends Omit<AgPieSeriesOptions, 'innerLabels'> {
    innerLabels?: AgDoughnutInnerLabelThemeOptions;
}

export interface AgPieSeriesLabelOptions<DatumType> extends AgChartLabelOptions {
    /** Distance in pixels between the callout line and the label text. */
    offset?: PixelSize;
    /** Minimum angle in degrees required for a sector to show a label. */
    minAngle?: number;
    /** Avoid callout label collision and overflow by automatically moving colliding labels or reducing the pie radius. If set to `false`, callout labels may collide with each other and the pie radius will not change to prevent clipping of callout labels. */
    avoidCollisions?: boolean;
    /** A function that allows the modification of the label text based on input parameters. */
    formatter?: (params: AgPieSeriesLabelFormatterParams<DatumType>) => string;
}

export interface AgPieSeriesSectorLabelOptions<DatumType> extends AgChartLabelOptions {
    /** Distance in pixels, used to make the label text closer to or further from the center. This offset is applied after positionRatio. */
    positionOffset?: PixelSize;
    /** Position of labels as a ratio proportional to pie radius (or doughnut thickness). Additional offset in pixels can be applied by using positionOffset. */
    positionRatio?: Ratio;
    /** A function that allows the modification of the label text based on input parameters. */
    formatter?: (params: AgPieSeriesLabelFormatterParams<DatumType>) => string;
}

export interface AgPieSeriesFormatterParams<DatumType> {
    readonly datum: DatumType;
    readonly fill?: CssColor;
    readonly stroke?: CssColor;
    readonly strokeWidth: PixelSize;
    readonly highlighted: boolean;
    readonly angleKey: string;
    readonly radiusKey?: string;
    readonly sectorLabelKey?: string;
    readonly seriesId: string;
}

export interface AgPieSeriesFormat {
    fill?: CssColor;
    fillOpacity?: Opacity;
    stroke?: CssColor;
    strokeWidth?: PixelSize;
}

export interface AgPieTitleOptions {
    /** Whether the text should be shown. */
    enabled?: boolean;
    /** The text to display. */
    text?: string;
    /** The font style to use for the text. */
    fontStyle?: FontStyle;
    /** The font weight to use for the text. */
    fontWeight?: FontWeight;
    /** The font size in pixels to use for the text. */
    fontSize?: FontSize;
    /** The font family to use for the text. */
    fontFamily?: FontFamily;
    /** The colour to use for the text. */
    color?: CssColor;
    /** Spacing added to help position the text. */
    spacing?: number;
    /** Whether the title text should be shown in the legend. */
    showInLegend?: boolean;
}

export interface AgPieSeriesCalloutOptions {
    /** The colours to cycle through for the strokes of the callouts. */
    colors?: CssColor[];
    /** The length in pixels of the callout lines. */
    length?: PixelSize;
    /** The width in pixels of the stroke for callout lines. */
    strokeWidth?: PixelSize;
}

export interface AgDoughnutInnerLabel {
    /** The text to show in the inner label. */
    text: string;
    /** The font style to use for the inner label. */
    fontStyle?: FontStyle;
    /** The font weight to use for the inner label. */
    fontWeight?: FontWeight;
    /** The font size in pixels to use for the inner label. */
    fontSize?: FontSize;
    /** The font family to use for the inner label. */
    fontFamily?: FontFamily;
    /** The colour to use for the inner label. */
    color?: CssColor;
    /** The margin in pixels before and after the inner label. */
    margin?: PixelSize;
}

export interface AgDoughnutInnerLabelThemeOptions extends Omit<AgDoughnutInnerLabel, 'text'> {}

export interface AgDoughnutInnerCircle {
    /** The colour of the fill for the inner circle. */
    fill: CssColor;
    /** The opacity of the fill for the inner circle. */
    fillOpacity?: Opacity;
}

/** Configuration for pie/doughnut series. */
export interface AgPieSeriesOptions<DatumType = any> extends AgBaseSeriesOptions<DatumType> {
    type?: 'pie';
    /** Configuration for the series title. */
    title?: AgPieTitleOptions;
    /** Configuration for the labels used outside of the sectors. */
    calloutLabel?: AgPieSeriesLabelOptions<DatumType>;
    /** Configuration for the labels used inside the sectors. */
    sectorLabel?: AgPieSeriesSectorLabelOptions<DatumType>;
    /** Configuration for the callout lines used with the labels for the sectors. */
    calloutLine?: AgPieSeriesCalloutOptions;
    /** The key to use to retrieve angle values from the data. */
    angleKey?: string;
    /** A human-readable description of the angle values. If supplied, this will be passed to the tooltip renderer as one of the parameters. */
    angleName?: string;
    /** The key to use to retrieve radius values from the data. */
    radiusKey?: string;
    /** A human-readable description of the radius values. If supplied, this will be passed to the tooltip renderer as one of the parameters. */
    radiusName?: string;
    /** The key to use to retrieve label values from the data. */
    calloutLabelKey?: string;
    /** A human-readable description of the label values. If supplied, this will be passed to the tooltip renderer as one of the parameters. */
    calloutLabelName?: string;
    /** The key to use to retrieve sector label values from the data. */
    sectorLabelKey?: string;
    /** A human-readable description of the sector label values. If supplied, this will be passed to the tooltip renderer as one of the parameters. */
    sectorLabelName?: string;
    /** The key to use to retrieve legend item labels from the data. If multiple pie series share this key they will be merged in the legend. */
    legendItemKey?: string;
    /** The colours to cycle through for the fills of the sectors. */
    fills?: CssColor[];
    /** The colours to cycle through for the strokes of the sectors. */
    strokes?: CssColor[];
    /** The opacity of the fill for the sectors. */
    fillOpacity?: Opacity;
    /** The opacity of the stroke for the sectors. */
    strokeOpacity?: Opacity;
    /** The width in pixels of the stroke for the sectors. */
    strokeWidth?: PixelSize;
    /** Defines how the pie sector strokes are rendered. Every number in the array specifies the length in pixels of alternating dashes and gaps. For example, `[6, 3]` means dashes with a length of `6` pixels with gaps between of `3` pixels. */
    lineDash?: PixelSize[];
    /** The initial offset of the dashed line in pixels. */
    lineDashOffset?: PixelSize;
    /** The rotation of the pie series in degrees. */
    rotation?: number;
    /** The offset in pixels of the outer radius of the series. Used to construct doughnut charts. */
    outerRadiusOffset?: PixelSize;
    /** The ratio of the outer radius of the series. Used to adjust the outer radius proportionally to the automatically calculated value. */
    outerRadiusRatio?: Ratio;
    /** The offset in pixels of the inner radius of the series. Used to construct doughnut charts. If this is not provided, or innerRadiusRatio is unset, or a value of zero is given, a pie chart will be rendered. */
    innerRadiusOffset?: PixelSize;
    /** The ratio of the inner radius of the series. Used to construct doughnut charts. If this is not provided, or innerRadiusOffset is unset, or a value of zero or one is given, a pie chart will be rendered. */
    innerRadiusRatio?: Ratio;
    /** Override of the automatically determined minimum radiusKey value from the data. */
    radiusMin?: number;
    /** Override of the automatically determined maximum radiusKey value from the data. */
    radiusMax?: number;
    /** Configuration for the shadow used behind the chart series. */
    shadow?: AgDropShadowOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgSeriesTooltip<AgPieSeriesTooltipRendererParams>;
    /** Configuration for the text lines to display inside the series, typically used when rendering a doughnut chart */
    innerLabels?: AgDoughnutInnerLabel[];
    /** Configuration for the area inside the series, only visible when rendering a doughnut chart by using innerRadiusOffset or innerRadiusRatio */
    innerCircle?: AgDoughnutInnerCircle;
    /** A formatter function for adjusting the styling of the pie sectors. */
    formatter?: (params: AgPieSeriesFormatterParams<DatumType>) => AgPieSeriesFormat;
    /** A map of event names to event listeners. */
    listeners?: AgSeriesListeners<DatumType>;
}

export interface AgPieSeriesTooltipRendererParams extends AgPolarSeriesTooltipRendererParams {
    /** calloutLabelKey as specified on series options. */
    calloutLabelKey?: string;
    /** calloutLabelName as specified on series options. */
    calloutLabelName?: string;
    /** sectorLabelKey as specified on series options. */
    sectorLabelKey?: string;
    /** sectorLabelName as specified on series options. */
    sectorLabelName?: string;
}

export interface AgPieSeriesLabelFormatterParams<DatumType> {
    /** Datum from the series data array that the label is being rendered for. */
    readonly datum: DatumType;

    /** calloutLabelKey as specified on series options. */
    readonly calloutLabelKey?: string;
    /** calloutLabelValue as read from series data via the calloutLabelKey property. */
    readonly calloutLabelValue?: string;
    /** calloutLabelName as specified on series options. */
    readonly calloutLabelName?: string;

    /** sectorLabelKey as specified on series options. */
    readonly sectorLabelKey?: string;
    /** sectorLabelValue as read from series data via the sectorLabelKey property. */
    readonly sectorLabelValue?: string;
    /** sectorLabelName as specified on series options. */
    readonly sectorLabelName?: string;

    /** angleKey as specified on series options. */
    readonly angleKey: string;
    /** angleValue as read from series data via the angleKey property. */
    readonly angleValue?: any;
    /** angleName as specified on series options. */
    readonly angleName?: string;

    /** radiusKey as specified on series options. */
    readonly radiusKey?: string;
    /** radiusValue as read from series data via the radiusKey property. */
    readonly radiusValue?: any;
    /** radiusName as specified on series options. */
    readonly radiusName?: string;

    /** The ID of the series. */
    readonly seriesId: string;
}
