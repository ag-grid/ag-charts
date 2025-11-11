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
    [
        'sparkline benchmark initial load',
        'sparkline benchmark initial load (pooled)',
        'sparkline benchmark after load updateDelta',
    ],
    ['zoom-large-dataset benchmark initial load', 'zoom-large-dataset benchmark after load 100x zoom'],
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
const chartOptions14: AgCartesianChartOptions = {
    container: document.getElementById('myChart14'),
    ...generatePerformanceChart(0, row),
};
const chartOptions15: AgCartesianChartOptions = {
    container: document.getElementById('myChart15'),
    ...generatePerformanceChart(1, row),
};
const chartOptions16: AgCartesianChartOptions = {
    container: document.getElementById('myChart16'),
    ...generatePerformanceChart(2, row++),
};
const chartOptions17: AgCartesianChartOptions = {
    container: document.getElementById('myChart17'),
    ...generatePerformanceChart(0, row),
};
const chartOptions18: AgCartesianChartOptions = {
    container: document.getElementById('myChart18'),
    ...generatePerformanceChart(1, row++),
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
AgCharts.create(chartOptions14);
AgCharts.create(chartOptions15);
AgCharts.create(chartOptions16);
AgCharts.create(chartOptions17);
AgCharts.create(chartOptions18);

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
        legend: { enabled: false },
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
                tooltip: {
                    enabled: true,
                },
            },
            {
                type: 'bar',
                xKey: 'name',
                yKey: `heapUsed`,
                yName: `Heap`,
                yKeyAxis: 'ySecondary',
                stackGroup: 'memory',
                tooltip: {
                    enabled: true,
                },
            },
            {
                type: 'bar',
                xKey: 'name',
                yKey: `canvasBytes`,
                yName: `Canvas`,
                yKeyAxis: 'ySecondary',
                stackGroup: 'memory',
                tooltip: {
                    enabled: true,
                },
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
