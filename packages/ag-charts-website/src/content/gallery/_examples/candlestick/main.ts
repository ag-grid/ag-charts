import { AgChartOptions, AgCharts, time } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'NASDAQ 100 (^NDX)',
    },
    subtitle: {
        text: 'Nasdaq GIDS - Nasdaq GIDS Historical Prices. Currency in USD',
        spacing: 50,
    },
    footnote: {
        text: 'Sep 11, 2023 - Mar 22, 2024',
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
                        content: `<b>0</b>${datum[openKey].toLocaleString()} <b>H</b>${datum[
                            highKey
                        ].toLocaleString()} <b>L</b>${datum[lowKey].toLocaleString()}
                         <b>C</b>${datum[closeKey].toLocaleString()}
                         <br/><b>Volume: </b>${datum['volume'].toLocaleString()}`,
                    };
                },
            },
        },
        {
            type: 'bar',
            xKey: 'date',
            xName: 'Date',
            yKey: 'volume',
            yName: 'Volume',
            fillOpacity: 0.5,
            showInLegend: false,
            formatter: ({ datum }) => {
                const openValue = datum['open'];
                const closeValue = datum['close'];
                const rising = closeValue > openValue;

                return {
                    fill: rising ? 'green' : 'red',
                    stroke: rising ? 'green' : 'red',
                };
            },
            tooltip: {
                enabled: false,
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
            keys: ['date'],
            line: {
                enabled: false,
            },
            tick: {
                interval: time.month.every(1),
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
            paddingInner: 0.4,
            crossLines: [
                {
                    type: 'range',
                    range: [new Date(2023, 9, 1), new Date(2023, 10, 1)],
                    strokeWidth: 0,
                    fillOpacity: 0.05,
                },
                {
                    type: 'range',
                    range: [new Date(2023, 11, 1), new Date(2024, 0, 1)],
                    strokeWidth: 0,
                    fillOpacity: 0.05,
                },
                {
                    type: 'range',
                    range: [new Date(2024, 1, 1), new Date(2024, 2, 1)],
                    strokeWidth: 0,
                    fillOpacity: 0.05,
                },
            ],
            crosshair: {
                label: {
                    format: '%d %b %y',
                },
            },
        },
        {
            type: 'number',
            position: 'right',
            keys: ['open', 'high', 'close', 'low'],
            tick: {
                width: 0,
                interval: 500,
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
        {
            type: 'number',
            position: 'left',
            keys: ['volume'],
            max: 50000000000,
            label: {
                enabled: false,
            },
            crosshair: {
                enabled: false,
            },
        },
    ],
    tooltip: {
        class: 'tooltip',
        position: {
            type: 'top-left',
            xOffset: 10,
            yOffset: 60,
        },
    },
};
AgCharts.create(options);
