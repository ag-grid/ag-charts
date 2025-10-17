import { GaugePresetModule, PriceVolumePresetModule } from 'ag-charts-community/modules';
import { type ModuleDefinition } from 'ag-charts-core';

import { AngleCategoryAxisModule } from './axes/angle-category/angleCategoryAxisModule';
import { AngleNumberAxisModule } from './axes/angle-number/angleNumberAxisModule';
import { OrdinalTimeAxisModule } from './axes/ordinal/ordinalTimeAxisModule';
import { RadiusCategoryAxisModule } from './axes/radius-category/radiusCategoryAxisModule';
import { RadiusNumberAxisModule } from './axes/radius-number/radiusNumberAxisModule';
import { StandaloneChartModule } from './charts/standaloneChartModule';
import { TopologyChartModule } from './charts/topologyChartModule';
import { AnimationModule } from './features/animation/animationModule';
import { AnnotationsModule } from './features/annotations/annotationsModule';
import { BackgroundModule } from './features/background/backgroundModule';
import { BandHighlightModule } from './features/band-highlight/bandHighlightModule';
import { ChartToolbarModule } from './features/chart-toolbar/chartToolbarModule';
import { ContextMenuModule } from './features/context-menu/contextMenuModule';
import { CrosshairModule } from './features/crosshair/crosshairModule';
import { DataSourceModule } from './features/data-source/dataSourceModule';
import { ErrorBarsModule } from './features/error-bar/errorBarModule';
import { ForegroundModule } from './features/foreground/foregroundModule';
import { NavigatorModule } from './features/navigator/navigatorModule';
import { RangesModule } from './features/ranges/rangesModule';
import { StatusBarModule } from './features/status-bar/statusBarModule';
import { SyncModule } from './features/sync/syncModule';
import { ZoomModule } from './features/zoom/zoomModule';
import { GradientLegendModule } from './gradient-legend/gradientLegendModule';
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

export { ModuleRegistry } from 'ag-charts-core';

/* eslint-disable unicorn/prefer-export-from */
export {
    OrdinalTimeAxisModule,
    AngleNumberAxisModule,
    AngleCategoryAxisModule,
    RadiusNumberAxisModule,
    RadiusCategoryAxisModule,
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
    ChordSeriesModule,
    SankeySeriesModule,
    LinearGaugeSeriesModule,
    RadialGaugeSeriesModule,
    SunburstSeriesModule,
    TreemapSeriesModule,
    StandaloneChartModule,
    PyramidSeriesModule,
    TopologyChartModule,
    MapLineSeriesModule,
    MapLineBackgroundSeriesModule,
    MapMarkerSeriesModule,
    MapShapeSeriesModule,
    MapShapeBackgroundSeriesModule,
    CrosshairModule,
    AnimationModule,
    AnnotationsModule,
    BackgroundModule,
    BandHighlightModule,
    ChartToolbarModule,
    ContextMenuModule,
    DataSourceModule,
    ErrorBarsModule,
    ForegroundModule,
    GradientLegendModule,
    NavigatorModule,
    RangesModule,
    StatusBarModule,
    SyncModule,
    ZoomModule,
    PriceVolumePresetModule,
    GaugePresetModule,
};

export const AllCartesianEnterpriseModules: ModuleDefinition[] = [
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
    AnimationModule,
    AnnotationsModule,
    BackgroundModule,
    BandHighlightModule,
    ChartToolbarModule,
    ContextMenuModule,
    CrosshairModule,
    DataSourceModule,
    ErrorBarsModule,
    ForegroundModule,
    GradientLegendModule,
    NavigatorModule,
    RangesModule,
    StatusBarModule,
    SyncModule,
    ZoomModule,
];

export const AllPolarEnterpriseModules: ModuleDefinition[] = [
    AngleNumberAxisModule,
    AngleCategoryAxisModule,
    RadiusNumberAxisModule,
    RadiusCategoryAxisModule,
    NightingaleSeriesModule,
    RadarAreaSeriesModule,
    RadarLineSeriesModule,
    RadialBarSeriesModule,
    RadialColumnSeriesModule,
    AnimationModule,
    BackgroundModule,
    ContextMenuModule,
    DataSourceModule,
    ForegroundModule,
    GradientLegendModule,
];

export const AllStandaloneEnterpriseModules: ModuleDefinition[] = [
    StandaloneChartModule,
    PyramidSeriesModule,
    LinearGaugeSeriesModule,
    RadialGaugeSeriesModule,
    SunburstSeriesModule,
    TreemapSeriesModule,
    ChordSeriesModule,
    SankeySeriesModule,
    AnimationModule,
    BackgroundModule,
    ContextMenuModule,
    DataSourceModule,
    ForegroundModule,
    GradientLegendModule,
];

export const AllTopologyEnterpriseModules: ModuleDefinition[] = [
    TopologyChartModule,
    MapLineSeriesModule,
    MapLineBackgroundSeriesModule,
    MapMarkerSeriesModule,
    MapShapeSeriesModule,
    MapShapeBackgroundSeriesModule,
    AnimationModule,
    BackgroundModule,
    ContextMenuModule,
    DataSourceModule,
    ForegroundModule,
    GradientLegendModule,
    ZoomModule,
];

export const AllEnterpriseModules: ModuleDefinition[] = [
    ...AllCartesianEnterpriseModules,
    ...AllPolarEnterpriseModules,
    ...AllStandaloneEnterpriseModules,
    ...AllTopologyEnterpriseModules,

    // Presets
    PriceVolumePresetModule,
    GaugePresetModule,

    // Plugins, WIP
    // InitialStateModule,
];
