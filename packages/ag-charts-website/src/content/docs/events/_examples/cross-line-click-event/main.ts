import type {
    AgAxisValue,
    AgCartesianChartOptions,
    AgCrossLineClickEvent,
    AgCrossLineDoubleClickEvent,
    AgCrossLineListeners,
} from 'ag-charts-community';
import {
    AgCharts,
    AreaSeriesModule,
    CrossLinesModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-community';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([
    AreaSeriesModule,
    CrossLinesModule,
    LegendModule,
    NumberAxisModule,
    UnitTimeAxisModule,
]);

const lockdownLabelStyle = { fontStyle: 'italic', position: 'bottom' } as const;
const variantLineStyle = { stroke: '#F59E0B', strokeWidth: 2, lineDash: [6, 4] };
const variantLabelStyle = { color: '#F59E0B', position: 'top' } as const;

function formatValue(value: AgAxisValue | undefined) {
    if (value instanceof Date) {
        return value.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return String(value);
}

function toString(ev: AgCrossLineClickEvent | AgCrossLineDoubleClickEvent) {
    // A `line` Cross Line carries `value`; a `range` Cross Line carries `range` instead.
    const at = ev.range != null ? `${formatValue(ev.range[0])} to ${formatValue(ev.range[1])}` : formatValue(ev.value);
    // `allMatchedParams` also reports any series node under the click point, so pick the right identifier.
    const allMatched = ev.allMatchedParams
        .map((params) => ('crossLineId' in params ? params.crossLineId : params.seriesId))
        .join(', ');
    return `crossLineId: ${ev.crossLineId} (${ev.crossLineType}) on ${ev.axisId}, at: ${at}, allMatchedParams: [${allMatched}]`;
}

const lockdownListeners: AgCrossLineListeners = {
    click: (ev) => console.log('[lockdown click]', toString(ev)),
    doubleClick: (ev) => console.log('[lockdown double click]', toString(ev)),
};

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'COVID-19 ICU Bed Usage',
    },
    subtitle: {
        text: 'Monthly peak ICU occupancy',
    },
    data: getData(),
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
            label: {
                spacing: 25,
            },
            crossLines: [
                {
                    id: 'first-lockdown',
                    type: 'range',
                    range: [new Date(2020, 2, 23), new Date(2020, 5, 1)],
                    label: {
                        text: 'First lockdown',
                        ...lockdownLabelStyle,
                    },
                    listeners: lockdownListeners,
                },
                {
                    id: 'winter-lockdown',
                    type: 'range',
                    range: [new Date(2020, 10, 5), new Date(2021, 1, 15)],
                    label: {
                        text: 'Winter lockdown',
                        ...lockdownLabelStyle,
                    },
                    listeners: lockdownListeners,
                },
                {
                    id: 'soft-lockdown',
                    type: 'range',
                    range: [new Date(2021, 11, 20), new Date(2022, 1, 15)],
                    label: {
                        text: 'Soft lockdown',
                        ...lockdownLabelStyle,
                    },
                    listeners: lockdownListeners,
                },
                {
                    id: 'alpha-variant',
                    type: 'line',
                    value: new Date(2020, 11, 1),
                    ...variantLineStyle,
                    label: {
                        text: 'Alpha',
                        ...variantLabelStyle,
                    },
                },
                {
                    id: 'delta-variant',
                    type: 'line',
                    value: new Date(2021, 6, 1),
                    ...variantLineStyle,
                    label: {
                        text: 'Delta',
                        ...variantLabelStyle,
                    },
                },
                {
                    id: 'omicron-variant',
                    type: 'line',
                    value: new Date(2021, 10, 1),
                    ...variantLineStyle,
                    label: {
                        text: 'Omicron',
                        ...variantLabelStyle,
                    },
                },
            ],
            listeners: {
                crossLineClick: (ev) => console.log('[x axis cross line click]', toString(ev)),
                crossLineDoubleClick: (ev) => console.log('[x axis cross line double click]', toString(ev)),
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'ICU beds occupied',
            },
            crossLines: [
                {
                    id: 'icu-capacity',
                    type: 'line',
                    value: 700,
                    stroke: '#EF4444',
                    strokeWidth: 2,
                    lineDash: [8, 4],
                    label: {
                        text: 'ICU capacity (700 beds)',
                        position: 'top-right',
                    },
                    listeners: {
                        click: (ev) => console.log('[capacity click]', toString(ev)),
                        doubleClick: (ev) => console.log('[capacity double click]', toString(ev)),
                    },
                },
            ],
        },
    },
    series: [
        {
            type: 'area',
            xKey: 'month',
            yKey: 'maxICU',
            yName: 'ICU beds occupied',
            strokeWidth: 1,
            fillOpacity: 0.5,
            fill: {
                type: 'gradient',
                colorStops: [
                    { color: '#ffffff', stop: 0 },
                    { color: '#7da9e8', stop: 0.75 },
                    { color: '#2c6ed5', stop: 1 },
                ],
            },
        },
    ],
    listeners: {
        crossLineClick: (ev) => console.log('[chart cross line click]', toString(ev)),
        crossLineDoubleClick: (ev) => console.log('[chart cross line double click]', toString(ev)),
    },
};

AgCharts.create(options);
