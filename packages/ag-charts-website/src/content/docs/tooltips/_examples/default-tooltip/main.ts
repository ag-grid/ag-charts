import { AgBarSeriesOptions, AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        {
            month: 'Jun',
            value1: 50,
            hats_made: 40,
        },
        {
            month: 'Jul',
            value1: 70,
            hats_made: 50,
        },
        {
            month: 'Aug',
            value1: 60,
            hats_made: 30,
        },
    ],
    series: [
        { type: 'bar', xKey: 'month', stacked: true, yKey: 'value1' },
        { type: 'bar', xKey: 'month', stacked: true, yKey: 'hats_made' },
    ],
};

var chart = AgCharts.create(options);

function setYNames() {
    (options.series![0] as AgBarSeriesOptions).yName = 'Sweaters Made';
    (options.series![1] as AgBarSeriesOptions).yName = 'Hats Made';
    AgCharts.update(chart, options);
}

function resetYNames() {
    (options.series![0] as AgBarSeriesOptions).yName = undefined;
    (options.series![1] as AgBarSeriesOptions).yName = undefined;
    AgCharts.update(chart, options);
}
