import type { _ModuleSupport } from 'ag-charts-community';

import { MiniChart } from './miniChart';

export const MiniChartModule: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'miniChart',
    packageType: 'community',
    chartTypes: ['cartesian'],
    instanceConstructor: MiniChart,
    themeTemplate: {
        miniChart: {
            enabled: false,
        },
    },
};
