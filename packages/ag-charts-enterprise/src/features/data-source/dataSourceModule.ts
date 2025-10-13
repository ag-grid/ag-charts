import { type PluginModuleDefinition, boolean, callback, positiveNumber, undocumented } from 'ag-charts-core';
import type { AgDataSourceOptions } from 'ag-charts-types';

import { DataSource } from './dataSource';

export const DataSourceModule: PluginModuleDefinition<
    AgDataSourceOptions & {
        requestThrottle: number;
        updateThrottle: number;
        updateDuringInteraction: boolean;
    }
> = {
    type: 'plugin',
    name: 'dataSource',
    enterprise: true,

    options: {
        getData: callback,
        requestThrottle: undocumented(positiveNumber),
        updateThrottle: undocumented(positiveNumber),
        updateDuringInteraction: undocumented(boolean),
    },

    create: (ctx) => new DataSource(ctx),
};
