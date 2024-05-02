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
    annotations: {
        initial: [
            {
                type: 'parallel-channel',
                locked: true,
                top: {
                    start: { x: new Date('Thursday, September 14, 2023'), y: 4487.78 - 50 },
                    end: { x: new Date('Tuesday, October 03, 2023'), y: 4229.45 - 50 },
                },
                bottom: {
                    start: { x: new Date('Thursday, September 14, 2023'), y: 4487.78 + 50 },
                    end: { x: new Date('Tuesday, October 03, 2023'), y: 4229.45 + 50 },
                },
            },
        ],
    },
};

AgCharts.create(options);
