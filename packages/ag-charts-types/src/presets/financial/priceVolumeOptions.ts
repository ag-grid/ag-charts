import type { AgSelectionClickMode, AgSelectionStyleOptions } from '../../chart/selectionOptions';
import type { CssColor, DatumDefault, Opacity, PixelSize, Ratio } from '../../chart/types';
import type { TextOptions, Toggleable } from '../../series/cartesian/commonOptions';

export type AgPriceVolumeChartType =
    'candlestick' | 'hollow-candlestick' | 'ohlc' | 'line' | 'step-line' | 'hlc' | 'high-low';

export interface AgPriceVolumePreset {
    /** Series type used for the OHLC data.
     *
     *  Default: `'candlestick'`
     */
    chartType?: AgPriceVolumeChartType;
    /** The key used to retrieve x-values from the data.
     *
     * Default: `'date'`
     */
    dateKey?: string;
    /** The key used to retrieve 'open' values from the data.
     *
     * Default: `'open'`
     */
    openKey?: string;
    /** The key used to retrieve 'high' values from the data.
     *
     * Default: `'high'`
     */
    highKey?: string;
    /** The key used to retrieve 'low' values from the data.
     *
     * Default: `'low'`
     */
    lowKey?: string;
    /** The key used to retrieve 'close' values from the data.
     *
     *  Default: `'close'`
     */
    closeKey?: string;
    /** The key used to retrieve 'volume' values from the data.
     *
     * Default: `'volume'`
     */
    volumeKey?: string;
    /** Whether to show the Navigator and mini-chart beneath the main chart.
     *
     * Default: `false`
     */
    navigator?: boolean;
    /** Whether to show the volume series at the bottom of the chart.
     *
     *  If set to `false`, no volume data is required.
     *
     * Default: `true`
     */
    volume?: boolean;
    /** Configuration for a Volume Profile, showing the traded volume at each price level as horizontal bars against the price axis. */
    volumeProfile?: AgVolumeProfileOptions;
    /** The height of each Volume Profile price level, in price units.
     *
     * If not set, the smallest gap between the prices in `volumeProfile.data` is used.
     */
    tickSize?: number;
    /** Whether to show the range buttons.
     *
     * Default: `true`
     */
    rangeButtons?: boolean;
    /** Whether to show the status bar.
     *
     * Default: `true`
     */
    statusBar?: boolean;
    /** Whether the toolbar is enabled.
     *
     * Default: `true`
     */
    toolbar?: boolean;
    /** Whether Zoom is enabled.
     *
     * Default: `true`
     */
    zoom?: boolean;
    /** Whether to enable chart synchronization.
     *
     * Default: `false`
     */
    sync?: boolean;
}

export interface AgVolumeProfileOptions extends Toggleable {
    /** The price levels to display, supplied separately from the chart's own `data`. */
    data: DatumDefault[];
    /** The key used to retrieve the price of each level from the data.
     *
     * Default: `'price'`
     */
    priceKey?: string;
    /** The key used to retrieve the up volume of each level from the data. */
    upKey: string;
    /** The key used to retrieve the down volume of each level from the data. */
    downKey: string;
    /** The edge of the series area the bars extend from.
     *
     * Default: `'left'`
     */
    placement?: AgVolumeProfilePlacement;
    /** The length of the longest bar, as a ratio of the series area width.
     *
     * Default: `0.5`
     */
    widthRatio?: Ratio;
    /** A fixed-width column showing each level's total volume, set between the price axis and the up and down bars. */
    totalSegment?: AgVolumeProfileTotalSegmentOptions;
    /** Selection of price levels. */
    selection?: AgVolumeProfileSelectionOptions;
}

export interface AgVolumeProfileSelectionOptions extends Toggleable {
    /** `'single'` replaces the selected level with each click; `'multiple'` toggles each clicked level, allowing any set of levels to be selected.
     *
     * Default: `'single'`
     */
    clickMode?: AgSelectionClickMode;
    /** Whether dragging a rectangle across the chart selects every price level it covers. Holding the Ctrl key while dragging adds to the selection instead of replacing it.
     *
     * Default: `false`
     */
    enableDrag?: boolean;
    /** Styling for the up and down segments of a selected level.
     *
     * Default: `{ strokeWidth: 2 }`
     */
    selectedItem?: AgSelectionStyleOptions;
    /** Styling for the up and down segments of the levels that are not selected, while any level is selected.
     *
     * Default: `{ opacity: 0.6 }`
     */
    unselectedItem?: AgSelectionStyleOptions;
    /** Styling for the background drawn behind each selected level. */
    selectedBand?: AgVolumeProfileSelectedBandOptions;
}

export interface AgVolumeProfileSelectedBandOptions {
    /** The fill of the band.
     *
     * Default: the theme's neutral fill
     */
    fill?: CssColor;
    /** The opacity of the band's fill.
     *
     * Default: `0.2`
     */
    fillOpacity?: Opacity;
    /** The colour of the band's outline. */
    stroke?: CssColor;
    /** The width of the band's outline, in pixels.
     *
     * Default: `0`
     */
    strokeWidth?: PixelSize;
    /** An array specifying the length in pixels of alternating dashes and gaps in the band's outline. */
    lineDash?: PixelSize[];
}

export interface AgVolumeProfileTotalSegmentOptions extends Toggleable {
    /** The fill of each level's block.
     *
     * Default: the theme's blue
     */
    fill?: CssColor;
    /** The width of the segment, in pixels. The series area shrinks to make room for it.
     *
     * Default: just wide enough for the widest label, but no less than `minWidth`
     */
    width?: PixelSize;
    /** The least width of the segment, in pixels, when `width` is not set.
     *
     * Default: `60`
     */
    minWidth?: PixelSize;
    /** The label showing each level's total volume. Text too wide for the segment is truncated. */
    label?: AgVolumeProfileTotalSegmentLabelOptions;
}

export interface AgVolumeProfileTotalSegmentLabelOptions extends Toggleable, TextOptions {
    /** A function that converts a level's total volume into the text to display. Without one, the value is abbreviated with a suffix, such as `1.2K` or `3.4M`. */
    formatter?: (params: AgVolumeProfileTotalSegmentLabelFormatterParams) => string;
}

export interface AgVolumeProfileTotalSegmentLabelFormatterParams {
    /** The level's total volume. */
    value: number;
    /** The level's price. */
    price: unknown;
    /** The grouped level the total was read from. */
    datum: DatumDefault;
}

type AgVolumeProfilePlacement = 'left' | 'right';
