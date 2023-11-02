import type { _ModuleSupport } from 'ag-charts-community';

import { BulletSeries } from './bulletSeries';

export const BulletModule: _ModuleSupport.SeriesModule<'bullet'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    identifier: 'bullet',
    instanceConstructor: BulletSeries,
    seriesDefaults: {},
    themeTemplate: {},
};
