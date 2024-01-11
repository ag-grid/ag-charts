import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Software & Hardware Revenues',
    },
    subtitle: {
        text: 'Millions USD',
    },
    series: [
        {
            type: 'radar-area',
            angleKey: 'quarter',
            radiusKey: 'software',
            radiusName: 'Software',
            fillOpacity: 0.1,
            label: {
                enabled: true,
            },
            marker: {
                enabled: true,
            },
        },
        {
            type: 'radar-area',
            angleKey: 'quarter',
            radiusKey: 'hardware',
            radiusName: 'Hardware',
            fillOpacity: 0.3,
            marker: {
                enabled: true,
            },
        },
        // {
        //   type: "radar-area",
        //   angleKey: "quarter",
        //   radiusKey: "services",
        //   radiusName: "Services",
        //   fillOpacity: 0.3,
        // },
    ],
    axes: [
        {
            type: 'radius-number',
            innerRadiusRatio: 0,
            shape: 'circle',
            tick: {
                size: 0,
                interval: 0.1,
            },
            label: {
                enabled: false,
            },
        },
        {
            type: 'angle-category',
            paddingInner: 0.4,
            line: {
                enabled: false,
            },
            label: {
                enabled: false,
            },
            gridLine: {
                enabled: true,
            },
        },
    ],
};

AgCharts.create(options);
