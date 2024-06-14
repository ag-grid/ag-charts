export type AgCandlestickVolumePreset = {
    type: 'candlestick-volume';

    xKey?: string;
    openKey?: string;
    highKey?: string;
    lowKey?: string;
    closeKey?: string;
    volumeKey?: string;
};

export type Preset = AgCandlestickVolumePreset;
