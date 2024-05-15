// @ag-skip-fws
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

// Chart Options
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    autoSize: true,
    data: [
        { month: 'Jan', avgTemp: 2.3, iceCreamSales: 162000 },
        { month: 'Mar', avgTemp: 6.3, iceCreamSales: 302000 },
        { month: 'May', avgTemp: 16.2, iceCreamSales: 800000 },
        { month: 'Jul', avgTemp: 22.8, iceCreamSales: 1254000 },
        { month: 'Sep', avgTemp: 14.5, iceCreamSales: 950000 },
        { month: 'Nov', avgTemp: 8.9, iceCreamSales: 200000 },
    ],
    // Series: Defines which chart type and data to use
    series: [{ type: 'bar', xKey: 'month', yKey: 'iceCreamSales' }],
};

const script = [...document.querySelectorAll('script').values()]
    .map((e) => e.src)
    .filter((s) => s.includes('ag-charts-community'))[0];

const element = document.createElement('iframe');
document.body.appendChild(element);
const docWindow = element.contentWindow;
(docWindow as any).options = options;
const doc = docWindow?.document;
doc?.open();
doc?.write(`
  <html>
    <head>
        <style>
            html {
                color-scheme: only light;
            }
        </style>
    </head>
    <body>
        <h1>Article Example</h1>
        <p>If the chart was placed in some news website with paragraphs above...</p>
        <div class="chart"></div>
        <p>And paragraphs below...</p>
        <h1>Explicit Size Example</h1>
        <div class="chart" data-width="200" data-height="200"></div>
        <h1>WebApp Example (Grid)</h1>
        <div style="display: grid; grid: 'a b' 1fr / auto 1fr; aspect-ratio: 2 / 1; border: 1px solid black">
            <textarea style="width: 200px; resize: both">Resize me</textarea>
            <div class="chart"></div>
        </div>
        <h1>WebApp Example (Flexbox)</h1>
        <div style="display: flex; aspect-ratio: 2 / 1; border: 1px solid black">
            <textarea style="width: 200px; resize: both">Resize me</textarea>
            <div class="chart" style="flex: 1"></div>
        </div>
        <h1>Small Grid Example</h1>
        <div style="display: grid; grid: 'a' 1fr / 1fr; width: 100px; height: 100px; border: 1px solid black">
            <div class="chart"></div>
        </div>
        <h1>Small Grid Example Via Min/Max Height</h1>
        <div
            style="
                display: grid;
                grid: 'a' 1fr / 1fr;
                min-width: 100px;
                min-height: 100px;
                max-width: 100px;
                max-height: 100px;
                border: 1px solid black;
            "
        >
            <div class="chart"></div>
        </div>
        <h1>Grid with Small Chart Example</h1>
        <div style="display: grid; grid: 'a b' auto 'c d' 1fr / auto 1fr; aspect-ratio: 2 / 1; border: 1px solid black">
            <div class="chart" data-width="200" data-height="200"></div>
            <h1>Some content 1</h1>
            <h1>Some content 2</h1>
            <h1>Some content 3</h1>
        </div>
        <script src="${script}"></script>
        <script>
            for (const container of document.getElementsByClassName('chart')) {
                const width = Number(container.getAttribute('data-width'));
                const height = Number(container.getAttribute('data-height'));
                const chartOptions = { ...options, container };
                if (width > 0) chartOptions.width = width;
                if (height > 0) chartOptions.height = height;
                AgCharts.create(chartOptions);
            }
        </script>
    </body>
  </html>
  `);
doc?.close();
