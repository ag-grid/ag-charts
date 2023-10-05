import {
    AgCartesianChartOptions,
    AgCartesianSeriesTooltipRendererParams,
    AgEnterpriseCharts,
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

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: "Try dragging the Navigator's handles to zoom in",
    },
    subtitle: {
        text: 'or the area between them to pan around',
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
            min: new Date(2004, 0, 1),
            max: new Date(2020, 0, 1),
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
        enabled: true,
    },
};

var chart = AgEnterpriseCharts.create(options);

function toggleEnabled(value: boolean) {
    options.navigator!.enabled = value;
    AgEnterpriseCharts.update(chart, options);
}
