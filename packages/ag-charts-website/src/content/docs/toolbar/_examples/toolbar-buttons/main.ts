import { AG_CHARTS_LOCALE_EN, AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

function dateFormat(dateString: string, format: string) {
    const dateObject = new Date(dateString);
    const formattedDate =
        format == 'd-m'
            ? dateObject.toLocaleString('en-GB', { day: 'numeric', month: 'short' })
            : dateObject.toLocaleString('en-GB', { month: 'short', year: '2-digit' });

    return formattedDate;
}

const MONTH = 30 * 24 * 60 * 60 * 1000;

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'AAPL Stock Price' },
    zoom: {
        enabled: true,
        rangeX: {
            start: new Date(2023, 10, 26),
        },
    },
    locale: {
        localeText: {
            ...AG_CHARTS_LOCALE_EN,
            myToolbarRange12Months: '12m',
            myToolbarRange12MonthsAria: '12 months',
            myTooltip: 'Click this button to show all trades',
        },
    },
    toolbar: {
        ranges: {
            enabled: true,
            buttons: [
                { label: 'toolbarRange6Months', ariaLabel: 'toolbarRange6MonthsAria', value: 6 * MONTH },
                { label: 'myToolbarRange12Months', ariaLabel: 'myToolbarRange12MonthsAria', value: 12 * MONTH },
                { label: 'toolbarRangeAll', tooltip: 'myTooltip', value: (start, end) => [start, end] },
            ],
        },
    },
    tooltip: {
        enabled: true,
    },
    axes: [
        {
            type: 'number',
            position: 'left',
            label: {},
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
    data: getData(),
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
    navigator: {
        miniChart: {
            padding: { top: 5, bottom: 5 },
            series: [
                {
                    type: 'line',
                    xKey: 'date',
                    yKey: 'open',
                    marker: { enabled: false },
                },
            ],
            label: {
                formatter: ({ value }) => dateFormat(value, 'm-y'),
            },
        },
    },
};

AgCharts.create(options);
