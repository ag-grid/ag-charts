import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Income' },
    subtitle: { text: 'USD' },
    data: [{ income: 12500, objective: 10000 }],
    series: [
        {
            type: 'bullet',
            direction: 'horizontal',
            valueKey: 'income',
            valueName: 'Actual income',
            targetKey: 'objective',
            targetName: 'Target income',
            scale: { max: 15000 },
            fill: '#000000',
            target: { stroke: '#3B3B3B' },
            colorRanges: [
                { color: '#FFB6C1' /* Light Pink */, stop: 8000 },
                { color: '#FFFACD' /* Light Yellow */, stop: 13000 },
                { color: '#B6FBB6' /* Light Green */ },
            ],
        },
    ],
    height: 150,
};

AgCharts.create(options);
