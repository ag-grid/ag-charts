// Entry point to implement and test our tree-shaking abilities
import { GaugePresetModule, PriceVolumePresetModule, SparklinePresetModule } from './api/preset/presetModules';
import { CartesianChartModule } from './chart/cartesianChartModule';
import { StandaloneChartModule, TopologyChartModule } from './chart/enterpriseChartModules';
import { PolarChartModule } from './chart/polarChartModule';
import { NewAreaSeriesModule } from './chart/series/cartesian/areaSeriesModule';
import { NewBarSeriesModule } from './chart/series/cartesian/barSeriesModule';
import { NewBubbleSeriesModule } from './chart/series/cartesian/bubbleSeriesModule';
import { NewHistogramSeriesModule } from './chart/series/cartesian/histogramSeriesModule';
import { NewLineSeriesModule } from './chart/series/cartesian/lineSeriesModule';
import { NewScatterSeriesModule } from './chart/series/cartesian/scatterSeriesModule';
import { NewDonutSeriesModule } from './chart/series/polar/donutSeriesModule';
import { NewPieSeriesModule } from './chart/series/polar/pieSeriesModule';
import {
    CategoryAxisModule,
    GroupedCategoryAxisModule,
    LogAxisModule,
    NumberAxisModule,
    TimeAxisModule,
    UnitTimeAxisModule,
} from './module/axisModules';

export { ModuleRegistry } from 'ag-charts-core';

export const AllCartesianCommunityModules = [
    CartesianChartModule,
    NumberAxisModule,
    LogAxisModule,
    TimeAxisModule,
    CategoryAxisModule,
    GroupedCategoryAxisModule,
    UnitTimeAxisModule,
    NewAreaSeriesModule,
    NewBarSeriesModule,
    NewBubbleSeriesModule,
    NewHistogramSeriesModule,
    NewLineSeriesModule,
    NewScatterSeriesModule,
];

export const AllPolarCommunityModules = [PolarChartModule, NewDonutSeriesModule, NewPieSeriesModule];

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

export { CartesianChartModule } from './chart/cartesianChartModule';
export {
    NumberAxisModule,
    LogAxisModule,
    TimeAxisModule,
    UnitTimeAxisModule,
    CategoryAxisModule,
    GroupedCategoryAxisModule,
} from './module/axisModules';
export { NewAreaSeriesModule } from './chart/series/cartesian/areaSeriesModule';
export { NewBarSeriesModule } from './chart/series/cartesian/barSeriesModule';
export { NewBubbleSeriesModule } from './chart/series/cartesian/bubbleSeriesModule';
export { NewHistogramSeriesModule } from './chart/series/cartesian/histogramSeriesModule';
export { NewLineSeriesModule } from './chart/series/cartesian/lineSeriesModule';
export { NewScatterSeriesModule } from './chart/series/cartesian/scatterSeriesModule';
export { PolarChartModule } from './chart/polarChartModule';
export { NewDonutSeriesModule } from './chart/series/polar/donutSeriesModule';
export { NewPieSeriesModule } from './chart/series/polar/pieSeriesModule';
