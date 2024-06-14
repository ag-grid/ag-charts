import type { AgChartOptions, AgFinancialChartOptions, Preset } from 'ag-charts-types';

import { candlestickVolumePreset } from './candlestickVolumePreset';

export const PRESETS: { [K in Preset['type']]: (p: Preset & { type: K }) => AgChartOptions } = {
    'candlestick-volume': candlestickVolumePreset,
};

export function isAgFinancialChartOptions(x: any): x is AgFinancialChartOptions {
    const { type } = x;
    return typeof type === 'string' && PRESETS[type as Preset['type']] != null;
}
