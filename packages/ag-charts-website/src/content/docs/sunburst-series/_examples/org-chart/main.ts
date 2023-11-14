import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { data } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            label: {
                fontSize: 14,
                minimumFontSize: 9,
            },
            secondaryLabel: {
                fontSize: 8,
                minimumFontSize: 7,
            },
            type: 'sunburst',
            labelKey: 'orgHierarchy',
            secondaryLabelKey: 'orgHierarchy',
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

AgEnterpriseCharts.create(options);
