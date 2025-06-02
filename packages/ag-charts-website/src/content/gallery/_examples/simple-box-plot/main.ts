import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Migration Flows to Europe',
    },
    subtitle: {
        text: 'Quarterly Overview (April - June 2023)',
    },
    footnote: {
        text: 'Source: UN International Organization for Migration',
    },
    data: getData(),
    series: [
        {
            type: 'box-plot',
            xKey: 'countryOfArrival',
            xName: 'Country Of Arrival',
            yName: 'Monthly Arrivals',
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
                strokeOpacity: 0.9,
            },
            cap: {
                lengthRatio: 0.8,
            },
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
            paddingInner: 0.7,
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
            type: 'number',
            position: 'left',
            interval: { values: [105, 385, 2714] },
            line: {
                enabled: false,
            },
        },
    ],
    formatter: {
        y: '#{,.0f}',
    },
};

AgCharts.create(options);
