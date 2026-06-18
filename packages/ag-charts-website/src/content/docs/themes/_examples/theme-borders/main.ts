import {
    AgCartesianChartOptions,
    AgCharts,
    CategoryAxisModule,
    ChartToolbarModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([
    LineSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
    ZoomModule,
    ChartToolbarModule,
]);

let width = 2;
let radius = 8;
let color = 'accentColor';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Adjust the border on the zoom buttons',
    },
    data: [
        { month: 'Jan', revenue: 120 },
        { month: 'Feb', revenue: 150 },
        { month: 'Mar', revenue: 180 },
        { month: 'Apr', revenue: 140 },
        { month: 'May', revenue: 210 },
        { month: 'Jun', revenue: 190 },
    ],
    series: [{ type: 'line', xKey: 'month', yKey: 'revenue', yName: 'Revenue' }],
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
    zoom: {
        enabled: true,
        buttons: { visible: 'always' },
    },
};

const chart = AgCharts.create(options);
updateBorder();

function updateBorder() {
    options.theme = {
        params: {
            accentColor: '#2f6df0',
            buttonBorder: { width, color: color === 'accentColor' ? { ref: 'accentColor' } : color },
            buttonBorderRadius: radius,
        },
    };
    chart.update(options);
}

function changeWidth(event: Event) {
    width = Number((event.target as HTMLInputElement).value);
    document.getElementById('width-value')!.textContent = String(width);
    updateBorder();
}

function changeRadius(event: Event) {
    radius = Number((event.target as HTMLInputElement).value);
    document.getElementById('radius-value')!.textContent = String(radius);
    updateBorder();
}

function changeColor(event: Event) {
    color = (event.target as HTMLSelectElement).value;
    updateBorder();
}
