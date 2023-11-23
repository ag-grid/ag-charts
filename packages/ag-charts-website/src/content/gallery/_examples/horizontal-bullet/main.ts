import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

function tooltipRenderer(params: { datum: any; valueKey: string; valueName?: string; targetKey?: string }) {
    const { datum, valueKey, valueName, targetKey } = params;
    if (valueName === undefined || targetKey === undefined) return '';

    const value = datum[valueKey];
    const target = targetKey ? datum[targetKey] : NaN;
    const diff = value - target;
    let diffText: string;
    if (diff < 0) {
        diffText = `<span style="color: red">${diff}%</span>`;
    } else {
        diffText = `<span style="color: green">+${diff}%</span>`;
    }

    return { content: `<b>${valueName}: </b> ${value}% (${diffText})` };
}

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: [{ profit: 29, targetProfit: 35 }],
    title: { text: 'Profit %' },
    subtitle: { text: '2023 Q1' },
    series: [
        {
            type: 'bullet',
            direction: 'horizontal',
            valueKey: 'profit',
            valueName: 'Profit',
            targetKey: 'targetProfit',
            targetName: 'Target',
            scale: { max: 50 },
            tooltip: { renderer: tooltipRenderer },
            target: { lengthRatio: 1.0, stroke: 'blue' },
        },
    ],
    axes: [
        {
            type: 'number',
            label: { formatter: ({ value }) => `${value}%` },
        },
        {
            type: 'category',
            label: { formatter: () => '' },
        },
    ],
    height: 160,
};

let chart = AgCharts.create(options);

function setProfit(profit: number) {
    options.data = [{ profit, targetProfit: 35 }];
    AgCharts.update(chart, options);
}
