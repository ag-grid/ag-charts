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
                    enableOutOfRange: false,
                    buttons: [
                        { label: '12 Months (in)', value: { unit: 'month', step: 12 } },
                        { label: '48 Months (out)', value: { unit: 'month', step: 48 } },
                        { label: 'February 2025 (out)', value: [new Date(2025, 1, 0), new Date(2025, 1, 27)] },
                        {
                            label: 'Window +1 Second (out)',
                            value: (_start, _end, windowStart, windowEnd) => {
                                return [windowStart, Number(windowEnd) + 1];
                            },
                        },
                        { label: 'All Data (in)', value: undefined },
                    ],
                },
            },
        },
    },
};

AgCharts.createFinancialChart(options);
