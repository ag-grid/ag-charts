export type FontStyle = 'normal' | 'italic' | 'oblique';
export type FontWeight =
    | 'normal'
    | 'bold'
    | 'bolder'
    | 'lighter'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900';

export type AgChartThemeName =
    | 'ag-default'
    | 'ag-default-dark'
    | 'ag-material'
    | 'ag-material-dark'
    | 'ag-pastel'
    | 'ag-pastel-dark'
    | 'ag-solar'
    | 'ag-solar-dark'
    | 'ag-vivid'
    | 'ag-vivid-dark';

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

    polar?: AgPolarChartOptions<AgPolarSeriesTheme>;
    pie?: AgPolarChartOptions<AgPieSeriesOptions>;

    hierarchy?: AgHierarchyChartOptions<AgHierarchySeriesTheme>;
    treemap?: AgHierarchyChartOptions<AgHierarchySeriesOptions>;

    common?: any;
}

export interface AgCartesianAxisThemeOptions<T> {
    top?: Omit<T, 'top' | 'type'>;
    right?: Omit<T, 'right' | 'type'>;
    bottom?: Omit<T, 'bottom' | 'type'>;
    left?: Omit<T, 'left' | 'type'>;
}

export interface AgNumberAxisThemeOptions
    extends Omit<AgNumberAxisOptions, 'type'>,
        AgCartesianAxisThemeOptions<AgNumberAxisOptions> {}
export interface AgLogAxisThemeOptions
    extends Omit<AgLogAxisOptions, 'type'>,
        AgCartesianAxisThemeOptions<AgLogAxisOptions> {}
export interface AgCategoryAxisThemeOptions
    extends Omit<AgCategoryAxisOptions, 'type'>,
        AgCartesianAxisThemeOptions<AgCategoryAxisOptions> {}
export interface AgGroupedCategoryAxisThemeOptions
    extends Omit<AgGroupedCategoryAxisOptions, 'type'>,
        AgCartesianAxisThemeOptions<AgGroupedCategoryAxisOptions> {}
export interface AgTimeAxisThemeOptions
    extends Omit<AgTimeAxisOptions, 'type'>,
        AgCartesianAxisThemeOptions<AgTimeAxisOptions> {}

