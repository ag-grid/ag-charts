import type { _ModuleSupport } from 'ag-charts-community';

import { SharedToolbar } from './sharedToolbar';

export const SharedToolbarModule: _ModuleSupport.ContextModule = {
    type: 'context',
    contextKey: 'sharedToolbar',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    moduleFactory: (ctx) => new SharedToolbar(ctx),
};
