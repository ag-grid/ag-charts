type FontStyle = 'normal' | 'italic' | 'oblique';
type FontWeight = 'normal' | 'bold' | 'bolder' | 'lighter'
    | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

export type AgChartThemeName = 'ag-default' | 'ag-default-dark'
    | 'ag-material' | 'ag-material-dark'
    | 'ag-pastel' | 'ag-pastel-dark'
    | 'ag-solar' | 'ag-solar-dark'
    | 'ag-vivid' | 'ag-vivid-dark';

export interface AgChartThemePalette {
    fills: string[];
    strokes: string[];
}

export interface AgChartThemeOptions {
    palette?: AgChartThemePalette;
    overrides?: AgChartThemeOverrides;
}

export interface AgChartTheme extends AgChartThemeOptions {
    baseTheme?: AgChartThemeName; // | ChartTheme;
}

export interface AgChartThemeOverrides {
    cartesian?: AgCartesianChartOptions<AgCartesianAxesTheme, AgCartesianSeriesTheme>;
    column?: AgCartesianChartOptions<AgCartesianAxesTheme, AgBarSeriesOptions>;
    bar?: AgCartesianChartOptions<AgCartesianAxesTheme, AgBarSeriesOptions>;
    line?: AgCartesianChartOptions<AgCartesianAxesTheme, AgLineSeriesOptions>;
    area?: AgCartesianChartOptions<AgCartesianAxesTheme, AgAreaSeriesOptions>;
    scatter?: AgCartesianChartOptions<AgCartesianAxesTheme, AgScatterSeriesOptions>;
    histogram?: AgCartesianChartOptions<AgCartesianAxesTheme, AgHistogramSeriesOptions>;

    polar?: AgPolarChartOptions<AgPolarAxesTheme, AgPolarSeriesTheme>;
    pie?: AgPolarChartOptions<AgPolarAxesTheme, AgPieSeriesOptions>;

    common?: any;
}

export interface AgCartesianAxesTheme {
    number?: Omit<AgNumberAxisOptions, 'type'>;
    category?: Omit<AgCategoryAxisOptions, 'type'>;
    groupedCategory?: Omit<AgGroupedCategoryAxisOptions, 'type'>;
    time?: Omit<AgTimeAxisOptions, 'type'>;
}

export interface AgCartesianSeriesTheme {
    line?: AgLineSeriesOptions;
    scatter?: AgScatterSeriesOptions;
    area?: AgAreaSeriesOptions;
    bar?: AgBarSeriesOptions;
    histogram?: AgHistogramSeriesOptions;
}

export interface AgPolarAxesTheme {
    // polar charts don't support axes at the moment
    // (used by radar charts, for example)
}

export interface AgPolarSeriesTheme {
    pie?: AgPieSeriesOptions;
}

export interface AgChartPaddingOptions {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
}

interface AgChartLabelOptions {
    enabled?: boolean;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
}

interface AgDropShadowOptions {
    enabled?: boolean;
    color?: string;
    xOffset?: number;
    yOffset?: number;
    blue?: number;
}

export interface AgChartCaptionOptions {
    enabled?: boolean;
    padding?: AgChartPaddingOptions;
    text?: string;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
}

interface AgNavigatorMaskOptions {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    fillOpacity?: number;
}

interface AgNavigatorHandleOptions {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    width?: number;
    height?: number;
    gripLineGap?: number;
    gripLineLength?: number;
}

export interface AgNavigatorOptions {
    enabled?: boolean;
    height?: number;
    margin?: number;
    min?: number;
    max?: number;
    mask?: AgNavigatorMaskOptions;
    minHandle?: AgNavigatorHandleOptions;
    maxHandle?: AgNavigatorHandleOptions;
}

type AgChartLegendPosition = 'top' | 'right' | 'bottom' | 'left';

interface AgChartLegendMarkerOptions {
    size?: number;
    shape?: string | (new () => any); // Remove the (new () => any) eventually.
    padding?: number;
    strokeWidth?: number;
}

interface AgChartLegendLabelOptions {
    color?: string;
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    fontSize?: number;
    fontFamily?: string;
}

interface AgChartLegendItemOptions {
    marker?: AgChartLegendMarkerOptions;
    label?: AgChartLegendLabelOptions;
    paddingX?: number;
    paddingY?: number;
}

