// @ag-skip-fws
import {
    AgBarSeriesOptions,
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule, LegendModule]);

const theme: AgCartesianChartOptions['theme'] = {
    params: {
        accentColor: '#ff0000',
    },
};

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    theme,
    title: { text: 'Monthly Revenue' },
    data: [
        { month: 'Jan', revenue: 120 },
        { month: 'Feb', revenue: 150 },
        { month: 'Mar', revenue: 180 },
        { month: 'Apr', revenue: 140 },
        { month: 'May', revenue: 210 },
        { month: 'Jun', revenue: 190 },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'revenue',
            yName: 'Revenue',
            fill: { ref: 'accentColor', mix: 0.5, ontoColor: 'var(--onto-color)' },
        } as AgBarSeriesOptions,
    ],
    axes: { x: { type: 'category' }, y: { type: 'number' } },
};

AgCharts.create(options);

function changeCSSVariable() {
    const current = document.body.style.getPropertyValue('--onto-color') || '#ffffff';
    document.body.style.setProperty('--onto-color', current === '#000000' ? '#ffffff' : '#000000');
}

(window as any).changeCSSVariable = changeCSSVariable;
