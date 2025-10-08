import { GaugePresetModule, PriceVolumePresetModule, SparklinePresetModule } from './api/preset/presetModules';
import { CartesianChartModule } from './chart/cartesianChartModule';
import { StandaloneChartModule, TopologyChartModule } from './chart/enterpriseChartModules';
import { PolarChartModule } from './chart/polarChartModule';
import { AreaSeriesModule } from './chart/series/cartesian/areaSeriesModule';
import { BarSeriesModule } from './chart/series/cartesian/barSeriesModule';
import { BubbleSeriesModule } from './chart/series/cartesian/bubbleSeriesModule';
import { HistogramSeriesModule } from './chart/series/cartesian/histogramSeriesModule';
import { LineSeriesModule } from './chart/series/cartesian/lineSeriesModule';
import { ScatterSeriesModule } from './chart/series/cartesian/scatterSeriesModule';
import { DonutSeriesModule } from './chart/series/polar/donutSeriesModule';
import { PieSeriesModule } from './chart/series/polar/pieSeriesModule';
import {
    CategoryAxisModule,
    GroupedCategoryAxisModule,
    LogAxisModule,
    NumberAxisModule,
    TimeAxisModule,
    UnitTimeAxisModule,
} from './module/axisModules';

export { ModuleRegistry } from 'ag-charts-core';

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
};

export const AllCartesianCommunityModules = [
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
];

export const AllPolarCommunityModules = [PolarChartModule, DonutSeriesModule, PieSeriesModule];

export const AllCommunityModules = [
    ...AllCartesianCommunityModules,
    ...AllPolarCommunityModules,

    // Enterprise placeholders
    StandaloneChartModule,
    TopologyChartModule,

    // Presets
    PriceVolumePresetModule,
    GaugePresetModule,
    SparklinePresetModule,
];
