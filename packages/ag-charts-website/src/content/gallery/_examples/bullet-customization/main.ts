import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

const BAD = '#FFB6C1'; /* Light Pink */
const OKAY = '#FFFACD'; /* Light Yellow */
const GOOD = '#B6FBB6'; /* Light Green */

function scaleFormatter(params: { value: number }) {
    const value = params.value / 1_000_000;
    return `$${value.toFixed(1)}M`;
}

function tooltipRenderer(params: {
    datum: any;
    valueKey: string;
    valueName?: string;
    targetKey?: string;
    targetName?: string;
}) {
    const { datum, valueKey, valueName, targetKey, targetName } = params;
    if (!valueName || !targetKey || !targetName) return 'Error';

    const toCurrency = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

    const value = datum[valueKey];
    const target = targetKey ? datum[targetKey] : NaN;
    const diff = target - value;
    let diffText: string;
    if (diff < 0) {
        diffText = `<span style="color: red">${toCurrency(diff)}</span>`;
    } else {
        diffText = `<span style="color: green">+${toCurrency(diff)}</span>`;
    }

    const row = (c1: string, c2: string) => `<tr><td><b>${c1}</b></td><td style="text-align: right">${c2}</td></tr>`;

    const row1 = row(targetName, toCurrency(target));
    const row2 = row(valueName, toCurrency(value));
    const row3 = row('Difference', diffText);
    return { content: `<table>${row1}${row2}${row3}</table>` };
}

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: [{ expenses: 1_674_300, maxExpenses: 1_800_000 }],
    series: [
        {
            type: 'bullet',
            direction: 'horizontal',
            valueKey: 'expenses',
            valueName: 'Expenses',
            targetKey: 'maxExpenses',
            targetName: 'Budget',
            scale: { max: 2_500_000 },
            tooltip: { renderer: tooltipRenderer },
            target: { lengthRatio: 1.0, strokeWidth: 2, stroke: 'grey' },
            colorRanges: [{ color: GOOD, stop: 1_000_000 }, { color: OKAY, stop: 2_000_000 }, { color: BAD }],
        },
    ],
    axes: [
        {
            type: 'number',
            label: { formatter: scaleFormatter },
        },
        {
            type: 'category',
            label: { fontSize: 16, fontWeight: 'bold', formatter: () => 'Expenditure (US$)' },
        },
    ],
    height: 115,
};

const chart = AgCharts.create(options);

function setBudget(maxExpenses: number) {
    options.data = [{ expenses: 1_674_300, maxExpenses }];
    AgCharts.update(chart, options);
}
