import { type ModuleDefinition, ModuleType } from 'ag-charts-core';

interface ModulePlaceholder {
    type: `${ModuleType}` | ModuleType;
    name: string;
    chartType?: string;
    enterprise?: boolean;
}

const ExpectedModules: ModulePlaceholder[] = [
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
    { type: 'plugin', name: 'background', enterprise: true },
    { type: 'plugin', name: 'foreground', enterprise: true },
    { type: 'plugin', name: 'chartToolbar', chartType: 'cartesian', enterprise: true },
    { type: 'plugin', name: 'contextMenu', enterprise: true },
    { type: 'plugin', name: 'statusBar', chartType: 'cartesian', enterprise: true },
    { type: 'plugin', name: 'dataSource', enterprise: true },
    { type: 'plugin', name: 'sync', chartType: 'cartesian', enterprise: true },
    { type: 'plugin', name: 'ranges', chartType: 'cartesian', enterprise: true },
    {
        type: 'plugin',
        name: 'zoom',
        // chartTypes: ['cartesian', 'topology']
        enterprise: true,
    },
    { type: 'plugin', name: 'gradientLegend', enterprise: true },
    { type: 'plugin', name: 'navigator', chartType: 'cartesian', enterprise: true },

    { type: 'axis:plugin', name: 'crosshair', chartType: 'cartesian', enterprise: true },
    { type: 'axis:plugin', name: 'bandHighlight', chartType: 'cartesian', enterprise: true },

    { type: 'series:plugin', name: 'errorBar', chartType: 'cartesian', enterprise: true },

    // { type: 'context', contextKey: 'sharedToolbar', chartTypes: ['cartesian'] },
];

export function getSeriesExpectedChartType(seriesName: string): string | undefined {
    const series = ExpectedModules.find((m) => m.type === 'series' && m.name === seriesName);
    return series?.chartType;
}

const verifiedModules = new Set<string>();
export function verifyIfModuleExpected(module: ModuleDefinition) {
    if (!module.enterprise) {
        throw new Error('AG Charts - internal configuration error, only enterprise modules need verification.');
    }
    for (const s of ExpectedModules) {
        if (s.type === module.type && s.name === module.name) {
            verifiedModules.add(s.name);
            return true;
        }
    }
    return false;
}

export function getUnusedExpectedModules() {
    const unusedExpectedModules = new Set<string>();
    for (const s of ExpectedModules) {
        if (s.enterprise && !verifiedModules.has(s.name)) {
            unusedExpectedModules.add(s.name);
        }
    }
    return unusedExpectedModules;
}
