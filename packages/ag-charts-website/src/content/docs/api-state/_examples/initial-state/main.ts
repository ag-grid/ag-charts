import {
    AgCartesianChartOptions,
    AgCartesianSeriesTooltipRendererParams,
    AgChartState,
    AgCharts,
} from 'ag-charts-enterprise';

import { getData } from './data';

const data = getData();

const tooltip = {
    renderer: ({ datum, xKey, yKey }: AgCartesianSeriesTooltipRendererParams) => {
        const date = Intl.DateTimeFormat('en-GB').format(datum[xKey]);
        return { content: `${date}: ${Math.round(datum[yKey] / 100) / 10 + 'k'}` };
    },
};

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Total Visitors to Tate Galleries',
    },
    footnote: {
        text: 'Source: Department for Digital, Culture, Media & Sport',
    },
    data,
    navigator: {
        enabled: true,
    },
    zoom: {
        enabled: true,
    },
    initialState: {
        zoom: {
            rangeX: {
                start: {
                    __type: 'date',
                    value: new Date('2021-01-01').getTime(),
                },
            },
        },
    },
    series: [
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Modern',
            yName: 'Tate Modern',
            tooltip,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Britain',
            yName: 'Tate Britain',
            tooltip,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Liverpool',
            yName: 'Tate Liverpool',
            tooltip,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate St Ives',
            yName: 'Tate St Ives',
            tooltip,
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Total visitors',
            },
            label: {
                formatter: (params) => {
                    return params.value / 1000 + 'k';
                },
            },
        },
    ],
};

const chart = AgCharts.create(options);

function showSixMonths() {
    options.initialState!.zoom = {
        rangeX: {
            start: {
                __type: 'date',
                value: data[data.length - 1].date.getTime() - 1000 * 60 * 60 * 24 * 30 * 6,
            },
        },
    };
    chart.update(options);
}

function show2019() {
    options.initialState!.zoom = {
        rangeX: {
            start: {
                __type: 'date',
                value: new Date('2019-01-01').getTime(),
            },
            end: {
                __type: 'date',
                value: new Date('2020-01-01').getTime(),
            },
        },
    };
    chart.update(options);
}

function showAll() {
    options.initialState!.zoom = {};
    chart.update(options);
}
