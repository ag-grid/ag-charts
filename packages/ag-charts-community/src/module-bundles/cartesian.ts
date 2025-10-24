import type { ModuleDefinition } from 'ag-charts-core';

import { BackgroundModule } from '../chart/background/backgroundModule';
import { CartesianChartModule } from '../chart/cartesianChartModule';
import { LegendModule } from '../chart/legend/legendModule';
import { SeriesAreaModule } from '../chart/series-area/seriesAreaModule';
import { AreaSeriesModule } from '../chart/series/cartesian/areaSeriesModule';
import { BarSeriesModule } from '../chart/series/cartesian/barSeriesModule';
import { BubbleSeriesModule } from '../chart/series/cartesian/bubbleSeriesModule';
import { HistogramSeriesModule } from '../chart/series/cartesian/histogramSeriesModule';
import { LineSeriesModule } from '../chart/series/cartesian/lineSeriesModule';
import { ScatterSeriesModule } from '../chart/series/cartesian/scatterSeriesModule';
import { LocaleModule } from '../locale/localeModule';
import { CategoryAxisModule } from '../module/axis-modules/categoryAxisModule';
import { GroupedCategoryAxisModule } from '../module/axis-modules/groupedCategoryAxisModule';
import { LogAxisModule } from '../module/axis-modules/logAxisModule';
import { NumberAxisModule } from '../module/axis-modules/numberAxisModule';
import { TimeAxisModule } from '../module/axis-modules/timeAxisModule';
import { UnitTimeAxisModule } from '../module/axis-modules/unitTimeAxisModule';

export const AllCartesianCommunityModules: ModuleDefinition[] = [
    CartesianChartModule,
    NumberAxisModule,
    LogAxisModule,
    TimeAxisModule,
    CategoryAxisModule,
    GroupedCategoryAxisModule,
    UnitTimeAxisModule,
    AreaSeriesModule,
    BarSeriesModule,
    BubbleSeriesModule,
    HistogramSeriesModule,
    LineSeriesModule,
    ScatterSeriesModule,
    SeriesAreaModule,
    BackgroundModule,
    LegendModule,
    LocaleModule,
];
