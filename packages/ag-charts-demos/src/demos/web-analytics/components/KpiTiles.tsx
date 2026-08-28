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

// Build the KPI set from the current summary, its daily breakdown, and an optional
// comparison summary.
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
    return (
        <div className="wa-kpi-tabs" role="tablist" aria-label="Traffic metric">
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
                        // Only the selected tab is in the tab order; arrow keys are not
                        // wired up, so leave the rest reachable by clicking.
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
