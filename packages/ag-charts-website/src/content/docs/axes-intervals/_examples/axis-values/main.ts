import { AgCartesianChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { os: 'Windows', share: 88.07 },
        { os: 'macOS', share: 9.44 },
        { os: 'Linux', share: 1.87 },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'os',
            yKey: 'share',
        },
    ],
    axes: {
        x: {
            type: 'category',
            title: {
                text: 'Operating System',
            },
        },
        y: {
            type: 'number',
            title: {
                text: 'Market Share (%)',
            },
            interval: {
                values: [0, 20, 40, 60, 80, 100],
            },
        },
    },
};

const chart = AgCharts.create(options);

// 'default' restores the values the chart was created with, so the checked segment always names the
// values actually applied.
function valuesChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    options.axes!.y!.interval!.values = value === 'custom' ? [50, 88, 100] : [0, 20, 40, 60, 80, 100];
    chart.update(options);
}
