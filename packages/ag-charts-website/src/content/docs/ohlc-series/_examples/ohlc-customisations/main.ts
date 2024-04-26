import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Dow Jones Industrial Average',
    },
    subtitle: {
        text: 'OHLC Patterns',
    },
    footnote: {
        text: '1 Minute',
    },
    series: [
        {
            type: 'ohlc',
            xKey: 'date',
            xName: 'Time',
            lowKey: 'low',
            highKey: 'high',
            openKey: 'open',
            closeKey: 'close',
            item: {
                up: {
                    stroke: '#45ba45',
                    strokeWidth: 2,
                },
                down: {
                    stroke: '#ba4545',
                    strokeWidth: 2,
                },
            },
            tooltip: {
                renderer: ({ datum, xKey, openKey, highKey, lowKey, closeKey }) => {
                    return {
                        title: `<b>${datum[xKey].toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</b>`,
                        content: `<b>O</b> ${datum[openKey].toLocaleString()}</br><b>H</b> ${datum[
                            highKey
                        ].toLocaleString()}<br/><b>L</b> ${datum[lowKey].toLocaleString()}
                           <br/><b>C</b> ${datum[closeKey].toLocaleString()}`,
                    };
                },
            },
        },
    ],
    axes: [
        {
            type: 'ordinal-time',
            position: 'bottom',
            label: {
                format: '%H:%M',
            },
        },
        {
            type: 'number',
            position: 'right',
            label: {
                formatter: ({ value }) => Number(value).toLocaleString(),
            },
            crosshair: {
                label: {
                    format: ',f',
                },
            },
        },
    ],
};

AgCharts.create(options);
