import { AgCartesianChartOptions, AgCategoryAxisOptions, AgCharts, LegendModule } from 'ag-charts-community';
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
                text: "placement: 'between'",
                fontSize: 15,
            },
            interval: {
                placement: 'between',
            },
            gridLine: {
                width: 1,
                style: [{ fill: 'black', fillOpacity: 0.05, stroke: '#2b5c95' }, { stroke: '#2b5c95' }],
            },
            tick: {
                enabled: true,
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

function setPlacement(placement: 'on' | 'between') {
    (options.axes!.x! as AgCategoryAxisOptions).interval!.placement = placement;
    (options.axes!.x! as AgCategoryAxisOptions).title!.text = `placement: '${placement}'`;
    chart.update(options);
}
