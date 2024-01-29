import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

const BAD = '#FFB6C1'; /* Light Pink */
const OKAY = '#FFFACD'; /* Light Yellow */
const GOOD = '#B6FBB6'; /* Light Green */

let chartOptions1: AgChartOptions = {
    container: document.getElementById('myChart1'),
    title: { text: 'Return Of Investment (ROI) %' },
    data: [{ target: 15, actual: 11 }],
    series: [
        {
            type: 'bullet',
            valueKey: 'actual',
            valueName: 'Actual ROI',
            targetKey: 'target',
            targetName: 'Target ROI',
            scale: { max: 20 },
            colorRanges: [{ color: BAD, stop: 8 }, { color: OKAY, stop: 12 }, { color: GOOD }],
        },
    ],
};

AgCharts.create(chartOptions1);

let chartOptions2: AgChartOptions = {
    container: document.getElementById('myChart2'),
    title: { text: 'Debt-to-Equity' },
    data: [{ target: 0.5, actual: 0.7 }],
    series: [
        {
            type: 'bullet',
            valueKey: 'actual',
            valueName: 'Actual Ratio',
            targetKey: 'target',
            targetName: 'Target Ratio',
            scale: { max: 1 },
            colorRanges: [{ color: GOOD, stop: 0.6 }, { color: OKAY, stop: 0.8 }, { color: BAD }],
        },
    ],
};

AgCharts.create(chartOptions2);

let chartOptions3: AgChartOptions = {
    container: document.getElementById('myChart3'),
    title: { text: 'Profit Margin %' },
    data: [{ target: 20, actual: 16.2 }],
    series: [
        {
            type: 'bullet',
            valueKey: 'actual',
            valueName: 'Actual Margin',
            targetKey: 'target',
            targetName: 'Target Margin',
            scale: { max: 25 },
            colorRanges: [{ color: BAD, stop: 12 }, { color: OKAY, stop: 18 }, { color: GOOD }],
        },
    ],
};

AgCharts.create(chartOptions3);

let chartOptions4: AgChartOptions = {
    container: document.getElementById('myChart4'),
    title: { text: 'Cash Flow (US$)' },
    data: [{ target: 500000, actual: 468100 }],
    series: [
        {
            type: 'bullet',
            valueKey: 'actual',
            valueName: 'Actual Cash Flow',
            targetKey: 'target',
            targetName: 'Target Cash Flow',
            scale: { max: 600000 },
            colorRanges: [{ color: BAD, stop: 350000 }, { color: OKAY, stop: 450000 }, { color: GOOD }],
        },
    ],
};

AgCharts.create(chartOptions4);

let chartOptions5: AgChartOptions = {
    container: document.getElementById('myChart5'),
    title: { text: 'Earnings Before Interest, Taxes, Depreciation, and Amortization (EBITDA) Margin' },
    data: [{ target: 25, actual: 21.7 }],
    series: [
        {
            type: 'bullet',
            valueKey: 'actual',
            valueName: 'Actual EBITDA',
            targetKey: 'target',
            targetName: 'Target EBITDA',
            scale: { max: 30 },
            colorRanges: [{ color: BAD, stop: 15 }, { color: OKAY, stop: 22 }, { color: GOOD }],
        },
    ],
};

AgCharts.create(chartOptions5);
