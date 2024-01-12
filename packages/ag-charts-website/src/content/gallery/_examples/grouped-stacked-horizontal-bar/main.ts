import { AgChartLabelFormatterParams, AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const label = {
    formatter: ({ value }: AgChartLabelFormatterParams<number>) => value.toFixed(0),
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: "Apple's Revenue by Product Category",
    },
    subtitle: {
        text: 'In Billion U.S. Dollars',
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
            strokeWidth: 2,
            stroke: 'transparent',
            label,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'mac',
            yName: 'Mac',
            stackGroup: 'Devices',
            strokeWidth: 2,
            stroke: 'transparent',
            label,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'ipad',
            yName: 'iPad',
            stackGroup: 'Devices',
            strokeWidth: 2,
            stroke: 'transparent',
            label,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'wearables',
            yName: 'Wearables',
            stackGroup: 'Other',
            strokeWidth: 2,
            stroke: 'transparent',
            label,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'services',
            yName: 'Services',
            stackGroup: 'Other',
            strokeWidth: 2,
            stroke: 'transparent',
            label,
        },
    ],
    axes: [
        {
            position: 'left',
            type: 'category',
            paddingInner: 0.2,
            paddingOuter: 0.2,
            groupPaddingInner: 0.2,
            crossLines: [
                {
                    type: 'range',
                    range: ["Q1'19", "Q1'19"],
                    strokeWidth: 0,
                },
                {
                    type: 'range',
                    range: ["Q3'19", "Q3'19"],
                    strokeWidth: 0,
                },
            ],
            label: {
                enabled: false,
            },
            line: {
                enabled: false,
            },
        },
        {
            position: 'top',
            type: 'number',
            tick: {
                interval: 20,
            },
        },
    ],
};

AgCharts.create(options);
