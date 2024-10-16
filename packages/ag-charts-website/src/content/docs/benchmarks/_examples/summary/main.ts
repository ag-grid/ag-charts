/* @ag-options-extract */
import { AgCartesianChartOptions, AgCartesianSeriesTooltipRendererParams, AgCharts } from 'ag-charts-enterprise';

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
    [
        'integrated charts large scale benchmark initial load',
        'integrated charts large scale benchmark after load 4x legend toggle',
    ],
    [
        'large-dataset benchmark initial load',
        'large-dataset benchmark after load 1x legend toggle',
        'large-dataset benchmark after load 4x datum highlight',
    ],
    [
        'large-scale multi-series benchmark initial load',
        'large-scale multi-series benchmark after load 4x legend toggle',
    ],
    [
        'multi-series benchmark initial load',
        'multi-series benchmark after load 10x legend toggle',
        'multi-series benchmark after load 15x datum highlight',
    ],
    ['resize benchmark after load 10x resize'],
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
const chartOptions3: AgCartesianChartOptions = {
    container: document.getElementById('myChart3'),
    ...generatePerformanceChart(0, row),
};
const chartOptions4: AgCartesianChartOptions = {
    container: document.getElementById('myChart4'),
    ...generatePerformanceChart(1, row++),
};
const chartOptions5: AgCartesianChartOptions = {
    container: document.getElementById('myChart5'),
    ...generatePerformanceChart(0, row),
};
const chartOptions6: AgCartesianChartOptions = {
    container: document.getElementById('myChart6'),
    ...generatePerformanceChart(1, row),
};
const chartOptions7: AgCartesianChartOptions = {
    container: document.getElementById('myChart7'),
    ...generatePerformanceChart(2, row++),
};
const chartOptions8: AgCartesianChartOptions = {
    container: document.getElementById('myChart8'),
    ...generatePerformanceChart(0, row),
};
const chartOptions9: AgCartesianChartOptions = {
    container: document.getElementById('myChart9'),
    ...generatePerformanceChart(1, row++),
};
const chartOptions10: AgCartesianChartOptions = {
    container: document.getElementById('myChart10'),
    ...generatePerformanceChart(0, row),
};
const chartOptions11: AgCartesianChartOptions = {
    container: document.getElementById('myChart11'),
    ...generatePerformanceChart(1, row),
};
const chartOptions12: AgCartesianChartOptions = {
    container: document.getElementById('myChart12'),
    ...generatePerformanceChart(2, row++),
};
const chartOptions13: AgCartesianChartOptions = {
    container: document.getElementById('myChart13'),
    ...generatePerformanceChart(0, row++),
};

AgCharts.create(chartOptions1);
AgCharts.create(chartOptions2);
AgCharts.create(chartOptions3);
AgCharts.create(chartOptions4);
AgCharts.create(chartOptions5);
AgCharts.create(chartOptions6);
AgCharts.create(chartOptions7);
AgCharts.create(chartOptions8);
AgCharts.create(chartOptions9);
AgCharts.create(chartOptions10);
AgCharts.create(chartOptions11);
AgCharts.create(chartOptions12);
AgCharts.create(chartOptions13);

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
        data: getData(),
        title: {
            text: yName(testName),
        },
        sync: {
            groupId: `${keyY}-group`,
            axes: 'xy',
            nodeInteraction: true,
        },
        legend: { enabled: false },
        axes: [
            {
                type: 'category',
            },
            {
                type: 'number',
                position: 'left',
                keys: [`results['${testName}'].timeMs`],
                min: 0,
                label: {
                    formatter: (params) =>
                        params.value == null ? params.value : formatMillis(Number(params.value), 0),
                },
            },
            {
                type: 'number',
                position: 'right',
                keys: [`results['${testName}'].heapUsed`, `results['${testName}'].canvasBytes`],
                min: 0,
                label: {
                    formatter: (params) => (params.value == null ? params.value : formatBytes(Number(params.value))),
                },
            },
        ],
        series: [
            {
                type: 'bar',
                xKey: 'name',
                yKey: `results['${testName}'].timeMs`,
                yName: `time`,
                stackGroup: 'time',
                tooltip: {
                    enabled: true,
                    renderer: ({ datum }: AgCartesianSeriesTooltipRendererParams<Suite>) => ({
                        content: formatMillis(datum.results[testName]!.timeMs, 2),
                    }),
                },
            },
            {
                type: 'bar',
                xKey: 'name',
                yKey: `results['${testName}'].heapUsed`,
                yName: `heap`,
                stackGroup: 'memory',
                tooltip: {
                    enabled: true,
                    renderer: ({ datum }: AgCartesianSeriesTooltipRendererParams<Suite>) => {
                        const { heapUsed } = datum.results[testName]!;
                        return {
                            content: `${formatBytes(heapUsed)}`,
                        };
                    },
                },
            },
            {
                type: 'bar',
                xKey: 'name',
                yKey: `results['${testName}'].canvasBytes`,
                yName: `canvas`,
                stackGroup: 'memory',
                tooltip: {
                    enabled: true,
                    renderer: ({ datum }: AgCartesianSeriesTooltipRendererParams<Suite>) => {
                        const { canvasBytes, canvasCount } = datum.results[testName]!;
                        return {
                            content: `${formatBytes(canvasBytes)} in ${canvasCount} canvases`,
                        };
                    },
                },
            },
        ],
    };

    return options;
}

function formatMillis(ms: number, precision: number): string {
    return `${ms.toFixed(precision)}ms`;
}

function formatBytes(bytes: number): string {
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(2)}KB` : `${(kb / 1024).toFixed(2)}MB`;
}
