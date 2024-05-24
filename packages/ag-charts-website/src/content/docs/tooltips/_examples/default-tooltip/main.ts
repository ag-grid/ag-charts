import { AgBarSeriesOptions, AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        { type: 'bar', xKey: 'month', stacked: true, yKey: 'value1', yName: 'Sweaters Made' },
        { type: 'bar', xKey: 'month', stacked: true, yKey: 'hats_made', yName: 'Hats Made' },
    ],
};

const chart = AgCharts.create(options);

function removeYNames() {
    (options.series![0] as AgBarSeriesOptions).yName = undefined;
    (options.series![1] as AgBarSeriesOptions).yName = undefined;
    chart.update(options);
}

function addYNames() {
    (options.series![0] as AgBarSeriesOptions).yName = 'Sweaters Made';
    (options.series![1] as AgBarSeriesOptions).yName = 'Hats Made';
    chart.update(options);
}
