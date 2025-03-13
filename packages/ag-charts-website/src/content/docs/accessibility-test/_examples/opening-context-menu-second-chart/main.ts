// @ag-skip-fws
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

const action = () => console.log('Hello world!');
const nodeAction = (event: any) => console.log(`Hello ${event.yKey} in ${event.datum.month}!`);
const legendItemAction = (event: any) => console.log(`Hello ${event.itemId}!`);

// Chart Options
const options1: AgCartesianChartOptions = {
    container: document.getElementById('myChart1'),
    title: { text: 'Chart 1' },
    legend: {},
    height: 600,
    width: 800,
    contextMenu: {
        extraActions: [{ label: 'Say hello', action }],
        extraNodeActions: [{ label: 'Say hello to a node', action: nodeAction }],
        extraLegendItemActions: [{ label: 'Say hello to a legend item', action: legendItemAction }],
    },
    data: [
        { month: 'Jun', sweaters: 50, hats: 40 },
        { month: 'Jul', sweaters: 70, hats: 50 },
        { month: 'Aug', sweaters: 60, hats: 30 },
    ],
    series: [
        { type: 'bar', xKey: 'month', yKey: 'sweaters', yName: 'Sweaters Made' },
        { type: 'bar', xKey: 'month', yKey: 'hats', yName: 'Hats Made' },
    ],
};

const options2: AgCartesianChartOptions = {
    container: document.getElementById('myChart2'),
    title: { text: 'Chart 2' },
    contextMenu: { enabled: true },
    height: 600,
    width: 800,
    data: [
        { month: 'Jun', sweaters: 50 },
        { month: 'Jul', sweaters: 70 },
        { month: 'Aug', sweaters: 60 },
    ],
    series: [{ type: 'bar', xKey: 'month', yKey: 'sweaters', yName: 'Sweaters Made' }],
};

AgCharts.create(options1);
AgCharts.create(options2);
