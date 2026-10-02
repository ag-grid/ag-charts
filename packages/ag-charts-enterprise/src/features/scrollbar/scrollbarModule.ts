import { type AgScrollbarOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { PluginModuleDefinition } from 'ag-charts-core';

import { BackgroundRegionsModule } from '../background-regions/backgroundRegionsModule';
import { ZoomInteractionModule } from '../zoom-interaction/zoomInteractionModule';
import { Scrollbar } from './scrollbar';
import { scrollbarOptionsDef } from './scrollbarOptionsDefs';
import { SCROLLBAR_THEME } from './scrollbarTheme';

export const ScrollbarModule: PluginModuleDefinition<AgScrollbarOptions, _ModuleSupport.ChartRegistry> = {
    type: 'plugin',
    name: 'scrollbar',
    chartTypes: ['cartesian'],
    enterprise: true,
    version: VERSION,
    dependencies: [ZoomInteractionModule, BackgroundRegionsModule],
    options: scrollbarOptionsDef,
    themeTemplate: SCROLLBAR_THEME,
    create: (ctx) => new Scrollbar(ctx),
    register: (ctx) => {
        if (ctx.has('viewportManager')) return;
        ctx.service('viewportManager', (c) => new _ModuleSupport.ViewportManager(c));
    },
};
