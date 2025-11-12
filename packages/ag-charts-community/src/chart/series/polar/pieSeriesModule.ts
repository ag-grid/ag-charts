import type { SeriesModuleDefinition } from 'ag-charts-core';
import type { AgPieSeriesOptions } from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { VERSION } from '../../../version';
import { PolarChartModule } from '../../polarChartModule';
import { PieSeries } from './pieSeries';
import { pieSeriesOptionsDef } from './pieSeriesOptionsDef';
import { pieTheme } from './pieTheme';

export const PieSeriesModule: SeriesModuleDefinition<AgPieSeriesOptions> = {
    type: 'series',
    name: 'pie',
    chartType: 'polar',
    version: VERSION,
    dependencies: [PolarChartModule],

    options: pieSeriesOptionsDef,
    themeTemplate: pieTheme,

    create: (ctx: ModuleContext) => new PieSeries(ctx),
};
