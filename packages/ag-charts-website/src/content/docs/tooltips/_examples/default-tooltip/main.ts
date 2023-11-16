import { AgBarSeriesOptions, AgCartesianChartOptions, AgChart } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        { type: 'bar', xKey: 'month', stacked: true, yKey: 'value1', yName: 'Sweaters Made' },
        { type: 'bar', xKey: 'month', stacked: true, yKey: 'hats_made', yName: 'Hats Made' },
    ],
};

var chart = AgChart.create(options);

function setYNames() {
    (options.series![0] as AgBarSeriesOptions).yName = 'Sweaters Made';
    (options.series![1] as AgBarSeriesOptions).yName = 'Hats Made';
    AgChart.update(chart, options);
}

function resetYNames() {
    (options.series![0] as AgBarSeriesOptions).yName = undefined;
    (options.series![1] as AgBarSeriesOptions).yName = undefined;
    AgChart.update(chart, options);
}
