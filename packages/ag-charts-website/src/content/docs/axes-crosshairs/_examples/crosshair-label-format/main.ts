import { AgCartesianChartOptions, AgCharts, AgTimeAxisOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    animation: { enabled: false },
    theme: {
        palette: {
            strokes: ['#AC9BF5', '#5984C2', '#36A883', '#F5CA46'],
            fills: ['#AC9BF5', '#5984C2', '#36A883', '#F5CA46'],
        },
    },
    padding: {
        left: 50,
        right: 50,
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
            interval: {
                step: { unit: 'month', step: 6 },
            },
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
            crosshair: {
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
    const crosshair = options.axes![0].crosshair! as AgTimeAxisOptions;
    crosshair.label = {
        format: `%d %b '%y`,
    };
    chart.update(options);
}

function axisLabelFormat() {
    const axes0 = options.axes![0] as AgTimeAxisOptions;
    const crosshair = axes0.crosshair!;
    if (crosshair.label && crosshair.label.format) {
        delete crosshair.label.format;
    }
    axes0.label = { format: `%b %Y` };
    chart.update(options);
}

function defaultFormat() {
    const axes0 = options.axes![0] as AgTimeAxisOptions;
    const crosshair = axes0.crosshair!;
    if (crosshair.label && crosshair.label.format) {
        delete crosshair.label.format;
    }
    if (axes0.label && axes0.label.format) {
        delete axes0.label!.format;
    }
    chart.update(options);
}
