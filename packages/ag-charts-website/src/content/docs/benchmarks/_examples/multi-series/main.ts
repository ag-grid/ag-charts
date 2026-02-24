// @ag-skip-fws

/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts, VERSION } from 'ag-charts-community';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import {
    ChartRef,
    SeriesVisibilityState,
    performDatumHighlight,
    performInitialLoad,
    performLegendToggle,
} from './benchmarkUtils';
import { getData } from './data';

(window as any).agChartsDebug = 'scene:stats';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    theme: {
        overrides: {
            line: {
                series: {
                    highlight: {
                        highlightedSeries: {
                            strokeWidth: 4,
                        },
                        unhighlightedSeries: {
                            opacity: 0.2,
                        },
                    },
                },
            },
        },
    },
    title: {
        text: 'Imported Banana Prices (2019)',
        fontSize: 18,
    },
    subtitle: {
        text: 'Source: Department for Environment, Food and Rural Affairs',
    },
    series: [
        {
            type: 'line',
            xKey: 'week',
            yKey: 'belize',
            yName: 'Belize',
            stroke: '#0b1791',
            marker: {
                fill: '#0b1791',
                stroke: '#0b1791',
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'cameroon',
            yName: 'Cameroon',
            stroke: '#be2a2c',
            marker: {
                fill: '#be2a2c',
                stroke: '#f6d24a',
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'columbia',
            yName: 'Columbia',
            stroke: '#f6d24a',
            marker: {
                fill: '#f6d24a',
                stroke: '#f6d24a',
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'costaRica',
            yName: 'Costa Rica',
            stroke: '#ce1126',
            marker: {
                fill: '#ce1126',
                stroke: '#ce1126',
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'dominicanRepublic',
            yName: 'Dominican Republic',
            stroke: '#002d62',
            marker: {
                fill: '#002d62',
                stroke: '#ce1126',
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'ecuador',
            yName: 'Ecuador',
            stroke: '#1b4e9e',
            marker: {
                fill: '#1b4e9e',
                stroke: '#fade4b',
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'ghana',
            yName: 'Ghana',
            stroke: '#f6d24a',
            marker: {
                fill: '#f6d24a',
                stroke: '#be2a2c',
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'honduras',
            yName: 'Honduras',
            stroke: '#0073cf',
            marker: {
                fill: '#0073cf',
                stroke: '#0073cf',
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'ivoryCoast',
            yName: 'Ivory Coast',
            stroke: '#e88532',
            marker: {
                fill: '#e88532',
                stroke: '#469c65',
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'jamaica',
            yName: 'Jamaica',
            stroke: '#000000',
            marker: {
                fill: '#000000',
                stroke: '#fed100',
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'mexico',
            yName: 'Mexico',
            stroke: '#006847',
            marker: {
                fill: '#006847',
                stroke: '#ce1126',
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'panama',
            yName: 'Panama',
            stroke: '#c22b38',
            marker: {
                fill: '#c22b38',
                stroke: '#1e5190',
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'windwardIsles',
            yName: 'Windward Isles',
            stroke: '#042279',
            marker: {
                fill: '#042279',
                stroke: '#bf2b30',
                strokeWidth: 2,
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'guatemala',
            yName: 'Guatemala',
            stroke: '#4997d0',
            marker: {
                fill: '#4997d0',
                stroke: '#4997d0',
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'nicaragua',
            yName: 'Nicaragua',
            stroke: '#2868c1',
            marker: {
                fill: '#ffffff',
                stroke: '#2868c1',
            },
        },
        {
            type: 'line',
            xKey: 'week',
            yKey: 'brazil',
            yName: 'Brazil',
            stroke: '#459945',
            marker: {
                fill: '#459945',
                stroke: '#459945',
            },
        },
    ],
    axes: {
        x: {
            type: 'category',
            title: {
                text: 'Week',
            },
            label: {
                formatter: (params: { index: number; value: any }) => (params.index % 3 ? '' : params.value),
            },
        },
        y: {
            type: 'number',
            title: {
                text: '£ per kg',
            },
            nice: false,
            min: 0.2,
            max: 1,
        },
    },
    legend: {
        position: 'bottom',
        item: {
            paddingY: 15,
        },
        spacing: 30,
    },
};

for (let i = 2; i <= 3; i++) {
    options.series!.push(
        ...options.series!.map((s) => {
            return {
                ...s,
                yName: `${(s as any).yName} ${i}`,
            };
        })
    );
}
/* @ag-options-end */

const chartRef: ChartRef = { current: AgCharts.create(options) };
const container = document.getElementById('myChart')!;

// Store series visibility states
const seriesCount = options.series!.length;
const visibilityState: SeriesVisibilityState = { visible: new Array(seriesCount).fill(true) };

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    return {
        testCases: [
            {
                id: 'initial-load',
                label: 'Initial Load',
                variants: [
                    {
                        params: { Operation: 'Chart Create' },
                        run: () => performInitialLoad(options, chartRef, (opts) => AgCharts.create(opts)),
                    },
                ],
            },
            {
                id: 'legend-toggle',
                label: 'Legend Toggle',
                variants: [
                    {
                        params: { Repetitions: '1x' },
                        run: () => performLegendToggle(chartRef.current!, options, visibilityState, 2), // Toggle on/off
                    },
                    {
                        params: { Repetitions: '10x' },
                        run: () => performLegendToggle(chartRef.current!, options, visibilityState, 10),
                    },
                ],
            },
            {
                id: 'datum-highlight',
                label: 'Datum Highlight',
                variants: [
                    {
                        params: { Repetitions: '1x' },
                        run: () => performDatumHighlight(chartRef.current!, container, 1),
                    },
                    {
                        params: { Repetitions: '15x' },
                        run: () => performDatumHighlight(chartRef.current!, container, 15),
                    },
                ],
            },
        ],
        config: {
            updatesPerTest: 20,
            maxCollectionTimeMs: 10000,
            warmupUpdates: 5,
        },
        metadata: {
            dataPoints: getData().length,
            seriesCount: seriesCount,
            version: VERSION,
            expectedRetainedSizeMB: 5.5,
            expectedCanvasCount: 5,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
