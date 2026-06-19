import {
    AgCartesianChartOptions,
    AgCharts,
    AgThemeColorParam,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule, LegendModule]);

let colorRef: AgThemeColorParam = 'accentColor';
let onto: AgThemeColorParam | 'none' = 'none';
let mix = 0.35;

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    theme: {
        params: {
            accentColor: '#2f6df0',
            backgroundColor: '#ffffff',
            foregroundColor: '#1b2a4a',
            // Only the text colour is derived from the controls below.
            textColor: { ref: colorRef, mix },
        },
    },
    title: {
        text: 'Quarterly Revenue',
    },
    subtitle: {
        text: 'Text colour derived from a parameter reference',
    },
    data: [
        { month: 'Jan', revenue: 120 },
        { month: 'Feb', revenue: 150 },
        { month: 'Mar', revenue: 180 },
        { month: 'Apr', revenue: 140 },
        { month: 'May', revenue: 210 },
        { month: 'Jun', revenue: 190 },
    ],
    series: [{ type: 'bar', xKey: 'month', yKey: 'revenue', yName: 'Revenue', fill: '#c9d6e8' }],
    axes: {
        x: { type: 'category', position: 'bottom', title: { text: 'Month' } },
        y: { type: 'number', position: 'left', title: { text: 'Revenue ($000s)' } },
    },
};

const chart = AgCharts.create(options);

/** inScope */
function updateTextColor() {
    const textColor = onto === 'none' ? { ref: colorRef, mix } : { ref: colorRef, mix, onto };
    options.theme = {
        params: {
            accentColor: '#2f6df0',
            backgroundColor: '#ffffff',
            foregroundColor: '#1b2a4a',
            // Only the text colour is derived from the controls below.
            textColor,
        },
    };
    chart.update(options);
}

function changeRef(event: Event) {
    colorRef = (event.target as HTMLSelectElement).value as AgThemeColorParam;
    updateTextColor();
}

function changeOnto(event: Event) {
    onto = (event.target as HTMLSelectElement).value as AgThemeColorParam | 'none';
    updateTextColor();
}

function changeMix(event: Event) {
    mix = Number((event.target as HTMLInputElement).value);
    document.getElementById('mix-value')!.textContent = mix.toFixed(2);
    updateTextColor();
}
