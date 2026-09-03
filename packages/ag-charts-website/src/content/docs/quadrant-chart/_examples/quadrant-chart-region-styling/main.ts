import { AgCharts, AgQuadrantChartOptions, ModuleRegistry, QuadrantChartModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([QuadrantChartModule]);

function formatRegion(region: string) {
    return region
        .split('-')
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(' ');
}

const options: AgQuadrantChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Climate Anomalies' },
    xKey: 'tempAnomaly',
    xName: 'Temperature anomaly (°C)',
    yKey: 'precipAnomaly',
    yName: 'Precipitation anomaly (%)',
    labelKey: 'country',
    labelName: 'Country',
    xAxis: {
        title: { text: 'Temperature anomaly (°C)' },
        label: { formatter: (params) => `${params.value} °C` },
        line: { enabled: false, width: 0 },
        gridLine: { enabled: false },
    },
    yAxis: {
        title: { text: 'Precipitation anomaly (%)' },
        label: { formatter: (params) => `${params.value}%` },
        max: 20,
        line: { enabled: false },
        gridLine: { enabled: false },
    },
    pivot: { x: 1.35, y: 0 },
    regions: {
        label: {
            fontSize: 14,
            fontWeight: 'bold',
        },
        topLeft: {
            fill: {
                type: 'gradient',
                rotation: 315,
                colorStops: [{ color: 'rgba(56, 189, 248, 0)' }, { color: '#38bdf8' }],
            },
            fillOpacity: 0.45,
            stroke: '#0284c7',
            strokeOpacity: 0.4,
            strokeWidth: 1.5,
            marker: { fill: '#38bdf8', strokeWidth: 0 },
            label: {
                text: 'Slower Warming, Wetter',
                color: '#0284c7',
            },
        },
        topRight: {
            fill: {
                type: 'gradient',
                rotation: 45,
                colorStops: [{ color: 'rgba(168, 85, 247, 0)' }, { color: '#a855f7' }],
            },
            fillOpacity: 0.45,
            stroke: '#9333ea',
            strokeOpacity: 0.4,
            strokeWidth: 1.5,
            marker: { fill: '#a855f7', strokeWidth: 0, size: 18 },
            label: {
                text: 'Faster Warming, Wetter',
                color: '#9333ea',
            },
        },
        bottomLeft: {
            fill: {
                type: 'gradient',
                rotation: 225,
                colorStops: [{ color: 'rgba(20, 184, 166, 0)' }, { color: '#14b8a6' }],
            },
            fillOpacity: 0.45,
            stroke: '#0d9488',
            strokeOpacity: 0.4,
            strokeWidth: 1.5,
            marker: { fill: '#14b8a6', stroke: '#0d9488', strokeWidth: 2, shape: 'cross' },
            label: {
                text: 'Slower Warming, Drier',
                color: '#0d9488',
            },
        },
        bottomRight: {
            fill: {
                type: 'gradient',
                rotation: 135,
                colorStops: [{ color: 'rgba(249, 115, 22, 0)' }, { color: '#f97316' }],
            },
            fillOpacity: 0.45,
            stroke: '#ea580c',
            strokeOpacity: 0.4,
            strokeWidth: 1.5,
            marker: { fill: '#f97316', strokeWidth: 0 },
            label: {
                text: 'Faster Warming, Drier',
                color: '#ea580c',
            },
        },
    },
    tooltip: {
        renderer: ({ region }) => ({
            title: formatRegion(region),
        }),
    },
};

AgCharts.createQuadrantChart(options);
