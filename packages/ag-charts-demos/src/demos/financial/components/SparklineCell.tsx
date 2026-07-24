import { type CustomCellRendererProps } from 'ag-grid-react';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { type AgChartInstance, AgCharts, type AgSparklineOptions } from 'ag-charts-community';

// Literal (not var) — the sparkline canvas resolves colours at render time and
// does not read the --fin-* CSS custom properties.
const UP = '#10b981';
const DOWN = '#f43f5e';

// One point of the spark. `x` is a monotonically increasing sequence number (not the
// array index) so a scrolling window is one appended point plus one dropped point,
// rather than every point's x shifting.
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
    };
}

// Renders an AG Charts sparkline of a row's recent price history inside a grid cell.
export function SparklineCell({ data: row }: CustomCellRendererProps<SparkRow>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<AgChartInstance<AgSparklineOptions>>();
    const history = useMemo(() => row?.history ?? [], [row]);
    const baseline = row?.baseline ?? history[0] ?? 0;
    // The points currently rendered (stable object identities, so a scroll removes the
    // dropped point by reference) and the next x sequence number to hand out.
    const pointsRef = useRef<SparkPoint[]>([]);
    const seqRef = useRef(0);
    const baselineRef = useRef(baseline);
    // Streaming hands a fresh history array every tick, so the effect below fires
    // even when the drawn line is unchanged. Track a cheap content signature and
    // skip the redundant chart update when it matches.
    const contentRef = useRef<string>();
    const content = `${history.length}:${history[history.length - 1]}:${baseline}`;

    useLayoutEffect(() => {
        const points = history.map((y, i) => ({ x: i, y }));
        pointsRef.current = points;
        seqRef.current = history.length;
        baselineRef.current = baseline;
        chartRef.current = AgCharts.__createSparkline(sparklineOptions(containerRef.current!, points, baseline));
        contentRef.current = content;
        return () => chartRef.current?.destroy();
        // Created once; data updates are handled by the effect below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (content === contentRef.current) return;
        contentRef.current = content;

        // The baseline drives segmentation, which a transaction can't change; a shift in
        // it (or any history that isn't a clean scroll of the current one) forces a reseed.
        const scroll = baseline === baselineRef.current ? scrollShift(pointsRef.current, history) : undefined;
        if (scroll === undefined) {
            const points = history.map((y, i) => ({ x: i, y }));
            pointsRef.current = points;
            seqRef.current = history.length;
            baselineRef.current = baseline;
            chartRef.current?.update(sparklineOptions(containerRef.current!, points, baseline)).catch(logError);
            return;
        }

        const { removed, appended } = scroll;
        const added = appended.map((y) => ({ x: seqRef.current++, y }));
        pointsRef.current = [...pointsRef.current.slice(removed.length), ...added];
        if (removed.length || added.length) {
            chartRef.current?.applyTransaction({ remove: removed, add: added }).catch(logError);
        }
    }, [content, history, baseline]);

    // Decorative: the trend duplicates the row's visible % change, and the chart injects
    // a role="img" node that churns every tick — keep the whole subtree out of the a11y tree.
    return <div ref={containerRef} className="fin-sparkline-cell" aria-hidden="true" />;
}

// eslint-disable-next-line no-console
const logError = (e: unknown) => console.error(e);

// If `history` is the current points scrolled left by some amount (the leading values
// dropped and new values appended to the end), return the dropped points and the
// appended values; otherwise undefined, signalling the caller to reseed.
function scrollShift(
    points: SparkPoint[],
    history: number[]
): { removed: SparkPoint[]; appended: number[] } | undefined {
    for (let shift = 0; shift <= points.length; shift++) {
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
    return undefined;
}
