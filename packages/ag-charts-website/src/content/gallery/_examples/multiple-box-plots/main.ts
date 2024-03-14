import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

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
    series: [
        {
            data: data['Jan - Mar 2023'],
            type: 'box-plot',
            xKey: 'countryOfArrival',
            xName: 'Country Of Arrival',
            yName: 'Jan - Mar 2023',
            minKey: 'min',
            q1Key: 'q1',
            medianKey: 'median',
            q3Key: 'q3',
            maxKey: 'max',
            cornerRadius: 8,
            strokeOpacity: 0,
            whisker: {
                strokeOpacity: 1,
            },
            cap: {
                lengthRatio: 0,
            },
        },
        {
            data: data['April - June 2023'],
            type: 'box-plot',
            xKey: 'countryOfArrival',
            xName: 'Country Of Arrival',
            yName: 'April - June 2023',
            minKey: 'min',
            q1Key: 'q1',
            medianKey: 'median',
            q3Key: 'q3',
            maxKey: 'max',
            cornerRadius: 8,
            strokeOpacity: 0,
            whisker: {
                strokeOpacity: 1,
            },
            cap: {
                lengthRatio: 0,
            },
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
                padding: 10,
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
