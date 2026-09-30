import { Component, ElementRef, NgZone, type OnDestroy, afterRenderEffect, inject, input } from '@angular/core';

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

/**
 * A KPI tile's sparkline. The host is the container the React version renders; the sparkline API
 * has no Angular wrapper, so the instance is created once and updated in place, since recreating it
 * per change would restart the entry animation.
 */
@Component({
    selector: 'div[waSparkline]',
    host: { class: 'wa-kpi-spark' },
    template: '',
})
export class Sparkline implements OnDestroy {
    readonly points = input.required<SparkPoint[]>();
    readonly color = input.required<string>();
    /** Formats a value for the tooltip, matching the tile's headline formatting. */
    readonly formatValue = input.required<(value: number) => string>();

    private readonly container = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly ngZone = inject(NgZone);
    private chart?: AgChartInstance<AgSparklineOptions>;

    constructor() {
        // After render, like the React layout effect, so the container is laid out. Outside the
        // Angular zone, as the ag-charts-angular components are, so the sparkline's own scheduling
        // never triggers change detection.
        afterRenderEffect(() => {
            const options = sparklineOptions(this.container, this.points(), this.color(), this.formatValue());
            this.ngZone.runOutsideAngular(() => {
                if (this.chart) {
                    void this.chart.update(options);
                } else {
                    this.chart = AgCharts.__createSparkline(options);
                }
            });
        });
    }

    ngOnDestroy(): void {
        this.chart?.destroy();
        this.chart = undefined;
    }
}
