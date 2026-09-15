import type { PluginModuleDefinition } from 'ag-charts-core';

import { communityModule } from '../../module/moduleIdentity';
import { VERSION } from '../../version';
import { SeriesArea } from './seriesArea';

export const SeriesAreaModule: PluginModuleDefinition<never> = /* #__PURE__ */ communityModule({
    type: 'plugin',
    name: 'series-area',
    version: VERSION,
    contributes: [],
    create: (ctx) => new SeriesArea(ctx),
});
