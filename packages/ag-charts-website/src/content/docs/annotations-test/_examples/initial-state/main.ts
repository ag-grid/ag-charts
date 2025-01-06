import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Height vs Weight for Major League Baseball Players',
    },
    footnote: {
        text: 'Source: Statistics Online Computational Resource',
        spacing: 35,
    },
    padding: {
        left: 35,
    },
    series: [
        {
            type: 'scatter',
            xKey: 'weight',
            yKey: 'height',
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'number',
            nice: false,
            crossLines: [
                {
                    type: 'line',
                    value: 210,
                    lineDash: [5, 4],
                    label: {
                        text: 'Height (Inches)',
                        position: 'top-left',
                    },
                },
            ],
        },
        {
            position: 'left',
            type: 'number',
            nice: false,
            crossLines: [
                {
                    type: 'line',
                    value: 75,
                    lineDash: [5, 4],
                    label: {
                        text: 'Weight (Pounds)',
                        position: 'inside-top-right',
                    },
                },
            ],
        },
    ],
    annotations: {
        enabled: true, // Do we need this if annotations in initial state?
    },
    initialState: {
        annotations: [
            {
                type: 'parallel-channel',
                start: {
                    x: 153,
                    y: 75.0,
                },
                end: {
                    x: 187,
                    y: 78.0,
                },
                height: 6,
            },
            {
                type: 'horizontal-line',
                value: 76.0,
                stroke: '#089981',
                axisLabel: {
                    fill: '#089981',
                },
            },
            {
                type: 'horizontal-line',
                value: 82.0,
                stroke: '#089981',
                axisLabel: {
                    fill: '#089981',
                },
                text: {
                    label: 'Support Level',
                    position: 'center',
                    alignment: 'right',
                    color: '#089981',
                },
            },
            {
                type: 'horizontal-line',
                value: 67.8,
                stroke: '#F23645',
                axisLabel: {
                    fill: '#F23645',
                },
            },
            {
                type: 'horizontal-line',
                value: 80.8,
                stroke: '#F23645',
                axisLabel: {
                    fill: '#F23645',
                },
                text: {
                    label: 'Resistance',
                    position: 'center',
                    alignment: 'left',
                    color: '#F23645',
                },
            },
            {
                type: 'horizontal-line',
                text: {
                    label: 'Short-term Support',
                    position: 'top',
                    alignment: 'center',
                    fontSize: 10,
                    color: '#a5a9ac',
                },
                value: 79.03092783505156,
                axisLabel: {
                    fill: '#a5a9ac',
                },
                stroke: '#a5a9ac',
                lineStyle: 'dotted',
            },
            {
                type: 'text',
                text: 'Distribution',
                x: 190,
                y: 79.0103092783505,
            },
            {
                type: 'comment',
                text: 'Accumulation',
                x: 165,
                y: 74,
            },
            {
                type: 'callout',
                color: '#040404',
                fill: '#6baaf3',
                fillOpacity: 0.6,
                stroke: '#2395ff',
                strokeOpacity: 1,
                strokeWidth: 2,
                text: 'Markup',
                start: {
                    x: 165,
                    y: 70,
                },
                end: {
                    x: 169,
                    y: 70,
                },
            },
            {
                type: 'line',
                start: {
                    x: 252,
                    y: 71,
                },
                end: {
                    x: 258,
                    y: 81,
                },
                extendEnd: true,
                strokeWidth: 2,
                lineStyle: 'dashed',
            },
        ],
    },
};

AgCharts.create(options);
