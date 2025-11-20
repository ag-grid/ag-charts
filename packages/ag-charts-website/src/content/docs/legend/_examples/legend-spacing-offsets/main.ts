import { AgCartesianChartOptions, AgChartLegendPositionOptions, AgCharts } from 'ag-charts-community';
import {
    BarSeriesModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    UnitTimeAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';

import { getData } from './data';


ModuleRegistry.registerModules([BarSeriesModule, LegendModule, LineSeriesModule, NumberAxisModule, UnitTimeAxisModule]);
const options: AgCartesianChartOptions & { legend: { position: AgChartLegendPositionOptions } } = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Financial Overview (1990–2025)',
        fontSize: 18,
    },
    subtitle: {
        text: 'Values in millions of €',
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'assets',
            yName: 'Assets',
            stacked: true,
            fill: '#4caf50',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'liabilities',
            yName: 'Liabilities',
            stacked: true,
            fill: '#f44336',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'netWorth',
            yName: 'Net Worth',
            stroke: '#1a1a1a',
            marker: { enabled: true, fill: '#1a1a1a' },
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
            title: {
                text: 'Year',
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Millions of €',
            },
        },
    },
    legend: {
        spacing: 20,
        position: {
            placement: 'right',
            xOffset: 0,
            yOffset: 0,
        },
    },
};

const chart = AgCharts.create(options);

function updateLegendSpacing(event: any) {
    var value = +event.target.value;

    options.legend!.spacing = +event.target.value;
    chart.update(options);

    document.getElementById('spacingValue')!.innerHTML = String(value);
}

function updateLegendXOffset(event: any) {
    var value = event.target.value;

    options.legend!.position.xOffset = +event.target.value;
    chart.update(options);

    document.getElementById('xOffsetValue')!.innerHTML = String(value);
}

function updateLegendYOffset(event: any) {
    var value = +event.target.value;

    options.legend!.position.yOffset = +event.target.value;
    chart.update(options);

    document.getElementById('yOffsetValue')!.innerHTML = String(value);
}
