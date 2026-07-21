import { AgCartesianChartOptions, AgChartState, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Total Visitors to Tate Galleries',
    },
    footnote: {
        text: 'Source: Department for Digital, Culture, Media & Sport',
    },
    data: getData(),
    animation: {
        enabled: false,
    },
    navigator: {
        enabled: true,
    },
    zoom: {
        enabled: true,
    },
    series: [
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Modern',
            yName: 'Tate Modern',
            id: 'tate-modern',
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Britain',
            yName: 'Tate Britain',
            id: 'tate-britain',
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Liverpool',
            yName: 'Tate Liverpool',
            id: 'tate-liverpool',
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate St Ives',
            yName: 'Tate St Ives',
            id: 'tate-st-ives',
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
        },
        y: {
            type: 'number',
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

function restoreUndefined() {
    chart.setState({ version: '14.0.0', zoom: undefined });
}

function restoreEmptyObject() {
    chart.setState({ version: '14.0.0', zoom: {} });
}
