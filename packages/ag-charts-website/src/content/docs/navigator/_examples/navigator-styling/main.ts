import {
    AgCartesianSeriesTooltipRendererParams,
    AgChartOptions,
    AgCharts,
    AgSeriesTooltip,
} from 'ag-charts-enterprise';

import { getData } from './data';

const tooltip: AgSeriesTooltip<AgCartesianSeriesTooltipRendererParams> = {
    renderer: ({ datum, xKey, yKey }) => ({
        content: `${datum[xKey].toLocaleString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })}: ${datum[yKey]}`,
    }),
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Navigator Styling',
    },
    data: getData(),
    series: [
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Modern',
            fill: '#c16068',
            stroke: '#874349',
            tooltip,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Britain',
            fill: '#a2bf8a',
            stroke: '#718661',
            tooltip,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Liverpool',
            fill: '#ebcc87',
            stroke: '#a48f5f',
            tooltip,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate St Ives',
            fill: '#80a0c3',
            stroke: '#5a7088',
            tooltip,
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
            nice: false,
            interval: {
                maxSpacing: 200,
            },
        },
        {
            type: 'number',
            position: 'left',
            label: {
                formatter: (params) => {
                    return params.value / 1000 + 'k';
                },
            },
        },
    ],
    legend: {
        enabled: false,
    },
    navigator: {
        height: 50,
        min: 0.2,
        max: 0.7,
        mask: {
            fill: 'red',
            strokeWidth: 2,
            fillOpacity: 0.3,
        },
        minHandle: {
            fill: 'yellow',
            stroke: 'blue',
            width: 16,
            height: 30,
            gripLineGap: 4,
            gripLineLength: 12,
            strokeWidth: 2,
        },
        maxHandle: {
            fill: 'lime',
            stroke: 'black',
        },
    },
};

const chart = AgCharts.create(options);
