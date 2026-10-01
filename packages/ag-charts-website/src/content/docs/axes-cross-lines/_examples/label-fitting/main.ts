import {
    AgCartesianChartOptions,
    AgCartesianCrossLineLabelOptions,
    AgCharts,
    CrossLinesModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    TimeAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([CrossLinesModule, LineSeriesModule, NumberAxisModule, TimeAxisModule]);

const rangeLabel: AgCartesianCrossLineLabelOptions = {
    text: 'Summer Promotion: Reduced Pricing in All Stores',
    placement: 'inside-top',
    maxWidth: 110,
};

const lineLabel: AgCartesianCrossLineLabelOptions = {
    text: 'Annual Revenue Target: £250k per Month',
    placement: 'inside-top-left',
    maxWidth: 120,
};

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
                    type: 'range',
                    range: [new Date(2025, 5, 1), new Date(2025, 7, 1)],
                    label: rangeLabel,
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
                    value: 250,
                    label: lineLabel,
                },
            ],
        },
    },
};

const chart = AgCharts.create(options);

function setLabelFit(fit: AgCartesianCrossLineLabelOptions) {
    options.axes!.x!.crossLines![0].label = { ...rangeLabel, ...fit };
    options.axes!.y!.crossLines![0].label = { ...lineLabel, ...fit };
    chart.update(options);
}

function wrap() {
    setLabelFit({});
}

function truncate() {
    setLabelFit({ wrapping: 'never', truncate: true });
}

function shrink() {
    setLabelFit({ wrapping: 'never', minimumFontSize: 8 });
}
