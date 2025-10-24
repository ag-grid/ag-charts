import type { ModuleDefinition } from 'ag-charts-core';

import { BackgroundModule } from '../chart/background/backgroundModule';
import { LegendModule } from '../chart/legend/legendModule';
import { PolarChartModule } from '../chart/polarChartModule';
import { SeriesAreaModule } from '../chart/series-area/seriesAreaModule';
import { DonutSeriesModule } from '../chart/series/polar/donutSeriesModule';
import { PieSeriesModule } from '../chart/series/polar/pieSeriesModule';
import { LocaleModule } from '../locale/localeModule';

export const AllPolarCommunityModules: ModuleDefinition[] = [
    PolarChartModule,
    DonutSeriesModule,
    PieSeriesModule,
    SeriesAreaModule,
    BackgroundModule,
    LegendModule,
    LocaleModule,
];
