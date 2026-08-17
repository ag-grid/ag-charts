import type { AgColorType, BorderOptions, FillOptions, Padding } from '../series/cartesian/commonOptions';
import type { Formatter, Renderer } from './callbackOptions';
import type { AgPreventableEvent } from './eventOptions';
import type { AgCssColorOrRef } from './themeParamsOptions';
import type {
    AgMarkerShape,
    ContextDefault,
    FontFamilyFull,
    FontSize,
    FontStyle,
    FontWeight,
    Opacity,
    PixelSize,
} from './types';

/** Controls when an element tooltip is shown. */
export type AgElementTooltipVisibility = 'auto' | 'always' | 'never';

export type AgChartLegendPlacement =
    | 'top'
    | 'top-right'
    | 'top-left'
    | 'bottom'
    | 'bottom-right'
    | 'bottom-left'
    | 'right'
    | 'right-top'
    | 'right-bottom'
    | 'left'
    | 'left-top'
    | 'left-bottom';

export interface AgChartLegendPositionOptions {
    /** Where the legend should show in relation to the chart.
     *
     * Default: `'bottom'`
     */
    placement?: AgChartLegendPlacement;
    /** Whether the legend is positioned over the series area instead of outside it.
     *
     * Default: `false`
     */
    floating?: boolean;
    /** X-translation offset for the legend.
     *
     * Default: `0`
     */
    xOffset?: PixelSize;
    /** Y-translation offset for the legend.
     *
     * Default: `0`
     */
    yOffset?: PixelSize;
}

export type AgChartLegendPosition = AgChartLegendPlacement | AgChartLegendPositionOptions;

export type AgChartLegendOrientation = 'horizontal' | 'vertical';

export interface AgChartLegendMarkerDisabledStyle {
    /** Opacity of the marker for legend items that have been toggled off. This is an absolute opacity: it replaces the default dimming rather than multiplying it, so `1` renders the marker fully opaque.
     *
     * Default: `0.5`
     */
    opacity?: Opacity;
    /** The fill colour to use for the marker of legend items that have been toggled off. A colour string, or an object for a gradient, pattern, or image fill. If unset, the marker keeps its enabled fill. */
    fill?: AgColorType;
    /** Opacity of the marker fill for legend items that have been toggled off. */
    fillOpacity?: Opacity;
    /** The colour to use for the marker stroke of legend items that have been toggled off. */
    stroke?: AgCssColorOrRef;
    /** Opacity of the marker stroke for legend items that have been toggled off. */
    strokeOpacity?: Opacity;
    /** The width in pixels of the marker stroke for legend items that have been toggled off. */
    strokeWidth?: PixelSize;
}

export interface AgChartLegendMarkerOptions {
    /** The size in pixels of the markers in the legend. */
    size?: PixelSize;
    /** If set, overrides the marker shape from the series and the legend will show the specified marker shape instead. If not set, will use a marker shape matching the shape from the series, or fall back to `'square'` if there is none. */
    shape?: AgMarkerShape;
    /** The padding in pixels between a legend marker and the corresponding label. */
    padding?: PixelSize;
    /** The width in pixels of the stroke for markers in the legend. */
    strokeWidth?: PixelSize;
    /** Overrides for the marker style of legend items that have been toggled off by clicking the legend. Any property left unset falls back to the enabled marker style. */
    disabledStyle?: AgChartLegendMarkerDisabledStyle;
}

export interface AgChartLegendLineDisabledStyle {
    /** Opacity of the line for legend items that have been toggled off. This is an absolute opacity: it replaces the default dimming rather than multiplying it, so `1` renders the line fully opaque.
     *
     * Default: `0.5`
     */
    opacity?: Opacity;
    /** The colour to use for the line of legend items that have been toggled off. If unset, the line keeps its enabled stroke. */
    stroke?: AgCssColorOrRef;
    /** Opacity of the line stroke for legend items that have been toggled off. */
    strokeOpacity?: Opacity;
    /** Defines how the line stroke is rendered for legend items that have been toggled off. Every number in the array specifies the length in pixels of alternating dashes and gaps. */
    lineDash?: PixelSize[];
    /** The initial offset in pixels of the dash pattern for legend items that have been toggled off. */
    lineDashOffset?: PixelSize;
}

export interface AgChartLegendLineOptions {
    /** The width in pixels of the stroke for line in the legend. This requires `showSeriesStroke` to be set to `true`. */
    strokeWidth?: PixelSize;
    /** The length of the legend item line in pixels. This requires `showSeriesStroke` to be set to `true`. */
    length?: PixelSize;
    /** Overrides for the line style of legend items that have been toggled off by clicking the legend. Any property left unset falls back to the enabled line style. */
    disabledStyle?: AgChartLegendLineDisabledStyle;
}

