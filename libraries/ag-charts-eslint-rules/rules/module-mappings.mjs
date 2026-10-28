/**
 * @fileoverview Module mappings for the AG Charts example-validation ESLint rule.
 *
 * Everything derivable from the module definitions lives in `module-mappings.generated.mjs`, kept in
 * step by `packages/ag-charts-enterprise/src/moduleTables.test.ts`. This file holds the knowledge the
 * definitions do not carry, and re-exports the generated tables.
 */
export {
    axisListenerToDefinition,
    axisPluginToDefinition,
    axisTypeToDefinition,
    bundleContents,
    cartesianSeriesModules,
    chartListenerToDefinition,
    chartOptionPathToDefinition,
    definitions,
    enterpriseModuleContents,
    moduleContents,
    pluginOptionToDefinition,
    polarAxisPluginToDefinition,
    polarSeriesModules,
    seriesChartType,
    seriesPluginToDefinition,
    seriesTypeToDefinition,
    validModuleIds,
} from './module-mappings.generated.mjs';

// Nested annotations plugin option → definition name
export const annotationsPluginToDefinition = new Map([['toolbar', 'chartToolbar']]);

// Axis compatibility - axis definitions that can satisfy a default axis requirement
// For example, grouped-category is a superset of category
export const axisModuleCompatibility = new Map([['category', ['grouped-category']]]);

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
    ['hlc', { x: 'ordinal-time', y: 'number' }],
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
