import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import {
    getFemaleData,
    getMaleData,
    getRandomisedFemaleData,
    getRandomisedMaleData,
    getRemovedFemaleData,
    getRemovedMaleData,
} from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    animation: {
        enabled: true,
    },
    series: [
        {
            type: 'bubble',
            title: 'Male',
            data: getMaleData(),
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
            sizeKey: 'age',
            sizeName: 'Age',
            labelKey: 'name',
            marker: {
                shape: 'square',
                size: 6,
                maxSize: 30,
                fill: 'rgba(227,111,106,0.71)',
                stroke: '#9f4e4a',
            },
            label: {
                enabled: true,
            },
        },
        {
            type: 'bubble',
            title: 'Female',
            data: getFemaleData(),
            xKey: 'height',
            xName: 'Height',
            yKey: 'weight',
            yName: 'Weight',
            sizeKey: 'age',
            sizeName: 'Age',
            labelKey: 'name',
            marker: {
                size: 6,
                maxSize: 30,
                fill: 'rgba(123,145,222,0.71)',
                stroke: '#56659b',
            },
            label: {
                enabled: true,
            },
        },
    ],
};

const chart = AgCharts.create(options);

function reset() {
    options.series![0].data = getMaleData();
    options.series![1].data = getFemaleData();
    AgCharts.update(chart, options as any);
}

function randomise() {
    options.series![0].data = getRandomisedMaleData();
    options.series![1].data = getRandomisedFemaleData();
    AgCharts.update(chart, options as any);
}

function remove() {
    options.series![0].data = getRemovedMaleData();
    options.series![1].data = getRemovedFemaleData();
    AgCharts.update(chart, options as any);
}
