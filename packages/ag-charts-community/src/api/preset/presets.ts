import type { AgChartOptions, Preset } from 'ag-charts-types';

import { candlestickVolumePreset } from './candlestickVolumePreset';

export const PRESETS: { [K in Preset['type']]: (p: Preset & { type: K }) => AgChartOptions } = {
    'candlestick-volume': candlestickVolumePreset,
};
