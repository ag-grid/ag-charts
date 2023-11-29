import type { CssColor, FontFamily, FontSize, FontStyle, FontWeight, MarkerShape, Opacity, PixelSize } from './types';
export type AgChartLegendPosition = 'top' | 'right' | 'bottom' | 'left';
export type AgChartLegendOrientation = 'horizontal' | 'vertical';
export interface AgChartLegendMarkerOptions {
    /** The size in pixels of the markers in the legend. */
    size?: PixelSize;
    /** If set, overrides the marker shape from the series and the legend will show the specified marker shape instead. If not set, will use a marker shape matching the shape from the series, or fall back to `'square'` if there is none. */
    shape?: MarkerShape;
    /** The padding in pixels between a legend marker and the corresponding label. */
    padding?: PixelSize;
    /** The width in pixels of the stroke for markers in the legend. */
    strokeWidth?: PixelSize;
}
export interface AgChartLegendLabelFormatterParams {
    seriesId: string;
    itemId: any;
    value: string;
}
export interface AgChartLegendLabelOptions {
    /** If the label text exceeds the maximum length, it will be truncated and an ellipsis will be appended to indicate this. */
    maxLength?: number;
    /** The colour of the text. */
    color?: CssColor;
    /** The font style to use for the legend. */
    fontStyle?: FontStyle;
    /** The font weight to use for the legend. */
    fontWeight?: FontWeight;
    /** The font size in pixels to use for the legend. */
    fontSize?: FontSize;
    /** The font family to use for the legend. */
    fontFamily?: FontFamily;
    /** Function used to render legend labels. Where `id` is a series ID, `itemId` is component ID within a series, such as a field name or an item index. */
    formatter?: (params: AgChartLegendLabelFormatterParams) => string;
}
export interface AgChartLegendItemOptions {
    /** Configuration for the legend markers. */
    marker?: AgChartLegendMarkerOptions;
    /** Configuration for the legend labels. */
    label?: AgChartLegendLabelOptions;
    /** Used to constrain the width of legend items. */
    maxWidth?: PixelSize;
    /** The horizontal spacing in pixels to use between legend items. */
    paddingX?: PixelSize;
    /** The vertical spacing in pixels to use between legend items. */
    paddingY?: PixelSize;
    /** Set to `false` to turn off toggling of the series visibility in the chart when the legend item is clicked. */
    toggleSeriesVisible?: boolean;
}
export interface AgChartLegendEvent<T extends string> {
    type: T;
    /** Series id */
    seriesId: string;
    /** Legend item id - usually yKey value for cartesian series. */
    itemId: string;
    /** Whether the legend item is currently enabled or not. */
    enabled: boolean;
}
export interface AgChartLegendClickEvent extends AgChartLegendEvent<'click'> {
}
export interface AgChartLegendDoubleClickEvent extends AgChartLegendEvent<'dblclick'> {
}
export interface AgChartLegendListeners {
    /** The listener to call when a legend item is clicked. */
    legendItemClick?: (event: AgChartLegendClickEvent) => void;
    /** The listener to call when a legend item is double clicked. */
    legendItemDoubleClick?: (event: AgChartLegendDoubleClickEvent) => void;
}
export interface AgChartLegendOptions {
    /** Whether to show the legend. By default, the chart displays a legend when there is more than one series present. */
    enabled?: boolean;
    /** Where the legend should show in relation to the chart. */
    position?: AgChartLegendPosition;
    /** How the legend items should be arranged. */
    orientation?: AgChartLegendOrientation;
    /** Used to constrain the width of the legend. */
    maxWidth?: PixelSize;
    /** Used to constrain the height of the legend. */
    maxHeight?: PixelSize;
    /** The spacing in pixels to use outside the legend. */
    spacing?: PixelSize;
    /** Configuration for the legend items that consist of a marker and a label. */
    item?: AgChartLegendItemOptions;
    /** Reverse the display order of legend items if `true`. */
    reverseOrder?: boolean;
    /** Optional callbacks for specific legend-related events. */
    listeners?: AgChartLegendListeners;
    /** Configuration for the pagination controls. */
    pagination?: AgChartLegendPaginationOptions;
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
    shape?: MarkerShape;
    /** The inner padding in pixels between a pagination button and the pagination label. */
    padding?: PixelSize;
}
export interface AgPaginationMarkerStyle {
    /** The fill colour to use for the pagination button markers. */
    fill?: CssColor;
    /** Opacity of the pagination buttons. */
    fillOpacity?: Opacity;
    /** The colour to use for the button strokes. */
    stroke?: CssColor;
    /** The width in pixels of the button strokes. */
    strokeWidth?: PixelSize;
    /** Opacity of the button strokes. */
    strokeOpacity?: Opacity;
}
export interface AgPaginationLabelOptions {
    /** The colour of the text. */
    color?: CssColor;
    /** The font style to use for the pagination label. */
    fontStyle?: FontStyle;
    /** The font weight to use for the pagination label. */
    fontWeight?: FontWeight;
    /** The font size in pixels to use for the pagination label. */
    fontSize?: FontSize;
    /** The font family to use for the pagination label. */
    fontFamily?: FontFamily;
}
