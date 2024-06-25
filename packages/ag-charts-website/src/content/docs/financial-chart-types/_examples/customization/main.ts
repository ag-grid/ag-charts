import { AgCharts, AgFinancialChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

(window as any).agChartsDebug = 'opts';

const options: AgFinancialChartOptions = {
    theme: {
        palette: {
            up: { fill: 'orange', stroke: 'light-orange' },
            down: { fill: 'blue', stroke: 'light-blue' },
        },
    },
    container: document.getElementById('myChart'),
    data: getData(),
};

const chart = AgCharts.createFinancialChart(options);
