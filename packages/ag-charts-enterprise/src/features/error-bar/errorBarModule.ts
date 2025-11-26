import { type AgErrorBarOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesPluginModuleDefinition } from 'ag-charts-core';

import { ErrorBars } from './errorBar';

export const ErrorBarsModule: SeriesPluginModuleDefinition<AgErrorBarOptions> = {
    type: 'series:plugin',
    name: 'errorBar',
    chartType: 'cartesian',
    seriesTypes: ['bar', 'line', 'scatter'],
    enterprise: true,
    version: VERSION,

    options: _ModuleSupport.errorBarOptionsDefs,
    themeTemplate: {
        visible: true,
        stroke: { $ref: 'foregroundColor' },
        strokeWidth: 1,
        strokeOpacity: 1,
        cap: {
            lengthRatio: {
                $if: [{ $eq: [{ $path: '../../type' }, 'bar'] }, 0.3, 1],
            },
        },
    },

    create: (ctx) => new ErrorBars(ctx),
};