export interface AgCartesianAxesTheme {
    number?: AgNumberAxisThemeOptions;
    log?: AgLogAxisThemeOptions;
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

export interface AgPolarSeriesTheme {
    pie?: AgPieSeriesOptions;
}

export interface AgHierarchySeriesTheme {
    treemap?: AgTreemapSeriesOptions;
}

export interface AgChartPaddingOptions {
    /** The number of pixels of padding at the top of the chart area. */
    top?: number;
    /** The number of pixels of padding at the right of the chart area. */
    right?: number;
    /** The number of pixels of padding at the bottom of the chart area. */
    bottom?: number;
    /** The number of pixels of padding at the left of the chart area. */
    left?: number;
}

export interface AgChartLabelOptions {
    /** Whether or not the labels should be shown. */
    enabled?: boolean;
    /** The font style to use for the labels. */
    fontStyle?: FontStyle;
    /** The font weight to use for the labels. */
    fontWeight?: FontWeight;
    /** The font size in pixels to use for the labels. */
    fontSize?: number;
    /** The font family to use for the labels. */
    fontFamily?: string;
    /** The colour to use for the labels. */
    color?: string;
}

export interface AgDropShadowOptions {
    /** Whether or not the shadow is visible. */
    enabled?: boolean;
    /** The colour of the shadow. */
    color?: string;
    /** The horizontal offset in pixels for the shadow. */
    xOffset?: number;
    /** The vertical offset in pixels for the shadow. */
    yOffset?: number;
    /** The radius of the shadow's blur, given in pixels. */
    blur?: number;
}

export interface AgChartCaptionOptions {
    /** Whether or not the title should be shown. */
    enabled?: boolean;
    padding?: AgChartPaddingOptions;
    /** The text to show in the title. */
    text?: string;
    /** The font style to use for the title. */
    fontStyle?: FontStyle;
    /** The font weight to use for the title. */
    fontWeight?: FontWeight;
    /** The font size in pixels to use for the title. */
    fontSize?: number;
    /** The font family to use for the title. */
    fontFamily?: string;
    /** The colour to use for the title. */
    color?: string;
}

export interface AgNavigatorMaskOptions {
    /** The fill colour used by the mask. */
    fill?: string;
    /** The stroke colour used by the mask. */
    stroke?: string;
    /** The stroke width used by the mask. */
    strokeWidth?: number;
    /** The opacity of the mask's fill in the <code>[0, 1]</code> interval, where <code>0</code> is effectively no masking. */
    fillOpacity?: number;
}

export interface AgNavigatorHandleOptions {
    /** The fill colour used by the handle. */
    fill?: string;
    /** The stroke colour used by the handle. */
    stroke?: string;
    /** The stroke width used by the handle. */
    strokeWidth?: number;
    /** The width of the handle. */
    width?: number;
    /** The height of the handle. */
    height?: number;
    /** The distance between the handle's grip lines. */
    gripLineGap?: number;
    /** The length of the handle's grip lines. */
    gripLineLength?: number;
}

export interface AgNavigatorOptions {
    /** Whether or not to show the navigator. */
    enabled?: boolean;
    /** The height of the navigator. */
    height?: number;
    /** The distance between the navigator and the bottom axis. */
    margin?: number;
    /** The start of the visible range in the <code>[0, 1]</code> interval. */
    min?: number;
    /** The end of the visible range in the <code>[0, 1]</code> interval. */
    max?: number;
    /** Configuration for the navigator's visible range mask. */
    mask?: AgNavigatorMaskOptions;
    /** Configuration for the navigator's left handle. */
    minHandle?: AgNavigatorHandleOptions;
    /** Configuration for the navigator's right handle. */
    maxHandle?: AgNavigatorHandleOptions;
}

export type AgChartLegendPosition = 'top' | 'right' | 'bottom' | 'left';

export interface AgChartLegendMarkerOptions {
    /** The size in pixels of the markers in the legend. */
    size?: number;
    /** If set, overrides the marker shape from the series and the legend will show the specified marker shape instead. If not set, will use a marker shape matching the shape from the series, or fall back to <code>'square'</code> if there is none. */
    shape?: string | (new () => any); // Remove the (new () => any) eventually.
    /** The padding in pixels between a legend marker and the corresponding label. */
    padding?: number;
    /** The width in pixels of the stroke for markers in the legend. */
    strokeWidth?: number;
}

export interface AgChartLegendLabelOptions {
    /** The colour of the text. */
    color?: string;
    /** The font style to use for the legend. */
    fontStyle?: FontStyle;
    /** The font weight to use for the legend. */
    fontWeight?: FontWeight;
    /** The font size in pixels to use for the legend. */
    fontSize?: number;
    /** The font family to use for the legend. */
    fontFamily?: string;
    /** Function used to render legend labels. Where <code>id</code> is a series ID, <code>itemId</code> is component ID within a series, such as a field name or an item index. */
    formatter?: (id: string, itemId: any, value: string) => string;
}

export interface AgChartLegendItemOptions {
    /** Configuration for the legend markers. */
    marker?: AgChartLegendMarkerOptions;
    /** Configuration for the legend labels. */
    label?: AgChartLegendLabelOptions;
    /** The horizontal spacing in pixels to use between legend items. */
    paddingX?: number;
    /** The vertical spacing in pixels to use between legend items. */
    paddingY?: number;
}

export interface AgChartLegendOptions {
    /** Whether or not to show the legend. */
    enabled?: boolean;
    /** Where the legend should show in relation to the chart. */
    position?: AgChartLegendPosition;
    /** The spacing in pixels to use outside the legend. */
    spacing?: number;
    /** Configuration for the legend items that consist of a marker and a label. */
    item?: AgChartLegendItemOptions;
}

export interface AgChartTooltipOptions {
    /** Set to false to disable tooltips for all series in the chart. */
    enabled?: boolean;
    /** A class name to be added to the tooltip element of the chart. */
    class?: string;
    /** If true, for series with markers the tooltip will be shown to the closest marker. */
    tracking?: boolean;
    /** The time interval (in milliseconds) after which the tooltip is shown. */
    delay?: number;
}

export interface AgChartBackground {
    /** Whether or not the background should be visible. */
    visible?: boolean;
    /** Colour of the chart background. */
    fill?: string;
}

export interface AgBaseChartListeners {
    /** The listener to call when a node (marker, column, bar, tile or a pie slice) in any series is clicked. In case a chart has multiple series, the chart's `seriesNodeClick` event can be used to listen to `nodeClick` events of all the series at once. */
    seriesNodeClick: (
        type: 'seriesNodeClick', 
        series: 'LineSeries' | 'AreaSeries' | 'BarSeries' | 'HistogramSeries' | 'PieSeries' | 'ScatterSeries' | 'TreemapSeries',
        datum: any,
        xKey: string,
        yKey: string,
    ) => any;
    /** Generic listeners. */
    [key: string]: Function,
} 

/** Configuration common to all charts.  */
export interface AgBaseChartOptions {
    /** The data to render the chart from. If this is not specified, it must be set on individual series instead. */
    data?: any[];
    /** The element to place the rendered chart into.<br/><strong>Important:</strong> make sure to read the <code>autoSize</code> config description for information on how the container element affects the chart size (by default). */
    container?: HTMLElement | null;
    /** The width of the chart in pixels. Has no effect if <code>autoSize</code> is set to <code>true</code>. */
    width?: number;
    /** The height of the chart in pixels. Has no effect if <code>autoSize</code> is set to <code>true</code>. */
    height?: number;
    /** By default, the chart will resize automatically to fill the container element. Set this to <code>false</code> to disable this behaviour. If either the <code>width</code> or <code>height</code> are set, auto-sizing will be disabled unless this is explicitly set to <code>true</code>.<br/><strong>Important:</strong> if this config is set to <code>true</code>, make sure to give the chart's <code>container</code> element an explicit size, otherwise you will run into a chicken and egg situation where the container expects to size itself according to the content and the chart expects to size itself according to the container. */
    autoSize?: boolean;
    /** Configuration for the padding shown around the chart. */
    padding?: AgChartPaddingOptions;
    /** Configuration for the background shown behind the chart. */
    background?: AgChartBackground;
    /** Configuration for the title shown at the top of the chart. */
    title?: AgChartCaptionOptions;
    /** Configuration for the subtitle shown beneath the chart title. Note: a subtitle will only be shown if a title is also present. */
    subtitle?: AgChartCaptionOptions;
    /** Global configuration that applies to all tooltips in the chart. */
    tooltip?: AgChartTooltipOptions;
    /** Configuration for the chart legend. */
    legend?: AgChartLegendOptions;
    /** A map of event names to event listeners. */
    listeners?: AgBaseChartListeners;
    theme?: string | AgChartTheme; // | ChartTheme
}

export interface AgBaseAxisOptions {
    keys?: string[];
}

export type AgCartesianAxisPosition = 'top' | 'right' | 'bottom' | 'left';

export interface AgAxisLineOptions {
    /** The width in pixels of the axis line. */
    width?: number;
    /** The colour of the axis line. */
    color?: string;
}

export interface AgAxisTickOptions {
    /** The width in pixels of the axis ticks (and corresponding grid line). */
    width?: number;
    /** The length in pixels of the axis ticks. */
    size?: number;
    /** The colour of the axis ticks. */
    color?: string;
    /** A hint of how many ticks to use across an axis. The axis is not guaranteed to use exactly this number of ticks, but will try to use a number of ticks that is close to the number given.<br/><br/>If the axis is a `time` axis, the following intervals from the `agCharts.time` namespace can be used: `millisecond, second, minute, hour, day, sunday, monday, tuesday, wednesday, thursday, friday, saturday, month, year, utcMinute, utcHour, utcDay, utcMonth, utcYear`. And derived intervals can be created by using the `every` method on the default ones. For example, `agCharts.time.month.every(2)` will return a derived interval that will make the axis place ticks for every other month.<br/><br/> */
    count?: any;
}

export interface AgAxisLabelFormatterParams {
    readonly value: any;
    readonly index: number;
    readonly fractionDigits?: number;
    readonly formatter?: (x: any) => string;
}

export interface AgAxisLabelOptions {
    /** The font style to use for the labels. */
    fontStyle?: FontStyle;
    /** The font weight to use for the labels. */
    fontWeight?: FontWeight;
    /** The font size in pixels to use for the labels. */
    fontSize?: number;
    /** The font family to use for the labels */
    fontFamily?: string;
    /** Padding in pixels between the axis label and the tick. */
    padding?: number;
    /** The colour to use for the labels */
    color?: string;
    /** The rotation of the axis labels in degrees. Note: for integrated charts the default is 335 degrees, unless the axis shows grouped or default categories (indexes). The first row of labels in a grouped category axis is rotated perpendicular to the axis line. */
    rotation?: number;
    // mirrored?: boolean;
    // parallel?: boolean;
    /** Format string used when rendering labels for time axes. For more information on the structure of the string, <a href=\"../axes/#time-label-format-string\">click here</a> */
    format?: string;
    /** Function used to render axis labels. If <code>value</code> is a number, <code>fractionDigits</code> will also be provided, which indicates the number of fractional digits used in the step between ticks; for example, a tick step of <code>0.0005</code> would have <code>fractionDigits</code> set to <code>4</code> */
    formatter?: (params: AgAxisLabelFormatterParams) => string;
}

export interface AgAxisGridStyle {
    /** The colour of the grid line. */
    stroke?: string;
    /** Defines how the gridlines are rendered. Every number in the array specifies the length in pixels of alternating dashes and gaps. For example, <code>[6, 3]</code> means dashes with a length of <code>6</code> pixels with gaps between of <code>3</code> pixels. */
    lineDash?: number[];
}

export type AgCartesianAxisType = 'category' | 'groupedCategory' | 'number' | 'log' | 'time';

/** Configuration for axes in cartesian charts. */
export interface AgBaseCartesianAxisOptions extends AgBaseAxisOptions {
    /** The position on the chart where the axis should be rendered. */
    position?: AgCartesianAxisPosition;
    /** Configuration for the title shown next to the axis. */
    title?: AgChartCaptionOptions;
    /** Configuration for the axis line. */
    line?: AgAxisLineOptions;
    /** Configuration for the axis ticks. */
    tick?: AgAxisTickOptions;
    /** Configuration for the axis labels, shown next to the ticks. */
    label?: AgAxisLabelOptions;
    /** Configuration of the lines used to form the grid in the chart area. */
    gridStyle?: AgAxisGridStyle[];
}

export interface AgNumberAxisOptions extends AgBaseCartesianAxisOptions {
    type: 'number';
    /** If 'true', the range will be rounded up to ensure nice equal spacing between the ticks. */
    nice?: boolean;
    /** User override for the automatically determined min value (based on series data). */
    min?: number;
    /** User override for the automatically determined max value (based on series data). */
    max?: number;
}

export interface AgLogAxisOptions extends AgBaseCartesianAxisOptions {
    type: 'log';
    /** If 'true', the range will be rounded up to ensure nice equal spacing between the ticks. */
    nice?: boolean;
    /** User override for the automatically determined min value (based on series data). */
    min?: number;
    /** User override for the automatically determined max value (based on series data). */
    max?: number;
    /** The base of the logarithm used. */
    base?: number;
}

export interface AgCategoryAxisOptions extends AgBaseCartesianAxisOptions {
    type: 'category';
    paddingInner?: number;
    paddingOuter?: number;
}

export interface AgGroupedCategoryAxisOptions extends AgBaseCartesianAxisOptions {
    type: 'groupedCategory';
}

export interface AgTimeAxisOptions extends AgBaseCartesianAxisOptions {
    type: 'time';
    /** If 'true', the range will be rounded up to ensure nice equal spacing between the ticks. */
    nice?: boolean;
}

export type AgCartesianAxisOptions =
    | AgNumberAxisOptions
    | AgLogAxisOptions
    | AgCategoryAxisOptions
    | AgGroupedCategoryAxisOptions
    | AgTimeAxisOptions;

export interface AgSeriesHighlightMarkerStyle {
    /** The fill colour of a marker when tapped or hovered over. Use `undefined` for no highlight. */
    fill?: string;
    /** The stroke colour of a marker when tapped or hovered over. Use `undefined` for no highlight. */
    stroke?: string;
    /** The stroke width of a marker when tapped or hovered over. Use `undefined` for no highlight. */
    strokeWidth?: number;
};

export interface AgSeriesHighlightSeriesStyle {
    enabled?: boolean;
    /** The opacity of the whole series (area line, area fill, labels and markers, if any) when another chart series or another stack level in the same area series is highlighted by hovering a data point or a legend item. Use `undefined` or `1` for no dimming. */
    dimOpacity?: number;
    /** The stroke width of the area line when one of the markers is tapped or hovered over, or when a tooltip is shown for a data point, even when series markers are disabled. Use `undefined` for no highlight. */
    strokeWidth?: number;
};

export interface AgSeriesHighlightStyle {
    /**
     * The fill colour of a marker when tapped or hovered over. Use `undefined` for no highlight.
     *
     * @deprecated Use item.fill instead.
     */
    fill?: string;
    /**
     * The stroke colour of a marker when tapped or hovered over. Use `undefined` for no highlight.
     *
     * @deprecated Use item.stroke instead.
     */
    stroke?: string;
    /**
     * The stroke width of a marker when tapped or hovered over. Use `undefined` for no highlight.
     *
     * @deprecated Use item.strokeWidth instead.
     */
    strokeWidth?: number;
    /** Highlight style used for an individual marker when tapped or hovered over. */
    item?: AgSeriesHighlightMarkerStyle;
    /** Highlight style used for whole series when one of its markers is tapped or hovered over. */
    series?: AgSeriesHighlightSeriesStyle;
};
export interface AgBaseSeriesOptions {
    /** The data to use when rendering the series. If this is not supplied, data must be set on the chart instead. */
    data?: any[];
    /** Whether or not to display the series. */
    visible?: boolean;
    /** Whether or not to include the series in the legend. */
    showInLegend?: boolean;
    /** The cursor to use for hovered area markers. This config is identical to the CSS `cursor` property. */
    cursor?: string;
    /** A map of event names to event listeners. */
    listeners?: { [key in string]: Function };
    /** Configuration for series markers and series line highlighting when a marker / data point or a legend item is hovered over. */
    highlightStyle?: AgSeriesHighlightStyle;
}

export interface AgTooltipRendererResult {
    title?: string;
    content?: string;
}

export interface AgSeriesTooltipRendererParams {
    readonly datum: any;
    readonly title?: string;
    readonly color?: string;
}

export interface AgCartesianSeriesTooltipRendererParams extends AgSeriesTooltipRendererParams {
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

export interface AgScatterSeriesTooltipRendererParams extends AgCartesianSeriesTooltipRendererParams {
    readonly sizeKey?: string;
    readonly sizeName?: string;

