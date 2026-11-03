import type { ModuleDefinition } from 'ag-charts-core';

import { LegendModule } from '../chart/legend/legendModule';
import { PolarChartModule } from '../chart/polarChartModule';
import { DonutSeriesModule } from '../chart/series/polar/donutSeriesModule';
import { PieSeriesModule } from '../chart/series/polar/pieSeriesModule';
import { LocaleModule } from '../locale/localeModule';

/** @deprecated v14.3.0 Register `AllCommunityModule`, or the individual modules you need. */
export const AllPolarModule: ModuleDefinition[] = [
    PolarChartModule,
    DonutSeriesModule,
    PieSeriesModule,
    LegendModule,
    LocaleModule,
];
