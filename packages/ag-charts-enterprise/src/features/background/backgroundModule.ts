import type { _ModuleSupport } from 'ag-charts-community';

import { Background } from './background';

export const BackgroundModule: _ModuleSupport.RootModule = {
    type: 'root',
    optionsKey: 'background',
    packageType: 'enterprise',
    chartTypes: ['cartesian', 'polar', 'topology', 'flow-proportion', 'standalone'],
    moduleFactory: (ctx) => new Background(ctx),
};
