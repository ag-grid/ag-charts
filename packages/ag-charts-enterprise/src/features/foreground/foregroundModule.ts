import { VERSION } from 'ag-charts-community';
import type { PluginModuleDefinition } from 'ag-charts-core';

import { Foreground } from './foreground';

export const ForegroundModule: PluginModuleDefinition<never> = {
    type: 'plugin',
    name: 'foreground',
    enterprise: true,
    version: VERSION,

    create: (ctx) => new Foreground(ctx),
};
