import {
    AgCandlestickSeriesTooltipRendererParams,
    AgCartesianChartOptions,
    AgCartesianSeriesTooltipRendererParams,
    AgCharts,
    AgSeriesTooltip,
    AgTooltipRendererResult,
} from 'ag-charts-enterprise';

import { getData } from './data';
import type { TooltipPosition } from 'ag-charts-community/src/chart/tooltip/tooltip';

function dateFormat(dateString: string, format: string) {
    const dateObject = new Date(dateString);
    const formattedDate =
        format == 'd-m'
            ? dateObject.toLocaleString('en-GB', { day: 'numeric', month: 'short' })
            : dateObject.toLocaleString('en-GB', { month: 'short', year: '2-digit' });

    return formattedDate;
}

const tooltipOptions : AgSeriesTooltip<any> = {
    position: {
        type: 'top-left',
        xOffset: 70,
        yOffset: 20,
    },
    renderer: ({ datum }: AgCartesianSeriesTooltipRendererParams)  => {
        var fill = datum.open < datum.close ? '#089981' : '#F23645';
        return `
           <div>
           O<span style="color: ${fill}">${datum.open}</span>
           H<span style="color: ${fill}">${datum.high}</span>
           L<span style="color: ${fill}">${datum.low}</span>
           C<span style="color: ${fill}">${datum.close}</span>
           Vol <span style="color: ${fill}">${Intl.NumberFormat('en', {
               notation: 'compact',
               maximumSignificantDigits: 3,
           }).format(datum.volume)}</span></div>`;
    },
};

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    zoom: {
        enabled: true,
        rangeX: {
            start: new Date(2023, 10, 26),
        },
    },
    title: {
        text: 'AAPL',
        textAlign: 'left',
    },
    series: [
        {
            type: 'bar',
            xKey: 'date',
            yKey: 'volume',
            showInLegend: false,
            formatter: ({ datum }) => {
                var fill = datum.open < datum.close ? '#92D2CC' : '#F7A9A7';
                return { fill: fill };
            },
            tooltip: tooltipOptions,
        },
        {
            type: 'candlestick',
            xKey: 'date',
            openKey: 'open',
            closeKey: 'close',
            highKey: 'high',
            lowKey: 'low',
            item: {
                up: {
                    fill: '#089981',
                    stroke: '#089981',
                },
                down: {
                    fill: '#F23645',
                    stroke: '#F23645',
                },
            },
            tooltip: tooltipOptions,
        },
    ],

    axes: [
        {
            type: 'number',
            position: 'left',
            keys: ['volume'],
            max: 1000000000,
            label: { enabled: false },
            crosshair: { enabled: false },
        },
        {
            type: 'number',
            position: 'right',
            tick: {
                size: 0,
                maxSpacing: 50,
            },
            label: {
                padding: 0,
                fontSize: 10,
                format: '.2f',
            },
            thickness: 25,
            crosshair: {
                enabled: true,
                snap: false,
            },
        },
        {
            type: 'category',
            position: 'bottom',
            label: {
                enabled: true,
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
            break;
        case 'All':
        default:
            rangeStart = new Date(2022, 1, 27);
            format = 'm-y';
            break;
    }

    options.zoom!.rangeX = { start: rangeStart };

    options.axes![2].label!.formatter = ({ value }) => dateFormat(value, format);
    options.axes![2].crosshair!.label!.renderer = ({ value }) => {
        return { text: dateFormat(value, format) };
    };

    AgCharts.update(chart, options);
}
