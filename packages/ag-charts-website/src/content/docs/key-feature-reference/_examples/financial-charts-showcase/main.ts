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
                start: {
                    x: { __type: 'date', value: new Date('2023-10-23').getTime() },
                    y: 148.0,
                },
                end: {
                    x: { __type: 'date', value: new Date('2024-04-12').getTime() },
                    y: 207.0,
                },
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
                text: {
                    label: 'Support Level',
                    position: 'center',
                    alignment: 'right',
                    color: '#089981',
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
                value: 181.03092783505156,
                axisLabel: {
                    fill: '#a5a9ac',
                },
                stroke: '#a5a9ac',
                lineStyle: 'dotted',
            },
            {
                type: 'text',
                text: 'Distribution',
                x: {
                    __type: 'date',
                    value: 'Thu Feb 22 2024 00:00:00 GMT+0000 (Greenwich Mean Time)',
                },
                y: 207.0103092783505,
            },
            {
                type: 'comment',
                text: 'Accumulation',
                x: {
                    __type: 'date',
                    value: 'Thu Nov 09 2023 00:00:00 GMT+0000 (Greenwich Mean Time)',
                },
                y: 131.7479612248038,
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
                    x: {
                        __type: 'date',
                        value: 'Tue Dec 26 2023 00:00:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    y: 173.2989690721649,
                },
                end: {
                    x: {
                        __type: 'date',
                        value: 'Tue Jul 18 2023 01:00:00 GMT+0100 (British Summer Time)',
                    },
                    y: 167.11340206185565,
                },
            },
            {
                type: 'line',
                start: {
                    x: {
                        __type: 'date',
                        value: 'Tue Oct 25 2022 01:00:00 GMT+0100 (British Summer Time)',
                    },
                    y: 120.72164948453609,
                },
                end: {
                    x: {
                        __type: 'date',
                        value: 'Thu May 04 2023 01:00:00 GMT+0100 (British Summer Time)',
                    },
                    y: 138.96907216494844,
                },
                extendEnd: true,
                strokeWidth: 2,
                lineStyle: 'dashed',
            },
        ],
    },
};

const chart = AgCharts.createFinancialChart(options);
