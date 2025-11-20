import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import {
    CategoryAxisModule,
    NumberAxisModule,
    ScatterSeriesModule,
    ModuleRegistry,
} from 'ag-charts-community';
import { ErrorBarsModule } from 'ag-charts-enterprise';

import { getData } from './data';


ModuleRegistry.registerModules([CategoryAxisModule, ErrorBarsModule, NumberAxisModule, ScatterSeriesModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Volume-Pressure Relationship',
    },
    series: [
        {
            type: 'scatter',
            xKey: 'volume',
            yKey: 'pressure',
            errorBar: {
                xLowerKey: 'volumeLower',
                xUpperKey: 'volumeUpper',
                yLowerKey: 'pressureLower',
                yUpperKey: 'pressureUpper',
            },
        },
    ],
};

AgCharts.create(options);
