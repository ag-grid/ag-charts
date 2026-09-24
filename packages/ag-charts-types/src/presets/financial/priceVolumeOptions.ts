import type { DatumDefault, Ratio } from '../../chart/types';

export type AgPriceVolumeChartType =
    | 'candlestick'
    | 'hollow-candlestick'
    | 'ohlc'
    | 'line'
    | 'step-line'
    | 'hlc'
    | 'high-low';

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

export interface AgVolumeProfileOptions {
    /** Whether to show the Volume Profile.
     *
     * Default: `true`
     */
    enabled?: boolean;
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
}

type AgVolumeProfilePlacement = 'left' | 'right';
