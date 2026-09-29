import { Component, ElementRef, inject, input, output } from '@angular/core';

import type { DailyPoint, summary } from '../data';
import { fmtDelta } from '../format';
import { METRICS, type MetricKey } from '../metrics';
import { type SparkPoint, Sparkline } from './sparkline';

type Summary = ReturnType<typeof summary>;

export interface KpiDef {
    key: MetricKey;
    label: string;
    value: string;
    /** Fractional change vs the comparison period; undefined hides the delta. */
    delta?: number;
    /** Daily values across the selected range, for the tile sparkline. */
    series: SparkPoint[];
    /** Sparkline colour. */
    color: string;
    /** Formats a metric value for the sparkline tooltip. */
    formatValue: (value: number) => string;
}

export function buildKpis(current: Summary, daily: DailyPoint[], previous: Summary): KpiDef[] {
    return METRICS.map((metric) => {
        const before = metric.value(previous);
        return {
            key: metric.key,
            label: metric.label,
            color: metric.color,
            formatValue: metric.formatValue,
            value: metric.formatValue(metric.value(current)),
            delta: before === 0 ? undefined : metric.value(current) / before - 1,
            series: daily.map((d) => ({ date: d.date, value: metric.daily(d) })),
        };
    });
}

/** DOM id of a metric's tab, so the chart below can name the tab that drives it. */
export function kpiTabId(key: MetricKey) {
    return `wa-kpi-tab-${key}`;
}

/**
 * The KPI row doubles as the tab strip of the traffic card: each metric is a tab, and
 * the selected one drives the chart beneath it.
 */
@Component({
    selector: 'div[waKpiTiles]',
    imports: [Sparkline],
    host: {
        class: 'wa-kpi-tabs',
        role: 'tablist',
        'aria-label': 'Traffic metric',
        '(keydown)': 'onKeydown($event)',
    },
    template: `
        @for (kpi of kpis(); track kpi.key) {
            <button
                [id]="kpiTabId(kpi.key)"
                type="button"
                role="tab"
                class="wa-kpi"
                [class.is-active]="kpi.key === activeKey()"
                [attr.aria-selected]="kpi.key === activeKey()"
                [tabindex]="kpi.key === activeKey() ? 0 : -1"
                [style.color]="kpi.key === activeKey() ? kpi.color : null"
                (click)="select.emit(kpi.key)"
            >
                <span class="wa-kpi-label">{{ kpi.label }}</span>
                <span class="wa-kpi-value">{{ kpi.value }}</span>
                @if (kpi.delta != null) {
                    <span class="wa-kpi-delta" [class.wa-up]="kpi.delta >= 0" [class.wa-down]="kpi.delta < 0"
                        >{{ fmtDelta(kpi.delta) }} vs prev</span
                    >
                }
                <span class="wa-kpi-spark-box" aria-hidden="true">
                    <div waSparkline [points]="kpi.series" [color]="kpi.color" [formatValue]="kpi.formatValue"></div>
                </span>
            </button>
        }
    `,
})
export class KpiTiles {
    readonly kpis = input.required<KpiDef[]>();
    /** The metric currently driving the traffic chart. */
    readonly activeKey = input.required<MetricKey>();
    readonly select = output<MetricKey>();

    protected readonly kpiTabId = kpiTabId;
    protected readonly fmtDelta = fmtDelta;
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    // Selection follows focus, so the roving tabindex above always lands on the active tab.
    protected onKeydown(event: KeyboardEvent): void {
        const kpis = this.kpis();
        const last = kpis.length - 1;
        const current = kpis.findIndex((kpi) => kpi.key === this.activeKey());
        let next: number;
        switch (event.key) {
            case 'ArrowRight':
                next = current === last ? 0 : current + 1;
                break;
            case 'ArrowLeft':
                next = current === 0 ? last : current - 1;
                break;
            case 'Home':
                next = 0;
                break;
            case 'End':
                next = last;
                break;
            default:
                return;
        }
        event.preventDefault();
        this.select.emit(kpis[next].key);
        this.host.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
    }
}
