import { AgCharts, AgQuadrantChartOptions, ModuleRegistry, QuadrantChartModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([QuadrantChartModule]);

const options: AgQuadrantChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Roadmap Prioritisation' },
    subtitle: { text: 'Effort against impact, with axis ticks shown' },
    xKey: 'effort',
    xName: 'Effort',
    yKey: 'impact',
    yName: 'Impact',
    labelKey: 'initiative',
    labelName: 'Initiative',
    label: { enabled: true },
    pivot: { x: 4, y: 6 },
    xAxis: {
        min: 0,
        max: 10,
        title: { text: 'Effort' },
        tick: { enabled: true },
    },
    yAxis: {
        min: 0,
        max: 10,
        title: { text: 'Impact' },
        tick: { enabled: true },
    },
};

AgCharts.createQuadrantChart(options);
