import {
    AgCartesianChartOptions,
    AgCategoryAxisOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Renewable Energy Share by Source' },
    data: [
        { source: 'Solar\nPhotovoltaic', share: 31 },
        { source: 'Onshore\nWind', share: 27 },
        { source: 'Offshore\nWind', share: 12 },
        { source: 'Hydro-\nelectric', share: 22 },
        { source: 'Bioenergy\n& Waste', share: 8 },
    ],
    series: [{ type: 'bar', xKey: 'source', yKey: 'share', yName: 'Share (%)' }],
    axes: {
        x: { type: 'category', label: { fontSize: 12, lineHeight: 14 } },
        y: { type: 'number', title: { text: 'Share (%)' } },
    },
};

const chart = AgCharts.create(options);

function updateFontSize(event: any) {
    const value = Number(event.target?.value);
    (options.axes!.x as AgCategoryAxisOptions).label!.fontSize = value;
    chart.update(options);
    document.getElementById('fontSizeSliderValue')!.innerHTML = String(value);
}

function updateLineHeight(event: any) {
    const value = Number(event.target?.value);
    (options.axes!.x as AgCategoryAxisOptions).label!.lineHeight = value;
    chart.update(options);
    document.getElementById('lineHeightSliderValue')!.innerHTML = String(value);
    (document.getElementById('lineHeightAutoButton') as HTMLButtonElement).disabled = false;
}

function resetLineHeight() {
    delete (options.axes!.x as AgCategoryAxisOptions).label!.lineHeight;
    chart.update(options);
    document.getElementById('lineHeightSliderValue')!.innerHTML = 'auto';
    (document.getElementById('lineHeightAutoButton') as HTMLButtonElement).disabled = true;
}
