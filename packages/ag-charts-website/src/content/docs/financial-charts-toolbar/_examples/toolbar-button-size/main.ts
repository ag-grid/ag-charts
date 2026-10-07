import { AgCharts, AgFinancialChartOptions, FinancialChartModule, ModuleRegistry } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([FinancialChartModule]);

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Toolbar Button Sizes',
    },
    theme: {
        overrides: {
            common: {
                annotations: {
                    toolbar: {
                        buttonSize: 44,
                    },
                    optionsToolbar: {
                        buttonSize: 44,
                    },
                },
                chartToolbar: {
                    buttonSize: 40,
                },
                zoom: {
                    buttons: {
                        buttonSize: 36,
                        visible: 'always',
                    },
                },
                ranges: {
                    buttonSize: 48,
                },
            },
        },
    },
};

AgCharts.createFinancialChart(options);
