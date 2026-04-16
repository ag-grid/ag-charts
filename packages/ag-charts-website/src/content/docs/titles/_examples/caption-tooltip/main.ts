import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Quarterly Revenue by Product Line Across All Regions',
        maxWidth: 250,
        tooltip: {
            text: 'Revenue figures in USD, sourced from internal CRM. Updated quarterly.',
        },
    },
    subtitle: {
        text: 'Fiscal Year 2025',
        tooltip: {
            renderer: ({ text }) => `<b>${text}</b><br/>Data refreshed: April 2025`,
        },
    },
    footnote: {
        text: 'Source: Internal CRM — Excludes returns, refunds and inter-company transfers',
        maxWidth: 300,
    },
    data: [
        { quarter: 'Q1', widgets: 420, gadgets: 310, gizmos: 220 },
        { quarter: 'Q2', widgets: 490, gadgets: 350, gizmos: 280 },
        { quarter: 'Q3', widgets: 530, gadgets: 410, gizmos: 310 },
        { quarter: 'Q4', widgets: 610, gadgets: 460, gizmos: 370 },
    ],
    series: [
        { type: 'bar', xKey: 'quarter', yKey: 'widgets', yName: 'Widgets' },
        { type: 'bar', xKey: 'quarter', yKey: 'gadgets', yName: 'Gadgets' },
        { type: 'bar', xKey: 'quarter', yKey: 'gizmos', yName: 'Gizmos' },
    ],
};

const chart = AgCharts.create(options);

function setTooltipVisible(visible: 'auto' | 'always' | 'never') {
    options.title!.tooltip = { ...options.title!.tooltip, visible };
    options.subtitle!.tooltip = { ...options.subtitle!.tooltip, visible };
    options.footnote!.tooltip = { ...options.footnote!.tooltip, visible };
    chart.update(options);
}
