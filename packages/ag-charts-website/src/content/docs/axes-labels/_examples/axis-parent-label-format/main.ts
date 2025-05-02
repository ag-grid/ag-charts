import { AgCartesianChartOptions, AgCharts, time } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
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
            type: 'time',
            position: 'bottom',
            unit: time.day,
            label: {
                format: {
                    day: '%e',
                    month: '%b',
                },
            },
            parentLevel: {
                enabled: true,
                label: {
                    format: {
                        month: '%e\n%b',
                        year: '%b\n%Y',
                    },
                },
            },
        },
        {
            type: 'number',
            position: 'left',
        },
    ],
    zoom: {},
    navigator: {},
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
