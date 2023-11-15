import { AgChart, AgChartOptions } from 'ag-charts-enterprise';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Income',
    },
    subtitle: {
        text: '2021-2022',
    },
    data: [{ income: 11, objective: 7 }],
    series: [
        {
            type: 'bullet',
            valueKey: 'income',
            valueName: 'Actual income',
            targetKey: 'objective',
            targetName: 'Target income',
            direction: 'horizontal',
            colorRanges: [{ color: 'red', stop: 5 }, { color: 'yellow', stop: 8 }, { color: 'green' }],
        },
    ],
};

AgChart.create(options);
