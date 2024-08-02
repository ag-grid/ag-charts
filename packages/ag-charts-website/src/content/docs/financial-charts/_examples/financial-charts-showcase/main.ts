import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Acme Inc.' },
    initialState: {
        annotations: [
            {
                type: 'parallel-channel',
                start: { x: { __type: 'date', value: new Date('2023-10-23').getTime() }, y: 148.0 },
                end: { x: { __type: 'date', value: new Date('2024-04-12').getTime() }, y: 207.0 },
                height: 14,
            },
            {
                type: 'horizontal-line',
                value: 111.0,
                stroke: '#089981',
                axisLabel: {
                    fill: '#089981',
                },
            },
            {
                type: 'horizontal-line',
                value: 125.0,
                stroke: '#089981',
                axisLabel: {
                    fill: '#089981',
                },
            },
            {
                type: 'horizontal-line',
                value: 143.8,
                stroke: '#F23645',
                axisLabel: {
                    fill: '#F23645',
                },
            },
            {
                type: 'horizontal-line',
                value: 200.8,
                stroke: '#F23645',
                axisLabel: {
                    fill: '#F23645',
                },
            },
            {
                type: 'text',
                text: 'Distribution',
                x: {
                    __type: 'date',
                    value: 'Thu Oct 26 2023 01:00:00 GMT+0100 (British Summer Time)',
                },
                y: 200.8247422680412,
            },
            {
                type: 'comment',
                text: 'Accumulation',
                x: {
                    __type: 'date',
                    value: 'Thu Nov 09 2023 00:00:00 GMT+0000 (Greenwich Mean Time)',
                },
                y: 112.37113402061856,
            },
            {
                type: 'callout',
                text: 'Markup',
                start: {
                    x: {
                        __type: 'date',
                        value: 'Tue Dec 26 2023 00:00:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    y: 173.2989690721649,
                },
                end: {
                    x: {
                        __type: 'date',
                        value: 'Tue Jul 25 2023 01:00:00 GMT+0100 (British Summer Time)',
                    },
                    y: 167.11340206185565,
                },
            },
        ],
    },
};

const chart = AgCharts.createFinancialChart(options);
