import { AgCartesianChartOptions, AgCharts, AgNumberAxisOptions } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);
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
        },
    },
};

const chart = AgCharts.create(options);

function setStep(step: number) {
    const axis = options.axes?.y as AgNumberAxisOptions;
    axis.interval = { step: step };
    chart.update(options);
}

function clearInterval() {
    const axis = options.axes?.y as AgNumberAxisOptions;
    axis.interval = {};
    chart.update(options);
}
