import { AgChartOptions, AgCharts } from 'ag-charts-community';
import { NumberAxisModule, ScatterSeriesModule, ModuleRegistry } from 'ag-charts-community';

import { femaleHeightWeight, maleHeightWeight } from './height-weight-data';


ModuleRegistry.registerModules([NumberAxisModule, ScatterSeriesModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Weight vs Height',
    },
    subtitle: {
        text: 'by gender',
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
    ],
    axes: {
        x: {
            type: 'number',
            position: 'bottom',
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
            position: 'left',
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
