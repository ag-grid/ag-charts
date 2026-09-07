import { type KeyboardEvent, useRef } from 'react';

import type { DailyPoint, summary } from '../data';
import { fmtDelta } from '../format';
import { METRICS, type MetricKey } from '../metrics';
import { type SparkPoint, Sparkline } from './Sparkline';

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

interface KpiTilesProps {
    kpis: KpiDef[];
    /** The metric currently driving the traffic chart. */
    activeKey: MetricKey;
    onSelect: (key: MetricKey) => void;
}

/** DOM id of a metric's tab, so the chart below can name the tab that drives it. */
export function kpiTabId(key: MetricKey) {
    return `wa-kpi-tab-${key}`;
}

/**
 * The KPI row doubles as the tab strip of the traffic card: each metric is a tab, and
 * the selected one drives the chart beneath it.
 */
export function KpiTiles({ kpis, activeKey, onSelect }: KpiTilesProps) {
    const tabsRef = useRef<HTMLDivElement>(null);

    // Selection follows focus, so the roving tabIndex below always lands on the active tab.
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const last = kpis.length - 1;
        const current = kpis.findIndex((kpi) => kpi.key === activeKey);
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
        onSelect(kpis[next].key);
        tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
    };

    return (
        <div className="wa-kpi-tabs" role="tablist" aria-label="Traffic metric" ref={tabsRef} onKeyDown={onKeyDown}>
            {kpis.map((kpi) => {
                const up = (kpi.delta ?? 0) >= 0;
                const active = kpi.key === activeKey;
                return (
                    <button
                        key={kpi.key}
                        id={kpiTabId(kpi.key)}
                        type="button"
                        role="tab"
                        className={active ? 'wa-kpi is-active' : 'wa-kpi'}
                        aria-selected={active}
                        // Roving tab order: Tab reaches the strip, arrow keys move within it.
                        tabIndex={active ? 0 : -1}
                        // Resolves `currentcolor` for the active tab's underline.
                        style={active ? { color: kpi.color } : undefined}
                        onClick={() => onSelect(kpi.key)}
                    >
                        <span className="wa-kpi-label">{kpi.label}</span>
                        <span className="wa-kpi-value">{kpi.value}</span>
                        {kpi.delta != null && (
                            <span className={`wa-kpi-delta ${up ? 'wa-up' : 'wa-down'}`}>
                                {fmtDelta(kpi.delta)} vs prev
                            </span>
                        )}
                        {/* The sparkline restates the tab's own figures, so keep its
                            chart DOM out of the button's accessible name. */}
                        <span className="wa-kpi-spark-box" aria-hidden="true">
                            <Sparkline points={kpi.series} color={kpi.color} formatValue={kpi.formatValue} />
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
