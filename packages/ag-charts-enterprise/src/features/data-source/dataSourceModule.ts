import type { _ModuleSupport } from 'ag-charts-community';

import { DataSource } from './dataSource';

export const DataSourceModule: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'dataSource',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'hierarchy', 'polar', 'topology'],
    instanceConstructor: DataSource,
    themeTemplate: {
        dataSource: { enabled: false },
    },
};
