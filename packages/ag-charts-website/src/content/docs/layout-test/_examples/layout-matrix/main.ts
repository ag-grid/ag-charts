// @ag-skip-fws
import { AgCartesianChartOptions } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    title: {
        text: "Apple's Revenue by Product Category",
    },
    subtitle: {
        text: 'In Billion U.S. Dollars',
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'iphone',
            yName: 'iPhone',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'mac',
            yName: 'Mac',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'ipad',
            yName: 'iPad',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'wearables',
            yName: 'Wearables',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'services',
            yName: 'Services',
        },
    ],
};

const fullSizes = `
  body {
    position: absolute;
    width: 100%;
    height: 100%;
  }
  `;

const fixedSizes = `
  ${fullSizes}
  
  #myChart {
    width: 300px;
    height: 300px;
  }
  `;

const bodyGrid = `
  :root, body {
    height: 100%;
    width: 100%;
    margin: 0;
    box-sizing: border-box;
  }
  
  body {
    display: grid;
    grid-auto-rows: minmax(0, 1fr);
    grid-auto-columns: minmax(0, 1fr);
  }
  `;

const script = 'https://localhost:4600/dev/ag-charts-community/dist/umd/ag-charts-community.js?t=1715337042150';
// const script = 'https://charts-staging.ag-grid.com/dev/ag-charts-community/dist/umd/ag-charts-community.js?t=1715349786074';

const cases = [
    { styles: '', options: {} },
    { styles: '', options: { width: 300, height: 300 } },
    { styles: fullSizes, options: {} },
    { styles: fullSizes, options: { width: 300, height: 300 } },
    { styles: fixedSizes, options: {} },
    { styles: fixedSizes, options: { width: 250, height: 250 } },
];
const domCases = [
    ['<div id="myChart"></div>'],
    [
        `
    <div style="
        display: grid;
        grid: 'a b' auto / 1fr auto;
      ">
        <div id="myChart"></div>
        <textarea></textarea>
      </div>
  `,
        bodyGrid,
    ],
];

let index = 1;
for (const { styles, options: caseOptions } of cases) {
    for (const [dom, extraStyles] of domCases) {
        const element = document.createElement('iframe');
        document.body.appendChild(element);
        const docWindow = element.contentWindow;
        // docWindow.agCharts = agCharts;
        const doc = docWindow?.document;
        doc?.open();
        doc?.write(`
      <html>
        <head>
          <style>
          
            body { overflow: hidden; padding: 0; margin: 0 } 
            ${styles}
            ${extraStyles ?? ''}
          </style>
        </head>
        <body>
            ${dom}
            <script src="${script}"></script>
            <script src="data.js"></script>
            <script>
              const options = ${JSON.stringify({ ...options, ...caseOptions })};
              options.container = document.getElementById("myChart");
              agCharts.AgCharts.create(options);
            </script>
        </body>
      </html>
      `);
        doc?.close();
    }
}
