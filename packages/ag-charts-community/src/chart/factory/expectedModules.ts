import { ModuleType } from 'ag-charts-core';

export type ChartType = 'cartesian' | 'polar' | 'topology' | 'standalone';

export interface ModulePlaceholder {
    type: `${ModuleType}` | ModuleType;
    name: string;
    moduleId: string;
    chartType?: ChartType;
    enterprise?: boolean;
}

/**
 * IMPORTANT: Make sure to update libraries/ag-charts-eslint-rules/rules/module-mappings.mjs
 * when adding/removing modules to keep example validation in sync.
 */
export const ExpectedModules = new Map<string, ModulePlaceholder>(
    (
        [
            // Chart types
            {
                type: 'chart',
                name: 'cartesian',
                moduleId: 'CartesianChartModule',
            },
            {
                type: 'chart',
                name: 'standalone',
                moduleId: 'StandaloneChartModule',
                enterprise: true,
            },
            {
                type: 'chart',
                name: 'polar',
                moduleId: 'PolarChartModule',
            },
            {
                type: 'chart',
                name: 'topology',
                moduleId: 'TopologyChartModule',
                enterprise: true,
            },

            // Axis types
            {
                type: 'axis',
                name: 'number',
                chartType: 'cartesian',
                moduleId: 'NumberAxisModule',
            },
            {
                type: 'axis',
                name: 'log',
                chartType: 'cartesian',
                moduleId: 'LogAxisModule',
            },
            {
                type: 'axis',
                name: 'time',
                chartType: 'cartesian',
                moduleId: 'TimeAxisModule',
            },
            {
                type: 'axis',
                name: 'unit-time',
                chartType: 'cartesian',
                moduleId: 'UnitTimeAxisModule',
            },
            {
                type: 'axis',
                name: 'category',
                chartType: 'cartesian',
                moduleId: 'CategoryAxisModule',
            },
            {
                type: 'axis',
                name: 'grouped-category',
                chartType: 'cartesian',
                moduleId: 'GroupedCategoryAxisModule',
            },
            {
                type: 'axis',
                name: 'ordinal-time',
                chartType: 'cartesian',
                enterprise: true,
                moduleId: 'OrdinalTimeAxisModule',
            },
            {
                type: 'axis',
                name: 'angle-category',
                chartType: 'polar',
                enterprise: true,
                moduleId: 'AngleCategoryAxisModule',
            },
            {
                type: 'axis',
                name: 'angle-number',
                chartType: 'polar',
                enterprise: true,
                moduleId: 'AngleNumberAxisModule',
            },
            {
                type: 'axis',
                name: 'radius-category',
                chartType: 'polar',
                enterprise: true,
                moduleId: 'RadiusCategoryAxisModule',
            },
            {
                type: 'axis',
                name: 'radius-number',
                chartType: 'polar',
                enterprise: true,
                moduleId: 'RadiusNumberAxisModule',
            },

            // Series types
            {
                type: 'series',
                name: 'bar',
                chartType: 'cartesian',
                moduleId: 'BarSeriesModule',
            },
            {
                type: 'series',
                name: 'scatter',
                chartType: 'cartesian',
                moduleId: 'ScatterSeriesModule',
            },
            {
                type: 'series',
                name: 'bubble',
                chartType: 'cartesian',
                moduleId: 'BubbleSeriesModule',
            },
            {
                type: 'series',
                name: 'line',
                chartType: 'cartesian',
                moduleId: 'LineSeriesModule',
            },
            {
                type: 'series',
                name: 'area',
                chartType: 'cartesian',
                moduleId: 'AreaSeriesModule',
            },
            {
                type: 'series',
                name: 'pie',
                chartType: 'polar',
                moduleId: 'PieSeriesModule',
            },
            {
                type: 'series',
                name: 'donut',
                chartType: 'polar',
                moduleId: 'DonutSeriesModule',
            },
            {
                type: 'series',
                name: 'box-plot',
                chartType: 'cartesian',
                enterprise: true,
                moduleId: 'BoxPlotSeriesModule',
            },
            {
                type: 'series',
                name: 'candlestick',
                chartType: 'cartesian',
                enterprise: true,
                moduleId: 'CandlestickSeriesModule',
            },
            {
                type: 'series',
                name: 'cone-funnel',
                chartType: 'cartesian',
                enterprise: true,
                moduleId: 'ConeFunnelSeriesModule',
            },
            {
                type: 'series',
                name: 'funnel',
                chartType: 'cartesian',
                enterprise: true,
                moduleId: 'FunnelSeriesModule',
            },
            {
                type: 'series',
                name: 'ohlc',
                chartType: 'cartesian',
                enterprise: true,
                moduleId: 'OhlcSeriesModule',
            },
            {
                type: 'series',
                name: 'heatmap',
                chartType: 'cartesian',
                enterprise: true,
                moduleId: 'HeatmapSeriesModule',
            },
            {
                type: 'series',
                name: 'histogram',
                chartType: 'cartesian',
                // enterprise: true,
                moduleId: 'HistogramSeriesModule',
            },
            {
                type: 'series',
                name: 'range-area',
                chartType: 'cartesian',
                enterprise: true,
                moduleId: 'RangeAreaSeriesModule',
            },
            {
                type: 'series',
                name: 'range-bar',
                chartType: 'cartesian',
                enterprise: true,
                moduleId: 'RangeBarSeriesModule',
            },
            {
                type: 'series',
                name: 'waterfall',
                chartType: 'cartesian',
                enterprise: true,
                moduleId: 'WaterfallSeriesModule',
            },
            {
                type: 'series',
                name: 'nightingale',
                chartType: 'polar',
                enterprise: true,
                moduleId: 'NightingaleSeriesModule',
            },
            {
                type: 'series',
                name: 'radar-area',
                chartType: 'polar',
                enterprise: true,
                moduleId: 'RadarAreaSeriesModule',
            },
            {
                type: 'series',
                name: 'radar-line',
                chartType: 'polar',
                enterprise: true,
                moduleId: 'RadarLineSeriesModule',
            },
            {
                type: 'series',
                name: 'radial-bar',
                chartType: 'polar',
                enterprise: true,
                moduleId: 'RadialBarSeriesModule',
            },
            {
                type: 'series',
                name: 'radial-column',
                chartType: 'polar',
                enterprise: true,
                moduleId: 'RadialColumnSeriesModule',
            },
            {
                type: 'series',
                name: 'map-shape',
                chartType: 'topology',
                enterprise: true,
                moduleId: 'MapShapeSeriesModule',
            },
            {
                type: 'series',
                name: 'map-line',
                chartType: 'topology',
                enterprise: true,
                moduleId: 'MapLineSeriesModule',
            },
            {
                type: 'series',
                name: 'map-marker',
                chartType: 'topology',
                enterprise: true,
                moduleId: 'MapMarkerSeriesModule',
            },
            {
                type: 'series',
                name: 'map-shape-background',
                chartType: 'topology',
                enterprise: true,
                moduleId: 'MapShapeBackgroundSeriesModule',
            },
            {
                type: 'series',
                name: 'map-line-background',
                chartType: 'topology',
                enterprise: true,
                moduleId: 'MapLineBackgroundSeriesModule',
            },
            {
                type: 'series',
                name: 'pyramid',
                chartType: 'standalone',
                enterprise: true,
                moduleId: 'PyramidSeriesModule',
            },
            {
                type: 'series',
                name: 'linear-gauge',
                chartType: 'standalone',
                enterprise: true,
                moduleId: 'LinearGaugeModule',
            },
            {
                type: 'series',
                name: 'radial-gauge',
                chartType: 'standalone',
                enterprise: true,
                moduleId: 'RadialGaugeModule',
            },
            {
                type: 'series',
                name: 'sunburst',
                chartType: 'standalone',
                enterprise: true,
                moduleId: 'SunburstSeriesModule',
            },
            {
                type: 'series',
                name: 'treemap',
                chartType: 'standalone',
                enterprise: true,
                moduleId: 'TreemapSeriesModule',
            },
            {
                type: 'series',
                name: 'chord',
                chartType: 'standalone',
                enterprise: true,
                moduleId: 'ChordSeriesModule',
            },
            {
                type: 'series',
                name: 'sankey',
                chartType: 'standalone',
                enterprise: true,
                moduleId: 'SankeySeriesModule',
            },

            // Plugins
            {
                type: 'plugin',
                name: 'animation',
                enterprise: true,
                moduleId: 'AnimationModule',
            },
            {
                type: 'plugin',
                name: 'annotations',
                chartType: 'cartesian',
                enterprise: true,
                moduleId: 'AnnotationsModule',
            },
            {
                type: 'plugin',
                name: 'legend',
                moduleId: 'LegendModule',
            },
            {
                type: 'plugin',
                name: 'locale',
                moduleId: 'LocaleModule',
            },
            {
                type: 'plugin',
                name: 'chartToolbar',
                chartType: 'cartesian',
                enterprise: true,
                moduleId: 'ChartToolbarModule',
            },
            {
                type: 'plugin',
                name: 'contextMenu',
                enterprise: true,
                moduleId: 'ContextMenuModule',
            },
            {
                type: 'plugin',
                name: 'statusBar',
                chartType: 'cartesian',
                enterprise: true,
                moduleId: 'StatusBarModule',
            },
            {
                type: 'plugin',
                name: 'dataSource',
                enterprise: true,
                moduleId: 'DataSourceModule',
            },
            {
                type: 'plugin',
                name: 'sync',
                chartType: 'cartesian',
                enterprise: true,
                moduleId: 'SyncModule',
            },
            {
                type: 'plugin',
                name: 'ranges',
                chartType: 'cartesian',
                enterprise: true,
                moduleId: 'RangesModule',
            },
            {
                type: 'plugin',
                name: 'zoom',
                enterprise: true,
                moduleId: 'ZoomModule',
            },
            {
                type: 'plugin',
                name: 'gradientLegend',
                enterprise: true,
                moduleId: 'GradientLegendModule',
            },
            {
                type: 'plugin',
                name: 'navigator',
                chartType: 'cartesian',
                enterprise: true,
                moduleId: 'NavigatorModule',
            },

            {
                type: 'axis:plugin',
                name: 'crosshair',
                chartType: 'cartesian',
                enterprise: true,
                moduleId: 'CrosshairModule',
            },
            {
                type: 'axis:plugin',
                name: 'bandHighlight',
                chartType: 'cartesian',
                enterprise: true,
                moduleId: 'BandHighlightModule',
            },

            {
                type: 'series:plugin',
                name: 'errorBar',
                chartType: 'cartesian',
                enterprise: true,
                moduleId: 'ErrorBarsModule',
            },

            {
                type: 'preset',
                name: 'gauge-preset',
                chartType: 'standalone',
                enterprise: true,
                moduleId: 'GaugePresetModule',
            },
            {
                type: 'preset',
                name: 'price-volume',
                chartType: 'cartesian',
                enterprise: true,
                moduleId: 'PriceVolumePresetModule',
            },
            {
                type: 'preset',
                name: 'sparkline',
                moduleId: 'SparklinePresetModule',
            },
        ] satisfies ModulePlaceholder[]
    ).map((m) => [m.name, m])
);

export function getSeriesExpectedChartType(seriesName: string): string | undefined {
    const expectedModule = ExpectedModules.get(seriesName);
    return expectedModule?.type === ModuleType.Series ? expectedModule.chartType : undefined;
}
