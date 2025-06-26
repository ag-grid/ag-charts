import type { _ModuleSupport } from 'ag-charts-community';

import { DataSource } from './dataSource';

export const DataSourceModule: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'dataSource',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'topology', 'standalone'],
    moduleFactory: (ctx) => new DataSource(ctx),
    themeTemplate: {
        dataSource: { enabled: false },
    },
};
