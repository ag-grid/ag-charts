import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const shared = {
    xKey: 'countryOfArrival',
    xName: 'Country Of Arrival',
    minKey: 'min',
    minName: 'Min',
    q1Key: 'q1',
    q1Name: 'Q1',
    medianKey: 'median',
    medianName: 'Median',
    q3Key: 'q3',
    q3Name: 'Q3',
    maxKey: 'max',
    maxName: 'Max',
    cornerRadius: 8,
    stroke: 'white',
    whisker: {
        stroke: '#2b5c95',
        strokeOpacity: 1,
    },
    cap: {
        lengthRatio: 0,
    },
};

const data = getData();
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Europe — Mixed Migration Flows',
    },
    subtitle: {
        text: 'Quarterly Overview',
    },
    footnote: {
        text: 'Source: UN International Organization for Migration',
    },
    padding: {
        left: 50,
    },
    series: [
        {
            type: 'box-plot',
            data: data['Jan - Mar 2023'],
            yName: 'Jan - Mar 2023',
            ...shared,
        },
        {
            type: 'box-plot',
            data: data['April - June 2023'],
            yName: 'April - June 2023',
            ...shared,
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'category',
            paddingInner: 0.5,
            paddingOuter: 0.2,
            gridLine: {
                enabled: true,
            },
            line: {
                enabled: false,
            },
            label: {
                spacing: 10,
            },
        },
        {
            position: 'left',
            type: 'number',
            line: {
                enabled: false,
            },
            label: {
                enabled: false,
            },
        },
    ],
};

AgCharts.create(options);
