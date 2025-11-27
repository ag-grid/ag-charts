import { AgCartesianChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {},
    subtitle: {},
    footnote: {},
    contextMenu: {
        items: [
            { showOn: 'always', label: 'always,', action: () => {} },
            { showOn: 'series-area', label: 'series-area,', action: () => {} },
            { showOn: 'series-node', label: 'series-node,', action: () => {} },
            { showOn: 'legend-item', label: 'legend-item,', action: () => {} },
        ],
    },
    data: [
        { x: 'Jun', y1: 50, y2: 40 },
        { x: 'Jul', y1: 70, y2: 50 },
        { x: 'Aug', y1: 60, y2: 30 },
    ],
    series: [
        { type: 'bar', xKey: 'x', yKey: 'y1', yName: 'Series 1' },
        { type: 'bar', xKey: 'x', yKey: 'y2', yName: 'Series 2' },
    ],
    axes: {
        x: { title: { text: 'X Axis Label' }, type: 'category' },
        y: { title: { text: 'Y Axis Label' }, type: 'number' },
    },
};

AgCharts.create(options);
