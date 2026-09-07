import { type DynamicContext, type SeriesModuleDefinition } from 'ag-charts-core';
import type { AgPieSeriesOptions } from 'ag-charts-types';

import type { ChartRegistry } from '../../../module/moduleContext';
import { communityModule } from '../../../module/moduleIdentity';
import { VERSION } from '../../../version';
import { PolarChartModule } from '../../polarChartModule';
import { PieSeries } from './pieSeries';
import { pieSeriesOptionsDef } from './pieSeriesOptionsDef';
import { pieTheme } from './pieTheme';

export const PieSeriesModule: SeriesModuleDefinition<AgPieSeriesOptions> = /* #__PURE__ */ communityModule({
    type: 'series',
    name: 'pie',
    chartType: 'polar',
    version: VERSION,
    dependencies: [PolarChartModule],

    options: pieSeriesOptionsDef,
    themeTemplate: pieTheme,

    create: (ctx: DynamicContext<ChartRegistry>) => new PieSeries(ctx),
});
