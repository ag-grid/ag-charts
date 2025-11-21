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
    axes: {
        x: {
            type: 'unit-time',
            label: {
                spacing: 8,
                format: {
                    day: '%e',
                    month: '%b',
                },
            },
            parentLevel: {
                enabled: true,
                tick: {
                    width: 1,
                    size: 4,
                },
                label: {
                    spacing: 4,
                    format: {
                        month: '%e\n%b',
                        year: '%b\n%Y',
                    },
                },
            },
        },
    },
    zoom: {
        enabled: true,
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
