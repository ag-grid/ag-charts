import { useLayoutEffect, useRef } from 'react';

import { type AgChartInstance, AgCharts, type AgSparklineOptions } from 'ag-charts-community';

import { THEME } from '../chartTheme';
import { fmtDate } from '../format';

/** One sparkline point: a daily value tagged with its date. */
export interface SparkPoint {
    date: Date;
    value: number;
}

interface Datum {
    x: number;
    y: number;
    date: Date;
}

function sparklineOptions(
    container: HTMLElement,
    points: SparkPoint[],
    color: string,
    formatValue: (value: number) => string
): AgSparklineOptions {
    const data: Datum[] = points.map((point, x) => ({ x, y: point.value, date: point.date }));
    return {
        type: 'area',
        theme: THEME,
        container,
        data,
        xKey: 'x',
        yKey: 'y',
        minWidth: 0,
        minHeight: 0,
        background: { visible: false },
        padding: { top: 3, right: 4, bottom: 3, left: 4 },
        fill: color,
        fillOpacity: 0.16,
        stroke: color,
        strokeWidth: 2,
        marker: { fill: color },
        tooltip: {
            position: {
                placement: ['top'],
            },
            renderer: ({ datum }: { datum: Datum }) => ({
                title: fmtDate(datum.date),
                content: formatValue(datum.y),
            }),
        },
    };
}

interface SparklineProps {
    points: SparkPoint[];
    color: string;
    /** Formats a value for the tooltip, matching the tile's headline formatting. */
    formatValue: (value: number) => string;
}

// A small area sparkline of a KPI's daily values across the selected range.
export function Sparkline({ points, color, formatValue }: SparklineProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<AgChartInstance<AgSparklineOptions>>();

    // The sparkline API has no React wrapper, so the instance is updated in place:
    // recreating it per render would restart the entry animation on every change.
    useLayoutEffect(() => {
        const container = containerRef.current!;
        const options = sparklineOptions(container, points, color, formatValue);
        const chart = chartRef.current;
        if (chart) {
            void chart.update(options);
        } else {
            chartRef.current = AgCharts.__createSparkline(options);
        }
    }, [points, color, formatValue]);

    // Clearing the ref matters as much as destroying: the effect above keys off it, and
    // would otherwise update a destroyed instance if the component ever re-mounted.
    useLayoutEffect(
        () => () => {
            chartRef.current?.destroy();
            chartRef.current = undefined;
        },
        []
    );

    return <div ref={containerRef} className="wa-kpi-spark" />;
}
