import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const MONTH = 30 * 24 * 60 * 60 * 1000;

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Acme Inc.' },
    data: getData(),
    volume: false,
    theme: {
        overrides: {
            common: {
                toolbar: {
                    ranges: {
                        enabled: true,
                        buttons: [
                            {
                                label: '6 Months',
                                value: 6 * MONTH,
                            },
                            {
                                label: '12 Months',
                                value: 12 * MONTH,
                            },
                            {
                                label: 'February',
                                value: [new Date(2023, 1, 1), new Date(2023, 2, 1)],
                            },
                            {
                                label: 'All Data',
                                value: (start, end) => [start, end],
                            },
                        ],
                    },
                },
            },
        },
    },
};

AgCharts.createFinancialChart(options);
