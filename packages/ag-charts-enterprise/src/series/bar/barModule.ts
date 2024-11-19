import { _ModuleSupport } from 'ag-charts-community';

import { BarSeries } from './barSeries';

const { BarSeriesModule } = _ModuleSupport;

export const BarModule: _ModuleSupport.SeriesModule<'bar'> = {
    ...BarSeriesModule,
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'bar',
    moduleFactory: (ctx) => new BarSeries(ctx),
};
