import type { PluginModuleDefinition } from 'ag-charts-core';

import type { ChartRegistry } from '../../module/moduleContext';
import { communityModule } from '../../module/moduleIdentity';
import { VERSION } from '../../version';
import { SeriesArea } from './seriesArea';

export const SeriesAreaModule: PluginModuleDefinition<never, ChartRegistry> = /* #__PURE__ */ communityModule({
    type: 'plugin',
    name: 'series-area',
    version: VERSION,
    // Exposed as a service so that modules rendering inside the series area can attach to it.
    register: (ctx) => {
        if (ctx.has('seriesArea')) return;
        ctx.service('seriesArea', (c) => new SeriesArea(c));
    },
    create: (ctx) => ctx.seriesArea!,
});
