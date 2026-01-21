/**
 * @fileoverview Module mappings for AG Charts ESLint rule
 * Derived from packages/ag-charts-community/src/chart/factory/expectedModules.ts
 * and packages/ag-charts-community/src/module-bundles/*.ts
 */

// Series type → Module ID
export const seriesTypeToModule = new Map([
    // Community - Cartesian
    ['bar', 'BarSeriesModule'],
    ['line', 'LineSeriesModule'],
    ['area', 'AreaSeriesModule'],
    ['scatter', 'ScatterSeriesModule'],
    ['bubble', 'BubbleSeriesModule'],
    ['histogram', 'HistogramSeriesModule'],
    // Community - Polar
    ['pie', 'PieSeriesModule'],
    ['donut', 'DonutSeriesModule'],
    // Enterprise - Cartesian
    ['box-plot', 'BoxPlotSeriesModule'],
    ['candlestick', 'CandlestickSeriesModule'],
    ['cone-funnel', 'ConeFunnelSeriesModule'],
    ['funnel', 'FunnelSeriesModule'],
    ['heatmap', 'HeatmapSeriesModule'],
    ['ohlc', 'OhlcSeriesModule'],
    ['range-area', 'RangeAreaSeriesModule'],
    ['range-bar', 'RangeBarSeriesModule'],
    ['waterfall', 'WaterfallSeriesModule'],
    // Enterprise - Polar
    ['nightingale', 'NightingaleSeriesModule'],
    ['radar-area', 'RadarAreaSeriesModule'],
    ['radar-line', 'RadarLineSeriesModule'],
    ['radial-bar', 'RadialBarSeriesModule'],
    ['radial-column', 'RadialColumnSeriesModule'],
    // Enterprise - Topology (Maps)
    ['map-shape', 'MapShapeSeriesModule'],
    ['map-line', 'MapLineSeriesModule'],
    ['map-marker', 'MapMarkerSeriesModule'],
    ['map-shape-background', 'MapShapeBackgroundSeriesModule'],
    ['map-line-background', 'MapLineBackgroundSeriesModule'],
    // Enterprise - Standalone
    ['pyramid', 'PyramidSeriesModule'],
    ['linear-gauge', 'LinearGaugeModule'],
    ['radial-gauge', 'RadialGaugeModule'],
    ['sunburst', 'SunburstSeriesModule'],
    ['treemap', 'TreemapSeriesModule'],
    ['chord', 'ChordSeriesModule'],
    ['sankey', 'SankeySeriesModule'],
]);

// Axis type → Module ID
export const axisTypeToModule = new Map([
    // Community - Cartesian
    ['number', 'NumberAxisModule'],
    ['category', 'CategoryAxisModule'],
    ['time', 'TimeAxisModule'],
    ['log', 'LogAxisModule'],
    ['grouped-category', 'GroupedCategoryAxisModule'],
    ['unit-time', 'UnitTimeAxisModule'],
    // Enterprise - Cartesian
    ['ordinal-time', 'OrdinalTimeAxisModule'],
    // Enterprise - Polar
    ['angle-category', 'AngleCategoryAxisModule'],
    ['angle-number', 'AngleNumberAxisModule'],
    ['radius-category', 'RadiusCategoryAxisModule'],
    ['radius-number', 'RadiusNumberAxisModule'],
]);

// Top-level plugin option → Module ID
export const pluginOptionToModule = new Map([
    ['animation', 'AnimationModule'],
    ['annotations', 'AnnotationsModule'],
    ['chartToolbar', 'ChartToolbarModule'],
    ['contextMenu', 'ContextMenuModule'],
    ['dataSource', 'DataSourceModule'],
    ['flashOnUpdate', 'FlashOnUpdateModule'],
    ['gradientLegend', 'GradientLegendModule'],
    ['legend', 'LegendModule'],
    ['locale', 'LocaleModule'],
    ['navigator', 'NavigatorModule'],
    ['ranges', 'RangesModule'],
    ['scrollbar', 'ScrollbarModule'],
    ['statusBar', 'StatusBarModule'],
    ['sync', 'SyncModule'],
    ['zoom', 'ZoomModule'],
]);

// Nested axis plugin option → Module ID
export const axisPluginToModule = new Map([
    ['crosshair', 'CrosshairModule'],
    ['bandHighlight', 'BandHighlightModule'],
]);

