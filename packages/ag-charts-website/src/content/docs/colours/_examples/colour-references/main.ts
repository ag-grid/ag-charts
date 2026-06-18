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

let accentColor = '#2f6df0';
let backgroundColor = '#ffffff';
let mix = 0.85;

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    theme: {
        params: {
            accentColor,
            backgroundColor,
            // Text and axes are derived from the accent and background colours.
            foregroundColor: { ref: 'accentColor', mix, onto: 'backgroundColor' },
        },
    },
    title: {
        text: 'Monthly Revenue',
    },
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
            // A reference resolves on a series fill as well as on theme parameters.
            fill: { ref: 'accentColor' } as any,
        },
    ],
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
};

const chart = AgCharts.create(options);

/** inScope */
function updateTheme() {
    options.theme = {
        params: {
            accentColor,
            backgroundColor,
            foregroundColor: { ref: 'accentColor', mix, onto: 'backgroundColor' },
        },
    };
    chart.update(options);
}

function changeAccent(event: Event) {
    accentColor = (event.target as HTMLSelectElement).value;
    updateTheme();
}

function changeBackground(event: Event) {
    backgroundColor = (event.target as HTMLSelectElement).value;
    updateTheme();
}

function changeMix(event: Event) {
    mix = Number((event.target as HTMLInputElement).value);
    document.getElementById('mix-value')!.textContent = mix.toFixed(2);
    updateTheme();
}
