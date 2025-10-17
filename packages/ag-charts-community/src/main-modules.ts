import { type ModuleDefinition } from 'ag-charts-core';

import { GaugePresetModule, PriceVolumePresetModule, SparklinePresetModule } from './api/preset/presetModules';
import { BackgroundModule } from './chart/background/backgroundModule';
import { CartesianChartModule } from './chart/cartesianChartModule';
import { StandaloneChartModule, TopologyChartModule } from './chart/enterpriseChartModules';
import { LegendModule } from './chart/legend/legendModule';
import { PolarChartModule } from './chart/polarChartModule';
import { SeriesAreaModule } from './chart/series-area/seriesAreaModule';
import { AreaSeriesModule } from './chart/series/cartesian/areaSeriesModule';
import { BarSeriesModule } from './chart/series/cartesian/barSeriesModule';
import { BubbleSeriesModule } from './chart/series/cartesian/bubbleSeriesModule';
import { HistogramSeriesModule } from './chart/series/cartesian/histogramSeriesModule';
import { LineSeriesModule } from './chart/series/cartesian/lineSeriesModule';
import { ScatterSeriesModule } from './chart/series/cartesian/scatterSeriesModule';
import { DonutSeriesModule } from './chart/series/polar/donutSeriesModule';
import { PieSeriesModule } from './chart/series/polar/pieSeriesModule';
import { LocaleModule } from './locale/localeModule';
import {
    CategoryAxisModule,
    GroupedCategoryAxisModule,
    LogAxisModule,
    NumberAxisModule,
    TimeAxisModule,
    UnitTimeAxisModule,
} from './module/axisModules';

export { ModuleRegistry } from 'ag-charts-core';

/* eslint-disable unicorn/prefer-export-from */
export {
    CartesianChartModule,
    NumberAxisModule,
    LogAxisModule,
    TimeAxisModule,
    UnitTimeAxisModule,
    CategoryAxisModule,
    GroupedCategoryAxisModule,
    AreaSeriesModule,
    BarSeriesModule,
    BubbleSeriesModule,
    HistogramSeriesModule,
    LineSeriesModule,
    ScatterSeriesModule,
    PolarChartModule,
    DonutSeriesModule,
    PieSeriesModule,
    SeriesAreaModule,
    BackgroundModule,
    LegendModule,
    LocaleModule,

    // Enterprise presets
    PriceVolumePresetModule,
    GaugePresetModule,
};

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

export const AllPolarCommunityModules: ModuleDefinition[] = [
    PolarChartModule,
    DonutSeriesModule,
    PieSeriesModule,
    SeriesAreaModule,
    BackgroundModule,
    LegendModule,
    LocaleModule,
];

export const AllCommunityModules: ModuleDefinition[] = [
    ...AllCartesianCommunityModules,
    ...AllPolarCommunityModules,

    // Enterprise placeholders
    StandaloneChartModule,
    TopologyChartModule,

    // Presets
    SparklinePresetModule,
];
