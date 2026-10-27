// Modules brought in by another module's `dependencies` count as registered. The enterprise axis
// modules carry such a dependency and the community ones do not, so the import package matters here.
import { AllCommunityModule, LineSeriesModule, NumberAxisModule, TimeAxisModule } from 'ag-charts-community';
import {
    AgCharts,
    AreaSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    GroupedCategoryAxisModule,
    ScrollbarModule,
    UnitTimeAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

// =============================================================================
// TEST CASE 1: Enterprise axes register background regions as a dependency - should pass
// =============================================================================
const impliedByEnterpriseAxes = {
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    seriesArea: { backgroundRegions: [{ xRange: { start: 0, end: 1 } }] },
    axes: {
        x: { type: 'unit-time' },
        y: { type: 'grouped-category' },
    },
};
AgCharts.create(impliedByEnterpriseAxes, {
    modules: [LineSeriesModule, UnitTimeAxisModule, GroupedCategoryAxisModule],
});

// =============================================================================
// TEST CASE 2: Community axes have no such dependency - should error
// =============================================================================
const notImpliedByCommunityAxes = {
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    seriesArea: { backgroundRegions: [{ xRange: { start: 0, end: 1 } }] },
    axes: {
        x: { type: 'time' },
        y: { type: 'number' },
    },
};
AgCharts.create(notImpliedByCommunityAxes, { modules: [LineSeriesModule, TimeAxisModule, NumberAxisModule] });

// =============================================================================
// TEST CASE 3: Zoom and scrollbar register background regions through their own dependency chain - should pass
// =============================================================================
const impliedByZoom = {
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'time' }, y: { type: 'number' } },
    zoom: {},
    seriesArea: { backgroundRegions: [{ xRange: { start: 0, end: 1 } }] },
};
AgCharts.create(impliedByZoom, { modules: [LineSeriesModule, TimeAxisModule, NumberAxisModule, ZoomModule] });
const impliedByScrollbar = {
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'time' }, y: { type: 'number' } },
    scrollbar: {},
    seriesArea: { backgroundRegions: [{ xRange: { start: 0, end: 1 } }] },
};
AgCharts.create(impliedByScrollbar, { modules: [LineSeriesModule, TimeAxisModule, NumberAxisModule, ScrollbarModule] });

// =============================================================================
// TEST CASE 4: Two registered modules imply the same internal module - should pass
// =============================================================================
const impliedTwice = {
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    seriesArea: { backgroundRegions: [{ xRange: { start: 0, end: 1 } }] },
    axes: {
        x: { type: 'unit-time' },
        y: { type: 'number' },
    },
    contextMenu: {},
};
AgCharts.create(impliedTwice, {
    modules: [LineSeriesModule, UnitTimeAxisModule, NumberAxisModule, ContextMenuModule],
});

// TEST CASE 5: Community bundles do not bring in the enterprise background regions - should error
const communityBundle = {
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    seriesArea: { backgroundRegions: [{ xRange: { start: 0, end: 1 } }] },
    axes: {
        x: { type: 'number' },
        y: { type: 'number' },
    },
};
AgCharts.create(communityBundle, { modules: [AllCommunityModule] });

// TEST CASE 6: A module whose dependency another registered module already provides is unnecessary - should error
const zoomNotNeeded = {
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    seriesArea: { backgroundRegions: [{ xRange: { start: 0, end: 1 } }] },
    axes: {
        x: { type: 'unit-time' },
        y: { type: 'grouped-category' },
    },
};
AgCharts.create(zoomNotNeeded, {
    modules: [LineSeriesModule, UnitTimeAxisModule, GroupedCategoryAxisModule, ZoomModule],
});

// TEST CASE 7: Missing modules already imported from enterprise, re-exported or enterprise variants, are fixable - should error
const importedFromEnterprise = {
    series: [{ type: 'area', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'category' }, y: { type: 'number' } },
};
AgCharts.create(importedFromEnterprise, { modules: [NumberAxisModule] });

// TEST CASE 8: An axis listener needs the enterprise variant of its own axis only - should error
const axisListener = {
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'time', listeners: { click: () => {} } }, y: { type: 'number' } },
};
AgCharts.create(axisListener, { modules: [LineSeriesModule, TimeAxisModule, NumberAxisModule] });

// TEST CASE 9: A chart-level axis listener needs the enterprise variant of every axis in use - should error
const chartAxisListener = {
    series: [{ type: 'area', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'category' }, y: { type: 'number' } },
    listeners: { axisClick: () => {} },
};
AgCharts.create(chartAxisListener, { modules: [AreaSeriesModule, NumberAxisModule] });
