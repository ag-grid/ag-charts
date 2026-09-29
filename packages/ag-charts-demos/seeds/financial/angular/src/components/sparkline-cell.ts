import { Component, ElementRef, NgZone, type OnDestroy, inject } from '@angular/core';
import { type ICellRendererAngularComp } from 'ag-grid-angular';
import { type ICellRendererParams } from 'ag-grid-community';

import { type AgChartInstance, AgCharts, type AgSparklineOptions } from 'ag-charts-community';

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

/**
 * Renders an AG Charts sparkline of a row's recent price history inside a grid cell. The host is
 * the container the React version renders; `agInit` is its mount, `refresh` its update effect.
 *
 * Decorative: the trend duplicates the row's visible % change, and the injected role="img" node
 * churns every tick, so the whole subtree stays out of the a11y tree.
 */
@Component({
    selector: 'div[finSparklineCell]',
    host: { class: 'fin-sparkline-cell', 'aria-hidden': 'true' },
    template: '',
})
export class SparklineCell implements ICellRendererAngularComp, OnDestroy {
    private readonly container = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly ngZone = inject(NgZone);
    private chart?: AgChartInstance<AgSparklineOptions>;
    private destroyed = false;
    // Stable object identities, so a scroll can remove the dropped point by reference.
    private points: SparkPoint[] = [];
    private seq = 0;
    private baseline = 0;

    agInit({ data: row }: ICellRendererParams<SparkRow>): void {
        const { history, baseline } = read(row);
        this.seed(history, baseline);
        // The grid attaches the renderer's element after `agInit` returns, and the React version
        // creates the sparkline in a layout effect once attached; a microtask lands after the attach.
        // Outside the Angular zone, as the ag-charts-angular components do, so a sparkline's own
        // scheduling never triggers change detection.
        queueMicrotask(() => {
            if (this.destroyed) return;
            this.chart = this.ngZone.runOutsideAngular(() =>
                AgCharts.__createSparkline(sparklineOptions(this.container, this.points, this.baseline))
            );
        });
    }

    refresh({ data: row }: ICellRendererParams<SparkRow>): boolean {
        const { history, baseline } = read(row);
        // The baseline drives segmentation, which a transaction cannot change, so a shift in it
        // forces a full reseed.
        if (baseline !== this.baseline) {
            this.seed(history, baseline);
            this.chart?.update(sparklineOptions(this.container, this.points, baseline)).catch(logError);
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

    ngOnDestroy(): void {
        this.destroyed = true;
        this.chart?.destroy();
        this.chart = undefined;
    }

    private seed(history: number[], baseline: number): void {
        this.points = history.map((y, i) => ({ x: i, y }));
        this.seq = history.length;
        this.baseline = baseline;
    }
}

function read(row: SparkRow | undefined): { history: number[]; baseline: number } {
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
