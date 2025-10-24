import { type AgErrorBarOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesPluginModuleDefinition } from 'ag-charts-core';

import { ErrorBars } from './errorBar';

export const ErrorBarsModule: SeriesPluginModuleDefinition<AgErrorBarOptions> = {
    type: 'series:plugin',
    // name: 'error-bars',
    name: 'errorBar',
    // chartType: 'cartesian',
    // seriesTypes: AgErrorBarSupportedSeriesTypes,
    seriesTypes: ['bar', 'line', 'scatter'],
    enterprise: true,

    options: _ModuleSupport.errorBarOptionsDefs,
    themeTemplate: {
        series: {
            errorBar: {
                visible: true,
                stroke: { $ref: 'foregroundColor' },
                strokeWidth: 1,
                strokeOpacity: 1,
                cap: {
                    length: undefined,
                    lengthRatio: undefined,
                },
            },
        },
    },

    create: (ctx) => new ErrorBars(ctx),
};
