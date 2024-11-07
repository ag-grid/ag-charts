import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Changes in Prison Population',
    },
    footnote: {
        text: 'Source: Ministry of Justice, HM Prison Service, and Her Majesty’s Prison and Probation Service',
    },
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'menDelta',
            yName: 'Male',
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'womenDelta',
            yName: 'Female',
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
            crossLines: [
                {
                    type: 'range',
                    range: ['Jan', 'Mar'],
                    fill: '#DFDFDF',
                    fillOpacity: 0.3,
                    strokeWidth: 0,
                    label: {
                        text: 'Q1',
                        position: 'inside-top',
                    },
                },
                {
                    type: 'range',
                    range: ['Apr', 'Jun'],
                    fill: undefined,
                    strokeWidth: 0,
                    label: {
                        text: 'Q2',
                        position: 'inside-top',
                    },
                },
                {
                    type: 'range',
                    range: ['Jul', 'Sep'],
                    fill: '#DFDFDF',
                    fillOpacity: 0.3,
                    strokeWidth: 0,
                    label: {
                        text: 'Q3',
                        position: 'inside-top',
                    },
                },
                {
                    type: 'range',
                    range: ['Oct', 'Dec'],
                    fill: undefined,
                    strokeWidth: 0,
                    label: {
                        text: 'Q4',
                        position: 'inside-top',
                    },
                },
            ],
        },
        {
            type: 'number',
            position: 'left',
            crossLines: [
                {
                    type: 'line',
                    value: -321,
                    fill: '#330066',
                    fillOpacity: 0.1,
                    stroke: '#330066',
                    strokeOpacity: 0.3,
                    lineDash: [10, 2],
                    label: {
                        text: 'Peak Male Release',
                        padding: 10,
                        position: 'bottom-right',
                    },
                },
                {
                    type: 'range',
                    range: [-90, 65],
                    fill: '#330066',
                    fillOpacity: 0.1,
                    stroke: '#330066',
                    strokeOpacity: 0.2,
                    strokeWidth: 0,
                    label: {
                        text: 'Female Range',
                        padding: 10,
                        position: 'inside-top-right',
                    },
                },
            ],
        },
    ],
};

AgCharts.create(options);
