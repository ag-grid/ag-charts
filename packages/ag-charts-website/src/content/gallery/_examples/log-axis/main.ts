import { AgCartesianChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const formatter = new Intl.NumberFormat();

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'World Population Over Time',
    },
    subtitle: {
        text: 'log scale',
    },
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'population',
            tooltip: {
                renderer: ({ datum, xKey, yKey }) => ({
                    content: `${datum[xKey]} CE: ${formatter.format(datum[yKey] ?? 0)}`,
                }),
            },
        },
    ],
    axes: [
        {
            type: 'log',
            position: 'left',
            title: {
                text: 'Population',
            },
            label: {
                format: ',.0f',
            },
        },
        {
            type: 'number',
            position: 'bottom',
            title: {
                text: 'Year',
            },
        },
    ],
};

const chart = AgEnterpriseCharts.create(options);

function useNumberAxis() {
    options.subtitle = {
        text: 'linear scale',
    };
    options.axes![0] = {
        type: 'number',
        position: 'left',
        title: {
            text: 'Population',
        },
        label: {
            format: ',.0f',
            fontSize: 10,
        },
    };
    AgEnterpriseCharts.update(chart, options);
}

function useLogAxis() {
    options.subtitle = {
        text: 'log scale',
    };
    options.axes![0] = {
        type: 'log',
        position: 'left',
        title: {
            text: 'Population',
        },
        label: {
            format: ',.0f',
            fontSize: 10,
        },
    };
    AgEnterpriseCharts.update(chart, options);
}
