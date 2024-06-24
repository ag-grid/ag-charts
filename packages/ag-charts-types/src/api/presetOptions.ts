export type AgPriceVolumePreset = {
    chartType?: 'candlestick' | 'ohlc' | 'line';
    xKey?: string;
    openKey?: string;
    highKey?: string;
    lowKey?: string;
    closeKey?: string;
    volumeKey?: string;
};

export type AgFinancialChartPresets = AgPriceVolumePreset;

export type Preset = AgFinancialChartPresets;