export interface AgChartLegendLabelDisabledStyle {
    /** Opacity of the label for legend items that have been toggled off. This is an absolute opacity: it replaces the default dimming rather than multiplying it, so `1` renders the label fully opaque.
     *
     * Default: `0.5`
     */
    opacity?: Opacity;
    /** The colour of the label text for legend items that have been toggled off. A colour string, or a theme-colour reference object. If unset, the label keeps its enabled colour. */
    color?: AgCssColorOrRef;
}

export interface AgChartLegendLabelFormatterParams<TContext = ContextDefault> {
    /** Series id */
    seriesId: string;
    /** Legend item id - usually yKey value for cartesian series. */
    itemId: any;
    /** The default title of this legend item. */
    value: string;
    /** Datum associated with this legend item. */
    datum?: any;
    /** Callback context for this formatter. */
    context?: TContext;
}

export interface AgChartLegendLabelOptions<TContext = ContextDefault> {
    /** If the label text exceeds the specified number of characters, it will be truncated and an ellipsis will be appended to indicate this. */
    maxLength?: number;
    /** The colour of the text. A colour string, or a theme-colour reference object. */
    color?: AgCssColorOrRef;
    /** The font style to use for the legend. */
    fontStyle?: FontStyle;
    /** The font weight to use for the legend. */
    fontWeight?: FontWeight;
    /** The font size in pixels to use for the legend. */
    fontSize?: FontSize;
    /** The font family to use for the legend. A single family name, or an array of names used as fallbacks. */
    fontFamily?: FontFamilyFull;
    /** Function used to render legend labels. Where `id` is a series ID, `itemId` is component ID within a series, such as a field name or an item index. */
    formatter?: Formatter<AgChartLegendLabelFormatterParams<TContext>>;
    /** Overrides for the label style of legend items that have been toggled off by clicking the legend. Any property left unset falls back to the enabled label style. */
    disabledStyle?: AgChartLegendLabelDisabledStyle;
}

export interface AgChartLegendItemTooltipRendererParams<TContext = ContextDefault> {
    /** Series id. */
    seriesId: string;
    /** Legend item id - usually yKey value for cartesian series. */
    itemId: string | number;
    /** The full, untruncated legend item label text. */
    text: string;
    /** Whether the series for this legend item is currently visible. */
    visible: boolean;
    /** Callback context for this renderer. */
    context?: TContext;
}

export interface AgChartLegendItemTooltipOptions<TContext = ContextDefault> {
    /** Controls when the tooltip is shown.
     * - `'auto'` shows the tooltip only when the label text is truncated.
     * - `'always'` shows the tooltip on every hover.
     * - `'never'` disables the tooltip entirely.
     *
     * Default: `'auto'` when no `text` or `renderer` is provided; `'always'` otherwise.
     */
    visible?: AgElementTooltipVisibility;
    /** Static tooltip text shown for all legend items. */
    text?: string;
    /** Function to generate tooltip content per legend item. Returns plain text or an HTML string.
     * Takes precedence over `text`. Return `undefined` (or omit a return value) to fall back to
     * `text` or the default legend item label. Return an empty string to suppress the tooltip.
     *
     * **Note:** Output is rendered as HTML. Ensure content is trusted to avoid XSS. */
    renderer?: Renderer<AgChartLegendItemTooltipRendererParams<TContext>, never>;
}

export interface AgChartLegendItemOptions<TContext = ContextDefault> {
    /** Configuration for the legend markers. */
    marker?: AgChartLegendMarkerOptions;
    /** Configuration for the legend lines. */
    line?: AgChartLegendLineOptions;
    /** Configuration for the legend labels. */
    label?: AgChartLegendLabelOptions<TContext>;
    /** Configuration for the legend item tooltip. */
    tooltip?: AgChartLegendItemTooltipOptions<TContext>;
    /** Used to constrain the width of legend items. */
    maxWidth?: PixelSize;
    /** The spacing in pixels to use between legend items. A number applies uniform padding; an object sets each side. */
    padding?: Padding;
    /** Set to `false` to hide the legend line line representing the stroke styling of line and area series.
     *  If enabled, legend marker will be hidden if series markers are disabled. */
    showSeriesStroke?: boolean;
}

export interface AgChartLegendEvent<T extends string, TContext = ContextDefault> {
    type: T;
    /** Series id */
    seriesId: string;
    /** Legend item id - usually yKey value for cartesian series. */
    itemId: string | number;
    /** Legend item text value. */
    text: string;
    /** The browser event that triggered the legend event. */
    event: Event;
    /** Callback context for this event. */
    context?: TContext;
}

export interface AgChartLegendClickEvent<TContext = ContextDefault>
    extends AgChartLegendEvent<'click', TContext>, AgPreventableEvent {
    /** Whether this legend item is currently shown as active. This is the state before any visibility toggle this
     * event may cause - use the chart `seriesVisibilityChange` event for the new state. */
    visible: boolean;
}

