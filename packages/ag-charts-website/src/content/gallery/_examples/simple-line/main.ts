import {
    AgCartesianSeriesTooltipRendererParams,
    AgChartOptions,
    AgCharts,
    AgTooltipRendererResult,
} from 'ag-charts-enterprise';

import { getData } from './data';

const dateFormatter = new Intl.DateTimeFormat('en-US');
const tooltip = {
    renderer: ({ title, datum, xKey, yKey }: AgCartesianSeriesTooltipRendererParams): AgTooltipRendererResult => ({
        title,
        content: `${dateFormatter.format(datum[xKey])}: ${datum[yKey]}`,
    }),
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Road Fuel Prices',
    },
    footnote: {
        text: 'Source: Department for Business, Energy & Industrial Strategy',
    },
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'petrol',
            tooltip,
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'diesel',
            tooltip,
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'time',
            title: {
                text: 'Date',
            },
            label: {
                format: '%b',
            },
        },
        {
            position: 'left',
            type: 'number',
            title: {
                text: 'Price in Pence',
            },
        },
    ],
};

AgCharts.create(options);
