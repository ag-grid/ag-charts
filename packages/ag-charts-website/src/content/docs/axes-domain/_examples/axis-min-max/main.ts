import { AgCartesianChartOptions, AgCharts, AgNumberAxisOptions, LegendModule } from 'ag-charts-community';
import { CategoryAxisModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { os: 'Windows', share: 88.07 },
        { os: 'macOS', share: 9.44 },
        { os: 'Linux', share: 1.87 },
    ],
    series: [
        {
            type: 'line',
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

function domainChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const numberAxisOptions = options.axes!.y! as AgNumberAxisOptions;
    delete numberAxisOptions.min;
    delete numberAxisOptions.max;
    if (value === 'min-max') {
        numberAxisOptions.min = -50;
        numberAxisOptions.max = 150;
    }
    chart.update(options);
}
