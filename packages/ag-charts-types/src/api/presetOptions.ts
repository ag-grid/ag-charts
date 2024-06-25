export type AgPriceVolumePreset = {
    chartType?: 'candlestick' | 'hollow-candlestick' | 'ohlc' | 'line' | 'step-line' | 'area' | 'range-area';
    xKey?: string;
    openKey?: string;
    highKey?: string;
    lowKey?: string;
    closeKey?: string;
    volumeKey?: string;

    timeFormat?: string;
};

export type AgFinancialChartPresets = AgPriceVolumePreset;

export type Preset = AgFinancialChartPresets;
