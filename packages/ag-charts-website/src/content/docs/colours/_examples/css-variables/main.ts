import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule, LegendModule]);

const dawn = {
    '--demo-bg': '#fffdf7',
    '--demo-fg': '#3a2e2e',
    '--demo-online': '#e07a5f',
    '--demo-retail': '#3d405b',
};

const dusk = {
    '--demo-bg': '#161b22',
    '--demo-fg': '#e6edf3',
    '--demo-online': '#58a6ff',
    '--demo-retail': '#ff7b72',
};

function applyPalette(palette: Record<string, string>) {
    for (const [name, value] of Object.entries(palette)) {
        document.documentElement.style.setProperty(name, value);
    }
}

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    theme: {
        params: {
            backgroundColor: 'var(--demo-bg)',
            foregroundColor: 'var(--demo-fg)',
        },
    },
    title: {
        text: 'Monthly Revenue',
    },
    data: [
        { month: 'Jan', online: 120, retail: 90 },
        { month: 'Feb', online: 150, retail: 100 },
        { month: 'Mar', online: 180, retail: 130 },
        { month: 'Apr', online: 140, retail: 120 },
        { month: 'May', online: 210, retail: 160 },
        { month: 'Jun', online: 190, retail: 150 },
    ],
    series: [
        { type: 'bar', xKey: 'month', yKey: 'online', yName: 'Online', fill: 'var(--demo-online)' },
        { type: 'bar', xKey: 'month', yKey: 'retail', yName: 'Retail', fill: 'var(--demo-retail)' },
    ],
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
};

AgCharts.create(options);

let dark = false;

function togglePalette() {
    dark = !dark;
    applyPalette(dark ? dusk : dawn);
}
