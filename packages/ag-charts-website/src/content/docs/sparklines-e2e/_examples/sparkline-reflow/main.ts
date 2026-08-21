// @ag-skip-fws
// @ag-skip-container-check
import {
    AgChartInstance,
    AgCharts,
    AgSparklineOptions,
    CategoryAxisModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LineSeriesModule, NumberAxisModule]);

const SPARKLINE_COUNT = 30;

const options: AgSparklineOptions = {
    container: document.getElementById('myChart'),
    type: 'line',
    width: 200,
    height: 30,
    background: { visible: false },
    minHeight: 0,
    minWidth: 0,
    xKey: 'x',
    yKey: 'y',
    data: getData(),
};

// Create one initial sparkline so gotoExample detects a canvas on load.
const initialChart = AgCharts.__createSparkline(options);

const charts: AgChartInstance<AgSparklineOptions>[] = [initialChart];

// Simulates Grid creating sparkline cells as rows scroll into view.
function createSparklines() {
    const container = document.getElementById('sparklineContainer');
    if (!container) return;

    for (let i = 0; i < SPARKLINE_COUNT; i++) {
        const div = document.createElement('div');
        div.style.width = '200px';
        div.style.height = '30px';
        div.style.display = 'inline-block';
        container.appendChild(div);

        charts.push(
            AgCharts.__createSparkline({
                ...options,
                container: div,
                data: getData(),
            })
        );
    }
}

// Mirrors SparklineCellRenderer.refresh(), which uses full update(), not updateDelta().
function updateSparklines() {
    for (const chart of charts) {
        chart.update({
            ...options,
            data: getData(),
        });
    }
}

// Mirrors the Grid's destroy/recreate pooling cycle as rows scroll in and out of the viewport.
function scrollSparklines() {
    const container = document.getElementById('sparklineContainer');
    if (!container) return;

    for (const chart of charts) {
        chart.destroy();
    }
    charts.length = 0;
    container.innerHTML = '';

    for (let i = 0; i < SPARKLINE_COUNT; i++) {
        const div = document.createElement('div');
        div.style.width = '200px';
        div.style.height = '30px';
        div.style.display = 'inline-block';
        container.appendChild(div);

        charts.push(
            AgCharts.__createSparkline({
                ...options,
                container: div,
                data: getData(),
            })
        );
    }
}
