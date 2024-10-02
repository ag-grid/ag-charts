import type { _ModuleSupport } from 'ag-charts-community';

import { ChartSync } from './chartSync';

export const SyncModule: _ModuleSupport.RootModule = {
    type: 'root',
    optionsKey: 'sync',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    moduleFactory: (ctx) => new ChartSync(ctx),
    themeTemplate: {
        sync: { enabled: false },
    },
};
