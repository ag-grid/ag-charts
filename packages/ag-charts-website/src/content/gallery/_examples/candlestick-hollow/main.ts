import { AgChartOptions, AgCharts, time } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Bitcoin USD',
    },
    subtitle: {
        text: '(BTC-USD)',
    },
    footnote: {
        text: '2014 - 2024',
    },
    series: [
        {
            type: 'candlestick',
            xKey: 'date',
            xName: 'Date',
            lowKey: 'low',
            lowName: 'Low',
            highKey: 'high',
            highName: 'High',
            openKey: 'open',
            openName: 'Open',
            closeKey: 'close',
            closeName: 'Close',
            tooltip: {
                renderer: ({ datum, openKey, highKey, lowKey, closeKey }) => {
                    return {
                        content: `<b>O</b> ${datum[openKey].toLocaleString()}</br><b>H</b> ${datum[
                            highKey
                        ].toLocaleString()}<br/><b>L</b> ${datum[lowKey].toLocaleString()}
                           <br/><b>C</b> ${datum[closeKey].toLocaleString()}`,
                    };
                },
            },
            item: {
                up: {
                    fill: 'transparent',
                    stroke: '#2b5c95',
                },
                down: {
                    fill: '#5090dc',
                    stroke: '#2b5c95',
                },
            },
        },
    ],
    zoom: {
        enabled: true,
    },
    axes: [
        {
            type: 'ordinal-time',
            position: 'bottom',
            interval: time.year.every(1),
            line: {
                enabled: false,
            },
            tick: {
                width: 0,
            },
            gridLine: {
                enabled: true,
            },
            crosshair: {
                label: {
                    format: '%d %b %y',
                },
            },
        },
        {
            type: 'number',
            position: 'right',
            interval: 10000,
            tick: {
                width: 0,
            },
            label: {
                formatter: ({ value }) => Number(value).toLocaleString(),
            },
            crosshair: {
                label: {
                    format: `,f`,
                },
            },
        },
    ],
    tooltip: {
        position: {
            type: 'pointer',
            yOffset: -20,
        },
    },
};
AgCharts.create(options);
