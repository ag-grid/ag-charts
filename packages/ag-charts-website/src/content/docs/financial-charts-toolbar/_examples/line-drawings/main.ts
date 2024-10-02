import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Line Drawings',
    },
    rangeButtons: false,
    initialState: {
        annotations: [
            {
                type: 'line',
                start: {
                    x: {
                        __type: 'date',
                        value: 'Thu Mar 21 2024 18:30:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    y: 39859.35027982327,
                },
                end: {
                    x: {
                        __type: 'date',
                        value: 'Thu Mar 21 2024 18:39:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    y: 39836.36176730486,
                },
                text: {
                    label: 'Trend line',
                    position: 'center',
                    alignment: 'center',
                },
                extendStart: true,
                extendEnd: true,
            },
            {
                type: 'parallel-channel',
                height: 15.282400589101599,
                middle: {
                    strokeWidth: 1,
                    lineDash: [6, 5],
                },
                background: {
                    fill: '#5090dc',
                    fillOpacity: 0.2,
                },
                start: {
                    x: {
                        __type: 'date',
                        value: 'Thu Mar 21 2024 18:45:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    y: 39831.539027982326,
                },
                end: {
                    x: {
                        __type: 'date',
                        value: 'Thu Mar 21 2024 18:59:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    y: 39842.30854197349,
                },
                text: {
                    label: 'Parallel channel',
                    position: 'top',
                    alignment: 'left',
                },
                extendStart: true,
            },
            {
                type: 'disjoint-channel',
                startHeight: 29.948914431675803,
                endHeight: 12.78416347381426,
                start: {
                    x: {
                        __type: 'date',
                        value: 'Thu Mar 21 2024 19:31:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    y: 39843.62007363771,
                },
                end: {
                    x: {
                        __type: 'date',
                        value: 'Thu Mar 21 2024 19:22:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    y: 39835.032798232695,
                },
                text: {
                    label: 'Disjoint channel',
                    position: 'top',
                    alignment: 'right',
                },
            },
            {
                type: 'vertical-line',
                value: {
                    __type: 'date',
                    value: 'Thu Mar 21 2024 19:08:00 GMT+0000 (Greenwich Mean Time)',
                },
                text: {
                    label: 'Vertical line',
                    position: 'top',
                    alignment: 'center',
                },
                axisLabel: {
                    enabled: true,
                },
            },
            {
                type: 'horizontal-line',
                value: 39863.48858615611,
                text: {
                    label: 'Horizontal line',
                    position: 'center',
                    alignment: 'right',
                },
                axisLabel: {
                    enabled: true,
                },
                strokeWidth: 3,
                lineStyle: 'dotted',
            },
        ],
    },
};

AgCharts.createFinancialChart(options);
