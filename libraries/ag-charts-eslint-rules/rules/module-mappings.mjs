/**
 * @fileoverview Module mappings for the AG Charts example-validation ESLint rule.
 *
 * Everything derivable from the module definitions lives in `module-mappings.generated.mjs`, kept in
 * step by `packages/ag-charts-enterprise/src/moduleTables.test.ts`. This file holds the knowledge the
 * definitions do not carry, and merges it with the generated tables.
 */
import * as generated from './module-mappings.generated.mjs';

export {
    axisPluginToModule,
    axisTypeToModule,
    bundleContents,
    cartesianSeriesModules,
    enterpriseBundleContents,
    enterpriseImpliedModules,
    enterpriseModules,
    impliedModules,
    moduleToPackage,
    pluginOptionToModule,
    polarAxisPluginToModule,
    polarSeriesModules,
    seriesChartType,
    seriesPluginToModule,
    seriesTypeToModule,
    validModuleIds,
} from './module-mappings.generated.mjs';

// The cross-line events are dispatched by the cross-lines plugins, which own `axes[].crossLines` rather
// than declaring the listener paths, so they are listed here alongside the generated listener owners.
export const axisListenerToModule = new Map([
    ...generated.axisListenerToModule,
    ['crossLineClick', 'CrossLinesModule'],
    ['crossLineDoubleClick', 'CrossLinesModule'],
]);

export const chartListenerToModule = new Map([
    ...generated.chartListenerToModule,
    ['crossLineClick', 'CrossLinesModule'],
    ['crossLineDoubleClick', 'CrossLinesModule'],
]);

// Nested annotations plugin option → Module ID
export const annotationsPluginToModule = new Map([['toolbar', 'ChartToolbarModule']]);

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
