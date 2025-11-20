import { AgCartesianChartOptions, AgCharts, AgNumberAxisOptions } from 'ag-charts-community';
import { CategoryAxisModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

ModuleRegistry.registerModules([CategoryAxisModule, LineSeriesModule, NumberAxisModule]);
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
            position: 'bottom',
            title: {
                text: 'Operating System',
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Market Share (%)',
            },
            nice: true,
        },
    },
};

const chart = AgCharts.create(options);

function toggleAxisNice() {
    (options.axes!.y! as AgNumberAxisOptions).nice = !(options.axes!.y! as AgNumberAxisOptions).nice;
    chart.update(options);
}
