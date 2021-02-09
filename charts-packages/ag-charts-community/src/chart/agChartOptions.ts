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

interface AgCartesianAxisThemeOptions<T> {
    top?: Omit<Omit<T, 'top'>, 'type'>;
    right?: Omit<Omit<T, 'right'>, 'type'>;
    bottom?: Omit<Omit<T, 'bottom'>, 'type'>;
    left?: Omit<Omit<T, 'left'>, 'type'>;
}

export interface AgNumberAxisThemeOptions extends Omit<AgNumberAxisOptions, 'type'>, AgCartesianAxisThemeOptions<AgNumberAxisOptions> {}
export interface AgCategoryAxisThemeOptions extends Omit<AgCategoryAxisOptions, 'type'>, AgCartesianAxisThemeOptions<AgCategoryAxisOptions> {}
export interface AgGroupedCategoryAxisThemeOptions extends Omit<AgGroupedCategoryAxisOptions, 'type'>, AgCartesianAxisThemeOptions<AgGroupedCategoryAxisOptions> {}
export interface AgTimeAxisThemeOptions extends Omit<AgTimeAxisOptions, 'type'>, AgCartesianAxisThemeOptions<AgTimeAxisOptions> {}

export interface AgCartesianAxesTheme {
    number?: AgNumberAxisThemeOptions;
    category?: AgCategoryAxisThemeOptions;
    groupedCategory?: AgGroupedCategoryAxisThemeOptions;
    time?: AgTimeAxisThemeOptions;
}

export interface AgCartesianSeriesTheme {
    line?: AgLineSeriesOptions;
    scatter?: AgScatterSeriesOptions;
    area?: AgAreaSeriesOptions;
    bar?: AgBarSeriesOptions;
    column?: AgBarSeriesOptions;
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
     * @deprecated Use `item.paddingX` instead.
     */
    layoutHorizontalSpacing?: number;
    /**
     * @deprecated Use `item.paddingY` instead.
     */
    layoutVerticalSpacing?: number;
    /**
     * @deprecated Use `item.marker.padding` instead.
     */
    itemSpacing?: number;
    /**
     * @deprecated Use `item.marker.shape` instead.
     */
    markerShape?: string | (new () => any);
    /**
     * @deprecated Use `item.marker.size` instead.
     */
    markerSize?: number;
    /**
     * @deprecated Use `item.marker.strokeWidth` instead.
     */
    strokeWidth?: number;
    /**
     * @deprecated Use `item.label.color` instead.
     */
    color?: string;
    /**
     * @deprecated Use `item.label.fontStyle` instead.
     */
    fontStyle?: FontStyle;
    /**
     * @deprecated Use `item.label.fontWeight` instead.
     */
    fontWeight?: FontWeight;
    /**
     * @deprecated Use `item.label.fontSize` instead.
     */
    fontSize?: number;
    /**
     * @deprecated Use `item.label.fontFamily` instead.
     */
    fontFamily?: string;
}

interface AgChartTooltipOptions {
    enabled?: boolean;
    class?: string;
    tracking?: boolean;
    delay?: number;
}

interface AgBaseChartOptions {
    container?: HTMLElement | null;
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
    tooltip?: AgChartTooltipOptions;
    /**
     * @deprecated Use `tooltip.class` instead.
     */
    tooltipClass?: string;
    /**
     * @deprecated Use `tooltip.tracking` instead.
     */
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
    /**
    * @deprecated Use `tooltip.enabled` instead.
    */
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

export interface AgCartesianSeriesMarkerFormatterParams {
    xKey: string;
    yKey: string;
}

export interface AgCartesianSeriesMarkerFormat {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    size?: number;
}

export type AgCartesianSeriesMarkerFormatter = (params: AgCartesianSeriesMarkerFormatterParams) => AgCartesianSeriesMarkerFormat;

interface AgCartesianSeriesMarker extends AgSeriesMarker {
    formatter?: AgCartesianSeriesMarkerFormatter;
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
    /**
     * @deprecated Use `tooltip.renderer` instead.
     */
    tooltipRenderer?: (params: AgCartesianSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}

export interface AgOHLCTooltipRendererParams extends AgSeriesTooltipRendererParams {
    dateKey?: string;
    dateName?: string;

