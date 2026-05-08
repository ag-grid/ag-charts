import {
    AgCartesianChartOptions,
    AgCharts,
    CategoryAxisModule,
    GradientLegendModule,
    HeatmapSeriesModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, GradientLegendModule, HeatmapSeriesModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Service Quality Ratings',
    },
    subtitle: {
        text: 'NPS Score (0–10)',
    },
    series: [
        {
            type: 'heatmap',
            xKey: 'segment',
            xName: 'Segment',
            yKey: 'service',
            yName: 'Service',
            colorKey: 'score',
            colorName: 'Score',
            colorScale: {
                domain: [0, 10],
                fills: [{ color: 'tomato', stop: 7 }, { color: 'gold', stop: 9 }, { color: 'seagreen' }],
            },
        },
    ],
    gradientLegend: {
        enabled: true,
        position: 'right',
        scale: {
            label: {
                fontStyle: 'italic',
                color: 'red',
            },
            padding: 10,
        },
    },
};

const chart = AgCharts.create(options);

function setPosition(position: 'bottom' | 'right' | 'left' | 'top') {
    options.gradientLegend = { ...options.gradientLegend, position };
    chart.update(options);
}

function setThickness(value: string) {
    const thickness = Number(value);
    options.gradientLegend = {
        ...options.gradientLegend,
        gradient: { ...options.gradientLegend?.gradient, thickness },
    };
    document.getElementById('thicknessValue')!.innerHTML = String(thickness);
    chart.update(options);
}

function setLength(value: string) {
    const preferredLength = Number(value);
    options.gradientLegend = {
        ...options.gradientLegend,
        gradient: { ...options.gradientLegend?.gradient, preferredLength },
    };
    document.getElementById('lengthValue')!.innerHTML = String(preferredLength);
    chart.update(options);
}

function setPadding(value: string) {
    const padding = Number(value);
    options.gradientLegend = {
        ...options.gradientLegend,
        scale: { ...options.gradientLegend?.scale, padding },
    };
    document.getElementById('paddingValue')!.innerHTML = String(padding);
    chart.update(options);
}
