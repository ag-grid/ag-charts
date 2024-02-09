import type { _ModuleSupport } from 'ag-charts-community';

import { MiniChart } from './miniChart';

export const MiniChartModule: _ModuleSupport.Module = {
    type: 'navigator',
    identifier: 'mini-chart',
    optionsKey: 'miniChart',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    instanceConstructor: MiniChart,
    themeTemplate: {},
};