// Nested series plugin option → Module ID
export const seriesPluginToModule = new Map([['errorBar', 'ErrorBarsModule']]);

// Nested annotations plugin option → Module ID
export const annotationsPluginToModule = new Map([['toolbar', 'ChartToolbarModule']]);

// Series modules that indicate cartesian chart type (for intrinsic axis detection)
export const cartesianSeriesModules = new Set([
    'AreaSeriesModule',
    'BarSeriesModule',
    'BubbleSeriesModule',
    'HistogramSeriesModule',
    'LineSeriesModule',
    'ScatterSeriesModule',
    'BoxPlotSeriesModule',
    'CandlestickSeriesModule',
    'ConeFunnelSeriesModule',
    'FunnelSeriesModule',
    'HeatmapSeriesModule',
    'OhlcSeriesModule',
    'RangeAreaSeriesModule',
    'RangeBarSeriesModule',
    'WaterfallSeriesModule',
]);

// Series modules that indicate polar chart type (for intrinsic axis detection)
export const polarSeriesModules = new Set([
    'NightingaleSeriesModule',
    'RadarAreaSeriesModule',
    'RadarLineSeriesModule',
    'RadialBarSeriesModule',
    'RadialColumnSeriesModule',
]);

// Series type → chart type mapping
export const seriesChartType = new Map([
    // Community - Cartesian
    ['bar', 'cartesian'],
    ['line', 'cartesian'],
    ['area', 'cartesian'],
    ['scatter', 'cartesian'],
    ['bubble', 'cartesian'],
    ['histogram', 'cartesian'],
    // Community - Polar
    ['pie', 'polar'],
    ['donut', 'polar'],
    // Enterprise - Cartesian
    ['box-plot', 'cartesian'],
    ['candlestick', 'cartesian'],
    ['cone-funnel', 'cartesian'],
    ['funnel', 'cartesian'],
    ['heatmap', 'cartesian'],
    ['ohlc', 'cartesian'],
    ['range-area', 'cartesian'],
    ['range-bar', 'cartesian'],
    ['waterfall', 'cartesian'],
    // Enterprise - Polar
    ['nightingale', 'polar'],
    ['radar-area', 'polar'],
    ['radar-line', 'polar'],
    ['radial-bar', 'polar'],
    ['radial-column', 'polar'],
    // Enterprise - Topology (Maps)
    ['map-shape', 'topology'],
    ['map-line', 'topology'],
    ['map-marker', 'topology'],
    ['map-shape-background', 'topology'],
    ['map-line-background', 'topology'],
    // Enterprise - Standalone
    ['pyramid', 'standalone'],
    ['linear-gauge', 'standalone'],
    ['radial-gauge', 'standalone'],
    ['sunburst', 'standalone'],
    ['treemap', 'standalone'],
    ['chord', 'standalone'],
    ['sankey', 'standalone'],
]);

// Default axis types per series (when no explicit axes defined)
export const seriesDefaultAxes = new Map([
    // Category x, Number y
    ['bar', { x: 'category', y: 'number' }],
    ['line', { x: 'category', y: 'number' }],
    ['area', { x: 'category', y: 'number' }],
    ['histogram', { x: 'number', y: 'number' }],
    ['scatter', { x: 'number', y: 'number' }],
    ['bubble', { x: 'number', y: 'number' }],
    // Enterprise cartesian
    ['box-plot', { x: 'category', y: 'number' }],
    ['candlestick', { x: 'ordinal-time', y: 'number' }],
    ['ohlc', { x: 'ordinal-time', y: 'number' }],
    ['heatmap', { x: 'category', y: 'category' }],
    ['range-area', { x: 'category', y: 'number' }],
    ['range-bar', { x: 'category', y: 'number' }],
    ['waterfall', { x: 'category', y: 'number' }],
    ['funnel', { x: 'category', y: 'number' }],
    ['cone-funnel', { x: 'category', y: 'number' }],
    // Enterprise polar
    ['nightingale', { angle: 'angle-category', radius: 'radius-number' }],
    ['radar-area', { angle: 'angle-category', radius: 'radius-number' }],
    ['radar-line', { angle: 'angle-category', radius: 'radius-number' }],
    ['radial-bar', { angle: 'angle-number', radius: 'radius-category' }],
    ['radial-column', { angle: 'angle-category', radius: 'radius-number' }],
]);

