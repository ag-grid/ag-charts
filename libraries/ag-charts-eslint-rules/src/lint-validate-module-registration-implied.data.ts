// Modules brought in by another module's `dependencies` count as registered. The enterprise axis
// modules carry such a dependency and the community ones do not, so the import package matters here.
import { LineSeriesModule, NumberAxisModule, TimeAxisModule } from 'ag-charts-community';
import {
    AgCharts,
    AxisInteractionModule,
    ContextMenuModule,
    GroupedCategoryAxisModule,
    ScrollbarModule,
    UnitTimeAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

// =============================================================================
// TEST CASE 1: Enterprise axes register axis interaction as a dependency - should pass
// =============================================================================
const impliedByEnterpriseAxes = {
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    axes: {
        x: { type: 'unit-time', listeners: { click: () => {} } },
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
    axes: {
        x: { type: 'time', listeners: { click: () => {} } },
        y: { type: 'number' },
    },
};
AgCharts.create(notImpliedByCommunityAxes, { modules: [LineSeriesModule, TimeAxisModule, NumberAxisModule] });

// =============================================================================
// TEST CASE 3: Zoom and scrollbar register axis interaction through their own dependency chain - should pass
// =============================================================================
const impliedByZoom = {
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'time' }, y: { type: 'number' } },
    zoom: {},
    listeners: { axisClick: () => {} },
};
AgCharts.create(impliedByZoom, { modules: [LineSeriesModule, TimeAxisModule, NumberAxisModule, ZoomModule] });
const impliedByScrollbar = {
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    axes: { x: { type: 'time' }, y: { type: 'number' } },
    scrollbar: {},
    listeners: { axisClick: () => {} },
};
AgCharts.create(impliedByScrollbar, { modules: [LineSeriesModule, TimeAxisModule, NumberAxisModule, ScrollbarModule] });

// =============================================================================
// TEST CASE 4: Explicitly registering an implied module alongside its dependent - should pass
// =============================================================================
const explicitAndImplied = {
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    axes: {
        x: { type: 'unit-time', listeners: { click: () => {} } },
        y: { type: 'number' },
    },
    contextMenu: {},
};
AgCharts.create(explicitAndImplied, {
    modules: [LineSeriesModule, UnitTimeAxisModule, NumberAxisModule, AxisInteractionModule, ContextMenuModule],
});
