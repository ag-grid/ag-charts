import {
    LegendModule,
    ModuleRegistry,
} from 'ag-charts-community';
import {
    AgCharts,
    AgFinancialChartOptions,
    AnimationModule,
    CrosshairModule,
    ZoomModule,
} from 'ag-charts-enterprise';
import { FinancialChartModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    FinancialChartModule,
    LegendModule,
    ZoomModule,
]);

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Fibonacci Tools',
    },
    rangeButtons: false,
    initialState: {
        annotations: [
            {
                type: 'fibonacci-retracement',
                start: {
                    x: {
                        __type: 'date',
                        value: '2024-03-21T19:30:00.000Z',
                    },
                    y: 39839.65593310556,
                },
                end: {
                    x: {
                        __type: 'date',
                        value: '2024-03-21T19:12:00.000Z',
                    },
                    y: 39830.30360752416,
                },
            },
            {
                type: 'fibonacci-retracement-trend-based',
                endRetracement: {
                    x: {
                        __type: 'date',
                        value: '2024-03-21T18:59:00.000Z',
                    },
                    y: 39824.246612868774,
                },
                start: {
                    x: {
                        __type: 'date',
                        value: '2024-03-21T18:38:00.000Z',
                    },
                    y: 39822.62080641716,
                },
                end: {
                    x: {
                        __type: 'date',
                        value: '2024-03-21T18:47:00.000Z',
                    },
                    y: 39830.20790319135,
                },
            },
        ],
    },
};

AgCharts.createFinancialChart(options);
