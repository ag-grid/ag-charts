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

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'AAPL Stock Price' },
    zoom: {
        enabled: true,
        rangeX: {
            start: new Date(2023, 10, 26),
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

const chart = AgCharts.create(options);

function changeRange(value: string) {
    let rangeStart = new Date(2022, 1, 27);
    let format = 'm-y';
    switch (value) {
        case '1y':
            rangeStart = new Date(2023, 1, 26);
            format = 'm-y';
            break;
        case 'YTD':
            rangeStart = new Date(2024, 0, 1);
            format = 'd-m';
            break;
        case '6m':
            rangeStart = new Date(2023, 7, 27);
            format = 'm-y';
            break;
        case '3m':
            rangeStart = new Date(2023, 9, 27);
            format = 'd-m';
            break;
        case '1m':
            rangeStart = new Date(2024, 0, 6);
            format = 'd-m';
        case 'All':
        default:
            rangeStart = new Date(2022, 1, 27);
            format = 'm-y';
            break;
    }

    options.zoom!.rangeX = { start: rangeStart };

    options.axes![1].label!.formatter = ({ value }) => dateFormat(value, format);
    options.axes![1].crosshair!.label!.renderer = ({ value }) => {
        return { text: dateFormat(value, format) };
    };

    AgCharts.update(chart, options);
}
