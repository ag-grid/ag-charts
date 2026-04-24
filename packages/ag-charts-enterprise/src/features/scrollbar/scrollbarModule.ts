import { type AgScrollbarOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { PluginModuleDefinition } from 'ag-charts-core';

import { ZoomInteractionModule } from '../zoom-interaction/zoomInteractionModule';
import { Scrollbar } from './scrollbar';
import { scrollbarOptionsDef } from './scrollbarOptionsDefs';
import { SCROLLBAR_THEME } from './scrollbarTheme';

export const ScrollbarModule: PluginModuleDefinition<AgScrollbarOptions, _ModuleSupport.ChartRegistry> = {
    type: 'plugin',
    name: 'scrollbar',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,
    dependencies: [ZoomInteractionModule],
    options: scrollbarOptionsDef,
    themeTemplate: SCROLLBAR_THEME,
    create: (ctx) => new Scrollbar(ctx),
    register: (ctx) => {
        if (ctx.has('zoomManager')) return;
        ctx.service('zoomManager', (c) => new _ModuleSupport.ZoomManager(c));
    },
};
