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
        backgroundColor: 'var(--chart-bg)',
        foregroundColor: 'var(--chart-fg)',
    },
};

const options: AgCartesianChartOptions = {
    container: document.getElementById('chart1'),
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
            fill: 'var(--series-fill-1)',
        } as AgBarSeriesOptions,
    ],
    axes: { x: { type: 'category' }, y: { type: 'number' } },
};

AgCharts.create(options);

const options2: AgCartesianChartOptions = {
    container: document.getElementById('chart2'),
    theme,
    title: { text: 'Product Sales' },
    data: [
        { product: 'Alpha', units: 80, returns: 20 },
        { product: 'Beta', units: 110, returns: 15 },
        { product: 'Gamma', units: 95, returns: 30 },
        { product: 'Delta', units: 60, returns: 10 },
    ],
    series: [
        { type: 'bar', xKey: 'product', yKey: 'units', yName: 'Units Sold', fill: 'var(--series-fill-2)' },
        { type: 'bar', xKey: 'product', yKey: 'returns', yName: 'Returns', fill: 'var(--series-fill-3)' },
    ] as AgBarSeriesOptions[],
    axes: { x: { type: 'category' }, y: { type: 'number' } },
};

AgCharts.create(options2);

let dark = false;

function toggleDarkMode() {
    dark = !dark;
    document.body.classList.toggle('dark', dark);
    document.getElementById('status')!.textContent = `Mode: ${dark ? 'Dark' : 'Light'} — no chart.update() called`;
}

(window as any).toggleDarkMode = toggleDarkMode;
