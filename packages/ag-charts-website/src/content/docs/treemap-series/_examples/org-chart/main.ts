import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'treemap',
            labelKey: 'orgHierarchy',
            sizeKey: undefined, // make all siblings within a parent the same size
            colorKey: undefined, // if undefined, depth will be used an the value, where root has 0 depth
            colorRange: ['#d73027', '#fee08b', '#1a9850', 'rgb(0, 116, 52)'],
            group: {
                padding: 5,
            },
            tile: {
                label: {
                    spacing: 1,
                },
            },
            tileSpacing: 5,
            highlightStyle: {
                group: {
                    label: {
                        color: 'white',
                    },
                },
            },
        },
    ],
    title: {
        text: 'Organizational Chart',
    },
    subtitle: {
        text: 'of a top secret startup',
    },
};

AgCharts.create(options);
