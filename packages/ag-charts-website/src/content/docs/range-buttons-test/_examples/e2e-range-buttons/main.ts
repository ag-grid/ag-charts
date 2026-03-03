import {
    AgCharts,
    AgFinancialChartOptions,
    ContextMenuModule,
    FinancialChartModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([FinancialChartModule]);

const MONTH = 30 * 24 * 60 * 60 * 1000;

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Acme Inc.' },
    data: getData(),
    volume: false,
    theme: {
        overrides: {
            common: {
                zoom: {
                    anchorPointX: 'middle',
                },
                ranges: {
                    enabled: true,
                    buttons: [
                        {
                            label: '3 Months (number)',
                            value: 3 * MONTH,
                        },
                        {
                            label: '3 Months (calendar)',
                            value: { unit: 'month', step: 3 },
                        },
                        {
                            label: 'Value Pair',
                            value: [new Date(2023, 1, 1), new Date(2023, 2, 1)],
                        },
                        {
                            label: 'All Domain Function',
                            value: (start, end) => [start, end],
                        },
                        {
                            label: 'Visible Window Function',
                            value: (_domainStart, _domainEnd, _windowStart, windowEnd) => {
                                const start = new Date(
                                    (typeof windowEnd === 'number' ? windowEnd : windowEnd.getTime()) - 1 * MONTH
                                );
                                return [start, windowEnd];
                            },
                        },
                    ],
                },
            },
        },
    },
};

AgCharts.createFinancialChart(options);
