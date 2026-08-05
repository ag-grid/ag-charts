import type { ModuleDefinition } from 'ag-charts-core';

import { BackgroundRegionsModule } from '../chart/background-regions/backgroundRegionsModule';
import { CrossLinesModule } from '../chart/crossline/crossLinesModule';
import { LegendModule } from '../chart/legend/legendModule';
import { LocaleModule } from '../locale/localeModule';
import { AllCartesianAxesModule } from './cartesian-axes';
import { AllCartesianSeriesModule } from './cartesian-series';

export const AllCartesianModule: ModuleDefinition[] = [
    AllCartesianAxesModule,
    AllCartesianSeriesModule,

    BackgroundRegionsModule,
    CrossLinesModule,
    LegendModule,
    LocaleModule,
].flat();
