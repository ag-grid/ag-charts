import { AgChart, AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

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
            direction: 'horizontal',
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
            direction: 'horizontal',
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
            direction: 'horizontal',
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
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'wearables',
            yName: 'Wearables',
            label: {
                color: 'white',
            },
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'services',
            yName: 'Services',
            label: {
                color: 'white',
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
    options.data = [
        ...getData().map((d: any) => ({
            ...d,
            iphone: d.iphone + Math.floor(Math.random() * 50 - 25),
        })),
    ];
    AgChart.update(chart, options as any);
}

function remove() {
    options.data = [
        ...getData().filter(
            (d: any) =>
                !d.quarter.startsWith("Q1'19") && !d.quarter.startsWith("Q3'19") && !d.quarter.startsWith("Q4'18")
        ),
    ];
    AgChart.update(chart, options as any);
}

function switchDirection() {
    options.series?.forEach((s: any) => (s.direction = s.direction === 'horizontal' ? 'vertical' : 'horizontal'));
    AgChart.update(chart, options as any);
}

function switchToGrouped() {
    options.series?.forEach((s: any) => delete s['stackGroup']);
    AgChart.update(chart, options as any);
}

function switchToStacked() {
    options.series?.forEach((s: any, i) => {
        if (i < 3) {
            s.stackGroup = 'Devices';
        }
    });
    AgChart.update(chart, options as any);
}
