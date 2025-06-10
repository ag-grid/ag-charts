import {
    AgCartesianSeriesTooltipRendererParams,
    AgChartOptions,
    AgCharts,
    AgTooltipRendererResult,
} from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const dateFormatter = new Intl.DateTimeFormat('en-US');
const tooltip = {
    renderer: ({ datum }: AgCartesianSeriesTooltipRendererParams<DataType>) => ({
        heading: dateFormatter.format(datum.date),
    }),
};

const options: AgChartOptions<DataType> = {
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
            yName: 'Petrol',
            tooltip,
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'diesel',
            yName: 'Diesel',
            tooltip,
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'unit-time',
            title: {
                text: 'Date',
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
