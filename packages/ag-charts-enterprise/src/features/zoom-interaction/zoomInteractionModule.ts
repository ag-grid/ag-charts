import { VERSION } from 'ag-charts-community';
import type { PluginModuleDefinition } from 'ag-charts-core';

import { AxisInteractionModule } from '../axis-interaction/axisInteractionModule';
import { ZoomInteraction } from './zoomInteraction';

export const ZoomInteractionModule: PluginModuleDefinition<never> = {
    type: 'plugin',
    name: 'zoom-base',
    version: VERSION,
    dependencies: [AxisInteractionModule],
    create: (ctx) => new ZoomInteraction(ctx),
};
