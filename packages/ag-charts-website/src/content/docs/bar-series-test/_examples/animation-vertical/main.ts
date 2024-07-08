import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    animation: {
        enabled: true,
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'iphone',
            yName: 'iPhone',
            stackGroup: 'Devices',
            label: {
                color: 'white',
            },
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'mac',
            yName: 'Mac',
            stackGroup: 'Devices',
            label: {
                color: 'white',
            },
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'ipad',
            yName: 'iPad',
            stackGroup: 'Devices',
            label: {
                color: 'white',
            },
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'wearables',
            yName: 'Wearables',
            label: {
                color: 'white',
            },
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'services',
            yName: 'Services',
            label: {
                color: 'white',
            },
        },
    ],
};

const chart = AgCharts.create(options);

function reset() {
    options.data = getData();
    chart.update(options as any);
}

function randomise() {
    options.data = [
        ...getData().map((d: any) => ({
            ...d,
            iphone: d.iphone + Math.floor(Math.random() * 50 - 25),
        })),
    ];
    chart.update(options as any);
}

function remove() {
    options.data = [
        ...getData().filter(
            (d: any) =>
                !d.quarter.startsWith("Q1'19") && !d.quarter.startsWith("Q3'19") && !d.quarter.startsWith("Q4'18")
        ),
    ];
    chart.update(options as any);
}
