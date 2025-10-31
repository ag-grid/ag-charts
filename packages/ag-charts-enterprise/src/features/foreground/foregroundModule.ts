import type { PluginModuleDefinition } from 'ag-charts-core';

import { VERSION } from '../../../../ag-charts-community/src/version';
import { Foreground } from './foreground';

export const ForegroundModule: PluginModuleDefinition<never> = {
    type: 'plugin',
    name: 'foreground',
    enterprise: true,
    version: VERSION,

    create: (ctx) => new Foreground(ctx),
};
