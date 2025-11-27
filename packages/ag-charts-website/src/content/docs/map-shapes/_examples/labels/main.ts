import { ModuleRegistry } from 'ag-charts-community';
import { AgChartOptions, AgCharts, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';
import { GradientLegendModule, MapShapeSeriesModule } from 'ag-charts-enterprise';

import { DataType, data } from './data';
import { topology } from './topology';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    GradientLegendModule,
    MapShapeSeriesModule,
    ZoomModule,
]);
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
            labelKey: 'code',
            colorKey: 'gdp',
            tooltip: {
                renderer: ({ datum }) => ({
                    data: [
                        { label: 'GDP', value: numberFormatter.format(datum.gdp) },
                        { label: 'Code', value: datum.code },
                    ],
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

const numberFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    useGrouping: true,
});

AgCharts.create(options);
