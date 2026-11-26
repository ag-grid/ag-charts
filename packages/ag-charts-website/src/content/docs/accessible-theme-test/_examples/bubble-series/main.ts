import { AgChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { BubbleSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { femaleHeightWeight, maleHeightWeight, teenHeightWeight } from './height-weight-data';

ModuleRegistry.registerModules([BubbleSeriesModule, LegendModule, NumberAxisModule]);
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
            type: 'bubble',
            title: 'Male',
            data: maleHeightWeight,
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
            sizeKey: 'age',
            sizeName: 'Age',
        },
        {
            type: 'bubble',
            title: 'Female',
            data: femaleHeightWeight,
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
            sizeKey: 'age',
            sizeName: 'Age',
        },
        {
            type: 'bubble',
            title: 'Teens',
            data: teenHeightWeight,
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
            sizeKey: 'age',
            sizeName: 'Age',
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
