import type { AgInitialStateOptions } from '../api/initialStateOptions';
import type { AgAnimationOptions } from './animationOptions';
import type { AgChartBackgroundImage } from './backgroundOptions';
import type { AgContextMenuOptions } from './contextMenuOptions';
import type { AgDataSourceOptions } from './dataSourceOptions';
import type { AgBaseChartListeners } from './eventOptions';
import type { AgGradientLegendOptions } from './gradientLegendOptions';
import type { AgChartLegendOptions } from './legendOptions';
import type { AgLocaleOptions } from './localeOptions';
import type { AgNavigatorOptions } from './navigatorOptions';
import type { AgToolbarOptions } from './toolbarOptions';
import type { AgChartTooltipOptions } from './tooltipOptions';
import type { CssColor, FontFamily, FontSize, FontStyle, FontWeight, PixelSize, TextAlign, TextWrap } from './types';
import type { AgZoomOptions } from './zoomOptions';
export interface AgChartPaddingOptions {
    /** The number of pixels of padding at the top of the chart area. */
    top?: PixelSize;
    /** The number of pixels of padding at the right of the chart area. */
    right?: PixelSize;
    /** The number of pixels of padding at the bottom of the chart area. */
    bottom?: PixelSize;
    /** The number of pixels of padding at the left of the chart area. */
    left?: PixelSize;
}
export interface AgSeriesAreaPaddingOptions {
    /** The number of pixels of padding at the top of the series area. */
    top?: PixelSize;
    /** The number of pixels of padding at the right of the series area. */
    right?: PixelSize;
    /** The number of pixels of padding at the bottom of the series area. */
    bottom?: PixelSize;
    /** The number of pixels of padding at the left of the series area. */
    left?: PixelSize;
}
export interface AgSeriesAreaOptions {
    /** Controls whether to strictly clip the series rendering to the series area. */
    clip?: boolean;
    /** Configuration for the padding around the series area. */
    padding?: AgSeriesAreaPaddingOptions;
}
export interface AgChartOverlayOptions {
    /** Text to render in the overlay. */
    text?: string;
    /** A function for generating HTML element or string for overlay content. */
    renderer?: () => HTMLElement | string;
}
export interface AgChartOverlaysOptions {
    /** An overlay to be displayed when there is no data. */
    loading?: AgChartOverlayOptions;
    /** An overlay to be displayed when there is no data. */
    noData?: AgChartOverlayOptions;
    /** An overlay to be displayed when there are no series visible. */
    noVisibleSeries?: AgChartOverlayOptions;
}
export interface AgChartCaptionOptions {
    /** Whether the text should be shown. */
    enabled?: boolean;
    /** The text to display. */
    text?: string;
    /** Horizontal position of the text. */
    textAlign?: TextAlign;
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
    spacing?: PixelSize;
    /** Used to constrain the width of the title before text is wrapped or truncated. */
    maxWidth?: PixelSize;
    /** Used to constrain the height of the title before text is truncated. */
    maxHeight?: PixelSize;
    /**
     * Text wrapping strategy for long text.
     * - `'always'` will always wrap text to fit within the `maxWidth`.
     * - `'hyphenate'` is similar to `'always'`, but inserts a hyphen (`-`) if forced to wrap in the middle of a word.
     * - `'on-space'` will only wrap on white space. If there is no possibility to wrap a line on space and satisfy the `maxWidth`, the text will be truncated.
     * - `'never'` disables text wrapping.
     *
     * Default: `'on-space'`
     */
    wrapping?: TextWrap;
}
export interface AgChartSubtitleOptions extends AgChartCaptionOptions {
}
export interface AgChartFooterOptions extends AgChartCaptionOptions {
}
export interface AgChartBackground {
    /** Whether the background should be visible. */
    visible?: boolean;
    /** Colour of the chart background. */
    fill?: CssColor;
    /** Background image. May be combined with fill colour. */
    image?: AgChartBackgroundImage;
}
type AgChartHighlightRange = 'tooltip' | 'node';
export interface AgChartHighlightOptions {
    /** By default, nodes will be highlighted when the cursor is within the `tooltip.range`. Set this to `'node'` to highlight nodes when within the `series[].nodeClickRange`. */
    range?: AgChartHighlightRange;
}
export interface AgChartSyncOptions {
    /** Toggles the synchronization feature. It is implicitly enabled when configuration options are provided; otherwise, it defaults to `false`. */
    enabled?: boolean;
    /** Specifies the synchronization group identifier for the chart. Omitting this assigns the chart to a default synchronization group. */
    groupId?: string;
    /**
     * Determines the axes to be synchronized across charts.
     *
     * Default: `x`
     */
    axes?: 'x' | 'y' | 'xy';
    /**
     * Enables synchronization of node interactions across charts.
     *
     * Default: `true`
     */
    nodeInteraction?: boolean;
    /**
     * Enables synchronization of zoom actions across charts.
     *
     * Default: `true`
     */
    zoom?: boolean;
}
export interface AgKeyboardOptions {
    /** Toggles the keyboard navigation feature.
     *
     * Default: `true`
     */
    enabled?: boolean;
    /** Allows setting the tabIndex of the chart canvas.
     *
     * Default: `0`
     */
    tabIndex?: number;
}
export interface AgBaseThemeableChartOptions<TDatum = any> {
    /** The width of the chart in pixels. */
    width?: PixelSize;
    /** The height of the chart in pixels. */
    height?: PixelSize;
    /**
     * Sets the minimum height of the chart. Ignored if `height` is specified.
     *
     * Default: `300`
     */
    minHeight?: PixelSize;
    /**
     * Sets the minimum width of the chart. Ignored if `width` is specified.
     *
     * Default: `300`
     */
    minWidth?: PixelSize;
    /** Configuration for the padding shown around the chart. */
    padding?: AgChartPaddingOptions;
    /** Configuration relating to the series area. */
    seriesArea?: AgSeriesAreaOptions;
    /** Configuration for the background shown behind the chart. */
    background?: AgChartBackground;
    /** Configuration for the title shown at the top of the chart. */
    title?: AgChartCaptionOptions;
    /** Configuration for the subtitle shown beneath the chart title.
     * __Note:__ A subtitle will only be shown if a title is also present. */
    subtitle?: AgChartSubtitleOptions;
    /** Configuration for the footnote shown at the bottom of the chart. */
    footnote?: AgChartFooterOptions;
    /** Configuration for the chart highlighting. */
    highlight?: AgChartHighlightOptions;
    /** HTML overlays. */
    overlays?: AgChartOverlaysOptions;
    /** Global configuration that applies to all tooltips in the chart. */
    tooltip?: AgChartTooltipOptions;
    /** Configuration for the chart legend. */
    legend?: AgChartLegendOptions;
    /** Configuration for the gradient legend. */
    gradientLegend?: AgGradientLegendOptions;
    /** Configuration for chart animations. */
    animation?: AgAnimationOptions;
    /** Configuration for asynchronously loaded data. */
    dataSource?: AgDataSourceOptions<TDatum>;
    /** Configuration for the context menu. */
    contextMenu?: AgContextMenuOptions;
    /** Configuration for localisation. */
    locale?: AgLocaleOptions;
    /** Configuration for the toolbar. */
    toolbar?: AgToolbarOptions;
    /** Keyboard navigation options. */
    keyboard?: AgKeyboardOptions;
    /** Configuration for the Navigator. */
    navigator?: AgNavigatorOptions;
    /** Configuration for synchronizing multiple charts. */
    sync?: AgChartSyncOptions;
    /** Configuration for the zoom options. */
    zoom?: AgZoomOptions;
    /** A map of event names to event listeners. */
    listeners?: AgBaseChartListeners<TDatum>;
}
/** Configuration common to all charts.  */
export interface AgBaseChartOptions<TDatum = any> extends AgBaseThemeableChartOptions<TDatum> {
    /** The data to render the chart from. If this is not specified, it must be set on individual series instead. */
    data?: TDatum[];
    /** The element to place the rendered chart into. */
    container?: HTMLElement | null;
    /** The initial state of the chart. This must be a serializable value. */
    initialState?: AgInitialStateOptions;
}
export {};
