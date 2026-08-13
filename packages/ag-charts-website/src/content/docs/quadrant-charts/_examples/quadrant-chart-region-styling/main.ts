import { AgCharts, AgQuadrantChartOptions, ModuleRegistry, QuadrantChartModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([QuadrantChartModule]);

const options: AgQuadrantChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Climate Anomalies' },
    subtitle: { text: 'Departure from the 1961–1990 baseline, split at global mean warming' },
    xKey: 'tempAnomaly',
    xName: 'Temperature anomaly (°C)',
    yKey: 'precipAnomaly',
    yName: 'Precipitation anomaly (%)',
    labelKey: 'country',
    labelName: 'Country',
    xAxis: { title: { text: 'Temperature anomaly (°C)' }, label: { formatter: (params) => `${params.value} °C` } },
    yAxis: { title: { text: 'Precipitation anomaly (%)' }, label: { formatter: (params) => `${params.value}%` } },
    pivot: { x: 1.35, y: 0 },
    regions: {
        topLeft: {
            fill: {
                type: 'gradient',
                rotation: 315,
                colorStops: [
                    { color: '#38bdf8', stop: 0 },
                    { color: 'rgba(56, 189, 248, 0)', stop: 1 },
                ],
            },
            fillOpacity: 0.45,
            stroke: '#0284c7',
            strokeOpacity: 0.4,
            strokeWidth: 1,
            marker: { fill: '#38bdf8', strokeWidth: 0 },
            label: {
                text: 'Slower Warming, Wetter',
                position: 'inside-top-left',
                color: '#0284c7',
                fontSize: 14,
                fontWeight: 'bold',
            },
        },
        topRight: {
            fill: {
                type: 'gradient',
                rotation: 45,
                colorStops: [
                    { color: '#a855f7', stop: 0 },
                    { color: 'rgba(168, 85, 247, 0)', stop: 1 },
                ],
            },
            fillOpacity: 0.45,
            stroke: '#9333ea',
            strokeOpacity: 0.4,
            strokeWidth: 1,
            marker: { fill: '#a855f7', strokeWidth: 0 },
            label: {
                text: 'Faster Warming, Wetter',
                position: 'inside-top-right',
                color: '#9333ea',
                fontSize: 14,
                fontWeight: 'bold',
            },
        },
        bottomLeft: {
            fill: {
                type: 'gradient',
                rotation: 225,
                colorStops: [
                    { color: '#14b8a6', stop: 0 },
                    { color: 'rgba(20, 184, 166, 0)', stop: 1 },
                ],
            },
            fillOpacity: 0.45,
            stroke: '#0d9488',
            strokeOpacity: 0.4,
            strokeWidth: 1,
            marker: { fill: '#14b8a6', strokeWidth: 0 },
            label: {
                text: 'Slower Warming, Drier',
                position: 'inside-bottom-left',
                color: '#0d9488',
                fontSize: 14,
                fontWeight: 'bold',
            },
        },
        bottomRight: {
            fill: {
                type: 'gradient',
                rotation: 135,
                colorStops: [
                    { color: '#f97316', stop: 0 },
                    { color: 'rgba(249, 115, 22, 0)', stop: 1 },
                ],
            },
            fillOpacity: 0.45,
            stroke: '#ea580c',
            strokeOpacity: 0.4,
            strokeWidth: 1,
            marker: { fill: '#f97316', strokeWidth: 0 },
            label: {
                text: 'Faster Warming, Drier',
                position: 'inside-bottom-right',
                color: '#ea580c',
                fontSize: 14,
                fontWeight: 'bold',
            },
        },
    },
};

AgCharts.createQuadrantChart(options);
