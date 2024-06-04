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
            values: [0, 20, 40, 60, 80, 100],
        },
    ],
};

const chart = AgCharts.create(options);

function setTickValues(values: number[]) {
    options.axes![1].tick = { values };
    chart.update(options);
}

function reset() {
    options.axes![1].tick = {};
    chart.update(options);
}
