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
            title: {
                text: 'Market Share (%)',
            },
            interval: 20,
        },
    ],
};

const chart = AgCharts.create(options);

function setMinMaxSpacing(minSpacing: number, maxSpacing: number) {
    Object.assign(options.axes![1], { minSpacing, maxSpacing });
    chart.update(options);
}

function reset() {
    Object.assign(options.axes![1], { minSpacing: undefined, maxSpacing: undefined });
    chart.update(options);
}
