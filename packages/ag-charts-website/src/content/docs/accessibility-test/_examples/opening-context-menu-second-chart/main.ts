// @ag-skip-fws
// AgCharts import needed for dark-mode skippet
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

const action = () => window.alert('Hello world!');
const nodeAction = (event: any) => window.alert(`Hello ${event.yKey} in ${event.datum.month}!`);
const legendItemAction = (event: any) => window.alert(`Hello ${event.itemId}!`);

// Chart Options
const options1: AgCartesianChartOptions = {
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

const script = [...document.querySelectorAll('script').values()]
    .map((e) => e.src)
    .filter((s) => s.includes('ag-charts-enterprise'))[0];

document.open();
document.write(`
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <div style="overflow: auto">
      <div id="myChart1"></div>
      <div style="height: 600px; width: 800px; background-color: rgba(0,255,0,255);"></div>
      <div id="myChart2"></div>
    </div>

    <script src="${script}"></script>
    <script>
      options1.container = document.getElementById('myChart1'),
      options2.container = document.getElementById('myChart2'),
      AgCharts.create(options1);
      AgCharts.create(options2);
    </script>
  </body>
</html>
`);
document?.close();
