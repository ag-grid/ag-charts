import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Customisation',
    },
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
                    comment: {
                        fill: 'orange',
                        color: 'blue',
                        strokeWidth: 4,
                    },
                },
            },
        },
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
            },
            {
                type: 'parallel-channel',
                height: 13.282400589101599,
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
            },
            {
                type: 'comment',
                text: 'Comment',
                visible: true,
                fontSize: 14,
                fontFamily: 'Verdana, sans-serif',
                x: {
                    __type: 'date',
                    value: 'Thu Mar 21 2024 19:06:00 GMT+0000 (Greenwich Mean Time)',
                },
                y: 39844.91891891892,
            },
        ],
    },
};

AgCharts.createFinancialChart(options);
