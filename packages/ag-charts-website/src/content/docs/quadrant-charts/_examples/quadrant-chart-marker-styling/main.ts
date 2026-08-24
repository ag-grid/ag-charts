import { AgCharts, AgQuadrantChartOptions, ModuleRegistry, QuadrantChartModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([QuadrantChartModule]);

const options: AgQuadrantChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Product Portfolio Review' },
    subtitle: { text: 'Markers styled by the region each point falls in' },
    xKey: 'revenueGrowth',
    xName: 'Revenue growth',
    yKey: 'marginChange',
    yName: 'Margin change',
    labelKey: 'category',
    labelName: 'Category',
    shape: 'circle',
    size: 12,
    strokeWidth: 2,
    itemStyler: ({ region }) => {
        switch (region) {
            case 'top-right':
                return { fill: '#16a34a', stroke: '#15803d', size: 18 };
            case 'top-left':
                return { fill: '#ca8a04', stroke: '#a16207' };
            case 'bottom-right':
                return { fill: '#2563eb', stroke: '#1d4ed8' };
            case 'bottom-left':
                return { fill: '#dc2626', stroke: '#b91c1c', shape: 'cross', strokeWidth: 3 };
        }
    },
    xAxis: { title: { text: 'Revenue growth (%)' } },
    yAxis: { title: { text: 'Margin change (% points)' } },
};

AgCharts.createQuadrantChart(options);