// Enterprise modules set
export const enterpriseModules = new Set([
    // Series
    'BoxPlotSeriesModule',
    'CandlestickSeriesModule',
    'ConeFunnelSeriesModule',
    'FunnelSeriesModule',
    'HeatmapSeriesModule',
    'OhlcSeriesModule',
    'RangeAreaSeriesModule',
    'RangeBarSeriesModule',
    'WaterfallSeriesModule',
    'NightingaleSeriesModule',
    'RadarAreaSeriesModule',
    'RadarLineSeriesModule',
    'RadialBarSeriesModule',
    'RadialColumnSeriesModule',
    'MapShapeSeriesModule',
    'MapLineSeriesModule',
    'MapMarkerSeriesModule',
    'MapShapeBackgroundSeriesModule',
    'MapLineBackgroundSeriesModule',
    'PyramidSeriesModule',
    'LinearGaugeModule',
    'RadialGaugeModule',
    'SunburstSeriesModule',
    'TreemapSeriesModule',
    'ChordSeriesModule',
    'SankeySeriesModule',
    // Axes
    'OrdinalTimeAxisModule',
    'AngleCategoryAxisModule',
    'AngleNumberAxisModule',
    'RadiusCategoryAxisModule',
    'RadiusNumberAxisModule',
    // Plugins
    'AnimationModule',
    'AnnotationsModule',
    'BandHighlightModule',
    'ChartToolbarModule',
    'ContextMenuModule',
    'CrosshairModule',
    'DataSourceModule',
    'ErrorBarsModule',
    'GradientLegendModule',
    'NavigatorModule',
    'RangesModule',
    'ScrollbarModule',
    'StatusBarModule',
    'SyncModule',
    'ZoomModule',
    // Chart types
    'TopologyChartModule',
    'StandaloneChartModule',
    // Presets
    'GaugePresetModule',
    'PriceVolumePresetModule',
]);

