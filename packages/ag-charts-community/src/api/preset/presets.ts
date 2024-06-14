import type { AgChartOptions, AgFinancialChartOptions, Preset } from 'ag-charts-types';

import { candlestickVolumePreset } from './candlestickVolumePreset';

export const PRESETS: { [K in Preset['type']]: (p: Preset & { type: K }) => AgChartOptions } = {
    'candlestick-volume': candlestickVolumePreset,
};

export function isAgFinancialChartOptions(x: any): x is AgFinancialChartOptions {
    return x.type != null && PRESETS[x.type] != null;
}
