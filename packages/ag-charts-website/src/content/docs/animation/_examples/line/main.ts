import { AgChart, AgChartOptions, AgEnterpriseCharts, time } from 'ag-charts-enterprise';
import { getData, getRandomisedData, getRemovedData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    autoSize: true,
    animation: {
        enabled: true,
    },
    legend: {
        enabled: false,
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'petrol',
            stroke: '#01c185',
            marker: {
                stroke: '#01c185',
                fill: '#01c185',
            },
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'diesel',
            stroke: '#000000',
            marker: {
                stroke: '#000000',
                fill: '#000000',
            },
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'time',
            tick: {
                interval: time.month.every(2),
            },
            label: {
                autoRotate: false,
            },
        },
        {
            position: 'left',
            type: 'number',
            label: {
                autoRotate: false,
            },
        },
    ],
};

const chart = AgEnterpriseCharts.create(options);

function reset() {
    options.data = getData();
    AgChart.update(chart, options as any);
}

function randomise() {
    options.data = [...getRandomisedData()];
    AgChart.update(chart, options as any);
}

function remove() {
    options.data = [...getRemovedData()];
    AgChart.update(chart, options as any);
}
