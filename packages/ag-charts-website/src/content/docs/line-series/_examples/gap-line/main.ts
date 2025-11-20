import { AgCartesianChartOptions, AgCharts, AgLineSeriesOptions } from 'ag-charts-community';
import {
    CategoryAxisModule,
    LineSeriesModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';

import { getData } from './data';


ModuleRegistry.registerModules([CategoryAxisModule, LineSeriesModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'People Born',
    },
    subtitle: {
        text: '2008-2020',
    },
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'visitors',
            connectMissingData: false,
        },
    ],
};

const chart = AgCharts.create(options);

function toggleConnectMissingData() {
    options.series = (options.series as Array<AgLineSeriesOptions>).map((series) => ({
        ...series,
        connectMissingData: !series.connectMissingData,
    }));
    chart.update(options);
}
