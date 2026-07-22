import { type CustomCellRendererProps } from 'ag-grid-react';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { type AgChartInstance, AgCharts, type AgSparklineOptions } from 'ag-charts-community';

// Literal (not var) — the sparkline canvas resolves colours at render time and
// does not read the --fin-* CSS custom properties.
const UP = '#10b981';
const DOWN = '#f43f5e';

// One point of the spark, tagged with its direction against the opening value.
interface SparkPoint {
    x: number;
    y: number;
    up: boolean;
}

// A grid row carrying a trend history plus the baseline it is measured against.
interface SparkRow {
    history: number[];
    baseline: number;
}

function sparklineOptions(container: HTMLElement, history: number[], baseline: number): AgSparklineOptions {
    // Split at the session baseline (first value of all history): green above, red below.
    const points: SparkPoint[] = history.map((y, i) => ({ x: i, y, up: y >= baseline }));

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
        marker: {
            enabled: true,
            size: 1,
            // Colour each point by whether it sits above or below the baseline.
            itemStyler: ({ datum }) => {
                const color = (datum as SparkPoint).up ? UP : DOWN;
                return { fill: color, stroke: color };
            },
        },
    };
}

// Renders an AG Charts sparkline of a row's recent price history inside a grid cell.
export function SparklineCell({ data: row }: CustomCellRendererProps<SparkRow>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<AgChartInstance<AgSparklineOptions>>();
    const history = useMemo(() => row?.history ?? [], [row]);
    const baseline = row?.baseline ?? history[0] ?? 0;

    useLayoutEffect(() => {
        chartRef.current = AgCharts.__createSparkline(sparklineOptions(containerRef.current!, history, baseline));
        return () => chartRef.current?.destroy();
        // Created once; data updates are handled by the effect below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        chartRef.current
            ?.update(sparklineOptions(containerRef.current!, history, baseline))
            // eslint-disable-next-line no-console
            .catch((e) => console.error(e));
    }, [history, baseline]);

    return <div ref={containerRef} className="fin-sparkline-cell" />;
}
