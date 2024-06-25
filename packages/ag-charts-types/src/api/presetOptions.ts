export type AgPriceVolumePreset = {
    chartType?: 'candlestick' | 'hollow-candlestick' | 'ohlc' | 'line' | 'step-line' | 'area' | 'range-area';
    xKey?: string;
    openKey?: string;
    highKey?: string;
    lowKey?: string;
    closeKey?: string;
    volumeKey?: string;

    navigator?: boolean;

    volume?: boolean;
    rangeToolbar?: boolean;
    statusBar?: boolean;
    annotations?: boolean;
    zoom?: boolean;
};

export type AgFinancialChartPresets = AgPriceVolumePreset;

export type Preset = AgFinancialChartPresets;
