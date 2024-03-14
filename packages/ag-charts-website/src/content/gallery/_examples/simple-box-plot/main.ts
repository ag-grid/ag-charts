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
            q1Key: 'q1',
            medianKey: 'median',
            q3Key: 'q3',
            maxKey: 'max',
            cornerRadius: 8,
            strokeOpacity: 0,
            whisker: {
                strokeOpacity: 0.9,
            },
            cap: {
                lengthRatio: 0.8,
            },
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'category',
            groupPaddingInner: 0,
            paddingInner: 0.7,
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
            tick: {
                values: [105, 385, 2714],
            },
        },
    ],
};

AgCharts.create(options);
