import { type SeriesModuleDefinition } from 'ag-charts-core';
import type { AgDonutSeriesOptions } from 'ag-charts-types';

import type { SeriesModule } from '../../../module/coreModules';
import type { ModuleContext } from '../../../module/moduleContext';
import { DonutSeries } from './donutSeries';
import { donutSeriesOptionsDef } from './donutSeriesOptionsDef';
import { donutTheme } from './donutTheme';

export const DonutSeriesModule: SeriesModule<'donut'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['polar'],

    identifier: 'donut',
    moduleFactory: (ctx) => new DonutSeries(ctx),
    themeTemplate: donutTheme,
};

export const NewDonutSeriesModule: SeriesModuleDefinition<AgDonutSeriesOptions> = {
    type: 'series',
    name: 'donut',
    chartType: 'polar',

    options: donutSeriesOptionsDef,

    create: (ctx: ModuleContext) => new DonutSeries(ctx),
};