export interface AgChartLegendDoubleClickEvent<TContext = ContextDefault>
    extends AgChartLegendEvent<'dblclick', TContext>, AgPreventableEvent {
    /** Whether this legend item is currently shown as active. This is the state before any visibility toggle this
     * event may cause - use the chart `seriesVisibilityChange` event for the new state. */
    visible: boolean;
}

export interface AgChartLegendContextMenuEvent<TContext = ContextDefault> extends AgChartLegendEvent<
    'contextmenu',
    TContext
> {}

export interface AgChartLegendListeners<TContext = ContextDefault> {
    /** The listener to call when a legend item is clicked. */
    legendItemClick?: (event: AgChartLegendClickEvent<TContext>) => void;
    /** The listener to call when a legend item is double-clicked. */
    legendItemDoubleClick?: (event: AgChartLegendDoubleClickEvent<TContext>) => void;
}

export interface AgChartLegendOptions<TContext = ContextDefault> extends FillOptions {
    /** Whether to show the legend. By default, the chart displays a legend when there is more than one series present. */
    enabled?: boolean;
    /** Where the legend should be positioned in relation to the chart. A placement keyword, or an object for fine-grained positioning.
     *
     * Default: `'bottom'`
     */
    position?: AgChartLegendPosition;
    /** How the legend items should be arranged. */
    orientation?: AgChartLegendOrientation;
    /** Used to constrain the width of the legend. */
    maxWidth?: PixelSize;
    /** Used to constrain the height of the legend. */
    maxHeight?: PixelSize;
    /** The border around the legend. */
    border?: BorderOptions;
    /** The corner radius of the legend. */
    cornerRadius?: PixelSize;
    /** The padding between the border and legend items. A number applies uniform padding; an object sets each side. */
    padding?: Padding;
    /** The spacing in pixels to use outside the legend.
     *
     * __Note:__ This only applies when `floating: false`.
     *
     * Default: `30` */
    spacing?: PixelSize;
    /** Configuration for the legend items that consist of a marker and a label. */
    item?: AgChartLegendItemOptions<TContext>;
    /** Reverse the display order of legend items if `true`. */
    reverseOrder?: boolean;
    /** Optional callbacks for specific legend-related events. */
    listeners?: AgChartLegendListeners<TContext>;
    /** Configuration for the pagination controls. */
    pagination?: AgChartLegendPaginationOptions;
    /** Set to `true` to prevent the last visible series from being toggled hidden. */
    preventHidingAll?: boolean;
    /** Set to `false` to turn off toggling of the series visibility in the chart when a legend item is clicked. */
    toggleSeries?: boolean;
}

export interface AgChartLegendPaginationOptions {
    /** Configuration for the pagination buttons. */
    marker?: AgPaginationMarkerOptions;
    /** Configuration for pagination buttons when a button is active. */
    activeStyle?: AgPaginationMarkerStyle;
    /** Configuration for pagination buttons when a button is inactive. */
    inactiveStyle?: AgPaginationMarkerStyle;
    /** Configuration for pagination buttons when a button is hovered over. */
    highlightStyle?: AgPaginationMarkerStyle;
    /** Configuration for the pagination label. */
    label?: AgPaginationLabelOptions;
}

export interface AgPaginationMarkerOptions {
    /** The size in pixels of the pagination buttons. */
    size?: PixelSize;
    /** If set, overrides the marker shape for the pagination buttons. If not set, the pagination buttons will default to the `'triangle'` marker shape. */
    shape?: AgMarkerShape;
    /** The inner padding in pixels between a pagination button and the pagination label. A number applies uniform padding; an object sets each side. */
    padding?: Padding;
}

export interface AgPaginationMarkerStyle {
    /** The fill colour to use for the pagination button markers. A colour string, or an object for a gradient, pattern, or image fill. */
    fill?: AgColorType;
    /** Opacity of the pagination buttons. */
    fillOpacity?: Opacity;
    /** The colour to use for the button strokes. */
    stroke?: AgCssColorOrRef;
    /** The width in pixels of the button strokes. */
    strokeWidth?: PixelSize;
    /** Opacity of the button strokes. */
    strokeOpacity?: Opacity;
}

export interface AgPaginationLabelOptions {
    /** The colour of the text. A colour string, or a theme-colour reference object. */
    color?: AgCssColorOrRef;
    /** The font style to use for the pagination label. */
    fontStyle?: FontStyle;
    /** The font weight to use for the pagination label. */
    fontWeight?: FontWeight;
    /** The font size in pixels to use for the pagination label. */
    fontSize?: FontSize;
    /** The font family to use for the pagination label. A single family name, or an array of names used as fallbacks. */
    fontFamily?: FontFamilyFull;
}

export interface AgInitialStateLegendOptions {
    /** Series or item id */
    seriesId?: string;
    /** Legend item id - usually yKey value for cartesian series. */
    itemId?: string;
    /** Whether the legend item is currently enabled or not. */
    visible: boolean;
    /** Human-readable description of the y-values. If supplied, matching items with the same value will be toggled together. */
    legendItemName?: string;
}
