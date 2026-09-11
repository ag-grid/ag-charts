import { VERSION } from 'ag-charts-community';
import type { PluginModuleDefinition } from 'ag-charts-core';

import { AxisInteraction } from './axisInteraction';

export const AxisInteractionModule: PluginModuleDefinition<never> = {
    type: 'plugin',
    name: 'axis-interaction',
    version: VERSION,
    create: (ctx) => new AxisInteraction(ctx),
};
