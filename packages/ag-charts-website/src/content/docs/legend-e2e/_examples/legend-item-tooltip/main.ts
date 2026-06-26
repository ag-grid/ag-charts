import { AgCartesianChartOptions, AgChartLegendItemTooltipRendererParams, AgCharts } from 'ag-charts-community';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { quarter: 'Q1', coal: -666, naturalGas: -1197, petroleum: -124 },
        { quarter: 'Q2', coal: 208, naturalGas: 906, petroleum: -318 },
        { quarter: 'Q3', coal: 426, naturalGas: 276, petroleum: 166 },
        { quarter: 'Q4', coal: 158, naturalGas: 672, petroleum: -19 },
    ],
    series: [
        { type: 'bar', xKey: 'quarter', yKey: 'naturalGas', yName: 'Natural Gas' },
        { type: 'bar', xKey: 'quarter', yKey: 'coal', yName: 'Coal' },
        { type: 'bar', xKey: 'quarter', yKey: 'petroleum', yName: 'Petroleum' },
    ],
    legend: {
        item: {
            label: { maxLength: 5 },
            tooltip: { visible: 'auto' },
        },
    },
};

const chart = AgCharts.create(options);

function setMode(mode: string) {
    switch (mode) {
        case 'auto':
            options.legend = { item: { label: { maxLength: 5 }, tooltip: { visible: 'auto' } } };
            break;
        case 'always':
            options.legend = { item: { label: { maxLength: 5 }, tooltip: { visible: 'always' } } };
            break;
        case 'never':
            options.legend = { item: { label: { maxLength: 5 }, tooltip: { visible: 'never' } } };
            break;
        case 'custom-text':
            options.legend = { item: { label: { maxLength: 5 }, tooltip: { text: 'Click to toggle' } } };
            break;
        case 'renderer':
            options.legend = {
                item: {
                    label: { maxLength: 5 },
                    tooltip: {
                        renderer: ({ text, visible }: AgChartLegendItemTooltipRendererParams) => {
                            const status = visible ? 'Visible' : 'Hidden';
                            return `<b>${text}</b> — <em>${status}</em>`;
                        },
                    },
                },
            };
            break;
    }
    chart.update(options);
}
