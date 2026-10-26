import type { ModuleDefinition } from 'ag-charts-core';

import { LegendModule } from '../chart/legend/legendModule';
import { DonutSeriesModule } from '../chart/series/polar/donutSeriesModule';
import { PieSeriesModule } from '../chart/series/polar/pieSeriesModule';
import { StandaloneChartModule } from '../chart/standaloneChartModule';
import { LocaleModule } from '../locale/localeModule';

export const AllPolarModule: ModuleDefinition[] = [
    StandaloneChartModule,
    DonutSeriesModule,
    PieSeriesModule,
    LegendModule,
    LocaleModule,
];
