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
    const axis = options.axes?.[1]! as AgNumberAxisOptions;
    axis.minSpacing = minSpacing;
    axis.maxSpacing = maxSpacing;
    chart.update(options);
}

function reset() {
    const axis = options.axes?.[1]! as AgNumberAxisOptions;
    axis.minSpacing = undefined;
    axis.maxSpacing = undefined;
    chart.update(options);
}
