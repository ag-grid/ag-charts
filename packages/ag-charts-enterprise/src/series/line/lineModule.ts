import { _ModuleSupport } from 'ag-charts-community';
import { _Theme } from 'ag-charts-community';

import { LineSeries } from './lineSeries';

const { LineSeriesModule } = _ModuleSupport;

export const LineModule: _ModuleSupport.SeriesModule<'line'> = {
    ...LineSeriesModule,
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'line',
    moduleFactory: (ctx) => new LineSeries(ctx),
};
