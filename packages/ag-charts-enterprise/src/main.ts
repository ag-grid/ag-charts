import { enterpriseRegistry } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import { LicenseManager } from './license/licenseManager';
import { injectWatermark } from './license/watermark';
import styles from './styles.css';

export {
    AG_CHARTS_LOCALE_EN_US,
    AgCharts,
    AgChartsCommunityModule,
    ModuleRegistry,
    VERSION,
    time,
    _ModuleSupport,
    _Scene,
    _Theme,
    _Util,
    _Widget,
} from 'ag-charts-community';
export * from 'ag-charts-types';

export { GaugePresetModule, PriceVolumePresetModule, SparklinePresetModule } from 'ag-charts-community';

export { AngleCategoryAxisModule } from './axes/angle-category/angleCategoryAxisModule';
export { AngleNumberAxisModule } from './axes/angle-number/angleNumberAxisModule';
export { OrdinalTimeAxisModule } from './axes/ordinal/ordinalTimeAxisModule';
export { RadiusCategoryAxisModule } from './axes/radius-category/radiusCategoryAxisModule';
export { RadiusNumberAxisModule } from './axes/radius-number/radiusNumberAxisModule';
export { AnimationModule } from './features/animation/animationModule';
export { AnnotationsModule } from './features/annotations/annotationsModule';
export { BackgroundModule } from './features/background/backgroundModule';
export { BandHighlightModule } from './features/band-highlight/bandHighlightModule';
export { ChartToolbarModule } from './features/chart-toolbar/chartToolbarModule';
export { ContextMenuModule } from './features/context-menu/contextMenuModule';
export { CrosshairModule } from './features/crosshair/crosshairModule';
export { DataSourceModule } from './features/data-source/dataSourceModule';
export { ErrorBarsModule } from './features/error-bar/errorBarModule';
export { ForegroundModule } from './features/foreground/foregroundModule';
export { NavigatorModule } from './features/navigator/navigatorModule';
export { RangesModule } from './features/ranges/rangesModule';
export { StatusBarModule } from './features/status-bar/statusBarModule';
export { SyncModule } from './features/sync/syncModule';
export { ZoomModule } from './features/zoom/zoomModule';
export { GradientLegendModule } from './gradient-legend/gradientLegendModule';
export { BoxPlotSeriesModule } from './series/box-plot/boxPlotModule';
export { CandlestickSeriesModule } from './series/candlestick/candlestickModule';
export { ChordSeriesModule } from './series/chord/chordModule';
export { ConeFunnelSeriesModule } from './series/cone-funnel/coneFunnelModule';
export { FunnelSeriesModule } from './series/funnel/funnelModule';
export { HeatmapSeriesModule } from './series/heatmap/heatmapModule';
export { LinearGaugeSeriesModule } from './series/linear-gauge/linearGaugeModule';
export { MapLineSeriesModule } from './series/map-line/mapLineModule';
export { MapLineBackgroundSeriesModule } from './series/map-line-background/mapLineBackgroundModule';
export { MapMarkerSeriesModule } from './series/map-marker/mapMarkerModule';
export { MapShapeSeriesModule } from './series/map-shape/mapShapeModule';
export { MapShapeBackgroundSeriesModule } from './series/map-shape-background/mapShapeBackgroundModule';
export { NightingaleSeriesModule } from './series/nightingale/nightingaleModule';
export { OhlcSeriesModule } from './series/ohlc/ohlcModule';
export { PyramidSeriesModule } from './series/pyramid/pyramidModule';
export { RadarAreaSeriesModule } from './series/radar-area/radarAreaModule';
export { RadarLineSeriesModule } from './series/radar-line/radarLineModule';
export { RadialBarSeriesModule } from './series/radial-bar/radialBarModule';
export { RadialColumnSeriesModule } from './series/radial-column/radialColumnModule';
export { RadialGaugeSeriesModule } from './series/radial-gauge/radialGaugeModule';
export { RangeAreaSeriesModule } from './series/range-area/rangeAreaModule';
export { RangeBarSeriesModule } from './series/range-bar/rangeBarModule';
export { SankeySeriesModule } from './series/sankey/sankeyModule';
export { SunburstSeriesModule } from './series/sunburst/sunburstModule';
export { TreemapSeriesModule } from './series/treemap/treemapModule';
export { WaterfallSeriesModule } from './series/waterfall/waterfallModule';

export { AllCartesianEnterpriseModules } from './module-bundles/cartesian';
export { AllPolarEnterpriseModules } from './module-bundles/polar';
export { AllStandaloneEnterpriseModules } from './module-bundles/standalone';
export { AllTopologyEnterpriseModules } from './module-bundles/topology';
export { AllEnterpriseModules } from './module-bundles/all';
export { AllCommunityAndEnterpriseModules } from './module-bundles/all-with-community';

export { LicenseManager, AgChartsEnterpriseModule } from './module-bundles/integrated';

// Globally registered enterprise setup
enterpriseRegistry.styles = styles;
enterpriseRegistry.licenseManager = (options: AgChartOptions) =>
    new LicenseManager(options.container?.ownerDocument ?? (typeof document === 'undefined' ? undefined : document));
enterpriseRegistry.injectWatermark = injectWatermark;
