import { VERSION } from 'ag-charts-community';
import type { PluginModuleDefinition } from 'ag-charts-core';
import { callback } from 'ag-charts-core';

import { AxisInteraction } from './axisInteraction';

export const AxisInteractionModule: PluginModuleDefinition<never> = {
    type: 'plugin',
    name: 'axis-interaction',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,
    contributes: [
        { path: 'axes[].listeners.click', options: callback },
        { path: 'axes[].listeners.doubleClick', options: callback },
        { path: 'listeners.axisClick', options: callback },
        { path: 'listeners.axisDoubleClick', options: callback },
    ],
    create: (ctx) => new AxisInteraction(ctx),
};
