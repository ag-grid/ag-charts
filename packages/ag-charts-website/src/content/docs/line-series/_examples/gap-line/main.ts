import { AgChartOptions, AgCharts, AgLineSeriesOptions } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
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
    AgCharts.update(chart, options);
}
