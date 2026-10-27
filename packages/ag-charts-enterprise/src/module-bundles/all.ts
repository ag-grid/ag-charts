import { AllCommunityModule } from 'ag-charts-community';
import type { ModuleDefinition } from 'ag-charts-core';

import { AngleCategoryAxisModule } from '../axes/angle-category/angleCategoryAxisModule';
import { AngleNumberAxisModule } from '../axes/angle-number/angleNumberAxisModule';
import {
    CategoryAxisModule,
    GroupedCategoryAxisModule,
    LogAxisModule,
    NumberAxisModule,
    TimeAxisModule,
    UnitTimeAxisModule,
} from '../axes/cartesian/cartesianAxisModules';
import { OrdinalTimeAxisModule } from '../axes/ordinal/ordinalTimeAxisModule';
import { PolarCrossLinesModule } from '../axes/polar-crosslines/polarCrossLinesModule';
import { RadiusCategoryAxisModule } from '../axes/radius-category/radiusCategoryAxisModule';
import { RadiusNumberAxisModule } from '../axes/radius-number/radiusNumberAxisModule';
import { AnimationModule } from '../features/animation/animationModule';
import { AnnotationsModule } from '../features/annotations/annotationsModule';
import { AxisInteractionModule } from '../features/axis-interaction/axisInteractionModule';
import { BackgroundRegionsModule } from '../features/background-regions/backgroundRegionsModule';
import { BandHighlightModule } from '../features/band-highlight/bandHighlightModule';
import { ChartToolbarModule } from '../features/chart-toolbar/chartToolbarModule';
import { ContextMenuModule } from '../features/context-menu/contextMenuModule';
import { CrosshairModule } from '../features/crosshair/crosshairModule';
import { SelectionModule } from '../features/data-selection/dataSelectionModule';
import { DataSourceModule } from '../features/data-source/dataSourceModule';
import { ErrorBarsModule } from '../features/error-bar/errorBarModule';
import { FlashOnUpdateModule } from '../features/flash-on-update/flashOnUpdateModule';
import { NavigatorModule } from '../features/navigator/navigatorModule';
import { RangesModule } from '../features/ranges/rangesModule';
import { ScrollbarModule } from '../features/scrollbar/scrollbarModule';
import { StatusBarModule } from '../features/status-bar/statusBarModule';
import { SyncModule } from '../features/sync/syncModule';
import { ZoomModule } from '../features/zoom/zoomModule';
import { GradientLegendModule } from '../gradient-legend/gradientLegendModule';
import { BoxPlotSeriesModule } from '../series/box-plot/boxPlotModule';
import { CandlestickSeriesModule } from '../series/candlestick/candlestickModule';
import { ChordSeriesModule } from '../series/chord/chordModule';
import { ConeFunnelSeriesModule } from '../series/cone-funnel/coneFunnelModule';
import { FunnelSeriesModule } from '../series/funnel/funnelModule';
import { HeatmapSeriesModule } from '../series/heatmap/heatmapModule';
import { HlcSeriesModule } from '../series/hlc/hlcModule';
import { LinearGaugeModule } from '../series/linear-gauge/linearGaugeModule';
import { MapLineBackgroundSeriesModule } from '../series/map-line-background/mapLineBackgroundModule';
import { MapLineSeriesModule } from '../series/map-line/mapLineModule';
import { MapMarkerSeriesModule } from '../series/map-marker/mapMarkerModule';
import { MapShapeBackgroundSeriesModule } from '../series/map-shape-background/mapShapeBackgroundModule';
import { MapShapeSeriesModule } from '../series/map-shape/mapShapeModule';
import { NightingaleSeriesModule } from '../series/nightingale/nightingaleModule';
import { OhlcSeriesModule } from '../series/ohlc/ohlcModule';
import { OrganizationSeriesModule } from '../series/organization/organizationSeriesModule';
import { PyramidSeriesModule } from '../series/pyramid/pyramidModule';
import { RadarAreaSeriesModule } from '../series/radar-area/radarAreaModule';
import { RadarLineSeriesModule } from '../series/radar-line/radarLineModule';
import { RadialBarSeriesModule } from '../series/radial-bar/radialBarModule';
import { RadialColumnSeriesModule } from '../series/radial-column/radialColumnModule';
import { RadialGaugeModule } from '../series/radial-gauge/radialGaugeModule';
import { RangeAreaSeriesModule } from '../series/range-area/rangeAreaModule';
import { RangeBarSeriesModule } from '../series/range-bar/rangeBarModule';
import { SankeySeriesModule } from '../series/sankey/sankeyModule';
import { SunburstSeriesModule } from '../series/sunburst/sunburstModule';
import { TreemapSeriesModule } from '../series/treemap/treemapModule';
import { WaterfallSeriesModule } from '../series/waterfall/waterfallModule';
import { FinancialChartModule } from './financial';
import { QuadrantChartModule } from './quadrant';

export const AllEnterpriseModule: ModuleDefinition[] = [
    AllCommunityModule,

    // Cartesian axes
    NumberAxisModule,
    LogAxisModule,
    TimeAxisModule,
    CategoryAxisModule,
    GroupedCategoryAxisModule,
    UnitTimeAxisModule,
    OrdinalTimeAxisModule,

    // Cartesian series
    BoxPlotSeriesModule,
    CandlestickSeriesModule,
    ConeFunnelSeriesModule,
    FunnelSeriesModule,
    HeatmapSeriesModule,
    HlcSeriesModule,
    OhlcSeriesModule,
    RangeAreaSeriesModule,
    RangeBarSeriesModule,
    WaterfallSeriesModule,

    // Cartesian features, ahead of series whose dependencies would register them out of order (organization → zoom)
    AnimationModule,
    AnnotationsModule,
    AxisInteractionModule,
    BandHighlightModule,
    ChartToolbarModule,
    ContextMenuModule,
    CrosshairModule,
    DataSourceModule,
    ErrorBarsModule,
    FlashOnUpdateModule,
    GradientLegendModule,
    NavigatorModule,
    RangesModule,
    ScrollbarModule,
    SelectionModule,
    BackgroundRegionsModule,
    StatusBarModule,
    SyncModule,
    ZoomModule,

    // Polar axes
    AngleNumberAxisModule,
    AngleCategoryAxisModule,
    RadiusNumberAxisModule,
    RadiusCategoryAxisModule,
    PolarCrossLinesModule,

    // Polar series
    NightingaleSeriesModule,
    RadarAreaSeriesModule,
    RadarLineSeriesModule,
    RadialBarSeriesModule,
    RadialColumnSeriesModule,

    // Map series
    MapLineSeriesModule,
    MapLineBackgroundSeriesModule,
    MapMarkerSeriesModule,
    MapShapeSeriesModule,
    MapShapeBackgroundSeriesModule,

    // Gauges
    LinearGaugeModule,
    RadialGaugeModule,

    // Presets
    FinancialChartModule,
    QuadrantChartModule,

    // Other series
    ChordSeriesModule,
    OrganizationSeriesModule,
    PyramidSeriesModule,
    SankeySeriesModule,
    SunburstSeriesModule,
    TreemapSeriesModule,
].flat();
