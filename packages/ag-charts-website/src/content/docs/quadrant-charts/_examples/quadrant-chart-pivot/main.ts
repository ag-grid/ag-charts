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
    labelKey: 'initiative',
    labelName: 'Initiative',
    label: { enabled: true },
    xAxis: { min: 0, max: 10, title: { text: 'Effort' } },
    yAxis: { min: 0, max: 10, title: { text: 'Impact' } },
    pivot: { x: 4, y: 6 },
};

AgCharts.createQuadrantChart(options);
