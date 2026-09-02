import { AgCharts, AgQuadrantChartOptions, ModuleRegistry, QuadrantChartModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([QuadrantChartModule]);

const options: AgQuadrantChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Product Portfolio Review' },
    subtitle: { text: 'Marker size shows annual revenue' },
    xKey: 'revenueGrowth',
    xName: 'Revenue growth',
    yKey: 'marginChange',
    yName: 'Margin change',
    sizeKey: 'revenue',
    sizeName: 'Revenue',
    minSize: 8,
    maxSize: 40,
    labelKey: 'category',
    labelName: 'Category',
    xAxis: { title: { text: 'Revenue growth (%)' } },
    yAxis: { title: { text: 'Margin change (% points)' } },
};

AgCharts.createQuadrantChart(options);
