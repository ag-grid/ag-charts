import { LegendModule, ModuleRegistry } from 'ag-charts-community';
import { AgCharts, AgFinancialChartOptions, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';
import { FinancialChartModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AnimationModule, CrosshairModule, FinancialChartModule, LegendModule, ZoomModule]);

const options: AgFinancialChartOptions = {
    theme: {
        palette: {
            up: { fill: '#F3A93C', stroke: '#A8492D' },
            down: { fill: '#1A00F4', stroke: '#75FBFD' },
        },
    },
    container: document.getElementById('myChart'),
    data: getData(),
};

const chart = AgCharts.createFinancialChart(options);
