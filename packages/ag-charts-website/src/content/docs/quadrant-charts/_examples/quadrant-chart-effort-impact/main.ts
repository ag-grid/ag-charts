import { AgCharts, AgQuadrantChartOptions, ModuleRegistry, QuadrantChartModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([QuadrantChartModule]);

const options: AgQuadrantChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Roadmap Prioritisation' },
    subtitle: { text: 'Expected impact against implementation effort' },
    xKey: 'effort',
    xName: 'Effort',
    yKey: 'impact',
    yName: 'Impact',
    label: { color: 'rgba(0, 0, 0, 0.5)' },
    labelKey: 'initiative',
    labelName: 'Initiative',
    xAxis: { min: 0, max: 10, title: { text: 'Effort' } },
    yAxis: { min: 0, max: 10, title: { text: 'Impact' } },
    pivot: { x: 5, y: 5 },
    regions: {
        topLeft: {
            fill: '#22c55e',
            fillOpacity: 0.12,
            stroke: '#22c55e',
            strokeOpacity: 0.4,
            strokeWidth: 1,
            label: { text: 'Quick Wins', position: 'inside', color: '#16a34a', fontSize: 14, fontWeight: 'bold' },
        },
        topRight: {
            fill: '#3b82f6',
            fillOpacity: 0.12,
            stroke: '#3b82f6',
            strokeOpacity: 0.4,
            strokeWidth: 1,
            label: { text: 'Big Bets', position: 'inside', color: '#2563eb', fontSize: 14, fontWeight: 'bold' },
        },
        bottomLeft: {
            fill: '#94a3b8',
            fillOpacity: 0.12,
            stroke: '#94a3b8',
            strokeOpacity: 0.4,
            strokeWidth: 1,
            label: { text: 'Fill-ins', position: 'inside', color: '#64748b', fontSize: 14, fontWeight: 'bold' },
        },
        bottomRight: {
            fill: '#ef4444',
            fillOpacity: 0.12,
            stroke: '#ef4444',
            strokeOpacity: 0.4,
            strokeWidth: 1,
            label: { text: 'Time Sinks', position: 'inside', color: '#dc2626', fontSize: 14, fontWeight: 'bold' },
        },
    },
};

AgCharts.createQuadrantChart(options);
