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
            type: 'line',
            xKey: 'os',
            yKey: 'share',
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            title: {
                text: 'Operating System',
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Market Share (%)',
            },
        },
    },
};

const chart = AgCharts.create(options);

function setAxisMinMax() {
    const numberAxisOptions = options.axes!.y! as AgNumberAxisOptions;
    numberAxisOptions.min = -50;
    numberAxisOptions.max = 150;
    chart.update(options);
}

function resetAxisDomain() {
    const numberAxisOptions = options.axes!.y! as AgNumberAxisOptions;
    if (numberAxisOptions.min) {
        delete numberAxisOptions.min;
    }
    if (numberAxisOptions.max) {
        delete numberAxisOptions.max;
    }
    chart.update(options);
}
