import { AgCharts, AgQuadrantChartOptions, ModuleRegistry, QuadrantChartModule } from 'ag-charts-enterprise';

import { type ProductLine, getData } from './data';

ModuleRegistry.registerModules([QuadrantChartModule]);

// The chart palette's red and green, plus a grey for the two regions kept low-emphasis.
const DIVEST = '#ef5452';
const INVEST = '#459d55';
const NEUTRAL = '#999999';

const options: AgQuadrantChartOptions<ProductLine> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Growth-Share Matrix',
    },
    subtitle: {
        text: 'Marker size shows annual revenue',
    },
    xKey: 'relativeShare',
    xName: 'Relative market share',
    yKey: 'marketGrowth',
    yName: 'Market growth',
    sizeKey: 'revenue',
    sizeName: 'Revenue',
    minSize: 12,
    maxSize: 70,
    labelKey: 'product',
    labelName: 'Product',
    pivot: { x: 1, y: 10 },
    shape: 'square',
    xAxis: {
        title: { text: 'Relative market share' },
        crosshair: { enabled: false },
    },
    yAxis: {
        title: { text: 'Market growth' },
        crosshair: { enabled: false },
    },
    axisPlacement: {
        label: 'crossing',
    },
    fillOpacity: 0.6,
    regions: {
        label: {
            spacing: 4,
            fontSize: 14,
            fontWeight: 'normal',
            color: { ref: 'chartBackgroundColor' },
            padding: { top: 4, right: 8, bottom: 4, left: 8 },
        },
        topLeft: {
            fill: NEUTRAL,
            stroke: NEUTRAL,
            strokeWidth: 0,
            fillOpacity: 0,
        },
        topRight: {
            fill: INVEST,
            stroke: INVEST,
            strokeWidth: 0,
            fillOpacity: 0.1,
            label: { text: 'Invest', fill: { ref: 'foregroundColor', mix: 0.3, ontoColor: INVEST } },
        },
        bottomLeft: {
            fill: DIVEST,
            stroke: DIVEST,
            strokeWidth: 0,
            fillOpacity: 0.1,
            label: { text: 'Divest', fill: { ref: 'foregroundColor', mix: 0.3, ontoColor: DIVEST } },
        },
        bottomRight: {
            fill: NEUTRAL,
            stroke: NEUTRAL,
            strokeWidth: 0,
            fillOpacity: 0,
        },
    },
    formatter: {
        x: (params) => {
            if (params.type !== 'number') return;
            return `${params.value}×`;
        },
        y: (params) => {
            if (params.type !== 'number') return;
            return `${params.value}%`;
        },
        size: (params) => {
            if (params.type !== 'number') return;
            return `$${params.value}m`;
        },
    },
};

AgCharts.createQuadrantChart(options);
