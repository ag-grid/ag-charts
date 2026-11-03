import {
    AgCartesianChartOptions,
    AgCartesianCrossLineLabelPlacement,
    AgCharts,
    CrossLinesModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    TimeAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([CrossLinesModule, LineSeriesModule, NumberAxisModule, TimeAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Monthly Revenue',
    },
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'revenue',
            yName: 'Revenue',
        },
    ],
    axes: {
        x: {
            type: 'time',
            crossLines: [
                {
                    type: 'line',
                    value: new Date(2025, 9, 1),
                    label: { text: 'Launch', placement: 'left-top' },
                },
                {
                    type: 'range',
                    enabled: false,
                    range: [new Date(2025, 5, 1), new Date(2025, 7, 1)],
                    label: { text: 'Promotion', placement: 'top' },
                },
            ],
        },
        y: {
            type: 'number',
            title: {
                text: 'Revenue (£k)',
            },
            crossLines: [
                {
                    type: 'line',
                    enabled: false,
                    value: 250,
                    label: { text: 'Target', placement: 'top' },
                },
                {
                    type: 'range',
                    range: [180, 210],
                    label: { text: 'Baseline', placement: 'inside-top-left' },
                },
            ],
        },
    },
};

const chart = AgCharts.create(options);

function setPlacement(axis: 'x' | 'y', type: 'line' | 'range', placement: AgCartesianCrossLineLabelPlacement) {
    for (const crossLine of options.axes![axis]!.crossLines!) {
        if (crossLine.type === type) {
            crossLine.label!.placement = placement;
        }
    }
    chart.update(options);
}

function toggleCrossLine(axis: 'x' | 'y', type: 'line' | 'range', enabled: boolean) {
    for (const crossLine of options.axes![axis]!.crossLines!) {
        if (crossLine.type === type) {
            crossLine.enabled = enabled;
        }
    }
    chart.update(options);
}
