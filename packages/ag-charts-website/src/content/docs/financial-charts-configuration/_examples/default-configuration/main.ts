import {
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    TimeAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-community';
import {
    AgCharts,
    AgFinancialChartOptions,
    AnimationModule,
    CrosshairModule,
    OrdinalTimeAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';
import { FinancialChartModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    FinancialChartModule,
    LegendModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    TimeAxisModule,
    UnitTimeAxisModule,
    ZoomModule,
]);

const options: AgFinancialChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
};

const chart = AgCharts.createFinancialChart(options);
