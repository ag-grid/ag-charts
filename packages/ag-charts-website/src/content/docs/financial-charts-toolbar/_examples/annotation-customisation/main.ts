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
                        stroke: 'blue',
                        strokeWidth: 2,
                    },
                },
            },
        },
    },
    initialState: {
        annotations: [
            {
                type: 'parallel-channel',
                height: 83.55795148247944,
                start: {
                    x: {
                        __type: 'date',
                        value: 'Tue Sep 19 2023 00:00:00 GMT+0100 (British Summer Time)',
                    },
                    y: 4401.88679245283,
                },
                end: {
                    x: {
                        __type: 'date',
                        value: 'Thu Oct 05 2023 00:00:00 GMT+0100 (British Summer Time)',
                    },
                    y: 4279.245283018868,
                },
            },
            {
                type: 'line',
                start: {
                    x: {
                        __type: 'date',
                        value: 'Tue Sep 05 2023 00:00:00 GMT+0100 (British Summer Time)',
                    },
                    y: 4507.681940700809,
                },
                end: {
                    x: {
                        __type: 'date',
                        value: 'Fri Oct 13 2023 00:00:00 GMT+0100 (British Summer Time)',
                    },
                    y: 4331.805929919137,
                },
            },
            {
                type: 'comment',
                text: 'Comment',
                visible: true,
                x: {
                    __type: 'date',
                    value: 'Tue Aug 22 2023 00:00:00 GMT+0100 (British Summer Time)',
                },
                y: 4261.725067385445,
            },
        ],
    },
};

AgCharts.createFinancialChart(options);
