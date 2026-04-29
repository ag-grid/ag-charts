import type { ModuleDefinition } from 'ag-charts-core';

import { CrossLinesModule } from '../chart/crossline/crossLinesModule';
import { LegendModule } from '../chart/legend/legendModule';
import { PolarChartModule } from '../chart/polarChartModule';
import { DonutSeriesModule } from '../chart/series/polar/donutSeriesModule';
import { PieSeriesModule } from '../chart/series/polar/pieSeriesModule';
import { LocaleModule } from '../locale/localeModule';

export const AllPolarModule: ModuleDefinition[] = [
    PolarChartModule,
    DonutSeriesModule,
    PieSeriesModule,
    CrossLinesModule,
    LegendModule,
    LocaleModule,
];
