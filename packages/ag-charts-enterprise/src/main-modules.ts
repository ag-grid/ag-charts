// Entry point to implement and test our tree-shaking abilities
import { _ModuleSupport } from 'ag-charts-community';

// Import modules that are needed for the arrays below
import {
    AngleCategoryAxisModule,
    AngleNumberAxisModule,
    OrdinalTimeAxisModule,
    RadiusCategoryAxisModule,
    RadiusNumberAxisModule,
} from './axes/axisModules';
import { StandaloneChartModule } from './charts/standaloneChartModule';
import { TopologyChartModule } from './charts/topologyChartModule';
import { AnnotationsModule, InitialStateModule, NavigatorModule } from './features/sync/pluginModules';
import { BoxPlotSeriesModule } from './series/box-plot';
import { CandlestickSeriesModule } from './series/candlestick';
import { ChordSeriesModule } from './series/chord';
import { ConeFunnelSeriesModule } from './series/cone-funnel';
import { FunnelSeriesModule } from './series/funnel';
import { HeatmapSeriesModule } from './series/heatmap';
import { LinearGaugeSeriesModule } from './series/linear-gauge/linearGaugeModule';
import { MapLineSeriesModule } from './series/map-line';
import { MapLineBackgroundSeriesModule } from './series/map-line-background';
import { MapMarkerSeriesModule } from './series/map-marker';
import { MapShapeSeriesModule } from './series/map-shape';
import { MapShapeBackgroundSeriesModule } from './series/map-shape-background';
import { NightingaleSeriesModule } from './series/nightingale';
import { OhlcSeriesModule } from './series/ohlc';
import { PyramidSeriesModule } from './series/pyramid';
import { RadarAreaSeriesModule } from './series/radar-area';
import { RadarLineSeriesModule } from './series/radar-line';
import { RadialBarSeriesModule } from './series/radial-bar';
import { RadialColumnSeriesModule } from './series/radial-column';
import { RadialGaugeSeriesModule } from './series/radial-gauge/radialGaugeModule';
import { RangeAreaSeriesModule } from './series/range-area';
import { RangeBarSeriesModule } from './series/range-bar';
import { SankeySeriesModule } from './series/sankey';
import { SunburstSeriesModule } from './series/sunburst';
import { TreemapSeriesModule } from './series/treemap';
import { WaterfallSeriesModule } from './series/waterfall';

export const ModuleRegistry = _ModuleSupport.ModuleRegistry;

// Re-export modules
export { OhlcSeriesModule } from './series/ohlc';
export { RangeAreaSeriesModule } from './series/range-area';
export { RangeBarSeriesModule } from './series/range-bar';
export { WaterfallSeriesModule } from './series/waterfall';
export { NightingaleSeriesModule } from './series/nightingale';
export { RadarAreaSeriesModule } from './series/radar-area';
export { RadarLineSeriesModule } from './series/radar-line';
export { RadialBarSeriesModule } from './series/radial-bar';
export { RadialColumnSeriesModule } from './series/radial-column';
export { ChordSeriesModule } from './series/chord';
export { SankeySeriesModule } from './series/sankey';
export { LinearGaugeSeriesModule } from './series/linear-gauge/linearGaugeModule';
export { RadialGaugeSeriesModule } from './series/radial-gauge/radialGaugeModule';
export { SunburstSeriesModule } from './series/sunburst';
export { TreemapSeriesModule } from './series/treemap';
export { StandaloneChartModule } from './charts/standaloneChartModule';
export { PyramidSeriesModule } from './series/pyramid';
export { TopologyChartModule } from './charts/topologyChartModule';
export { MapLineSeriesModule } from './series/map-line';
export { MapLineBackgroundSeriesModule } from './series/map-line-background';
export { MapMarkerSeriesModule } from './series/map-marker';
export { MapShapeSeriesModule } from './series/map-shape';
export { MapShapeBackgroundSeriesModule } from './series/map-shape-background';

export const AllCartesianEnterpriseModules = [
    OrdinalTimeAxisModule,
    BoxPlotSeriesModule,
    CandlestickSeriesModule,
    ConeFunnelSeriesModule,
    FunnelSeriesModule,
    HeatmapSeriesModule,
    OhlcSeriesModule,
    RangeAreaSeriesModule,
    RangeBarSeriesModule,
    WaterfallSeriesModule,
];

export const AllPolarEnterpriseModules = [
    AngleNumberAxisModule,
    AngleCategoryAxisModule,
    RadiusNumberAxisModule,
    RadiusCategoryAxisModule,
    NightingaleSeriesModule,
    RadarAreaSeriesModule,
    RadarLineSeriesModule,
    RadialBarSeriesModule,
    RadialColumnSeriesModule,
];

export const AllStandaloneEnterpriseModules = [
    StandaloneChartModule,
    PyramidSeriesModule,
    LinearGaugeSeriesModule,
    RadialGaugeSeriesModule,
    SunburstSeriesModule,
    TreemapSeriesModule,
    ChordSeriesModule,
    SankeySeriesModule,
];

export const AllTopologyEnterpriseModules = [
    TopologyChartModule,
    MapLineSeriesModule,
    MapLineBackgroundSeriesModule,
    MapMarkerSeriesModule,
    MapShapeSeriesModule,
    MapShapeBackgroundSeriesModule,
];

export const AllEnterpriseModules = [
    ...AllCartesianEnterpriseModules,
    ...AllPolarEnterpriseModules,
    ...AllStandaloneEnterpriseModules,
    ...AllTopologyEnterpriseModules,

    // Plugins, WIP
    AnnotationsModule,
    NavigatorModule,
    InitialStateModule,
];

export {
    OrdinalTimeAxisModule,
    AngleNumberAxisModule,
    AngleCategoryAxisModule,
    RadiusNumberAxisModule,
    RadiusCategoryAxisModule,
} from './axes/axisModules';
export { BoxPlotSeriesModule } from './series/box-plot';
export { CandlestickSeriesModule } from './series/candlestick';
export { ConeFunnelSeriesModule } from './series/cone-funnel';
export { FunnelSeriesModule } from './series/funnel';
export { HeatmapSeriesModule } from './series/heatmap';
