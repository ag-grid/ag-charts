import { AgChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { ModuleRegistry, NumberAxisModule, ScatterSeriesModule } from 'ag-charts-community';

import { femaleHeightWeight, maleHeightWeight } from './height-weight-data';

ModuleRegistry.registerModules([LegendModule, NumberAxisModule, ScatterSeriesModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Weight vs Height',
    },
    subtitle: {
        text: 'by Gender',
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
            shape: 'square',
            fill: '#e36f6ab5',
            stroke: '#9f4e4a',
        },
        {
            type: 'scatter',
            title: 'Female',
            data: femaleHeightWeight,
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
            shape: 'circle', // default
            fill: '#7b91deb5',
            stroke: '#56659b',
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
