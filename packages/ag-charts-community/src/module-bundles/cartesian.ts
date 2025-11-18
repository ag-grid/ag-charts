import type { ModuleDefinition } from 'ag-charts-core';

import { LegendModule } from '../chart/legend/legendModule';
import { LocaleModule } from '../locale/localeModule';
import { AllCartesianAxesModule } from './cartesian-axes';
import { AllCartesianSeriesModule } from './cartesian-series';

export const AllCartesianModule: ModuleDefinition[] = [
    AllCartesianAxesModule,
    AllCartesianSeriesModule,

    LegendModule,
    LocaleModule,
].flat();
