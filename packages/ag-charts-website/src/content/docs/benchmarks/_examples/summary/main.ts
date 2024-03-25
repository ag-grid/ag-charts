/* @ag-options-extract */
import {
    AgCartesianChartOptions,
    AgCartesianSeriesTooltipRendererParams,
    AgCharts,
    AgLineSeriesOptions,
} from 'ag-charts-community';

import { getData } from './data';

type Suite = ReturnType<typeof getData>[number];
type SuiteResults = Suite['results'];
type TestName = keyof SuiteResults;
type TestResult = SuiteResults[TestName];

const initialLoadKeys: TestName[] = [
    'integrated charts large scale benchmark initial load',
    'large-dataset benchmark initial load',
    'large-scale multi-series benchmark initial load',
    'multi-series benchmark initial load',
];

const seriesToggleKeys: TestName[] = [
    'integrated charts large scale benchmark after load 4x legend toggle',
    'large-dataset benchmark after load 1x legend toggle',
    'large-scale multi-series benchmark after load 4x legend toggle',
    'multi-series benchmark after load 10x legend toggle',
];

const seriesHighlightKeys: TestName[] = [
    'large-dataset benchmark after load 4x datum highlight',
    'multi-series benchmark after load 15x datum highlight',
];

const chartOptions1: AgCartesianChartOptions = {
    container: document.getElementById('myChart1'),
    autoSize: true,
    data: getData(),
    title: {
        text: 'Initial Load Cases',
        fontSize: 18,
    },
    ...generatePerformanceChartOptions(initialLoadKeys, (key) =>
        key.replace(' initial load', '').replace(' benchmark', '')
    ),
};

AgCharts.create(chartOptions1);

const chartOptions2: AgCartesianChartOptions = {
    container: document.getElementById('myChart2'),
    autoSize: true,
    data: getData(),
    title: {
        text: 'Legend Toggle',
        fontSize: 18,
    },
    ...generatePerformanceChartOptions(seriesToggleKeys, (key) =>
        key.replace(' legend toggle', '').replace(' benchmark after load', '')
    ),
};

AgCharts.create(chartOptions2);

const chartOptions3: AgCartesianChartOptions = {
    container: document.getElementById('myChart3'),
    autoSize: true,
    data: getData(),
    title: {
        text: 'Datum Highlight',
        fontSize: 18,
    },
    ...generatePerformanceChartOptions(seriesHighlightKeys, (key) =>
        key.replace(' datum highlight', '').replace(' benchmark after load', '')
    ),
};

AgCharts.create(chartOptions3);

function generatePerformanceChartOptions(
    keys: TestName[],
    yName: (key: TestName) => string
): {
    axes: AgCartesianChartOptions['axes'];
    series: AgLineSeriesOptions[];
} {
    return {
        axes: [
            {
                type: 'category',
            },
            {
                type: 'number',
                position: 'left',
                keys: keys.map((key) => `results['${key}'].timeMs`),
                label: {
                    formatter: (params) =>
                        params.value == null ? params.value : formatMillis(Number(params.value), 0),
                },
            },
            {
                type: 'number',
                position: 'right',
                keys: keys.map((key) => `results['${key}'].memoryUsage`),
                label: {
                    formatter: (params) => (params.value == null ? params.value : formatBytes(Number(params.value))),
                },
            },
        ],
        series: keys.flatMap((key) => {
            return [
                {
                    type: 'line' as const,
                    xKey: 'name',
                    yKey: `results['${key}'].timeMs`,
                    yName: `${yName(key)} (time)`,
                    tooltip: {
                        enabled: true,
                        renderer: ({ datum }: AgCartesianSeriesTooltipRendererParams<Suite>) => ({
                            content: formatMillis(datum.results[key].timeMs, 2),
                        }),
                    },
                },
                {
                    type: 'line' as const,
                    xKey: 'name',
                    yKey: `results['${key}'].memoryUsage`,
                    yName: `${yName(key)} (heap usage)`,
                    strokeOpacity: 0.5,
                    lineDash: [4, 4],
                    tooltip: {
                        enabled: true,
                        renderer: ({ datum }: AgCartesianSeriesTooltipRendererParams<Suite>) => {
                            const memoryUsage = datum.results[key].memoryUsage;
                            return {
                                content: memoryUsage ? formatBytes(memoryUsage) : undefined,
                            };
                        },
                    },
                },
            ];
        }),
    };
}

function formatMillis(ms: number, precision: number): string {
    return `${ms.toFixed(precision)}ms`;
}

function formatBytes(bytes: number): string {
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(2)}KB` : `${(kb / 1024).toFixed(2)}MB`;
}
