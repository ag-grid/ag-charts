import { AgCharts } from 'ag-charts-community';
import type { AgChartInstance } from 'ag-charts-types';

import { getStockData } from './stockData';
import { getRegularVolumeProfile } from './volumeProfileData';

export type PresetName = 'linear gauge' | 'radial gauge' | 'quadrant' | 'price-volume' | 'volume-profile';

type PresetFactory = (options: Record<string, unknown>) => AgChartInstance<any>;

// Bespoke: each preset has its own `AgCharts.create*` entrypoint, which the shared factories do not call.
export const PRESET_FACTORIES: Record<PresetName, PresetFactory> = {
    'linear gauge': (options) => AgCharts.createGauge({ ...options, type: 'linear-gauge', value: 50 }),
    'radial gauge': (options) => AgCharts.createGauge({ ...options, type: 'radial-gauge', value: 50 }),
    quadrant: (options) =>
        AgCharts.createQuadrantChart({
            ...options,
            data: [
                { x: -1, y: -1 },
                { x: 1, y: 1 },
            ],
            xKey: 'x',
            yKey: 'y',
        }),
    'price-volume': (options) => AgCharts.createFinancialChart({ ...options, data: getStockData().slice(0, 20) }),
    'volume-profile': (options) =>
        AgCharts.createVolumeProfileChart({
            ...options,
            data: getRegularVolumeProfile(),
            upKey: 'upVolume',
            downKey: 'downVolume',
        }),
};
