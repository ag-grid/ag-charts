import { AgCartesianChartOptions, AgCharts, AgNumberAxisOptions } from 'ag-charts-community';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { os: 'Windows', share: 88.07 },
        { os: 'macOS', share: 9.44 },
        { os: 'Linux', share: 1.87 },
    ],
    series: [
        {
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
            title: {
                text: 'Market Share (%)',
            },
            nice: true,
        },
    ],
};

const chart = AgCharts.create(options);

function toggleAxisNice() {
    (options.axes![1] as AgNumberAxisOptions).nice = !(options.axes![1] as AgNumberAxisOptions).nice;
    chart.update(options);
}
