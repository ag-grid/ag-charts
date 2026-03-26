import { ModuleRegistry, enterpriseRegistry } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import { Background } from './features/background/background';
import { Foreground } from './features/foreground/foreground';
import { LicenseManager } from './license/licenseManager';
import { injectWatermark } from './license/watermark';
import styles from './styles.css';

export * from 'ag-charts-types';
export * from 'ag-charts-community';

export { AngleCategoryAxisModule } from './axes/angle-category/angleCategoryAxisModule';
export { AngleNumberAxisModule } from './axes/angle-number/angleNumberAxisModule';
export { OrdinalTimeAxisModule } from './axes/ordinal/ordinalTimeAxisModule';
export { RadiusCategoryAxisModule } from './axes/radius-category/radiusCategoryAxisModule';
export { RadiusNumberAxisModule } from './axes/radius-number/radiusNumberAxisModule';
export { AnimationModule } from './features/animation/animationModule';
export { AnnotationsModule } from './features/annotations/annotationsModule';
export { BandHighlightModule } from './features/band-highlight/bandHighlightModule';
export { ChartToolbarModule } from './features/chart-toolbar/chartToolbarModule';
export { ContextMenuModule } from './features/context-menu/contextMenuModule';
export { CrosshairModule } from './features/crosshair/crosshairModule';
export { DataSourceModule } from './features/data-source/dataSourceModule';
export { ErrorBarsModule } from './features/error-bar/errorBarModule';
export { FlashOnUpdateModule } from './features/flash-on-update/flashOnUpdateModule';
export { NavigatorModule } from './features/navigator/navigatorModule';
export { ScrollbarModule } from './features/scrollbar/scrollbarModule';
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
export { LinearGaugeModule } from './series/linear-gauge/linearGaugeModule';
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
export { RadialGaugeModule } from './series/radial-gauge/radialGaugeModule';
export { RangeAreaSeriesModule } from './series/range-area/rangeAreaModule';
export { RangeBarSeriesModule } from './series/range-bar/rangeBarModule';
export { SankeySeriesModule } from './series/sankey/sankeyModule';
export { SunburstSeriesModule } from './series/sunburst/sunburstModule';
export { TreemapSeriesModule } from './series/treemap/treemapModule';
export { WaterfallSeriesModule } from './series/waterfall/waterfallModule';

export { AllEnterpriseModule } from './module-bundles/all';
export { AllCartesianModule } from './module-bundles/cartesian';
export { AllCartesianAxesModule } from './module-bundles/cartesian-axes';
export { AllCartesianSeriesModule } from './module-bundles/cartesian-series';
export { FinancialChartModule } from './module-bundles/financial';
export { AllGaugeModule } from './module-bundles/gauge';
export { LicenseManager, AgChartsEnterpriseModule } from './module-bundles/integrated';
export { AllPolarModule } from './module-bundles/polar';
export { AllMapSeriesModule } from './module-bundles/topology';

// Globally registered enterprise setup
ModuleRegistry.setRegistryMode(ModuleRegistry.RegistryMode.Enterprise);

enterpriseRegistry.styles = styles;
enterpriseRegistry.licenseManager = (options: AgChartOptions) =>
    new LicenseManager(options.container?.ownerDocument ?? (typeof document === 'undefined' ? undefined : document));
enterpriseRegistry.injectWatermark = injectWatermark;
enterpriseRegistry.createBackground = (ctx) => new Background(ctx);
enterpriseRegistry.createForeground = (ctx) => new Foreground(ctx);
