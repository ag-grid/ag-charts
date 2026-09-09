import {
    AgCharts,
    AgQuadrantChartOptions,
    AgQuadrantRegion,
    ModuleRegistry,
    QuadrantChartModule,
} from 'ag-charts-enterprise';

import { type OperationalRisk, getData } from './data';

ModuleRegistry.registerModules([QuadrantChartModule]);

const responses: Record<AgQuadrantRegion, string> = {
    'top-left': 'Mitigate',
    'top-right': 'Escalate',
    'bottom-left': 'Accept',
    'bottom-right': 'Monitor',
};

const options: AgQuadrantChartOptions<OperationalRisk> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Operational Risk Register',
    },
    subtitle: {
        text: 'Assessed likelihood against financial exposure',
    },
    xKey: 'likelihood',
    xName: 'Likelihood',
    yKey: 'impact',
    yName: 'Impact',
    labelKey: 'risk',
    labelName: 'Risk',
    alignAxesToPivot: false,
    pivot: { x: 50, y: 4.5 },
    xAxis: {
        title: { text: 'Likelihood' },
        min: 0,
        max: 100,
        line: { enabled: false },
        crosshair: { enabled: false },
    },
    yAxis: {
        title: { text: 'Impact' },
        min: 0,
        max: 8,
        line: { enabled: false },
        crosshair: { enabled: false },
    },
    size: 14,
    regions: {
        topLeft: {
            label: { text: responses['top-left'] },
            stroke: { ref: 'chartBackgroundColor' },
            strokeWidth: 1,
        },
        topRight: {
            label: { text: responses['top-right'] },
            stroke: { ref: 'chartBackgroundColor' },
            strokeWidth: 1,
        },
        bottomLeft: {
            label: { text: responses['bottom-left'] },
            stroke: { ref: 'chartBackgroundColor' },
            strokeWidth: 1,
        },
        bottomRight: {
            label: { text: responses['bottom-right'] },
            stroke: { ref: 'chartBackgroundColor' },
            strokeWidth: 1,
        },
    },
    tooltip: {
        renderer: ({ datum, region }) => ({
            heading: datum.risk,
            title: `${responses[region]} — owned by ${datum.owner}`,
            data: [
                { label: 'Likelihood', value: `${datum.likelihood}%` },
                { label: 'Impact', value: `£${datum.impact.toFixed(1)}m` },
            ],
        }),
    },
    formatter: {
        x: (params) => {
            if (params.type !== 'number') return;
            return `${params.value}%`;
        },
        y: (params) => {
            if (params.type !== 'number') return;
            return `£${params.value}m`;
        },
    },
};

AgCharts.createQuadrantChart(options);
