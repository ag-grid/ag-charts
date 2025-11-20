import {
    AreaSeriesModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-community';
import { AgCartesianChartOptions, AgCartesianSeriesTooltipRendererParams, AgCharts } from 'ag-charts-enterprise';
import { NavigatorModule, ZoomModule } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([
    AreaSeriesModule,
    LegendModule,
    NavigatorModule,
    NumberAxisModule,
    UnitTimeAxisModule,
    ZoomModule,
]);
const data = getData();

const dateFormatter = new Intl.DateTimeFormat('en-GB');
const tooltip = {
    renderer: ({ datum, yKey }: AgCartesianSeriesTooltipRendererParams<DataType>) => {
        const value = `${Math.round(Number(datum[yKey]) / 100) / 10 + 'k'}`;
        return { data: [{ label: dateFormatter.format(datum.date), value }] };
    },
};

const options: AgCartesianChartOptions<DataType> = {
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
        legend: [
            {
                seriesId: 'tate-modern',
                visible: false,
            },
        ],
    },
    series: [
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Modern',
            yName: 'Tate Modern',
            id: 'tate-modern',
            tooltip,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Britain',
            yName: 'Tate Britain',
            id: 'tate-britain',
            tooltip,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Liverpool',
            yName: 'Tate Liverpool',
            id: 'tate-liverpool',
            tooltip,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate St Ives',
            yName: 'Tate St Ives',
            id: 'tate-st-ives',
            tooltip,
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
        },
        y: {
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
    },
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

function setInitialLegendState() {
    options.initialState!.legend = [
        {
            seriesId: 'tate-modern',
            visible: false,
        },
        {
            seriesId: 'tate-liverpool',
            visible: false,
        },
    ];
    chart.update(options);
}

function resetInitialLegendState() {
    options.initialState!.legend = [
        {
            seriesId: 'tate-modern',
            visible: true,
        },
        {
            seriesId: 'tate-liverpool',
            visible: true,
        },
        {
            seriesId: 'tate-britain',
            visible: true,
        },
        {
            seriesId: 'tate-st-ives',
            visible: true,
        },
    ];
    chart.update(options);
}
