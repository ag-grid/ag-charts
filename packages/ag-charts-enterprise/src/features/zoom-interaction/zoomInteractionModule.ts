import { VERSION } from 'ag-charts-community';
import type { PluginModuleDefinition } from 'ag-charts-core';

import { AxisDOMProxyModule } from '../axis-dom-proxy/axisDomProxyModule';
import { ZoomInteraction } from './zoomInteraction';

export const ZoomInteractionModule: PluginModuleDefinition<never> = {
    type: 'plugin',
    name: 'zoom-base',
    version: VERSION,
    dependencies: [AxisDOMProxyModule],
    create: (ctx) => new ZoomInteraction(ctx),
};
