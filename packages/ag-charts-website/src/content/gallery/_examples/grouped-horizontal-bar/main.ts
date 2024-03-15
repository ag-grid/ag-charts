import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Changes in Prison Population',
    },
    footnote: {
        text: 'Source: Ministry of Justice, HM Prison Service, and HM’s Prison and Probation Service',
    },
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'month',
            yKey: 'menDelta',
            yName: 'Male',
            cornerRadius: 20,
            label: {
                formatter: ({ value }) => value.toFixed(0),
            },
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'month',
            yKey: 'womenDelta',
            yName: 'Female',
            cornerRadius: 20,
            label: {
                formatter: ({ value }) => value.toFixed(0),
            },
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'left',
            line: {
                enabled: false,
            },
            label: {
                enabled: false,
            },
            paddingInner: 0.2,
            crossLines: [
                {
                    type: 'line',
                    value: 'Jul',
                    strokeWidth: 0,
                    fillOpacity: 0,
                    label: {
                        text: '→ JUL',
                        position: 'insideRight',
                    },
                },
                {
                    type: 'range',
                    range: ['Aug', 'Aug'],
                    strokeWidth: 0,
                    fillOpacity: 0,
                    label: {
                        text: '→ AUG',
                        position: 'insideRight',
                    },
                },
                {
                    type: 'range',
                    range: ['Sep', 'Sep'],
                    strokeWidth: 0,
                    fillOpacity: 0,
                    label: {
                        text: '→ SEP',
                        position: 'insideRight',
                    },
                },
                {
                    type: 'range',
                    range: ['Oct', 'Oct'],
                    strokeWidth: 0,
                    fillOpacity: 0,

                    label: {
                        text: '→ OCT',
                        position: 'insideRight',
                    },
                },
                {
                    type: 'range',
                    range: ['Nov', 'Nov'],
                    strokeWidth: 0,
                    fillOpacity: 0,
                    label: {
                        text: 'NOV ←',
                        position: 'insideLeft',
                    },
                },
                {
                    type: 'range',
                    range: ['Dec', 'Dec'],
                    strokeWidth: 0,
                    fillOpacity: 0,
                    label: {
                        text: 'DEC ←',
                        position: 'insideLeft',
                    },
                },
            ],
        },
        {
            type: 'number',
            position: 'bottom',
            nice: false,
            min: -300,
            max: 500,
            label: {
                enabled: false,
            },
        },
    ],
};

AgCharts.create(options);
