// Entry point to implement and test our tree-shaking abilities
import { _ModuleSupport } from 'ag-charts-community';

import { FlowProportionChartModule } from './charts/flowProportionChartModule';
import { GaugeChartModule } from './charts/gaugeChartModule';
import { HierarchyChartModule } from './charts/hierarchyChartModule';
import { StandaloneChartModule } from './charts/standaloneChartModule';
import { TopologyChartModule } from './charts/topologyChartModule';
import { BoxPlotSeriesModule } from './series/box-plot';
import { CandlestickSeriesModule } from './series/candlestick';
import { ChordSeriesModule } from './series/chord';
import { ConeFunnelSeriesModule } from './series/cone-funnel';
import { FunnelSeriesModule } from './series/funnel';
import { HeatmapSeriesModule } from './series/heatmap';
import { MapLineSeriesModule } from './series/map-line';
import { MapLineBackgroundSeriesModule } from './series/map-line-background';
import { MapMarkerSeriesModule } from './series/map-marker';
import { MapShapeSeriesModule } from './series/map-shape';
import { NightingaleSeriesModule } from './series/nightingale';
import { OhlcSeriesModule } from './series/ohlc';
import { PyramidSeriesModule } from './series/pyramid';
import { RadarAreaSeriesModule } from './series/radar-area';
import { RadarLineSeriesModule } from './series/radar-line';
import { RadialBarSeriesModule } from './series/radial-bar';
import { RadialColumnSeriesModule } from './series/radial-column';
import { RangeAreaSeriesModule } from './series/range-area';
import { RangeBarSeriesModule } from './series/range-bar';
import { SankeySeriesModule } from './series/sankey';
import { SunburstSeriesModule } from './series/sunburst';
import { TreemapSeriesModule } from './series/treemap';
import { WaterfallSeriesModule } from './series/waterfall';

export const ModuleRegistry = _ModuleSupport.ModuleRegistry;

export {
    BoxPlotSeriesModule,
    CandlestickSeriesModule,
    ConeFunnelSeriesModule,
    FunnelSeriesModule,
    HeatmapSeriesModule,
    OhlcSeriesModule,
    RangeAreaSeriesModule,
    RangeBarSeriesModule,
    WaterfallSeriesModule,
    NightingaleSeriesModule,
    RadarAreaSeriesModule,
    RadarLineSeriesModule,
    RadialBarSeriesModule,
    RadialColumnSeriesModule,
    FlowProportionChartModule,
    ChordSeriesModule,
    SankeySeriesModule,
    GaugeChartModule,
    HierarchyChartModule,
    SunburstSeriesModule,
    TreemapSeriesModule,
    StandaloneChartModule,
    PyramidSeriesModule,
    TopologyChartModule,
    MapLineSeriesModule,
    MapLineBackgroundSeriesModule,
    MapMarkerSeriesModule,
    MapShapeSeriesModule,
};

export const AllCartesianEnterpriseModules = [
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
    NightingaleSeriesModule,
    RadarAreaSeriesModule,
    RadarLineSeriesModule,
    RadialBarSeriesModule,
    RadialColumnSeriesModule,
];

export const AllFlowProportionEnterpriseModules = [FlowProportionChartModule, ChordSeriesModule, SankeySeriesModule];

export const AllGaugeEnterpriseModules = [GaugeChartModule];

export const AllHierarchyEnterpriseModules = [HierarchyChartModule, SunburstSeriesModule, TreemapSeriesModule];

export const AllStandaloneEnterpriseModules = [StandaloneChartModule, PyramidSeriesModule];

export const AllTopologyEnterpriseModules = [
    TopologyChartModule,
    MapLineSeriesModule,
    MapLineBackgroundSeriesModule,
    MapMarkerSeriesModule,
    MapShapeSeriesModule,
];

export const AllEnterpriseModules = [
    ...AllCartesianEnterpriseModules,
    ...AllPolarEnterpriseModules,
    ...AllFlowProportionEnterpriseModules,
    ...AllGaugeEnterpriseModules,
    ...AllHierarchyEnterpriseModules,
    ...AllStandaloneEnterpriseModules,
    ...AllTopologyEnterpriseModules,
];