    readonly labelKey?: string;
    readonly labelName?: string;
}

export interface AgSeriesMarker {
    /** Whether or not to show markers. */
    enabled?: boolean;
    /** The shape to use for the markers. You can also supply a custom marker by providing a <code>Marker</code> subclass. */
    shape?: string | (new () => any);
    /** The size in pixels of the markers. */
    size?: number;
    /** For series where the size of the marker is determined by the data, this determines the largest size a marker can be in pixels. */
    maxSize?: number;
    /** The colour to use for marker fills. If this is not specified, the markers will take their fill from the series. */
    fill?: string;
    /** The colour to use for marker strokes. If this is not specified, the markers will take their stroke from the series. */
    stroke?: string;
    /** The width in pixels of the marker stroke. If this is not specified, the markers will take their stroke width from the series. */
    strokeWidth?: number;
    /**  */
    fillOpacity?: number;
    /**  */
    strokeOpacity?: number;
}

export interface AgSeriesMarkerFormatterParams {
    datum: any;
    fill?: string;
    stroke?: string;
    strokeWidth: number;
    size: number;
    highlighted: boolean;
}

export interface AgCartesianSeriesMarkerFormatterParams extends AgSeriesMarkerFormatterParams {
    xKey: string;
    yKey: string;
}

export interface AgCartesianSeriesMarkerFormat {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    size?: number;
}

export type AgCartesianSeriesMarkerFormatter = (
    params: AgCartesianSeriesMarkerFormatterParams
) => AgCartesianSeriesMarkerFormat | undefined;

export interface AgCartesianSeriesMarker extends AgSeriesMarker {
    /** Function used to return formatting for individual markers, based on the supplied information. If the current marker is highlighted, the <code>highlighted</code> property will be set to <code>true</code>; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    formatter?: AgCartesianSeriesMarkerFormatter;
}

export interface AgSeriesTooltip {
    /** Whether or not to show tooltips when the series are hovered over. */
    enabled?: boolean;
}

export interface AgLineSeriesLabelOptions extends AgChartLabelOptions {
    /** Function used to turn 'yKey' values into text to be displayed by a label. Be default the values are simply stringified. */
    formatter?: (params: { value: any }) => string;
}

export interface AgLineSeriesTooltip extends AgSeriesTooltip {
    /** Function used to create the content for tooltips. */
    renderer?: (params: AgCartesianSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
    format?: string;
}

/** Configuration for line series. */
export interface AgLineSeriesOptions extends AgBaseSeriesOptions {
    type?: 'line';
    marker?: AgCartesianSeriesMarker;
    /** The key to use to retrieve x-values from the data. */
    xKey?: string;
    /** The key to use to retrieve y-values from the data. */
    yKey?: string;
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
    /** The title to use for the series. Defaults to <code>yName</code> if it exists, or <code>yKey</code> if not. */
    title?: string;
    /** The colour of the stroke for the lines. */
    stroke?: string;
    /** The width in pixels of the stroke for the lines. */
    strokeWidth?: number;
    /** The opacity of the stroke for the lines. */
    strokeOpacity?: number;
    /** Defines how the line stroke is rendered. Every number in the array specifies the length in pixels of alternating dashes and gaps. For example, <code>[6, 3]</code> means dashes with a length of <code>6</code> pixels with gaps between of <code>3</code> pixels. */
    lineDash?: number[];
    /** The initial offset of the dashed line in pixels. */
    lineDashOffset?: number;
    /** Configuration for the labels shown on top of data points. */
    label?: AgLineSeriesLabelOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgLineSeriesTooltip;
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
    tooltip?: AgOHLCSeriesTooltip;
}

export interface AgScatterSeriesTooltip extends AgSeriesTooltip {
    /** Function used to create the content for tooltips. */
    renderer?: (params: AgScatterSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}

export interface AgScatterSeriesLabelOptions extends AgChartLabelOptions {}

/** Configuration for scatter/bubble series. */
export interface AgScatterSeriesOptions extends AgBaseSeriesOptions {
    /** Configuration for the treemap series.  */
    type?: 'scatter';
    /** Configuration for the markers used in the series.  */
    marker?: AgCartesianSeriesMarker;
    /** Configuration for the labels shown on top of data points.  */
    label?: AgScatterSeriesLabelOptions;
    /** The key to use to retrieve x-values from the data.  */
    xKey?: string;
    /** The key to use to retrieve y-values from the data.  */
    yKey?: string;
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters.  */
    xName?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters.  */
    yName?: string;
    /** The key to use to retrieve size values from the data, used to control the size of the markers in bubble charts.  */
    sizeKey?: string;
    /** A human-readable description of the size values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters.  */
    sizeName?: string;
    /** The key to use to retrieve values from the data to use as labels for the markers.  */
    labelKey?: string;
    /** A human-readable description of the label values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters.  */
    labelName?: string;
    /** The title to use for the series. Defaults to <code>yName</code> if it exists, or <code>yKey</code> if not.  */
    title?: string;
    /** @deprecated Use {@link marker.fill} instead. */
    fill?: string;
    /** @deprecated Use {@link marker.stroke} instead. */
    stroke?: string;
    /** @deprecated Use {@link marker.strokeWidth} instead. */
    strokeWidth?: number;
    /** @deprecated Use {@link marker.fillOpacity} instead. */
    fillOpacity?: number;
    /** @deprecated Use {@link marker.strokeOpacity} instead. */
    strokeOpacity?: number;
    /** Series-specific tooltip configuration.  */
    tooltip?: AgScatterSeriesTooltip;
}

export interface AgAreaSeriesTooltip extends AgSeriesTooltip {
    renderer?: (params: AgCartesianSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
    format?: string;
}

export interface AgAreaSeriesLabelOptions extends AgChartLabelOptions {
    /** Function used to turn 'yKey' values into text to be displayed by a label. Be default the values are simply stringified. */
    formatter?: (params: { value: any }) => string;
}

/** Configuration for area series. */
export interface AgAreaSeriesOptions extends AgBaseSeriesOptions {
    type?: 'area';
    /** Configuration for the markers used in the series. */
    marker?: AgCartesianSeriesMarker;
    /** The number to normalise the area stacks to. For example, if <code>normalizedTo</code> is set to <code>100</code>, the stacks will all be scaled proportionally so that their total height is always 100. */
    normalizedTo?: number;
    /** The key to use to retrieve x-values from the data. */
    xKey?: string;
    /**
     * The keys to use to retrieve y-values from the data.
     *
     * @deprecated use yKey and multiple series instead
     */
    yKeys?: string[];
    /** The key to use to retrieve y-values from the data. */
    yKey?: string;
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /**
     * Human-readable descriptions of the y-values. If supplied, a corresponding `yName` will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters.
     *
     * @deprecated use yName and multiple series instead
     */
    yNames?: string[];
    yName?: string;
    /**
     * The colours to cycle through for the fills of the areas.
     *
     * @deprecated use fill and multiple series instead
     */
    fills?: string[];
    /** The colour to use for the fill of the area. */
    fill?: string;
    /**
     * The colours to cycle through for the strokes of the areas.
     *
     * @deprecated use stroke and multiple series instead
     */
    strokes?: string[];
    /** The colours to use for the stroke of the areas. */
    stroke?: string;
    /** The width in pixels of the stroke for the areas. */
    strokeWidth?: number;
    /** The opacity of the fill for the area. */
    fillOpacity?: number;
    /** The opacity of the stroke for the areas. */
    strokeOpacity?: number;
    /** Defines how the area strokes are rendered. Every number in the array specifies the length in pixels of alternating dashes and gaps. For example, <code>[6, 3]</code> means dashes with a length of <code>6</code> pixels with gaps between of <code>3</code> pixels. */
    lineDash?: number[];
    /** The initial offset of the dashed line in pixels. */
    lineDashOffset?: number;
    /** Configuration for the shadow used behind the chart series. */
    shadow?: AgDropShadowOptions;
    /** Configuration for the labels shown on top of data points. */
    label?: AgAreaSeriesLabelOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgAreaSeriesTooltip;
    stacked?: boolean;
}

export interface AgBarSeriesLabelOptions extends AgChartLabelOptions {
    /** Function used to turn 'yKey' values into text to be displayed by a label. Be default the values are simply stringified. */
    formatter?: (params: { value: number }) => string;
    /** Where to render series labels relative to the segments. */
    placement?: 'inside' | 'outside';
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
    /** Function used to create the content for tooltips. */
    renderer?: (params: AgCartesianSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}

/** Configuration for bar/column series. */
export interface AgBarSeriesOptions extends AgBaseSeriesOptions {
    type?: 'bar' | 'column';
    /** Whether to show different y-values as separate bars (grouped) or not (stacked). */
    grouped?: boolean;
    stacked?: boolean;
    /** The number to normalise the bar stacks to. Has no effect when <code>grouped</code> is <code>true</code>. For example, if <code>normalizedTo</code> is set to <code>100</code>, the bar stacks will all be scaled proportionally so that each of their totals is 100. */
    normalizedTo?: number;
    /** The key to use to retrieve x-values from the data. */
    xKey?: string;
    /** The keys to use to retrieve y-values from the data. */
    yKey?: string;
    /**
     * The keys to use to retrieve y-values from the data.
     *
     * @deprecated use yKey and multiple series instead
     */
    yKeys?: string[] | string[][];
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** Human-readable description of the y-values. If supplied, a corresponding `yName` will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
    /**
     * Human-readable descriptions of the y-values. If supplied, a corresponding `yName` will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters.
     *
     * @deprecated use yName and multiple series instead
     */
    yNames?: string[] | { [key in string]: string };
    flipXY?: boolean;
    /**
     * The colours to cycle through for the fills of the bars.
     *
     * @deprecated use fill and multiple series instead
     */
    fills?: string[];
    /** The colour to use for the fill of the area. */
    fill?: string;
    /**
     * The colours to cycle through for the strokes of the bars.
     *
     * @deprecated use stroke and multiple series instead
     */
    strokes?: string[];
    /** The colours to use for the stroke of the bars. */
    stroke?: string;
    /** The width in pixels of the stroke for the bars. */
    strokeWidth?: number;
    /** The opacity of the fill for the bars. */
    fillOpacity?: number;
    /** The opacity of the stroke for the bars. */
    strokeOpacity?: number;
    /** Defines how the bar/column strokes are rendered. Every number in the array specifies the length in pixels of alternating dashes and gaps. For example, <code>[6, 3]</code> means dashes with a length of <code>6</code> pixels with gaps between of <code>3</code> pixels. */
    lineDash?: number[];
    /** The initial offset of the dashed line in pixels. */
    lineDashOffset?: number;
    /** Configuration for the shadow used behind the chart series. */
    shadow?: AgDropShadowOptions;
    /** Configuration for the labels shown on bars. */
    label?: AgBarSeriesLabelOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgBarSeriesTooltip;
    /** Function used to return formatting for individual bars/columns, based on the given parameters. If the current bar/column is highlighted, the <code>highlighted</code> property will be set to <code>true</code>; make sure to check this if you want to differentiate between the highlighted and un-highlighted states. */
    formatter?: (params: AgBarSeriesFormatterParams) => AgBarSeriesFormat;
}

export interface AgHistogramSeriesLabelOptions extends AgChartLabelOptions {
    /** Function used to turn 'yKey' values into text to be displayed by a label. Be default the values are simply stringified. */
    formatter?: (params: { value: number }) => string;
}

export interface AgHistogramSeriesTooltip extends AgSeriesTooltip {
    /** Function used to create the content for tooltips. */
    renderer?: (params: AgCartesianSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}

/** Configuration for histogram series. */
export interface AgHistogramSeriesOptions extends AgBaseSeriesOptions {
    type?: 'histogram';
    /** The colour of the fill for the histogram bars. */
    fill?: string;
    /** The colour of the stroke for the histogram bars. */
    stroke?: string;
    /** The opacity of the fill for the histogram bars. */
    fillOpacity?: number;
    /** The opacity of the stroke for the histogram bars. */
    strokeOpacity?: number;
    /** The width in pixels of the stroke for the histogram bars. */
    strokeWidth?: number;
    /** Defines how the column strokes are rendered. Every number in the array specifies the length in pixels of alternating dashes and gaps. For example, <code>[6, 3]</code> means dashes with a length of <code>6</code> pixels with gaps between of <code>3</code> pixels. */
    lineDash?: number[];
    /** The initial offset of the dashed line in pixels. */
    lineDashOffset?: number;
    /** The key to use to retrieve x-values from the data. */
    xKey?: string;
    /** A human-readable description of the x-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    xName?: string;
    /** The key to use to retrieve y-values from the data. */
    yKey?: string;
    /** A human-readable description of the y-values. If supplied, this will be shown in the default tooltip and passed to the tooltip renderer as one of the parameters. */
    yName?: string;
    /** For variable width bins, if true the histogram will represent the aggregated <code>yKey</code> values using the area of the bar. Otherwise, the height of the var represents the value as per a normal bar chart. This is useful for keeping an undistorted curve displayed when using variable-width bins. */
    areaPlot?: boolean;
    /** Set the bins explicitly. The bins need not be of equal width. Clashes with the <code>binCount</code> setting. */
    bins?: [number, number][];
    /** The number of bins to try to split the x axis into. Clashes with the <code>bins</code> setting. */
    binCount?: number;
    /** Dictates how the bins are aggregated. If set to 'sum', the value shown for the bins will be the total of the yKey values. If set to 'mean', it will display the average yKey value of the bin. */
    aggregation?: 'count' | 'sum' | 'mean';
    /** Configuration for the shadow used behind the chart series. */
    shadow?: AgDropShadowOptions;
    /** Configuration for the labels shown on bars. */
    label?: AgHistogramSeriesLabelOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgHistogramSeriesTooltip;
}

export interface AgPieSeriesLabelOptions extends AgChartLabelOptions {
    /** Distance in pixels between the callout line and the label text. */
    offset?: number;
    /** Minimum angle in degrees required for a segment to show a label. */
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
    /** Function used to create the content for tooltips. */
    renderer?: (params: AgPieSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}

export interface AgPieTitleOptions extends AgChartCaptionOptions {
    showInLegend?: boolean;
}

export interface AgPieSeriesCalloutOptions {
    /** The colours to cycle through for the strokes of the callouts. */
    colors?: string[];
    /** The length in pixels of the callout lines. */
    length?: number;
    /** The width in pixels of the stroke for callout lines. */
    strokeWidth?: number;
}

/** Configuration for pie/doughnut series. */
export interface AgPieSeriesOptions extends AgBaseSeriesOptions {
    type?: 'pie';
    /** Configuration for the series title. */
    title?: AgPieTitleOptions;
    /** Configuration for the labels used for the segments. */
    label?: AgPieSeriesLabelOptions;
    /** Configuration for the callouts used with the labels for the segments. */
    callout?: AgPieSeriesCalloutOptions;
    /** The key to use to retrieve angle values from the data. */
    angleKey?: string;
    /** A human-readable description of the angle values. If supplied, this will be passed to the tooltip renderer as one of the parameters. */
    angleName?: string;
    /** The key to use to retrieve radius values from the data. */
    radiusKey?: string;
    /** A human-readable description of the radius values. If supplied, this will be passed to the tooltip renderer as one of the parameters. */
    radiusName?: string;
    /** The key to use to retrieve label values from the data. */
    labelKey?: string;
    /** A human-readable description of the label values. If supplied, this will be passed to the tooltip renderer as one of the parameters. */
    labelName?: string;
    /** The colours to cycle through for the fills of the segments. */
    fills?: string[];
    /** The colours to cycle through for the strokes of the segments. */
    strokes?: string[];
    /** The opacity of the fill for the segments. */
    fillOpacity?: number;
    /** The opacity of the stroke for the segments. */
    strokeOpacity?: number;
    /** The width in pixels of the stroke for the segments. */
    strokeWidth?: number;
    /** Defines how the pie sector strokes are rendered. Every number in the array specifies the length in pixels of alternating dashes and gaps. For example, <code>[6, 3]</code> means dashes with a length of <code>6</code> pixels with gaps between of <code>3</code> pixels. */
    lineDash?: number[];
    /** The initial offset of the dashed line in pixels. */
    lineDashOffset?: number;
    /** The rotation of the pie series in degrees. */
    rotation?: number;
    /** The offset in pixels of the outer radius of the series. Used to construct doughnut charts. */
    outerRadiusOffset?: number;
    /** The offset in pixels of the inner radius of the series. Used to construct doughnut charts. If this is not given, or a value of zero is given, a pie chart will be rendered. */
    innerRadiusOffset?: number;
    /** Configuration for the shadow used behind the chart series. */
    shadow?: AgDropShadowOptions;
    /** Series-specific tooltip configuration. */
    tooltip?: AgPieSeriesTooltip;
    formatter?: (params: AgPieSeriesFormatterParams) => AgPieSeriesFormat;
}

export interface AgPieSeriesTooltipRendererParams extends AgPolarSeriesTooltipRendererParams {
    labelKey?: string;
    labelName?: string;
}

export interface AgTreemapSeriesLabelOptions extends AgChartLabelOptions {
    /** The amount of the tile's vertical space to reserve for the label. */
    padding?: number;
}

export interface AgTreemapNodeDatum {
    datum: any;
    parent?: AgTreemapNodeDatum;
    children?: AgTreemapNodeDatum[];
    depth: number;
    colorValue: number;
    fill: string;
    label: string;
    hasTitle: boolean;
}

export interface AgTreemapSeriesTooltipRendererParams {
    datum: AgTreemapNodeDatum;
    sizeKey: string;
    labelKey: string;
    valueKey: string;
    color: string;
}

export interface AgTreemapSeriesTooltip extends AgSeriesTooltip {
    /** Function used to create the content for tooltips. */
    renderer?: (params: AgTreemapSeriesTooltipRendererParams) => string | AgTooltipRendererResult;
}

export interface AgTreemapSeriesLabelsOptions {
    /** The label configuration for the large leaf tiles. */
    large?: AgChartLabelOptions;
    /** The label configuration for the medium-sized leaf tiles. */
    medium?: AgChartLabelOptions;
    /** The label configuration for the small leaf tiles. */
    small?: AgChartLabelOptions;
    /** The configuration for the labels showing the value of the 'colorKey'. */
    color?: AgChartLabelOptions;
}

/** Configuration for the treemap series. */
export interface AgTreemapSeriesOptions extends AgBaseSeriesOptions {
    type?: 'treemap';
    /** The label configuration for the top-level tiles. */
    title?: AgTreemapSeriesLabelOptions;
    /** The label configuration for the children of the top-level parent tiles. */
    subtitle?: AgTreemapSeriesLabelOptions;
    /** Configuration for the tile labels. */
    labels?: AgTreemapSeriesLabelsOptions;
    /** The name of the node key containing the label. */
    labelKey?: string;
    /** The name of the node key containing the size value. */
    sizeKey?: string;
    /** The name of the node key containing the color value. This value (along with `colorDomain` and `colorRange` configs) will be used to determine the tile color. */
    colorKey?: string;
    /** The domain the 'colorKey' values belong to. The domain can contain more than two stops, for example `[-5, 0, -5]`. In that case the 'colorRange' should also use a matching number of colors. */
    colorDomain?: number[];
    /** The color range to interpolate the numeric `colorDomain` into. For example, if the `colorDomain` is `[-5, 5]` and `colorRange` is `['red', 'green']`, a `colorKey` value of `-5` will be assigned the 'red' color, `5` - 'green' color and `0` a blend of 'red' and 'green'. */
    colorRange?: string[];
    /** Whether or not to assign colors to non-leaf nodes based on 'colorKey'. */
    colorParents?: boolean;
    /** Series-specific tooltip configuration. */
    tooltip?: AgTreemapSeriesTooltip;
    /** The amount of padding in pixels inside of each treemap tile. Increasing `nodePadding` will reserve more space for parent labels. */
    nodePadding?: number;
    /** Whether or not to use gradients for treemap tiles. */
    gradient?: boolean;
}

export type AgCartesianSeriesOptions =
    | AgLineSeriesOptions
    | AgScatterSeriesOptions
    | AgAreaSeriesOptions
    | AgBarSeriesOptions
    | AgHistogramSeriesOptions
    | AgOHLCSeriesOptions;

export type AgPolarSeriesOptions = AgPieSeriesOptions;

export type AgHierarchySeriesOptions = AgTreemapSeriesOptions;

export interface AgCartesianChartOptions<
    TAxisOptions = AgCartesianAxisOptions[],
    TSeriesOptions = AgCartesianSeriesOptions[]
> extends AgBaseChartOptions {
    type?: 'cartesian' | 'groupedCategory' | 'line' | 'bar' | 'column' | 'area' | 'scatter' | 'ohlc' | 'histogram';
    /** Configuration for the chart navigator. */
    navigator?: AgNavigatorOptions;
    /** Axis configurations. */
    axes?: TAxisOptions;
    /** Series configurations. */
    series?: TSeriesOptions;
}

export interface AgPolarChartOptions<TSeriesOptions = AgPolarSeriesOptions[]> extends AgBaseChartOptions {
    type?: 'polar' | 'pie';
    series?: TSeriesOptions;
}

export interface AgHierarchyChartOptions<TSeriesOptions = AgHierarchySeriesOptions[]> extends AgBaseChartOptions {
    type?: 'hierarchy' | 'treemap';
    data?: any;
    series?: TSeriesOptions;
}

export type AgChartOptions = AgCartesianChartOptions | AgPolarChartOptions | AgHierarchyChartOptions;
