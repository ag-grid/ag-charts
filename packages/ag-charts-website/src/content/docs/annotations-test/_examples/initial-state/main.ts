import { AgChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

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
    axes: {
        x: {
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
        y: {
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
    },
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
            },
            {
                type: 'horizontal-line',
                value: 82.0,
                text: {
                    label: 'Support Level',
                    position: 'center',
                    alignment: 'right',
                },
            },
            {
                type: 'horizontal-line',
                value: 67.8,
            },
            {
                type: 'horizontal-line',
                value: 80.8,
                text: {
                    label: 'Resistance',
                    position: 'center',
                    alignment: 'left',
                },
            },
            {
                type: 'horizontal-line',
                text: {
                    label: 'Short-term Support',
                    position: 'top',
                    alignment: 'center',
                },
                value: 79.03092783505156,
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
                lineStyle: 'dashed',
            },
            {
                type: 'arrow-up',
                x: 165,
                y: 73,
            },
            {
                type: 'arrow-down',
                x: 220,
                y: 73,
            },
            {
                type: 'note',
                text: 'This is a note',
                x: 180,
                y: 80,
            },
            {
                type: 'vertical-line',
                text: {
                    label: 'Vertical Line',
                    position: 'center',
                },
                value: 240,
                strokeWidth: 3,
            },
            {
                type: 'disjoint-channel',
                start: {
                    x: 220,
                    y: 81,
                },
                end: {
                    x: 235,
                    y: 75,
                },
                startHeight: 6,
                endHeight: -4,
            },
            {
                type: 'arrow',
                start: {
                    x: 165,
                    y: 81,
                },
                end: {
                    x: 265,
                    y: 69,
                },
                lineStyle: 'dotted',
                strokeWidth: 6,
            },
        ],
    },
};

AgCharts.create(options);
