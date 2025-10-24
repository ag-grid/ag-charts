import type { SeriesModuleDefinition } from 'ag-charts-core';
import type { AgDonutSeriesOptions } from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { DonutSeries } from './donutSeries';
import { donutSeriesOptionsDef } from './donutSeriesOptionsDef';
import { donutTheme } from './donutTheme';

export const DonutSeriesModule: SeriesModuleDefinition<AgDonutSeriesOptions> = {
    type: 'series',
    name: 'donut',
    chartType: 'polar',

    options: donutSeriesOptionsDef,
    themeTemplate: donutTheme,

    create: (ctx: ModuleContext) => new DonutSeries(ctx),
};
