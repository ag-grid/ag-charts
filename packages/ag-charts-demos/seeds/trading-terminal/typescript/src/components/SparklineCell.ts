import { type ICellRendererComp, type ICellRendererParams } from 'ag-grid-community';

import { type AgChartInstance, AgCharts, type AgSparklineOptions } from 'ag-charts-community';

import { h } from '../dom';

// Literal (not var) — the sparkline canvas resolves colours at render time and
// does not read the --fin-* CSS custom properties.
const UP = '#10b981';
const DOWN = '#f43f5e';

// `x` is a monotonic sequence number rather than the array index, so a scrolling window is one
// appended plus one dropped point instead of every point's x shifting.
interface SparkPoint {
    x: number;
    y: number;
}

// A grid row carrying a trend history plus the baseline it is measured against.
interface SparkRow {
    history: number[];
    baseline: number;
}

function sparklineOptions(container: HTMLElement, points: SparkPoint[], baseline: number): AgSparklineOptions {
    // Split at the session baseline: green above, red below.
    return {
        type: 'line',
        container,
        data: points,
        xKey: 'x',
        yKey: 'y',
        minWidth: 0,
        minHeight: 0,
        background: { visible: false },
        padding: { top: 4, right: 2, bottom: 4, left: 2 },
        stroke: UP,
        strokeWidth: 1.25,
        segmentation: {
            enabled: true,
            key: 'y',
            segments: [{ stop: baseline, stroke: DOWN }],
        },
        tooltip: {
            enabled: false,
        },
    };
}

// eslint-disable-next-line no-console
const logError = (e: unknown) => console.error(e);

// Renders an AG Charts sparkline of a row's recent price history inside a grid cell.
export class SparklineCell implements ICellRendererComp<SparkRow> {
    // Decorative: the trend duplicates the row's visible % change, and the injected role="img" node
    // churns every tick, so keep the whole subtree out of the a11y tree.
    private readonly eGui = h('div', { class: 'fin-sparkline-cell', 'aria-hidden': 'true' });
    private chart?: AgChartInstance<AgSparklineOptions>;
    private destroyed = false;
    // Stable object identities, so a scroll can remove the dropped point by reference.
    private points: SparkPoint[] = [];
    private seq = 0;
    private baseline = 0;

    init(params: ICellRendererParams<SparkRow>) {
        const { history, baseline } = readRow(params);
        this.seed(history, baseline);
        // The React component creates its chart in a layout effect, once the cell is in the document.
        // The grid attaches this element right after `init` returns, so a microtask lands at the same
        // point; the chart then measures a laid-out cell rather than a detached div.
        queueMicrotask(() => {
            if (this.destroyed) return;
            this.chart = AgCharts.__createSparkline(sparklineOptions(this.eGui, this.points, this.baseline));
        });
    }

    getGui() {
        return this.eGui;
    }

    refresh(params: ICellRendererParams<SparkRow>) {
        const { history, baseline } = readRow(params);
        // The baseline drives segmentation, which a transaction cannot change, so a shift in it
        // forces a full reseed.
        if (baseline !== this.baseline) {
            this.seed(history, baseline);
            this.chart?.update(sparklineOptions(this.eGui, this.points, baseline)).catch(logError);
            return true;
        }

        const { removed, appended } = scrollShift(this.points, history);
        const added = appended.map((y) => ({ x: this.seq++, y }));
        this.points = [...this.points.slice(removed.length), ...added];
        if (removed.length || added.length) {
            this.chart?.applyTransaction({ remove: removed, add: added }).catch(logError);
        }
        return true;
    }

    destroy() {
        this.destroyed = true;
        this.chart?.destroy();
        this.chart = undefined;
    }

    private seed(history: number[], baseline: number) {
        this.points = history.map((y, i) => ({ x: i, y }));
        this.seq = history.length;
        this.baseline = baseline;
    }
}

function readRow({ data: row }: ICellRendererParams<SparkRow>) {
    const history = row?.history ?? [];
    return { history, baseline: row?.baseline ?? history[0] ?? 0 };
}

// Expresses `history` as a scroll of the current points: the dropped points plus the appended
// values. A window sharing no prefix still resolves, as a full replacement.
function scrollShift(points: SparkPoint[], history: number[]): { removed: SparkPoint[]; appended: number[] } {
    for (let shift = 0; shift < points.length; shift++) {
        const retained = points.length - shift;
        if (retained > history.length) continue;
        let matches = true;
        for (let i = 0; i < retained; i++) {
            if (points[shift + i].y !== history[i]) {
                matches = false;
                break;
            }
        }
        if (matches) {
            return { removed: points.slice(0, shift), appended: history.slice(retained) };
        }
    }
    return { removed: points.slice(), appended: history };
}
