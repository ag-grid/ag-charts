import type { _ModuleSupport } from 'ag-charts-community';

import { Foreground } from './foreground';

export const ForegroundModule: _ModuleSupport.RootModule = {
    type: 'root',
    optionsKey: 'foreground',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'hierarchy', 'topology', 'flow-proportion', 'standalone', 'gauge'],
    moduleFactory: (ctx) => new Foreground(ctx),
};
