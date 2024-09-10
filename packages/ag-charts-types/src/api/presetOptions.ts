import type { AgLinearGaugeSeriesOptions } from '../series/gauge/linearGaugeOptions';
import type { AgRadialGaugeSeriesOptions } from '../series/gauge/radialGaugeOptions';

/** @deprecated v10.1.0 use 'hlc' instead. */
export type DeprecatedAgPriceVolumeChartType = 'range-area';
export type AgPriceVolumeChartType =
    | 'candlestick'
    | 'hollow-candlestick'
    | 'ohlc'
    | 'line'
    | 'step-line'
    | 'hlc'
    | 'high-low'
    | DeprecatedAgPriceVolumeChartType;

export interface AgPriceVolumePreset {
    /** Series type used for the OHLC data.
     *
     *  Default: `'candlestick'`
     */
    chartType?: AgPriceVolumeChartType;
    /** The key used to retrieve x-values from the data.
     *
     * Default: `'date'`
     *
     * @deprecated v10.1.0 use `dateKey` instead.
     */
    xKey?: string;
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
    /** Whether to show the range toolbar.
     *
     * Default: `true`
     *
     * @deprecated v10.1.0 use `rangeButtons` instead.
     */
    rangeToolbar?: boolean;
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
    /** Whether Annotations are enabled.
     *
     * Default: `true`
     *
     * @deprecated v10.1.0 use `toolbar` instead.
     */
    annotations?: boolean;
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
}

export type AgFinancialChartPresets = AgPriceVolumePreset;

export type AgLinearGaugePreset = AgLinearGaugeSeriesOptions;
export type AgRadialGaugePreset = AgRadialGaugeSeriesOptions;
export type AgGaugePreset = AgLinearGaugePreset | AgRadialGaugePreset;

export type Preset = AgFinancialChartPresets;