export interface AgChartLegendOptions {
    enabled?: boolean;
    position?: AgChartLegendPosition;
    spacing?: number;
    item?: AgChartLegendItemOptions;
    /**
     * @deprecated
     */
    layoutHorizontalSpacing?: number;
    /**
     * @deprecated
     */
    layoutVerticalSpacing?: number;
    /**
     * @deprecated
     */
    itemSpacing?: number;
    /**
     * @deprecated
     */
    markerShape?: string | (new () => any);
    /**
     * @deprecated
     */
    markerSize?: number;
    /**
     * @deprecated
     */
    strokeWidth?: number;
    /**
     * @deprecated
     */
    color?: string;
    /**
     * @deprecated
     */
    fontStyle?: FontStyle;
    /**
     * @deprecated
     */
    fontWeight?: FontWeight;
    /**
     * @deprecated
     */
    fontSize?: number;
    /**
     * @deprecated
     */
    fontFamily?: string;
}

interface AgBaseChartOptions {
    container?: HTMLElement;
    data?: any[];
    width?: number;
    height?: number;
    autoSize?: boolean;
    padding?: AgChartPaddingOptions;
    background?: {
        visible?: boolean;
        fill?: string;
    },
    title?: AgChartCaptionOptions;
    subtitle?: AgChartCaptionOptions;
    tooltipClass?: string;
    tooltipTracking?: boolean;
    navigator?: AgNavigatorOptions;
    legend?: AgChartLegendOptions;
    listeners?: { [key in string]: Function };
    theme?: string | AgChartTheme; // | ChartTheme
}

interface AgBaseAxisOptions {
    keys?: string[];
}

type AgCartesianAxisPosition = 'top' | 'right' | 'bottom' | 'left';

interface AgAxisLineOptions {
    width?: number;
    color?: string;
}

interface AgAxisTickOptions {
    width?: number;
    size?: number;
    color?: string;
    count?: any;
}

interface AgAxisLabelFormatterParams {
    readonly value: any;
    readonly index: number;
    readonly fractionDigits?: number;
    readonly formatter?: (x: any) => string;
}

interface AgAxisLabelOptions {
    fontStyle?: FontStyle;
    fontWeight?: FontWeight;
    fontSize?: number;
    fontFamily?: string;
    padding?: number;
    color?: string;
    rotation?: number;
    // mirrored?: boolean;
    // parallel?: boolean;
    format?: string;
    formatter?: (params: AgAxisLabelFormatterParams) => string;
}

interface AgAxisGridStyle {
    stroke?: string;
    lineDash?: number[];
}

interface AgBaseCartesianAxisOptions extends AgBaseAxisOptions {
    position?: AgCartesianAxisPosition;
    title?: AgChartCaptionOptions;
    line?: AgAxisLineOptions;
    tick?: AgAxisTickOptions;
    label?: AgAxisLabelOptions;
    gridStyle?: AgAxisGridStyle[];
}

interface AgNumberAxisOptions extends AgBaseCartesianAxisOptions {
    type: 'number';
    nice?: boolean;
    min?: number;
    max?: number;
}

interface AgCategoryAxisOptions extends AgBaseCartesianAxisOptions {
    type: 'category';
    paddingInner?: number;
    paddingOuter?: number;
}

interface AgGroupedCategoryAxisOptions extends AgBaseCartesianAxisOptions {
    type: 'groupedCategory';
}

interface AgTimeAxisOptions extends AgBaseCartesianAxisOptions {
    type: 'time';
    nice?: boolean;
}

export type AgCartesianAxisOptions =
    AgNumberAxisOptions |
    AgCategoryAxisOptions |
    AgGroupedCategoryAxisOptions |
    AgTimeAxisOptions;

type AgPolarAxisOptions = any;

interface AgBaseSeriesOptions {
    tooltipEnabled?: boolean;
    data?: any[];
    visible?: boolean;
    showInLegend?: boolean;
    listeners?: { [key in string]: Function };
}

export interface AgTooltipRendererResult {
    title?: string;
    content?: string;
}

interface AgSeriesTooltipRendererParams {
    readonly datum: any;
    readonly title?: string;
    readonly color?: string;
}

interface AgCartesianSeriesTooltipRendererParams extends AgSeriesTooltipRendererParams {
    readonly xKey: string;
    readonly xValue?: any;
    readonly xName?: string;

