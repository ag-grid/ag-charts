import { AgChartState, AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Annotations',
    },
    initialState: {
        annotations: [
            {
                type: 'line',
                start: {
                    x: {
                        __type: 'date',
                        value: 'Thu Mar 21 2024 18:30:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    y: 39862.89027982327,
                },
                end: {
                    x: {
                        __type: 'date',
                        value: 'Thu Mar 21 2024 18:38:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    y: 39844.70176730486,
                },

                stroke: '#5090dc',
                strokeOpacity: 1,
                strokeWidth: 2,
            },
            {
                type: 'parallel-channel',
                height: 13.282400589101599,
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

                stroke: '#5090dc',
                strokeOpacity: 1,
                strokeWidth: 2,
            },
            {
                type: 'disjoint-channel',
                startHeight: 16.872238586154708,
                endHeight: 4.666789396178501,
                background: {
                    fill: '#5090dc',
                    fillOpacity: 0.2,
                },
                start: {
                    x: {
                        __type: 'date',
                        value: 'Thu Mar 21 2024 19:27:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    y: 39851.402798232695,
                },
                end: {
                    x: {
                        __type: 'date',
                        value: 'Thu Mar 21 2024 19:17:00 GMT+0000 (Greenwich Mean Time)',
                    },
                    y: 39845.30007363771,
                },

                stroke: '#5090dc',
                strokeOpacity: 1,
                strokeWidth: 2,
            },
            {
                type: 'vertical-line',
                value: {
                    __type: 'date',
                    value: 'Thu Mar 21 2024 19:08:00 GMT+0000 (Greenwich Mean Time)',
                },

                axisLabel: {
                    enabled: true,
                },
                stroke: '#5090dc',
                strokeOpacity: 1,
                strokeWidth: 2,
            },
            {
                type: 'horizontal-line',
                value: 39863.48858615611,
                axisLabel: {
                    enabled: true,
                },
                stroke: '#5090dc',
                strokeOpacity: 1,
                strokeWidth: 2,
            },
        ],
    },
};

const chart = AgCharts.createFinancialChart(options);
