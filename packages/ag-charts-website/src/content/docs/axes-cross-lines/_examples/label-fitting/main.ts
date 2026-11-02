import {
    AgCartesianChartOptions,
    AgCharts,
    CrossLinesModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    TextWrap,
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
                    type: 'range',
                    range: [new Date(2025, 5, 1), new Date(2025, 7, 1)],
                    label: {
                        text: 'Summer Promotion: Reduced Pricing in All Stores',
                        placement: 'inside-top',
                        maxWidth: 120,
                        maxHeight: 60,
                    },
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
                    label: {
                        text: 'Annual Revenue Target: £250k per Month',
                        placement: 'top-left',
                        maxWidth: 120,
                        maxHeight: 60,
                    },
                },
            ],
        },
    },
};

const chart = AgCharts.create(options);

function setMaxWidth(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    document.getElementById('maxWidthValue')!.textContent = String(value);
    options.axes!.x!.crossLines![0].label!.maxWidth = value;
    options.axes!.y!.crossLines![0].label!.maxWidth = value;
    chart.update(options);
}

function setMaxHeight(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    document.getElementById('maxHeightValue')!.textContent = String(value);
    options.axes!.x!.crossLines![0].label!.maxHeight = value;
    options.axes!.y!.crossLines![0].label!.maxHeight = value;
    chart.update(options);
}

function setWrapping(value: string) {
    options.axes!.x!.crossLines![0].label!.wrapping = value as TextWrap;
    options.axes!.y!.crossLines![0].label!.wrapping = value as TextWrap;
    chart.update(options);
}

function setMinimumFontSize(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    document.getElementById('minimumFontSizeValue')!.textContent = String(value);
    options.axes!.x!.crossLines![0].label!.minimumFontSize = value;
    options.axes!.y!.crossLines![0].label!.minimumFontSize = value;
    chart.update(options);
}

function setTruncate(value: string) {
    options.axes!.x!.crossLines![0].label!.truncate = value === 'enabled';
    options.axes!.y!.crossLines![0].label!.truncate = value === 'enabled';
    chart.update(options);
}
