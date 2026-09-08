import { AgCartesianChartOptions, AgCharts, AgNumberAxisOptions, LegendModule } from 'ag-charts-community';
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
        },
    },
};

const chart = AgCharts.create(options);

function stepChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const axis = options.axes?.y as AgNumberAxisOptions;
    delete axis.interval;
    if (value !== 'none') {
        axis.interval = { step: Number(value) };
    }
    chart.update(options);
}
