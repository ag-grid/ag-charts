import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            label: {
                // fontSize: 14,
                // minimumFontSize: 9,
                fontSize: 9,
                minimumFontSize: 7,
            },
            secondaryLabel: {
                fontSize: 8,
                minimumFontSize: 7,
            },
            type: 'sunburst',
            labelKey: 'orgHierarchy',
            secondaryLabelKey: 'orgHierarchy',
            colorRange: ['#cb4b3f', '#6acb64'],
            sectorSpacing: 2,
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
