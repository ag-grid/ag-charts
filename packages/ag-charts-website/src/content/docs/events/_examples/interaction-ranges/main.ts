import { AgCartesianChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { CategoryAxisModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);
let options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'petrol',
            nodeClickRange: 'exact',
            listeners: {
                seriesNodeClick: ({ datum }) => console.log(`petrol - ${datum.petrol}`),
            },
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'diesel',
            nodeClickRange: 'exact',
            listeners: {
                seriesNodeClick: ({ datum }) => console.log(`diesel - ${datum.diesel}`),
            },
        },
    ],
};

const chart = AgCharts.create(options);

function exact() {
    options.series = options.series!.map((series) => ({
        ...series,
        nodeClickRange: 'exact',
    }));

    chart.update(options);
}

function nearest() {
    options.series = options.series!.map((series) => ({
        ...series,
        nodeClickRange: 'nearest',
    }));

    chart.update(options);
}

function distance() {
    options.series = options.series!.map((series) => ({
        ...series,
        nodeClickRange: 10,
    }));

    chart.update(options);
}
