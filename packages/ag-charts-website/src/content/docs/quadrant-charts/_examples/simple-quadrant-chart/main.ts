import { AgCharts, AgQuadrantChartOptions, ModuleRegistry, QuadrantChartModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([QuadrantChartModule]);

const options: AgQuadrantChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Product Portfolio Review' },
    subtitle: { text: 'Year-on-year revenue growth against change in gross margin' },
    xKey: 'revenueGrowth',
    xName: 'Revenue growth',
    yKey: 'marginChange',
    yName: 'Margin change',
    labelKey: 'category',
    labelName: 'Category',
    label: { enabled: true },
    xAxis: { title: { text: 'Revenue growth (%)' } },
    yAxis: { title: { text: 'Margin change (% points)' } },
};

AgCharts.createQuadrantChart(options);
