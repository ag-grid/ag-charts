import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { ChartToolbar } from './chartToolbar';

export const ChartToolbarModule: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'chartToolbar',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    dependencies: ['toolbar'],
    moduleFactory: (ctx) => new ChartToolbar(ctx),
    themeTemplate: {
        chartToolbar: {},
    },
};
