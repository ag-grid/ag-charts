import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { CategoryAxisModule, NumberAxisModule, ModuleRegistry } from 'ag-charts-community';
import { GradientLegendModule, MapShapeSeriesModule } from 'ag-charts-enterprise';

import { DataType, data } from './data';
import { topology } from './topology';


ModuleRegistry.registerModules([CategoryAxisModule, GradientLegendModule, MapShapeSeriesModule, NumberAxisModule]);
const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'GDP by State',
    },
    data,
    topology,
    series: [
        {
            type: 'map-shape',
            idKey: 'name',
            colorKey: 'gdp',
            tooltip: {
                renderer: ({ datum }) => ({
                    data: [{ label: 'GDP', value: numberFormatter.format(datum.gdp) }],
                }),
            },
        },
    ],
    gradientLegend: {
        enabled: true,
        scale: {
            label: {
                fontSize: 9,
                formatter: ({ value }) => `$${Math.floor(+value / 1e6)}T`,
            },
        },
    },
};

AgCharts.create(options);

const numberFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    useGrouping: true,
});
