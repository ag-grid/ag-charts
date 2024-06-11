import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

function dateFormat(dateString: string, format: string) {
    const dateObject = new Date(dateString);
    const formattedDate =
        format == 'd-m'
            ? dateObject.toLocaleString('en-GB', { day: 'numeric', month: 'short' })
            : dateObject.toLocaleString('en-GB', { month: 'short', year: '2-digit' });

    return formattedDate;
}

const commonOptions: AgCartesianChartOptions = {
    sync: {
        enabled: true,
    },
    zoom: {
        enabled: true,
        rangeX: {
            start: new Date(2023, 10, 26),
        },
    },
    data: getData(),
};

const candlestickOptions: AgCartesianChartOptions = {
    ...commonOptions,
    container: document.getElementById('ohlcChart'),
    title: { text: 'AAPL Stock Price' },
    toolbar: {
        ranges: {
            enabled: true,
        },
    },
    series: [
        {
            type: 'candlestick',
            xKey: 'date',
            openKey: 'open',
            closeKey: 'close',
            highKey: 'high',
            lowKey: 'low',
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'right',
            interval: { step: 25 },
            tick: {
                size: 0,
            },
            title: {
                text: 'OHLC',
                spacing: 0,
            },
            label: {
                padding: 0,
                fontSize: 10,
            },
            thickness: 25,
            crosshair: {
                enabled: false,
            },
        },
        {
            type: 'category',
            position: 'bottom',
            label: {
                enabled: false,
            },
            crosshair: {
                enabled: true,
                label: {
                    enabled: false,
                },
            },
        },
    ],
};

AgCharts.create(candlestickOptions);

const volumeOptions: AgCartesianChartOptions = {
    ...commonOptions,
    padding: { top: 0 },
    container: document.getElementById('volumeChart'),
    series: [
        {
            type: 'bar',
            xKey: 'date',
            yKey: 'volume',
            fill: '#544FC5',
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'right',
            nice: false,
            title: {
                text: 'Volume',
                spacing: 0,
            },
            label: {
                enabled: false,
            },
            thickness: 25,
            crosshair: {
                enabled: false,
            },
        },
        {
            type: 'category',
            position: 'bottom',
            label: {
                autoRotate: false,
                formatter: ({ value }) => dateFormat(value, 'd-m'),
            },
            crosshair: {
                enabled: true,
                label: {
                    renderer: ({ value }) => {
                        return { text: dateFormat(value, 'd-m') };
                    },
                },
            },
        },
    ],
    navigator: {
        mask: { fill: '#b9bfe5' },
        miniChart: {
            padding: { top: 5, bottom: 5 },
            series: [
                {
                    type: 'area',
                    xKey: 'date',
                    yKey: 'open',
                    fill: '#F5FBFF',
                    strokeWidth: 2,
                    stroke: '#4cb4ff',
                },
            ],
            label: {
                formatter: ({ value }) => dateFormat(value, 'm-y'),
            },
        },
    },
};

AgCharts.create(volumeOptions);
