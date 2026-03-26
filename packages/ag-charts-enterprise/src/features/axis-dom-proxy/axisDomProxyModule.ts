import { VERSION } from 'ag-charts-community';
import type { PluginModuleDefinition } from 'ag-charts-core';

import { AxisDOMProxy } from './axisDomProxy';

export const AxisDOMProxyModule: PluginModuleDefinition<never> = {
    type: 'plugin',
    name: 'axis-dom-proxy',
    version: VERSION,
    create: (ctx) => new AxisDOMProxy(ctx),
};