// Bundle definitions - what each bundle includes
export const bundleContents = new Map([
    [
        'AllCommunityModule',
        [
            // Axes
            'NumberAxisModule',
            'LogAxisModule',
            'TimeAxisModule',
            'CategoryAxisModule',
            'GroupedCategoryAxisModule',
            'UnitTimeAxisModule',
            // Series
            'AreaSeriesModule',
            'BarSeriesModule',
            'BubbleSeriesModule',
            'HistogramSeriesModule',
            'LineSeriesModule',
            'ScatterSeriesModule',
            'PieSeriesModule',
            'DonutSeriesModule',
            // Plugins
            'LegendModule',
            'LocaleModule',
            // Presets
            'SparklinePresetModule',
            // Chart types
            'CartesianChartModule',
            'PolarChartModule',
        ],
    ],
    [
        'AllCartesianModule',
        [
            // Axes
            'NumberAxisModule',
            'LogAxisModule',
            'TimeAxisModule',
            'CategoryAxisModule',
            'GroupedCategoryAxisModule',
            'UnitTimeAxisModule',
            // Series
            'AreaSeriesModule',
            'BarSeriesModule',
            'BubbleSeriesModule',
            'HistogramSeriesModule',
            'LineSeriesModule',
            'ScatterSeriesModule',
            // Plugins
            'LegendModule',
            'LocaleModule',
            // Chart types
            'CartesianChartModule',
        ],
    ],
    ['AllPolarModule', ['PieSeriesModule', 'DonutSeriesModule', 'LegendModule', 'LocaleModule', 'PolarChartModule']],
    [
        'AllCartesianAxesModule',
        [
            'NumberAxisModule',
            'LogAxisModule',
            'TimeAxisModule',
            'CategoryAxisModule',
            'GroupedCategoryAxisModule',
            'UnitTimeAxisModule',
        ],
    ],
    [
        'AllCartesianSeriesModule',
        [
            'AreaSeriesModule',
            'BarSeriesModule',
            'BubbleSeriesModule',
            'HistogramSeriesModule',
            'LineSeriesModule',
            'ScatterSeriesModule',
        ],
    ],
    [
        'AllEnterpriseModule',
        [
            // All community modules
            'NumberAxisModule',
            'LogAxisModule',
            'TimeAxisModule',
            'CategoryAxisModule',
            'GroupedCategoryAxisModule',
            'UnitTimeAxisModule',
            'AreaSeriesModule',
            'BarSeriesModule',
            'BubbleSeriesModule',
            'HistogramSeriesModule',
            'LineSeriesModule',
            'ScatterSeriesModule',
            'PieSeriesModule',
            'DonutSeriesModule',
            'LegendModule',
            'LocaleModule',
            'SparklinePresetModule',
            'CartesianChartModule',
            'PolarChartModule',
            // Enterprise cartesian axes
            'OrdinalTimeAxisModule',
            // Enterprise polar axes
            'AngleCategoryAxisModule',
            'AngleNumberAxisModule',
            'RadiusCategoryAxisModule',
            'RadiusNumberAxisModule',
            // Enterprise cartesian series
            'BoxPlotSeriesModule',
            'CandlestickSeriesModule',
            'ConeFunnelSeriesModule',
            'FunnelSeriesModule',
            'HeatmapSeriesModule',
            'OhlcSeriesModule',
            'RangeAreaSeriesModule',
            'RangeBarSeriesModule',
            'WaterfallSeriesModule',
            // Enterprise polar series
            'NightingaleSeriesModule',
            'RadarAreaSeriesModule',
            'RadarLineSeriesModule',
            'RadialBarSeriesModule',
            'RadialColumnSeriesModule',
            // Enterprise standalone series
            'PyramidSeriesModule',
            'LinearGaugeModule',
            'RadialGaugeModule',
            'SunburstSeriesModule',
            'TreemapSeriesModule',
            'ChordSeriesModule',
            'SankeySeriesModule',
            // Enterprise map series
            'MapShapeSeriesModule',
            'MapLineSeriesModule',
            'MapMarkerSeriesModule',
            'MapShapeBackgroundSeriesModule',
            'MapLineBackgroundSeriesModule',
            // Enterprise plugins
            'AnimationModule',
            'AnnotationsModule',
            'BandHighlightModule',
            'ChartToolbarModule',
            'ContextMenuModule',
            'CrosshairModule',
            'DataSourceModule',
            'ErrorBarsModule',
            'GradientLegendModule',
            'NavigatorModule',
            'RangesModule',
            'ScrollbarModule',
            'StatusBarModule',
            'SyncModule',
            'ZoomModule',
            // Enterprise chart types
            'TopologyChartModule',
            'StandaloneChartModule',
            // Enterprise presets
            'GaugePresetModule',
            'PriceVolumePresetModule',
            'FinancialChartModule',
        ],
    ],
    ['AllGaugeModule', ['LinearGaugeModule', 'RadialGaugeModule', 'GaugePresetModule', 'StandaloneChartModule']],
    [
        'AllMapSeriesModule',
        [
            'MapShapeSeriesModule',
            'MapLineSeriesModule',
            'MapMarkerSeriesModule',
            'MapShapeBackgroundSeriesModule',
            'MapLineBackgroundSeriesModule',
            'TopologyChartModule',
        ],
    ],
    [
        'FinancialChartModule',
        [
            'CandlestickSeriesModule',
            'OhlcSeriesModule',
            'BarSeriesModule',
            'LineSeriesModule',
            'NumberAxisModule',
            'TimeAxisModule',
            'CategoryAxisModule',
            'OrdinalTimeAxisModule',
            'AnimationModule',
            'CrosshairModule',
            'ZoomModule',
            'NavigatorModule',
            'AnnotationsModule',
            'ChartToolbarModule',
            'ContextMenuModule',
            'RangesModule',
            'StatusBarModule',
            'LegendModule',
            'LocaleModule',
            'CartesianChartModule',
            'PriceVolumePresetModule',
        ],
    ],
]);

// Axis module compatibility - modules that can satisfy a default axis requirement
// For example, GroupedCategoryAxisModule is a superset of CategoryAxisModule
export const axisModuleCompatibility = new Map([
    ['CategoryAxisModule', ['GroupedCategoryAxisModule']], // grouped-category can satisfy category axis requirement
]);

