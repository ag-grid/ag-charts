import { AgChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { ModuleRegistry, NumberAxisModule, ScatterSeriesModule } from 'ag-charts-community';

import { femaleHeightWeight, maleHeightWeight, teenHeightWeight } from './height-weight-data';

ModuleRegistry.registerModules([LegendModule, NumberAxisModule, ScatterSeriesModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    theme: 'ag-accessible',
    title: {
        text: 'Weight vs Height',
    },
    subtitle: {
        text: 'by group',
    },
    series: [
        {
            type: 'scatter',
            title: 'Male',
            data: maleHeightWeight,
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
        },
        {
            type: 'scatter',
            title: 'Female',
            data: femaleHeightWeight,
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
        },
        {
            type: 'scatter',
            title: 'Teens',
            data: teenHeightWeight,
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
        },
    ],
    axes: {
        x: {
            type: 'number',
            title: {
                text: 'Height',
            },
            label: {
                formatter: (params) => {
                    return params.value + 'cm';
                },
            },
        },
        y: {
            type: 'number',
            title: {
                text: 'Weight',
            },
            label: {
                formatter: (params) => {
                    return params.value + 'kg';
                },
            },
        },
    },
};

AgCharts.create(options);
