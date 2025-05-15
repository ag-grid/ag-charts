import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(800),
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'price',
            marker: {
                enabled: false,
            },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
        },
        {
            type: 'time',
            position: 'bottom',
            unit: 'day',
            label: {
                format: {
                    day: '%e',
                    month: '%b',
                },
            },
            parentLevel: {
                enabled: true,
                tick: {
                    width: 1,
                },
                label: {
                    format: {
                        month: '%e\n%b',
                        year: '%b\n%Y',
                    },
                },
            },
        },
    ],
    zoom: {
        enabled: true,
        autoScaling: {
            enabled: true,
        },
    },
    navigator: {
        enabled: true,
    },
    initialState: {
        zoom: {
            ratioX: { start: 0.95, end: 1 },
        },
    },
};

const chart = AgCharts.create(options);

function zoomOut() {
    chart.setState({
        version: '11.0.0',
        zoom: {
            ratioX: { start: 0, end: 1 },
        },
    });
}

function zoomMonth() {
    chart.setState({
        version: '11.0.0',
        zoom: {
            ratioX: { start: 0.95, end: 1 },
        },
    });
}
