import { AgChartOptions, AgCharts, time } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'USD/GBP',
    },
    subtitle: {
        text: 'CCY - CCY Price in GBP',
        spacing: 20,
    },
    footnote: {
        text: 'Apr 25, 2023 - Apr 25, 2024',
    },
    series: [
        {
            type: 'ohlc',
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
                        content: `<b>0</b>${datum[openKey].toFixed(4)} <b>H</b>${datum[highKey].toFixed(
                            4
                        )} <b>L</b>${datum[lowKey].toFixed(4)}
                           <b>C</b>${datum[closeKey].toFixed(4)}`,
                    };
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
            interval: time.month.every(1),
            line: {
                enabled: false,
            },
            tick: {
                width: 0,
            },
            gridLine: {
                enabled: true,
            },
            label: {
                formatter: ({ value }) => {
                    const dateObject = new Date(value);
                    if (dateObject.getFullYear() === 2024 && dateObject.getMonth() === 0) {
                        return '2024';
                    }
                    return dateObject.toLocaleString('en-GB', {
                        month: 'short',
                    });
                },
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
            interval: 0.01,
            tick: {
                width: 0,
            },
            label: {
                formatter: ({ value }) => Number(value).toFixed(4),
            },
            crosshair: {
                label: {
                    format: `.4f`,
                },
            },
            crossLines: [
                {
                    type: 'line',
                    value: 0.8016,
                    lineDash: [4, 3],
                    stroke: 'red',
                },
            ],
        },
    ],
    tooltip: {
        class: 'tooltip',
        position: {
            type: 'top-left',
            xOffset: 10,
            yOffset: 55,
        },
    },
};
AgCharts.create(options);
