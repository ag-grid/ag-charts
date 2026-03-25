// @ag-skip-fws
import {
    AgCartesianChartOptions,
    AgCharts,
    CategoryAxisModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    RangesModule,
    ZoomModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([CategoryAxisModule, LineSeriesModule, NumberAxisModule, RangesModule, ZoomModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: Array.from({ length: 20 }, (_, i) => ({ x: i, y: i * 10 })),
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    zoom: { enabled: true },
    ranges: {
        enabled: true,
        buttons: [
            { label: 'Half', value: [0, 9] },
            { label: 'All', value: undefined },
        ],
    },
};

const chart = AgCharts.create(options);

document.getElementById('disable')!.addEventListener('click', () => {
    chart.updateDelta({ ranges: { enabled: false } });
});
document.getElementById('enable')!.addEventListener('click', () => {
    chart.updateDelta({ ranges: { enabled: true } });
});
