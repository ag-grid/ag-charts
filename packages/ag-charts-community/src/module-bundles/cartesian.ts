import type { ModuleDefinition } from 'ag-charts-core';

import { CrossLinesModule } from '../chart/crossline/crossLinesModule';
import { LegendModule } from '../chart/legend/legendModule';
import { LocaleModule } from '../locale/localeModule';
import { AllCartesianAxesModule } from './cartesian-axes';
import { AllCartesianSeriesModule } from './cartesian-series';

/** @deprecated v14.3.0 Register `AllCommunityModule`, or the individual modules you need. */
export const AllCartesianModule: ModuleDefinition[] = [
    AllCartesianAxesModule,
    AllCartesianSeriesModule,

    CrossLinesModule,
    LegendModule,
    LocaleModule,
].flat();
