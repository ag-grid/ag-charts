/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

type Suite = ReturnType<typeof getData>[number];
type SuiteResults = Suite['results'];
type TestName = keyof SuiteResults;
type TestResult = SuiteResults[TestName];

const keys: TestName[][] = [
    [
        'simple-chart benchmark initial load',
        'simple-chart benchmark after load 10x legend toggle',
        // 'simple-chart benchmark after load 15x datum highlight',
    ],
];

let row = 0;
const chartOptions1: AgCartesianChartOptions = {
    container: document.getElementById('myChart1'),
    ...generatePerformanceChart(0, row),
};
const chartOptions2: AgCartesianChartOptions = {
    container: document.getElementById('myChart2'),
    ...generatePerformanceChart(1, row++),
};

AgCharts.create(chartOptions1);
AgCharts.create(chartOptions2);

function generatePerformanceChart(keyX: number, keyY: number) {
    const yName = (key: TestName) => {
        return (
            key
                .replace(' benchmark initial load', '')
                .replace(' benchmark after load', '')
                // .replace(' legend toggle', '')
                //     .replace(' datum highlight', '')
                .replace(' benchmark after load', '')
        );
    };

    const testName = keys[keyY][keyX];
    const options: AgCartesianChartOptions = {
        data: getData().map((d) => ({ name: d.name, ...d.results[testName] })),
        title: {
            text: yName(testName),
        },
        sync: {
            groupId: `${keyY}-group`,
            axes: 'xy',
            nodeInteraction: true,
        },
        // legend: { enabled: false },
        axes: {
            x: {
                type: 'category',
                label: {
                    fontSize: 8,
                },
            },
            y: {
                type: 'number',
                position: 'left',
                keys: [`timeMs`],
                min: 0,
                label: {
                    formatter: (params) => {
                        const ms = Number(params.value);
                        if (ms === 0) return '0';
                        return params.value == null ? params.value : formatMillis(ms, ms === 0 || ms > 10 ? 0 : 2);
                    },
                },
            },
            ySecondary: {
                type: 'number',
                position: 'right',
                keys: [`heapUsed`, `canvasBytes`],
                min: 0,
                label: {
                    formatter: (params) => {
                        const bytes = Number(params.value);
                        if (bytes === 0) return '0';
                        return params.value == null ? params.value : formatBytes(bytes);
                    },
                },
            },
        },
        series: [
            {
                type: 'bar',
                xKey: 'name',
                yKey: `timeMs`,
                yName: `Time`,
                stackGroup: 'time',
            },
            {
                type: 'bar',
                xKey: 'name',
                yKey: `heapUsed`,
                yName: `Heap`,
                stackGroup: 'memory',
            },
            {
                type: 'bar',
                xKey: 'name',
                yKey: `canvasBytes`,
                yName: `Canvas`,
                stackGroup: 'memory',
            },
        ],
    };

    return options;
}

const msNumberFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
});

function formatMillis(ms: number, precision: number): string {
    return `${new Intl.NumberFormat('en-US', {
        maximumFractionDigits: precision,
    }).format(ms)}ms`;
}

function formatBytes(bytes: number): string {
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(2)}KB` : `${(kb / 1024).toFixed(2)}MB`;
}
