import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Proportion of Hits for Recollection, Familiarity, and Guessing Across Different Stimuli and Task Conditions',
    },
    series: [
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'recollection',
            yName: 'Recollection',
            errorBar: {
                yLowerKey: 'recollection_error_low',
                yUpperKey: 'recollection_error_high',
            },
        },
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'familiarity',
            yName: 'Familiarity',
            errorBar: {
                yLowerKey: 'familiarity_error_low',
                yUpperKey: 'familiarity_error_high',
            },
        },
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'guessing',
            yName: 'Guessing',
            errorBar: {
                yLowerKey: 'guessing_error_low',
                yUpperKey: 'guessing_error_high',
            },
        },
    ],
    axes: {
        x: {
            type: 'grouped-category',
        },
    },
};

const chart = AgCharts.create(options);
