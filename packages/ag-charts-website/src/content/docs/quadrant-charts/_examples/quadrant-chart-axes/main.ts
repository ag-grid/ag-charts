import { AgCharts, AgQuadrantChartOptions, ModuleRegistry, QuadrantChartModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([QuadrantChartModule]);

const options: AgQuadrantChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Roadmap Prioritisation' },
    subtitle: { text: 'Toggle whether the axes cross at the pivot' },
    xKey: 'effort',
    xName: 'Effort',
    yKey: 'impact',
    yName: 'Impact',
    labelKey: 'initiative',
    labelName: 'Initiative',
    label: { enabled: true },
    pivot: { x: 4, y: 6 },
    alignAxesToPivot: false,
    xAxis: {
        min: 0,
        max: 10,
        title: { text: 'Effort' },
        label: { enabled: true },
        tick: { enabled: true },
    },
    yAxis: {
        min: 0,
        max: 10,
        title: { text: 'Impact' },
        label: { enabled: true },
        tick: { enabled: true },
    },
};

const chart = AgCharts.createQuadrantChart(options);

function toggleAlignAxesToPivot() {
    options.alignAxesToPivot = !options.alignAxesToPivot;
    chart.update(options);
}