    readonly yKey: string;
    readonly yValue?: any;
    readonly yName?: string;
}

export interface AgPolarSeriesTooltipRendererParams extends AgSeriesTooltipRendererParams {
    readonly angleKey: string;
    readonly angleValue?: any;
    readonly angleName?: string;

    readonly radiusKey?: string;
    readonly radiusValue?: any;
    readonly radiusName?: string;
}

interface AgScatterSeriesTooltipRendererParams extends AgCartesianSeriesTooltipRendererParams {
    readonly sizeKey?: string;
    readonly sizeName?: string;

    readonly labelKey?: string;
    readonly labelName?: string;
}

interface AgSeriesMarker {
    enabled?: boolean;
    shape?: string;
    size?: number;
    maxSize?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
}

interface AgCartesianSeriesMarkerFormatterParams {
    xKey: string;
    yKey: string;
}

interface AgCartesianSeriesMarkerFormat {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    size?: number;
}

interface AgCartesianSeriesMarker extends AgSeriesMarker {
    formatter?: (params: AgCartesianSeriesMarkerFormatterParams) => AgCartesianSeriesMarkerFormat;
}

export interface AgSeriesTooltip {
    enabled?: boolean;
}

export interface AgLineSeriesTooltip extends AgSeriesTooltip {
    renderer?: (params: AgCartesianSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}

export interface AgLineSeriesOptions extends AgBaseSeriesOptions {
    type?: 'line';
    marker?: AgCartesianSeriesMarker;
    xKey?: string;
    yKey?: string;
    xName?: string;
    yName?: string;
    title?: string;
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    lineDash?: number[];
    lineDashOffset?: number;
    highlightStyle?: {
        fill?: string;
        stroke?: string;
    };
    tooltip?: AgLineSeriesTooltip;
    tooltipRenderer?: (params: AgCartesianSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}

export interface AgScatterSeriesTooltip extends AgSeriesTooltip {
    renderer?: (params: AgScatterSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}

export interface AgScatterSeriesOptions extends AgBaseSeriesOptions {
    type?: 'scatter';
    marker?: AgCartesianSeriesMarker;
    xKey?: string;
    yKey?: string;
    xName?: string;
    yName?: string;
    title?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    fillOpacity?: number;
    strokeOpacity?: number;
    highlightStyle?: {
        fill?: string;
        stroke?: string;
    };
    tooltip?: AgScatterSeriesTooltip;
    tooltipRenderer?: (params: AgScatterSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}

export interface AgAreaSeriesTooltip extends AgSeriesTooltip {
    renderer?: (params: AgCartesianSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
    format?: string;
}

export interface AgAreaSeriesOptions extends AgBaseSeriesOptions {
    type?: 'area';
    marker?: AgCartesianSeriesMarker;
    xKey?: string;
    yKeys?: string[];
    xName?: string;
    yNames?: string[];
    fills?: string[];
    strokes?: string[];
    strokeWidth?: number;
    fillOpacity?: number;
    strokeOpacity?: number;
    lineDash?: number[];
    lineDashOffset?: number;
    shadow?: AgDropShadowOptions;
    highlightStyle?: {
        fill?: string;
        stroke?: string;
    };
    tooltip?: AgAreaSeriesTooltip;
    tooltipRenderer?: (params: AgCartesianSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}

interface AgBarSeriesLabelOptions extends AgChartLabelOptions {
    formatter?: (params: { value: number; }) => string;
}

export interface AgBarSeriesFormatterParams {
    readonly datum: any;
    readonly fill?: string;
    readonly stroke?: string;
    readonly strokeWidth: number;
    readonly highlighted: boolean;
    readonly xKey: string;
    readonly yKey: string;
}

export interface AgBarSeriesFormat {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
}

export interface AgBarSeriesTooltip extends AgSeriesTooltip {
    renderer?: (params: AgCartesianSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}

export interface AgBarSeriesOptions extends AgBaseSeriesOptions {
    type?: 'bar' | 'column';
    grouped?: boolean;
    normalizedTo?: number;
    xKey?: string;
    yKeys?: string[] | string[][];
    xName?: string;
    yNames?: string[] | { [key in string]: string };
    fills?: string[];
    strokes?: string[];
    strokeWidth?: number;
    fillOpacity?: number;
    strokeOpacity?: number;
    lineDash?: number[];
    lineDashOffset?: number;
    shadow?: AgDropShadowOptions;
    highlightStyle?: {
        fill?: string;
        stroke?: string;
    };
    label?: AgBarSeriesLabelOptions;
    tooltip?: AgBarSeriesTooltip;
    tooltipRenderer?: (params: AgCartesianSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
    formatter?: (params: AgBarSeriesFormatterParams) => AgBarSeriesFormat;
}

interface AgHistogramSeriesLabelOptions extends AgChartLabelOptions {
    formatter?: (params: { value: number; }) => string;
}

export interface AgHistogramSeriesTooltip extends AgSeriesTooltip {
    renderer?: (params: AgCartesianSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}

export interface AgHistogramSeriesOptions extends AgBaseSeriesOptions {
    type?: 'histogram';
    fill?: string;
    stroke?: string;
    fillOpacity?: number;
    strokeOpacity?: number;
    strokeWidth?: number;
    lineDash?: number[];
    lineDashOffset?: number;
    xKey?: string;
    xName?: string;
    yKey?: string;
    yName?: string;
    areaPlot?: boolean;
    bins?: [number, number][];
    binCount?: number;
    aggregation?: 'count' | 'sum' | 'mean';
    shadow?: AgDropShadowOptions;
    highlightStyle?: {
        fill?: string;
        stroke?: string;
    };
    label?: AgHistogramSeriesLabelOptions;
    tooltip?: AgHistogramSeriesTooltip;
    tooltipRenderer?: (params: AgCartesianSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}

interface AgPieSeriesLabelOptions extends AgChartLabelOptions {
    offset?: number;
    minAngle?: number;
}

export interface AgPieSeriesFormatterParams {
    readonly datum: any;
    readonly fill?: string;
    readonly stroke?: string;
    readonly strokeWidth: number;
    readonly highlighted: boolean;
    readonly angleKey: string;
    readonly radiusKey?: string;
}

export interface AgPieSeriesFormat {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
}

export interface AgPieSeriesTooltip extends AgSeriesTooltip {
    renderer?: (params: AgPieSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}

export interface AgPieSeriesOptions extends AgBaseSeriesOptions {
    type?: 'pie';
    title?: AgChartCaptionOptions;
    label?: AgPieSeriesLabelOptions;
    callout?: {
        colors?: string[];
        length?: number;
        strokeWidth?: number;
    };
    angleKey?: string;
    angleName?: string;
    radiusKey?: string;
    radiusName?: string;
    labelKey?: string;
    labelName?: string;
    fills?: string[];
    strokes?: string[];
    fillOpacity?: number;
    strokeOpacity?: number;
    strokeWidth?: number;
    lineDash?: number[];
    lineDashOffset?: number;
    rotation?: number;
    outerRadiusOffset?: number;
    innerRadiusOffset?: number;
    shadow?: AgDropShadowOptions;
    highlightStyle?: {
        fill?: string;
        stroke?: string;
    };
    tooltip?: AgPieSeriesTooltip;
    tooltipRenderer?: (params: AgPieSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
    formatter?: (params: AgPieSeriesFormatterParams) => AgPieSeriesFormat;
}

interface AgPieSeriesTooltipRendererParams extends AgPolarSeriesTooltipRendererParams {
    labelKey?: string;
    labelName?: string;
}

type AgCartesianSeriesOptions =
    AgLineSeriesOptions |
    AgScatterSeriesOptions |
    AgAreaSeriesOptions |
    AgBarSeriesOptions |
    AgHistogramSeriesOptions;

type AgPolarSeriesOptions = AgPieSeriesOptions;

export interface AgCartesianChartOptions<TAxisOptions = AgCartesianAxisOptions[], TSeriesOptions = AgCartesianSeriesOptions[]> extends AgBaseChartOptions {
    type?: 'cartesian' | 'groupedCategory' | 'line' | 'bar' | 'column' | 'area' | 'scatter';
    axes?: TAxisOptions;
    series?: TSeriesOptions;
}

export interface AgPolarChartOptions<TAxisOptions = AgPolarAxisOptions[], TSeriesOptions = AgPolarSeriesOptions[]> extends AgBaseChartOptions {
    type?: 'polar' | 'pie';
    axes?: TAxisOptions; // will be supported in the future and used by radar series
    series?: TSeriesOptions;
}

export type AgChartOptions = AgCartesianChartOptions | AgPolarChartOptions;