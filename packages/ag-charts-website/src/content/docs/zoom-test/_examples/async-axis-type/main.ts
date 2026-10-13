// @ag-skip-fws
import {
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    DataSourceModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NavigatorModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    TimeAxisModule,
    UnitTimeAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { FakeServer } from './fakeServer';

ModuleRegistry.registerModules([
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    DataSourceModule,
    LegendModule,
    LineSeriesModule,
    NavigatorModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    TimeAxisModule,
    UnitTimeAxisModule,
    ZoomModule,
]);

type AxisType = 'ordinal-time' | 'unit-time' | 'time';
type XAxisOptions = NonNullable<NonNullable<AgCartesianChartOptions['axes']>['x']>;

const xAxes: Record<AxisType, XAxisOptions> = {
    'ordinal-time': { type: 'ordinal-time' },
    'unit-time': { type: 'unit-time', unit: 'day' },
    time: { type: 'time' },
};

let session = { requests: 0, lines: [] as string[] };

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Async data: x-axis type' },
    dataSource: {
        getData: async (params) => {
            const requestSession = session;
            requestSession.requests++;
            updateRequestCount();
            const { data, granularity } = await FakeServer.get(params);
            logRequest(requestSession, params, data.length, granularity);
            return data;
        },
    },
    navigator: { enabled: true },
    zoom: { enabled: true, buttons: { visible: 'always' } },
    initialState: {
        zoom: {
            rangeX: {
                start: { __type: 'date', value: new Date('2023-03-21').getTime() },
            },
        },
    },
    series: [{ type: 'line', xKey: 'time', yKey: 'price', yName: 'Price' }],
    axes: {
        y: { type: 'number', min: 400, max: 1600 },
        x: xAxes['ordinal-time'],
    },
};

let chart = AgCharts.create(options);

// Recreate the chart rather than updating it, so that every axis type is exercised from a fresh initial load.
function changeAxisType(axisType: AxisType) {
    chart.destroy();
    session = { requests: 0, lines: [] };
    document.getElementById('requestLog')!.textContent = '';
    options.axes!.x = xAxes[axisType];
    chart = AgCharts.create(options);
}

/** inScope */
function logRequest(
    requestSession: typeof session,
    { source, windowStart, windowEnd }: { source?: string; windowStart?: unknown; windowEnd?: unknown },
    count: number,
    granularity: string
) {
    // Ignore responses that arrive after the chart has been recreated.
    if (requestSession !== session) return;
    requestSession.lines.push(
        `#${requestSession.requests} ${source ?? 'unknown'} | ${formatWindow(windowStart)} -> ${formatWindow(windowEnd)} | ${count} pts | ${granularity}`
    );
    document.getElementById('requestLog')!.textContent = requestSession.lines.join('\n');
}

/** inScope */
function formatWindow(value: unknown) {
    if (value === undefined) return 'undefined';
    const date = new Date(value as Date | number | string);
    return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
}

/** inScope */
function updateRequestCount() {
    document.getElementById('requestCount')!.textContent = `getData() calls: ${session.requests}`;
}
