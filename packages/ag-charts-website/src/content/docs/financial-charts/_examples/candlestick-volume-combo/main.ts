import {
    AgCartesianChartOptions,
    AgCartesianSeriesTooltipRendererParams,
    AgCharts,
    AgSeriesTooltip,
} from 'ag-charts-enterprise';

import { getData } from './data';

function dateFormat(dateString: string, format: string) {
    const dateObject = new Date(dateString);
    const formattedDate =
        format == 'd-m'
            ? dateObject.toLocaleString('en-GB', { day: 'numeric', month: 'short' })
            : dateObject.toLocaleString('en-GB', { month: 'short', year: '2-digit' });

    return formattedDate;
}

const tooltipOptions: AgSeriesTooltip<any> = {
    position: {
        type: 'top-left',
        xOffset: 70,
        yOffset: 20,
    },
    renderer: ({ datum }: AgCartesianSeriesTooltipRendererParams) => {
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
    toolbar: {
        ranges: {
            enabled: true,
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
            position: 'right',
            keys: ['open', 'close', 'high', 'low'],
            max: 210,
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
            type: 'number',
            position: 'left',
            keys: ['volume'],
            max: 1000000000,
            label: { enabled: false },
            crosshair: { enabled: false },
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
    annotations: {
        enabled: true,
        initial: [
            {
                type: 'parallel-channel',
                start: { x: new Date(1672756200000), y: 130.28 + 6 },
                end: { x: new Date(1689773400000), y: 195.1 + 6 },
                size: 12,
            },
            {
                type: 'line',
                start: { x: new Date(1701959400000), y: 193.63 },
                end: { x: new Date(1707489000000), y: 188.85 },
            },
            {
                type: 'line',
                start: { x: new Date(1691155800000), y: 185.52 },
                end: { x: new Date(1698413400000), y: 166.91 },
            },
        ],
    },
};

AgCharts.create(options);
