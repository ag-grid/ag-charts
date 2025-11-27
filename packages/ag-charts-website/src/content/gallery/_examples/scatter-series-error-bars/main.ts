import { CategoryAxisModule, ModuleRegistry, NumberAxisModule, ScatterSeriesModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts, ErrorBarsModule } from 'ag-charts-enterprise';

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
