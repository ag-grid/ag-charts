import { AgChartOptions, AgCharts } from 'ag-charts-community';

const noDataOverlay = () => {
    return [
        '<div',
        '    style="',
        '        align-items: center;',
        '        background: hsl(45deg, 100%, 90%);',
        '        border: 2px solid hsl(0deg, 100%, 75%);',
        '        box-sizing: border-box;',
        '        color: black;',
        '        display: flex;',
        '        height: calc(100% - 16px);',
        '        justify-content: center;',
        '        margin: 8px;',
        '    "',
        '>',
        '    <em>Custom message for <strong>missing data</strong></em>',
        '</div>',
    ].join('\n');
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'A chart with missing data',
    },
    data: [],
    series: [
        {
            xKey: 'year',
            yKey: 'spending',
        },
    ],
    axes: [
        { type: 'number', position: 'left', title: { text: 'Year' } },
        { type: 'number', position: 'bottom', title: { text: 'Spending' } },
    ],
    overlays: {
        noData: {
            renderer: noDataOverlay,
        },
    },
};

AgCharts.create(options);
