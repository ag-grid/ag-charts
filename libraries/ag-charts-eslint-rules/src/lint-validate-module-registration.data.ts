// Stub ModuleRegistry
const ModuleRegistry = {
    registerModules: (_modules: unknown[]) => {},
    reset: () => {},
};

// Stub AgCharts
const AgCharts = {
    create: (_options: unknown) => ({}),
};

// Stub module identifiers
const BarSeriesModule = {};
const LineSeriesModule = {};
const AreaSeriesModule = {};
const ScatterSeriesModule = {};
const PieSeriesModule = {};
const DonutSeriesModule = {};
const CategoryAxisModule = {};
const NumberAxisModule = {};
const TimeAxisModule = {};
const LogAxisModule = {};
const LegendModule = {};
const LocaleModule = {};
const AnimationModule = {};
const ZoomModule = {};
const CrosshairModule = {};
const NavigatorModule = {};
const ErrorBarsModule = {};
const TreemapSeriesModule = {};
const HeatmapSeriesModule = {};
const AllCommunityModule = {};
const AllEnterpriseModule = {};
const DataSourceModule = {};
const ContextMenuModule = {};
const CandlestickSeriesModule = {};
const OrdinalTimeAxisModule = {};

// =============================================================================
// TEST CASE 1: Correct registration - should pass
// =============================================================================
ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule, LegendModule]);
const correctOptions1 = {
    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'category' }, y: { type: 'number' } },
};
AgCharts.create(correctOptions1);
ModuleRegistry.reset();

// =============================================================================
// TEST CASE 2: Missing series module - should error
// =============================================================================
ModuleRegistry.registerModules([CategoryAxisModule, NumberAxisModule, LegendModule]);
const missingSeriesModule = {
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'category' }, y: { type: 'number' } },
};
AgCharts.create(missingSeriesModule);
ModuleRegistry.reset();

// =============================================================================
// TEST CASE 3: Missing axis module - should error
// =============================================================================
ModuleRegistry.registerModules([BarSeriesModule, NumberAxisModule, LegendModule]);
const missingAxisModule = {
    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'category' }, y: { type: 'number' } },
};
AgCharts.create(missingAxisModule);
ModuleRegistry.reset();

// =============================================================================
// TEST CASE 4: Over-registration - should warn
// =============================================================================
ModuleRegistry.registerModules([
    BarSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
    LegendModule,
    TreemapSeriesModule, // Not used
]);
const overRegistration = {
    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'category' }, y: { type: 'number' } },
};
AgCharts.create(overRegistration);
ModuleRegistry.reset();

// =============================================================================
// TEST CASE 5: Bundle module covers requirements - should pass
// =============================================================================
ModuleRegistry.registerModules([AllCommunityModule]);
const bundleCovers = {
    series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'category' }, y: { type: 'number' } },
};
AgCharts.create(bundleCovers);
ModuleRegistry.reset();

// =============================================================================
// TEST CASE 6: Missing crosshair module - should error
// =============================================================================
ModuleRegistry.registerModules([LineSeriesModule, CategoryAxisModule, NumberAxisModule, LegendModule]);
const missingCrosshair = {
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    axes: {
        x: { type: 'category', crosshair: { enabled: true } },
        y: { type: 'number' },
    },
};
AgCharts.create(missingCrosshair);
ModuleRegistry.reset();

// =============================================================================
// TEST CASE 7: Plugin option requires module - should error (missing zoom)
// =============================================================================
ModuleRegistry.registerModules([LineSeriesModule, CategoryAxisModule, NumberAxisModule, LegendModule]);
const missingZoom = {
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'category' }, y: { type: 'number' } },
    zoom: { enabled: true },
};
AgCharts.create(missingZoom);
ModuleRegistry.reset();

// =============================================================================
// TEST CASE 8: Multiple series types - all should be required
// =============================================================================
ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule, LegendModule]);
const multipleSeriesTypes = {
    series: [
        { type: 'bar', xKey: 'x', yKey: 'y1' },
        { type: 'line', xKey: 'x', yKey: 'y2' }, // Missing LineSeriesModule
    ],
    axes: { x: { type: 'category' }, y: { type: 'number' } },
};
AgCharts.create(multipleSeriesTypes);
ModuleRegistry.reset();

