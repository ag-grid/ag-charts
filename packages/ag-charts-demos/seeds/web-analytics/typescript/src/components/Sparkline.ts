import { type AgChartInstance, AgCharts, type AgSparklineOptions } from 'ag-charts-community';

import { THEME } from '../chartTheme';
import { type View, h } from '../dom';
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
        fill: {
            type: 'gradient',
            colorStops: [{ color: '#ffffff' }, { color: color }],
        },
        fillOpacity: 0.3,
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

export interface Sparkline extends View {
    update(points: SparkPoint[]): void;
}

export function createSparkline(
    points: SparkPoint[],
    color: string,
    /** Formats a value for the tooltip, matching the tile's headline formatting. */
    formatValue: (value: number) => string
): Sparkline {
    const el = h('div', { class: 'wa-kpi-spark' });
    let chart: AgChartInstance<AgSparklineOptions> | undefined;

    return {
        el,
        mount() {
            chart = AgCharts.__createSparkline(sparklineOptions(el, points, color, formatValue));
        },
        // The instance is updated in place: recreating it per change would restart the entry
        // animation, as the React component's layout effect avoids too.
        update(next) {
            if (next === points) return;
            points = next;
            void chart?.update(sparklineOptions(el, points, color, formatValue));
        },
        destroy() {
            chart?.destroy();
            chart = undefined;
        },
    };
}
