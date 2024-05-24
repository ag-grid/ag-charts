import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { os: 'Windows', share: 88.07 },
        { os: 'macOS', share: 9.44 },
        { os: 'Linux', share: 1.87 },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'os',
            yKey: 'share',
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
            title: {
                text: 'Operating System',
            },
        },
        {
            type: 'number',
            position: 'left',
            reverse: false,
            title: {
                text: 'Market Share (%)',
            },
        },
    ],
};

const chart = AgCharts.create(options);

function toggleAxisReverse() {
    const numberAxisOptions = options.axes![1];
    numberAxisOptions.reverse = !numberAxisOptions.reverse;
    chart.update(options);
}
