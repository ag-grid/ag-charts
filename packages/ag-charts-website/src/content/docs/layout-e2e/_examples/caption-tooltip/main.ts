// @ag-skip-fws
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Quarterly Revenue by Product Line for the Financial Year',
    },
    subtitle: {
        text: 'Fiscal Year 2025',
    },
    footnote: {
        text: 'Excludes returns and refunds',
    },
    data: [
        { quarter: 'Q1', widgets: 420, gadgets: 310 },
        { quarter: 'Q2', widgets: 490, gadgets: 350 },
        { quarter: 'Q3', widgets: 530, gadgets: 410 },
        { quarter: 'Q4', widgets: 610, gadgets: 460 },
    ],
    series: [
        { type: 'bar', xKey: 'quarter', yKey: 'widgets', yName: 'Widgets' },
        { type: 'bar', xKey: 'quarter', yKey: 'gadgets', yName: 'Gadgets' },
    ],
};

const chart = AgCharts.create(options);

document.getElementById('visible-always')!.addEventListener('click', () => {
    options.title!.tooltip = { visible: 'always' };
    options.subtitle!.tooltip = { visible: 'always' };
    chart.update(options);
});

document.getElementById('visible-never')!.addEventListener('click', () => {
    options.title!.tooltip = { visible: 'never' };
    options.subtitle!.tooltip = { visible: 'never' };
    chart.update(options);
});

document.getElementById('visible-auto')!.addEventListener('click', () => {
    options.title!.tooltip = { visible: 'auto' };
    options.subtitle!.tooltip = { visible: 'auto' };
    chart.update(options);
});

document.getElementById('custom-text')!.addEventListener('click', () => {
    options.title!.tooltip = { text: 'Revenue in USD from internal CRM' };
    chart.update(options);
});

document.getElementById('renderer')!.addEventListener('click', () => {
    options.title!.tooltip = {
        renderer: ({ text }) => `<b>${text}</b><br/>Source: Internal CRM`,
    };
    chart.update(options);
});

document.getElementById('empty-renderer')!.addEventListener('click', () => {
    options.title!.tooltip = {
        renderer: () => '',
    };
    chart.update(options);
});

document.getElementById('undefined-renderer')!.addEventListener('click', () => {
    options.title!.tooltip = {
        visible: 'always',
        renderer: () => undefined,
    };
    options.subtitle!.tooltip = {
        visible: 'always',
        text: 'Subtitle fallback text',
        renderer: () => undefined,
    };
    chart.update(options);
});

document.getElementById('truncate')!.addEventListener('click', () => {
    options.title!.maxWidth = 200;
    options.title!.tooltip = undefined;
    chart.update(options);
});

document.getElementById('reset')!.addEventListener('click', () => {
    options.title!.tooltip = undefined;
    options.title!.maxWidth = undefined;
    options.subtitle!.tooltip = undefined;
    chart.update(options);
});
