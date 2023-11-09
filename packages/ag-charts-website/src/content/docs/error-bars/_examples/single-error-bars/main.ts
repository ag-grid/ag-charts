import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Monthly Dividends with 95% Confidence Intervals (%)',
    },
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'dividends',
            yName: 'Monthly Dividends (%)',
            errorBar: {
                yLowerKey: 'lowerCI',
                yUpperKey: 'upperCI',
            },
        },
    ],
};

AgEnterpriseCharts.create(options);
