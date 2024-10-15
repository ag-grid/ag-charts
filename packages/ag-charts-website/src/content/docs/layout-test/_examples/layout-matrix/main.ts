// @ag-skip-fws
// AgCharts import needed for dark-mode skippet
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const css = String.raw;
const html = String.raw;

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

const fullSizes = css`
    body {
        position: absolute;
        width: 100%;
        height: 100%;
    }
`;

const fixedSizes = css`
    ${fullSizes}

    #myChart {
        width: 300px;
        height: 300px;
    }
`;

const bodyGrid = css`
    :root,
    body {
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

const script = [...document.querySelectorAll('script').values()]
    .map((e) => e.src)
    .find((s) => s.includes('ag-charts-community'));

const cases = [
    { styles: '', options: {} },
    { styles: '', options: { width: 300, height: 300 } },
    { styles: fullSizes, options: {} },
    { styles: fullSizes, options: { width: 300, height: 300 } },
    { styles: fixedSizes, options: {} },
    { styles: fixedSizes, options: { width: 250, height: 250 } },
];
const domCases = [
    [html`<div id="myChart"></div>`],
    [
        html`
            <div
                style="${css`
                    display: grid;
                    grid: 'a b' auto / 1fr auto;
                `}"
            >
                <div id="myChart"></div>
                <textarea></textarea>
            </div>
        `,
        bodyGrid,
    ],
];

for (const { styles, options: caseOptions } of cases) {
    for (const [dom] of domCases) {
        const element = document.createElement('iframe');
        document.body.appendChild(element);
        const docWindow = element.contentWindow;
        // docWindow.agCharts = agCharts;
        const doc = docWindow?.document;
        doc?.open();
        doc?.write(html`
            <html>
                <head>
                    <style>
                        ${css`
                            body {
                                overflow: hidden;
                                padding: 0;
                                margin: 0;
                            }

                            ${styles}
                        `}
                    </style>
                </head>
                <body>
                    ${dom}
                    <script src="${script!}"></script>
                    <script>
                        const options = ${JSON.stringify({ ...options, ...caseOptions })};
                        options.container = document.getElementById('myChart');
                        agCharts.AgCharts.create(options);
                    </script>
                </body>
            </html>
        `);
        doc?.close();
    }
}
