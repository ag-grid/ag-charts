// @ag-skip-fws
import {
    AgCartesianChartOptions,
    AgCharts,
    AgFinancialChartOptions,
    AllEnterpriseModule,
    ModuleRegistry,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllEnterpriseModule]);

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

// The colour picker's text field is the one chart `input` the visualiser's input rule can reach.
const financialData = Array.from({ length: 30 }, (_, i) => {
    const open = 100 + 10 * Math.sin(i / 3);
    const close = open + (i % 2 === 0 ? 3 : -3);
    return {
        date: new Date(2024, 3, i + 1),
        open,
        high: Math.max(open, close) + 2,
        low: Math.min(open, close) - 2,
        close,
    };
});

const financialOptions: AgFinancialChartOptions = {
    container: document.getElementById('financialChart'),
    data: financialData,
    rangeButtons: false,
    navigator: false,
    toolbar: true,
    volume: false,
    zoom: false,
};

AgCharts.create(visualiserOptions);
AgCharts.create(outsideOptions);
AgCharts.createFinancialChart(financialOptions);
