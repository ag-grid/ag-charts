import { type PluginModuleDefinition, callback } from 'ag-charts-core';
import type { AgDataSourceOptions } from 'ag-charts-types';

import { DataSource } from './dataSource';

export const DataSourceModule: PluginModuleDefinition<AgDataSourceOptions> = {
    type: 'plugin',
    name: 'dataSource',
    enterprise: true,

    options: {
        getData: callback,
    },

    create: (ctx) => new DataSource(ctx),
};
