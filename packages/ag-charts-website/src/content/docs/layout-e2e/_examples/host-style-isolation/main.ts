// @ag-skip-fws
import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    LegendModule,
    NumberAxisModule,
]);

const data = [
    { quarter: 'Q1', widgets: 420, gadgets: 310 },
    { quarter: 'Q2', widgets: 490, gadgets: 350 },
    { quarter: 'Q3', widgets: 530, gadgets: 410 },
    { quarter: 'Q4', widgets: 610, gadgets: 460 },
];

const series: AgCartesianChartOptions['series'] = [
    { type: 'bar', xKey: 'quarter', yKey: 'widgets', yName: 'Widgets' },
    { type: 'bar', xKey: 'quarter', yKey: 'gadgets', yName: 'Gadgets' },
];

// One chart inside the visualiser's container and one outside it, under the same page rules.
const visualiserOptions: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series,
};

const outsideOptions: AgCartesianChartOptions = {
    container: document.getElementById('outsideChart'),
    data,
    series,
};

AgCharts.create(visualiserOptions);
AgCharts.create(outsideOptions);
