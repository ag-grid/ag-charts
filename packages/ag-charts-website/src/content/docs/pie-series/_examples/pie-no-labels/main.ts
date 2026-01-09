import { AgChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { ModuleRegistry, PieSeriesModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([LegendModule, PieSeriesModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'pie',
            angleKey: 'amount',
        },
    ],
    legend: {
        enabled: false,
    },
};

AgCharts.create(options);
