import type { SeriesModuleDefinition } from 'ag-charts-core';
import type { AgDonutSeriesOptions } from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { VERSION } from '../../../version';
import { PolarChartModule } from '../../polarChartModule';
import { DonutSeries } from './donutSeries';
import { donutSeriesOptionsDef } from './donutSeriesOptionsDef';
import { donutTheme } from './donutTheme';

export const DonutSeriesModule: SeriesModuleDefinition<AgDonutSeriesOptions> = {
    type: 'series',
    name: 'donut',
    chartType: 'polar',
    version: VERSION,
    dependencies: [PolarChartModule],

    options: donutSeriesOptionsDef,
    themeTemplate: donutTheme,

    create: (ctx: ModuleContext) => new DonutSeries(ctx),
};
