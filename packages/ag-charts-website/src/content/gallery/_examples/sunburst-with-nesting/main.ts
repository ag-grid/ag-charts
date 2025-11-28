import { ModuleRegistry } from 'ag-charts-community';
import { AgChartOptions, AgCharts, ContextMenuModule, SunburstSeriesModule } from 'ag-charts-enterprise';

import { DataType, data } from './data';

ModuleRegistry.registerModules([SunburstSeriesModule]);
const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'sunburst',
            labelKey: 'name',
            secondaryLabelKey: 'size',
            sizeKey: 'size',
            secondaryLabel: {
                formatter: ({ value }) => (value != null ? `${value.toFixed(0)} kb` : undefined),
            },
            tooltip: {
                renderer: ({ datum }) => ({
                    data: datum?.size != null ? [{ label: `Size`, value: `${datum.size.toFixed(0)} kb` }] : undefined,
                }),
            },
        },
    ],
    title: {
        text: 'Webpack dependencies',
    },
};

AgCharts.create(options);
