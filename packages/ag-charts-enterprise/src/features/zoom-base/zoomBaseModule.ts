import { VERSION } from 'ag-charts-community';
import type { PluginModuleDefinition } from 'ag-charts-core';

import { ZoomBase } from './zoomBase';

export const ZoomBaseModule: PluginModuleDefinition<never> = {
    type: 'plugin',
    name: 'zoom-base',
    version: VERSION,
    create: (ctx) => new ZoomBase(ctx),
};
