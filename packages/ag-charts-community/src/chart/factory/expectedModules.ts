import { ModuleType } from 'ag-charts-core';

export type ChartType = 'cartesian' | 'polar' | 'topology' | 'standalone';

interface ModulePlaceholder {
    type: `${ModuleType}` | ModuleType;
    name: string;
    chartType?: ChartType;
    enterprise?: boolean;
    removable?: false | 'standalone';
}

export const ExpectedModules: ModulePlaceholder[] = [
    // Chart types
    { type: 'chart', name: 'cartesian' },
    { type: 'chart', name: 'standalone' },
    { type: 'chart', name: 'polar' }, // TODO refactor pie/donut to be a standalone chart type, and make polar an enterprise feature
    { type: 'chart', name: 'topology', enterprise: true },

    // Axis types
    { type: 'axis', name: 'number', chartType: 'cartesian' },
    { type: 'axis', name: 'log', chartType: 'cartesian' },
    { type: 'axis', name: 'time', chartType: 'cartesian' },
    { type: 'axis', name: 'unit-time', chartType: 'cartesian' },
    { type: 'axis', name: 'category', chartType: 'cartesian' },
    { type: 'axis', name: 'grouped-category', chartType: 'cartesian' },
    { type: 'axis', name: 'ordinal-time', chartType: 'cartesian', enterprise: true },
    { type: 'axis', name: 'angle-category', chartType: 'polar', enterprise: true },
    { type: 'axis', name: 'angle-number', chartType: 'polar', enterprise: true },
    { type: 'axis', name: 'radius-category', chartType: 'polar', enterprise: true },
    { type: 'axis', name: 'radius-number', chartType: 'polar', enterprise: true },

    // Series types
    { type: 'series', name: 'bar', chartType: 'cartesian' },
    { type: 'series', name: 'scatter', chartType: 'cartesian' },
    { type: 'series', name: 'bubble', chartType: 'cartesian' },
    { type: 'series', name: 'line', chartType: 'cartesian' },
    { type: 'series', name: 'area', chartType: 'cartesian' },
    { type: 'series', name: 'pie', chartType: 'polar' }, // TODO should be of chartType standalone
    { type: 'series', name: 'donut', chartType: 'polar' }, // TODO should be of chartType standalone
    { type: 'series', name: 'box-plot', chartType: 'cartesian', enterprise: true },
    { type: 'series', name: 'candlestick', chartType: 'cartesian', enterprise: true },
    { type: 'series', name: 'cone-funnel', chartType: 'cartesian', enterprise: true },
    { type: 'series', name: 'funnel', chartType: 'cartesian', enterprise: true },
    { type: 'series', name: 'ohlc', chartType: 'cartesian', enterprise: true },
    { type: 'series', name: 'heatmap', chartType: 'cartesian', enterprise: true },
    { type: 'series', name: 'histogram', chartType: 'cartesian' /*, enterprise: true*/ },
    { type: 'series', name: 'range-area', chartType: 'cartesian', enterprise: true },
    { type: 'series', name: 'range-bar', chartType: 'cartesian', enterprise: true },
    { type: 'series', name: 'waterfall', chartType: 'cartesian', enterprise: true },
    { type: 'series', name: 'nightingale', chartType: 'polar', enterprise: true },
    { type: 'series', name: 'radar-area', chartType: 'polar', enterprise: true },
    { type: 'series', name: 'radar-line', chartType: 'polar', enterprise: true },
    { type: 'series', name: 'radial-bar', chartType: 'polar', enterprise: true },
    { type: 'series', name: 'radial-column', chartType: 'polar', enterprise: true },
    { type: 'series', name: 'map-shape', chartType: 'topology', enterprise: true },
    { type: 'series', name: 'map-line', chartType: 'topology', enterprise: true },
    { type: 'series', name: 'map-marker', chartType: 'topology', enterprise: true },
    { type: 'series', name: 'map-shape-background', chartType: 'topology', enterprise: true },
    { type: 'series', name: 'map-line-background', chartType: 'topology', enterprise: true },
    { type: 'series', name: 'pyramid', chartType: 'standalone', enterprise: true },
    { type: 'series', name: 'linear-gauge', chartType: 'standalone', enterprise: true },
    { type: 'series', name: 'radial-gauge', chartType: 'standalone', enterprise: true },
    { type: 'series', name: 'sunburst', chartType: 'standalone', enterprise: true },
    { type: 'series', name: 'treemap', chartType: 'standalone', enterprise: true },
    { type: 'series', name: 'chord', chartType: 'standalone', enterprise: true },
    { type: 'series', name: 'sankey', chartType: 'standalone', enterprise: true },

    // Plugins
    { type: 'plugin', name: 'animation', enterprise: true },
    { type: 'plugin', name: 'annotations', chartType: 'cartesian', enterprise: true },
    { type: 'plugin', name: 'background', enterprise: true, removable: false },
    { type: 'plugin', name: 'foreground', enterprise: true },
    { type: 'plugin', name: 'chartToolbar', chartType: 'cartesian', enterprise: true },
    { type: 'plugin', name: 'contextMenu', enterprise: true },
    { type: 'plugin', name: 'statusBar', chartType: 'cartesian', enterprise: true },
    { type: 'plugin', name: 'dataSource', enterprise: true },
    { type: 'plugin', name: 'sync', chartType: 'cartesian', enterprise: true },
    { type: 'plugin', name: 'ranges', chartType: 'cartesian', enterprise: true },
    { type: 'plugin', name: 'zoom', enterprise: true },
    { type: 'plugin', name: 'gradientLegend', enterprise: true },
    { type: 'plugin', name: 'navigator', chartType: 'cartesian', enterprise: true },

    { type: 'axis:plugin', name: 'crosshair', chartType: 'cartesian', enterprise: true },
    { type: 'axis:plugin', name: 'bandHighlight', chartType: 'cartesian', enterprise: true },

    { type: 'series:plugin', name: 'errorBar', chartType: 'cartesian', enterprise: true },

    { type: 'preset', name: 'gauge-preset', chartType: 'standalone', enterprise: true },
    { type: 'preset', name: 'price-volume', chartType: 'cartesian', enterprise: true },
];

const SeriesExpectedChartType = new Map<string, ChartType>(
    ExpectedModules.filter((m) => m.type === 'series').map((m) => [m.name, m.chartType!])
);

export function getSeriesExpectedChartType(seriesName: string): string | undefined {
    return SeriesExpectedChartType.get(seriesName);
}
