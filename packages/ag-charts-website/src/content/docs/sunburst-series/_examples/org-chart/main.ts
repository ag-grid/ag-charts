import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { data } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'sunburst',
            labelKey: 'name',
            label: {
                fontSize: 14,
                minimumFontSize: 9,
            },
            secondaryLabel: {
                fontSize: 8,
                minimumFontSize: 7,
            },
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
