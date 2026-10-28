import { type ModuleDefinition } from 'ag-charts-core';

import { SparklinePresetModule } from '../api/preset/presetModules';
import { CrossLinesModule } from '../chart/crossline/crossLinesModule';
import { LegendModule } from '../chart/legend/legendModule';
import { AreaSeriesModule } from '../chart/series/cartesian/areaSeriesModule';
import { BarSeriesModule } from '../chart/series/cartesian/barSeriesModule';
import { BubbleSeriesModule } from '../chart/series/cartesian/bubbleSeriesModule';
import { HistogramSeriesModule } from '../chart/series/cartesian/histogramSeriesModule';
import { LineSeriesModule } from '../chart/series/cartesian/lineSeriesModule';
import { ScatterSeriesModule } from '../chart/series/cartesian/scatterSeriesModule';
import { DonutSeriesModule } from '../chart/series/polar/donutSeriesModule';
import { PieSeriesModule } from '../chart/series/polar/pieSeriesModule';
import { StandaloneChartModule } from '../chart/standaloneChartModule';
import { LocaleModule } from '../locale/localeModule';
import { CategoryAxisModule } from '../module/axis-modules/categoryAxisModule';
import { GroupedCategoryAxisModule } from '../module/axis-modules/groupedCategoryAxisModule';
import { LogAxisModule } from '../module/axis-modules/logAxisModule';
import { NumberAxisModule } from '../module/axis-modules/numberAxisModule';
import { TimeAxisModule } from '../module/axis-modules/timeAxisModule';
import { UnitTimeAxisModule } from '../module/axis-modules/unitTimeAxisModule';

export const AllCommunityModule: ModuleDefinition[] = [
    // Cartesian axes
    NumberAxisModule,
    LogAxisModule,
    TimeAxisModule,
    CategoryAxisModule,
    GroupedCategoryAxisModule,
    UnitTimeAxisModule,

    // Cartesian series
    AreaSeriesModule,
    BarSeriesModule,
    BubbleSeriesModule,
    HistogramSeriesModule,
    LineSeriesModule,
    ScatterSeriesModule,

    CrossLinesModule,
    LegendModule,
    LocaleModule,

    // Standalone series
    StandaloneChartModule,
    DonutSeriesModule,
    PieSeriesModule,

    // Presets
    SparklinePresetModule,
];
