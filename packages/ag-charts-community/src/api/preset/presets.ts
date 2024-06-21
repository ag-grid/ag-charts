import type { AgFinancialChartOptions, Preset } from 'ag-charts-types';

import { candlestickVolumePreset } from './candlestickVolumePreset';

export const PRESETS = {
    'candlestick-volume': candlestickVolumePreset,
};

export function isAgFinancialChartOptions(x: any): x is AgFinancialChartOptions {
    const { type } = x;
    return typeof type === 'string' && PRESETS[type as Preset['type']] != null;
}
