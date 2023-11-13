import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { data } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'sunburst',
            labelKey: 'name',
            secondaryLabelKey: 'change',
            sizeKey: 'valuation',
            colorKey: 'change',
            colorRange: ['#cb4b3f', '#6acb64'],
            sectorSpacing: 1,
            secondaryLabel: {
                formatter(params) {
                    return params.value.toFixed(2) + '%';
                },
            },
            tooltip: {
                renderer: (params) => {
                    return {
                        content: `<b>Change</b>: ${params.datum.change.toFixed(2)}%`,
                    };
                },
            },
        },
    ],
    title: {
        text: 'S&P 500 index stocks categorized by sectors and industries.',
    },
    subtitle: {
        text: 'Area represents market cap. Color represents change from the day before.',
    },
};

AgEnterpriseCharts.create(options);
