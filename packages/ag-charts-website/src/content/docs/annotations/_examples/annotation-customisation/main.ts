import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'S&P 500 Index',
    },
    subtitle: {
        text: 'Daily High and Low Prices',
    },
    footnote: {
        text: '1 Aug 2023 - 1 Nov 2023',
    },
    series: [
        {
            type: 'candlestick',
            xKey: 'date',
            xName: 'Date',
            lowKey: 'low',
            highKey: 'high',
            openKey: 'open',
            closeKey: 'close',
        },
    ],
    theme: {
        overrides: {
            common: {
                annotations: {
                    line: {
                        stroke: 'lime',
                        strokeWidth: 3,
                        lineDash: [3, 4],
                    },
                    'parallel-channel': {
                        stroke: 'red',
                        strokeWidth: 4,
                        background: {
                            fill: 'red',
                        },
                        middle: {
                            strokeOpacity: 0,
                        },
                    },
                },
            },
        },
    },
    annotations: {
        initial: [
            {
                type: 'parallel-channel',
                top: {
                    start: { x: new Date('Thursday, September 14, 2023'), y: 4487.78 - 50 },
                    end: { x: new Date('Tuesday, October 03, 2023'), y: 4229.45 - 50 },
                },
                bottom: {
                    start: { x: new Date('Thursday, September 14, 2023'), y: 4487.78 + 50 },
                    end: { x: new Date('Tuesday, October 03, 2023'), y: 4229.45 + 50 },
                },
            },
            {
                type: 'line',
                start: { x: new Date('Friday, August 18, 2023'), y: 4344.88 },
                end: { x: new Date('Tuesday, October 03, 2023'), y: 4229.45 },
            },
            {
                type: 'line',
                start: { x: new Date('Friday, September 01, 2023'), y: 4530.6 },
                end: { x: new Date('Thursday, October 12, 2023'), y: 4380.94 },
            },
        ],
    },
};

AgCharts.create(options);
