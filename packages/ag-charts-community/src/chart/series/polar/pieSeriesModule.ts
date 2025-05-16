import type { SeriesModuleDefinition } from 'ag-charts-core';
import type { AgPieSeriesOptions } from 'ag-charts-types';

import type { SeriesModule } from '../../../module/coreModules';
import type { ModuleContext } from '../../../module/moduleContext';
import { PieSeries } from './pieSeries';
import { pieSeriesOptionsDef } from './pieSeriesOptionsDef';
import { pieTheme } from './pieTheme';

export const PieSeriesModule: SeriesModule<'pie'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'community',
    chartTypes: ['polar'],

    identifier: 'pie',
    moduleFactory: (ctx) => new PieSeries(ctx),
    themeTemplate: pieTheme,
};

export const NewPieSeriesModule: SeriesModuleDefinition<AgPieSeriesOptions> = {
    type: 'series',
    name: 'pie',
    chartType: 'polar',

    options: pieSeriesOptionsDef,

    create: (ctx: ModuleContext) => new PieSeries(ctx),
};
