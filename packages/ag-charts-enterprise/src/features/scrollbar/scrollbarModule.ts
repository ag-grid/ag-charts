import { type AgScrollbarOptions, VERSION } from 'ag-charts-community';
import type { PluginModuleDefinition } from 'ag-charts-core';

import { ZoomBaseModule } from '../zoom-base/zoomBaseModule';
import { Scrollbar } from './scrollbar';
import { scrollbarOptionsDef } from './scrollbarOptionsDefs';
import { SCROLLBAR_THEME } from './scrollbarTheme';

export const ScrollbarModule: PluginModuleDefinition<AgScrollbarOptions> = {
    type: 'plugin',
    name: 'scrollbar',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,
    dependencies: [ZoomBaseModule],
    options: scrollbarOptionsDef,
    themeTemplate: SCROLLBAR_THEME,
    create: (ctx) => new Scrollbar(ctx),
};
