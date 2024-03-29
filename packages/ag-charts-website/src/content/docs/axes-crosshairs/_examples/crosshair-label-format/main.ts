import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    theme: {
        palette: {
            strokes: ['#AC9BF5', '#5984C2', '#36A883', '#F5CA46'],
            fills: ['#AC9BF5', '#5984C2', '#36A883', '#F5CA46'],
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Onshore wind',
            yName: 'Onshore Wind',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Offshore wind',
            yName: 'Offshore Wind',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Solar photovoltaics',
            yName: 'Solar Photovoltaics',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Small scale Hydro',
            yName: 'Small Scale Hydro',
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'time',
            gridLine: {
                style: [],
            },
            nice: false,
            crosshair: {
                enabled: true,
            },
        },
        {
            position: 'right',
            type: 'number',
            title: {
                text: `kilotonnes of oil equivalent (ktoe)`,
            },
            label: {
                formatter: (params) => `${params.value / 1000}K`,
            },
            line: {
                enabled: false,
            },
        },
    ],
    tooltip: {
        enabled: false,
    },
};

const chart = AgCharts.create(options);

function crosshairLabelFormat() {
    const crosshair = options.axes![0].crosshair!;
    crosshair.label = {
        format: `%b %Y`,
    };
    AgCharts.update(chart, options);
}

function axisLabelFormat() {
    const axes0 = options.axes![0]!;
    const crosshair = axes0.crosshair!;
    if (crosshair.label && crosshair.label.format) {
        delete axes0.crosshair!.label!.format;
    }
    axes0.label = { format: `%Y` };
    AgCharts.update(chart, options);
}

function defaultFormat() {
    const axes0 = options.axes![0]!;
    const crosshair = axes0.crosshair!;
    if (crosshair.label && crosshair.label.format) {
        delete axes0.crosshair!.label!.format;
    }
    if (axes0.label && axes0.label.format) {
        delete axes0.label!.format;
    }
    AgCharts.update(chart, options);
}
