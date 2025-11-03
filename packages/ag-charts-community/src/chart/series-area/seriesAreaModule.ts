import { type PluginModuleDefinition, boolean, borderOptionsDef, number, padding } from 'ag-charts-core';
import type { AgSeriesAreaOptions } from 'ag-charts-types';

import { VERSION } from '../../version';
import { SeriesArea } from './seriesArea';

export const SeriesAreaModule: PluginModuleDefinition<AgSeriesAreaOptions> = {
    type: 'plugin',
    name: 'seriesArea',
    version: VERSION,

    options: {
        border: borderOptionsDef,
        clip: boolean,
        cornerRadius: number,
        padding: padding,
    },

    create: (ctx) => new SeriesArea(ctx),
};