    openKey?: string;
    openName?: string;

    highKey?: string;
    highName?: string;

    lowKey?: string;
    lowName?: string;

    closeKey?: string;
    closeName?: string;
}

export interface AgOHLCSeriesTooltip extends AgSeriesTooltip {
    renderer?: (params: AgOHLCTooltipRendererParams) => string | AgTooltipRendererResult;
}

export interface AgOHLCSeriesOptions extends AgBaseSeriesOptions {
    type?: 'ohlc';
    dateKey?: string;
    openKey?: string;
    highKey?: string;
    lowKey?: string;
    closeKey?: string;
    labelKey?: string;
    highlightStyle?: {
        fill?: string;
        stroke?: string;
    };
    tooltip?: AgOHLCSeriesTooltip;
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
    /**
    * @deprecated Use `tooltip.renderer` instead.
    */
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
    /**
    * @deprecated Use `tooltip.renderer` instead.
    */
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
    /**
    * @deprecated Use `tooltip.renderer` instead.
    */
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
    /**
    * @deprecated Use `tooltip.renderer` instead.
    */
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
    /**
    * @deprecated Use `tooltip.renderer` instead.
    */
    tooltipRenderer?: (params: AgPieSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
    formatter?: (params: AgPieSeriesFormatterParams) => AgPieSeriesFormat;
}

interface AgPieSeriesTooltipRendererParams extends AgPolarSeriesTooltipRendererParams {
    labelKey?: string;
    labelName?: string;
}

interface AgTreemapSeriesLabelOptions extends AgChartLabelOptions {
    padding?: number;
}

interface AgTreemapNodeDatum {
    data: any;
    parent?: AgTreemapNodeDatum;
    children?: AgTreemapNodeDatum[];
    depth: number;
}

interface AgTreemapSeriesTooltipRendererParams {
    datum: AgTreemapNodeDatum;
    sizeKey: string;
    labelKey: string;
    valueKey: string;
    color: string;
}

export interface AgTreemapSeriesTooltip extends AgSeriesTooltip {
    renderer?: (params: AgTreemapSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}

export interface AgTreemapSeriesOptions extends AgBaseSeriesOptions {
    type?: 'treemap';
    title?: AgTreemapSeriesLabelOptions;
    subtitle?: AgTreemapSeriesLabelOptions;
    labels?: {
        large?: AgChartLabelOptions;
        medium?: AgChartLabelOptions;
        small?: AgChartLabelOptions;
        value?: AgChartLabelOptions;
    },
    labelKey?: string;
    tooltip?: AgTreemapSeriesTooltip;
    nodePadding?: number;
    colorParents?: boolean;
    gradient?: boolean;
}

type AgCartesianSeriesOptions =
    AgLineSeriesOptions |
    AgScatterSeriesOptions |
    AgAreaSeriesOptions |
    AgBarSeriesOptions |
    AgHistogramSeriesOptions |
    AgOHLCSeriesOptions;

type AgPolarSeriesOptions = AgPieSeriesOptions;

type AgHierarchySeriesOptions = AgTreemapSeriesOptions;

export interface AgCartesianChartOptions<TAxisOptions = AgCartesianAxisOptions[], TSeriesOptions = AgCartesianSeriesOptions[]> extends AgBaseChartOptions {
    type?: 'cartesian' | 'groupedCategory' | 'line' | 'bar' | 'column' | 'area' | 'scatter' | 'ohlc';
    axes?: TAxisOptions;
    series?: TSeriesOptions;
}

export interface AgPolarChartOptions<TAxisOptions = AgPolarAxisOptions[], TSeriesOptions = AgPolarSeriesOptions[]> extends AgBaseChartOptions {
    type?: 'polar' | 'pie';
    axes?: TAxisOptions; // will be supported in the future and used by radar series
    series?: TSeriesOptions;
}

export interface AgHierarchyChartOptions<TSeriesOptions = AgHierarchySeriesOptions[]> extends AgBaseChartOptions {
    type?: 'hierarchy' | 'treemap';
    data?: any;
    series?: TSeriesOptions;
}

export type AgChartOptions = AgCartesianChartOptions | AgPolarChartOptions | AgHierarchyChartOptions;