// Intrinsic defaults - modules that are expected without explicit options
export const intrinsicDefaults = {
    // Always expected for any chart
    always: ['LegendModule', 'GradientLegendModule'],
    // Expected when using enterprise features (commonly included for interactivity)
    enterprise: ['AnimationModule', 'ContextMenuModule', 'CrosshairModule'],
    // Expected for cartesian charts (axis modules)
    cartesian: [
        'CategoryAxisModule',
        'GroupedCategoryAxisModule',
        'NumberAxisModule',
        'TimeAxisModule',
        'LogAxisModule',
    ],
    // Expected for polar charts (axis modules)
    polar: ['AngleCategoryAxisModule', 'AngleNumberAxisModule', 'RadiusCategoryAxisModule', 'RadiusNumberAxisModule'],
};

// All valid module identifiers
export const validModuleIds = new Set([
    // Community series
    'AreaSeriesModule',
    'BarSeriesModule',
    'BubbleSeriesModule',
    'DonutSeriesModule',
    'HistogramSeriesModule',
    'LineSeriesModule',
    'PieSeriesModule',
    'ScatterSeriesModule',
    // Enterprise series
    'BoxPlotSeriesModule',
    'CandlestickSeriesModule',
    'ChordSeriesModule',
    'ConeFunnelSeriesModule',
    'FunnelSeriesModule',
    'HeatmapSeriesModule',
    'LinearGaugeModule',
    'MapLineBackgroundSeriesModule',
    'MapLineSeriesModule',
    'MapMarkerSeriesModule',
    'MapShapeBackgroundSeriesModule',
    'MapShapeSeriesModule',
    'NightingaleSeriesModule',
    'OhlcSeriesModule',
    'PyramidSeriesModule',
    'RadarAreaSeriesModule',
    'RadarLineSeriesModule',
    'RadialBarSeriesModule',
    'RadialColumnSeriesModule',
    'RadialGaugeModule',
    'RangeAreaSeriesModule',
    'RangeBarSeriesModule',
    'SankeySeriesModule',
    'SunburstSeriesModule',
    'TreemapSeriesModule',
    'WaterfallSeriesModule',
    // Community axes
    'CategoryAxisModule',
    'GroupedCategoryAxisModule',
    'LogAxisModule',
    'NumberAxisModule',
    'TimeAxisModule',
    'UnitTimeAxisModule',
    // Enterprise axes
    'AngleCategoryAxisModule',
    'AngleNumberAxisModule',
    'OrdinalTimeAxisModule',
    'RadiusCategoryAxisModule',
    'RadiusNumberAxisModule',
    // Plugins
    'AnimationModule',
    'AnnotationsModule',
    'BandHighlightModule',
    'ChartToolbarModule',
    'ContextMenuModule',
    'CrosshairModule',
    'DataSourceModule',
    'ErrorBarsModule',
    'GradientLegendModule',
    'LegendModule',
    'LocaleModule',
    'NavigatorModule',
    'RangesModule',
    'ScrollbarModule',
    'StatusBarModule',
    'SyncModule',
    'ZoomModule',
    // Chart types
    'CartesianChartModule',
    'PolarChartModule',
    'StandaloneChartModule',
    'TopologyChartModule',
    // Presets
    'GaugePresetModule',
    'PriceVolumePresetModule',
    'SparklinePresetModule',
    'FinancialChartModule',
    // Bundles
    'AllCommunityModule',
    'AllEnterpriseModule',
    'AllCartesianModule',
    'AllCartesianAxesModule',
    'AllCartesianSeriesModule',
    'AllPolarModule',
    'AllGaugeModule',
    'AllMapSeriesModule',
]);

// Bundle module IDs (these come from the main package, not individual imports)
const bundleModuleIds = new Set([
    'AllCommunityModule',
    'AllEnterpriseModule',
    'AllCartesianModule',
    'AllCartesianAxesModule',
    'AllCartesianSeriesModule',
    'AllPolarModule',
    'AllGaugeModule',
    'AllMapSeriesModule',
    'FinancialChartModule',
]);

// Module ID → Package name (for auto-fix import generation)
// Derived from enterpriseModules set - anything in that set is enterprise, else community
export const moduleToPackage = new Map(
    [...validModuleIds]
        .filter((moduleId) => !bundleModuleIds.has(moduleId))
        .map((moduleId) => [moduleId, enterpriseModules.has(moduleId) ? 'ag-charts-enterprise' : 'ag-charts-community'])
);
