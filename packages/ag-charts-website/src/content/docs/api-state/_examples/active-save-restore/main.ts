import type { AgCartesianChartOptions, AgChartState } from 'ag-charts-community';
import {
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';
import type { DataType } from './data';

ModuleRegistry.registerModules([BarSeriesModule, LegendModule, NumberAxisModule, CategoryAxisModule]);

let state: AgChartState | undefined = undefined;

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Transportation Usage Over Time',
    },
    subtitle: {
        text: 'Click a bar to save active (highlight/tooltip) state',
    },
    series: [
        { type: 'bar', xKey: 'year', yKey: 'publicTransit', yName: 'Public Transit' },
        { type: 'bar', xKey: 'year', yKey: 'privateCar', yName: 'Private Car' },
        { type: 'bar', xKey: 'year', yKey: 'cycle', yName: 'Cycle' },
        { type: 'bar', xKey: 'year', yKey: 'other', yName: 'Other' },
    ],
    listeners: {
        seriesNodeClick: () => {
            state = chart.getState();
        },
    },
    axes: {
        y: {
            type: 'number',
            title: { text: 'Usage (millions of trips)' },
        },
    },
    legend: {
        position: 'bottom',
    },
};

const chart = AgCharts.create(options);

function restoreState() {
    if (state) {
        chart.setState(state);
    }
}