// =============================================================================
// TEST CASE 9: ErrorBar requires ErrorBarsModule
// =============================================================================
ModuleRegistry.registerModules([ScatterSeriesModule, NumberAxisModule, LegendModule]);
const errorBarMissing = {
    series: [
        {
            type: 'scatter',
            xKey: 'x',
            yKey: 'y',
            errorBar: { yLowerKey: 'yLow', yUpperKey: 'yHigh' },
        },
    ],
    axes: { x: { type: 'number' }, y: { type: 'number' } },
};
AgCharts.create(errorBarMissing);
ModuleRegistry.reset();

// =============================================================================
// TEST CASE 10: Correct with plugins - should pass
// =============================================================================
ModuleRegistry.registerModules([
    LineSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
    LegendModule,
    ZoomModule,
    CrosshairModule,
    NavigatorModule,
]);
const correctWithPlugins = {
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    axes: {
        x: { type: 'category', crosshair: { enabled: true } },
        y: { type: 'number' },
    },
    zoom: { enabled: true },
    navigator: { enabled: true },
};
AgCharts.create(correctWithPlugins);
ModuleRegistry.reset();

// =============================================================================
// TEST CASE 11: Pie chart with polar modules
// =============================================================================
ModuleRegistry.registerModules([PieSeriesModule, LegendModule]);
const pieChart = {
    series: [{ type: 'pie', angleKey: 'value', calloutLabelKey: 'label' }],
};
AgCharts.create(pieChart);
ModuleRegistry.reset();

// =============================================================================
// TEST CASE 12: DataSource requires DataSourceModule
// =============================================================================
ModuleRegistry.registerModules([LineSeriesModule, CategoryAxisModule, NumberAxisModule, LegendModule]);
const dataSourceMissing = {
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'category' }, y: { type: 'number' } },
    dataSource: { getData: () => [] },
};
AgCharts.create(dataSourceMissing);
ModuleRegistry.reset();

// =============================================================================
// TEST CASE 13: Candlestick with only y-axis - should require OrdinalTimeAxisModule for default x
// =============================================================================
ModuleRegistry.registerModules([CandlestickSeriesModule, NumberAxisModule, OrdinalTimeAxisModule, LegendModule]);
const candlestickOnlyYAxis = {
    series: [
        {
            type: 'candlestick',
            xKey: 'date',
            openKey: 'open',
            closeKey: 'close',
            highKey: 'high',
            lowKey: 'low',
        },
    ],
    axes: {
        y: { type: 'number', nice: false },
    },
};
AgCharts.create(candlestickOnlyYAxis);
ModuleRegistry.reset();

// =============================================================================
// TEST CASE 14: Candlestick with only x-axis - should require NumberAxisModule for default y
// =============================================================================
ModuleRegistry.registerModules([CandlestickSeriesModule, NumberAxisModule, OrdinalTimeAxisModule, LegendModule]);
const candlestickOnlyXAxis = {
    series: [
        {
            type: 'candlestick',
            xKey: 'date',
            openKey: 'open',
            closeKey: 'close',
            highKey: 'high',
            lowKey: 'low',
        },
    ],
    axes: {
        x: { type: 'ordinal-time' },
    },
};
AgCharts.create(candlestickOnlyXAxis);
ModuleRegistry.reset();

// =============================================================================
// TEST CASE 15: Candlestick with both axes - should pass
// =============================================================================
ModuleRegistry.registerModules([CandlestickSeriesModule, NumberAxisModule, OrdinalTimeAxisModule, LegendModule]);
const candlestickBothAxes = {
    series: [
        {
            type: 'candlestick',
            xKey: 'date',
            openKey: 'open',
            closeKey: 'close',
            highKey: 'high',
            lowKey: 'low',
        },
    ],
    axes: {
        x: { type: 'ordinal-time' },
        y: { type: 'number' },
    },
};
AgCharts.create(candlestickBothAxes);
ModuleRegistry.reset();

// =============================================================================
// TEST CASE 16: flashOnUpdate requires FlashOnUpdateModule
// =============================================================================
ModuleRegistry.registerModules([LineSeriesModule, CategoryAxisModule, NumberAxisModule, LegendModule]);
const flashOnUpdateMissing = {
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'category' }, y: { type: 'number' } },
    flashOnUpdate: { enabled: true },
};
AgCharts.create(flashOnUpdateMissing);
ModuleRegistry.reset();
