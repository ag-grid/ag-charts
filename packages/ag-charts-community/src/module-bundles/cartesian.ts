import type { ModuleDefinition } from 'ag-charts-core';

import { BackgroundModule } from '../chart/background/backgroundModule';
import { LegendModule } from '../chart/legend/legendModule';
import { SeriesAreaModule } from '../chart/series-area/seriesAreaModule';
import { LocaleModule } from '../locale/localeModule';
import { AllCartesianAxesModule } from './cartesian-axes';
import { AllCartesianSeriesModule } from './cartesian-series';

export const AllCartesianModule: ModuleDefinition[] = [
    AllCartesianAxesModule,
    AllCartesianSeriesModule,

    SeriesAreaModule,
    BackgroundModule,
    LegendModule,
    LocaleModule,
].flat();
