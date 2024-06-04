import { AgCartesianChartOptions, AgCharts, type AgContinuousAxisOptions } from 'ag-charts-community';

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
            title: {
                text: 'Market Share (%)',
            },
            interval: 20,
        },
    ],
};

const chart = AgCharts.create(options);

function setTickInterval(interval: number) {
    Object.assign(options.axes![1], { interval });
    chart.update(options);
}

function resetInterval() {
    Object.assign(options.axes![1], { interval: undefined });
    chart.update(options);
}
