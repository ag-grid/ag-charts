export interface AgPriceVolumePreset {
    /** Series type used for the OHLC data.
     *
     *  Default: `'candlestick'`
     */
    chartType?: 'candlestick' | 'hollow-candlestick' | 'ohlc' | 'line' | 'step-line' | 'range-area';
    /** The key used to retrieve x-values from the data.
     *
     * Default: `'date'`
     */
    xKey?: string;
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
     */
    rangeToolbar?: boolean;
    /** Whether to show the status bar.
     *
     * Default: `true`
     */
    statusBar?: boolean;
    /** Whether Annotations are enabled.
     *
     * Default: `true`
     */
    annotations?: boolean;
    /** Whether Zoom is enabled.
     *
     * Default: `true`
     */
    zoom?: boolean;
    /** Whether ChartTypes is enabled.
     *
     * Default: `true`
     */
    seriesTypes?: boolean;
}

export type AgFinancialChartPresets = AgPriceVolumePreset;

export type Preset = AgFinancialChartPresets;
