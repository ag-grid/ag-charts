import { AgCharts } from 'ag-charts-enterprise';
import type { AgCartesianChartOptions } from 'ag-charts-types';

import { type HeatmapDatum, ROWS, getData } from './data';

const WIDTH = 760;
const HEIGHT = 500;

const data = getData();

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    animation: { enabled: false },
    width: WIDTH,
    height: HEIGHT,
    legend: { enabled: false },
    tooltip: { enabled: false },
    dataIdKey: 'id',
    data,
    series: [
        {
            type: 'heatmap',
            xKey: 'time',
            yKey: 'band',
            colorKey: 'level',
        },
    ],
};

const chart = AgCharts.create(options);

/** Rewrites every cell of one column, so a transaction touches a few cells and leaves the rest. */
function updateColumn(column: number, level: number) {
    const update: HeatmapDatum[] = [];
    for (let y = 0; y < ROWS; y++) {
        update.push({ ...data[column * ROWS + y], level: (level + y * 3) % 100 });
    }
    return chart.applyTransaction({ update });
}

/** Resizes the chart by a pixel and back, which makes every layer repaint whole and lays the cells out as before. */
async function forceFullRedraw() {
    await chart.updateDelta({ width: WIDTH + 1 });
    await chart.updateDelta({ width: WIDTH });
}

// For e2e testing:
(window as any).agE2E = { chart, updateColumn, forceFullRedraw };
