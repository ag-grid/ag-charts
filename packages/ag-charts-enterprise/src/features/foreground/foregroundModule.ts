import type { PluginModuleDefinition } from 'ag-charts-core';

import { Foreground } from './foreground';

export const ForegroundModule: PluginModuleDefinition<never> = {
    type: 'plugin',
    name: 'foreground',
    enterprise: true,

    create: (ctx) => new Foreground(ctx),
};
