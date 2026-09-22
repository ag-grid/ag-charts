// Shared KPI-metric registry, so a metric's label, colour and formatting stay
// identical across the tiles and the traffic chart. The six sparklines sit in one
// row, so these colours are in a validated adjacent order. Yellow and red are
// deliberately unused: yellow is too faint for a 2px line, and red is reserved for
// the negative-delta cue.
import { PALETTE } from './chartTheme';
import type { DailyPoint, summary } from './data';
import { fmtCurrency, fmtDuration, fmtInt, fmtPct } from './format';

type Summary = ReturnType<typeof summary>;

export type MetricKey = 'sessions' | 'visitors' | 'conversions' | 'conversionRate' | 'revenue' | 'avgDuration';

export interface MetricDef {
    key: MetricKey;
    label: string;
    /** Short noun for chart titles/axes, e.g. "Sessions over time". */
    axisTitle: string;
    color: string;
    /** Formats a single value — shared by the tile headline, axis, and tooltip. */
    formatValue: (value: number) => string;
    value: (s: Summary) => number;
    daily: (d: DailyPoint) => number;
}

export const METRICS: MetricDef[] = [
    {
        key: 'sessions',
        label: 'Sessions',
        axisTitle: 'Sessions',
        color: PALETTE[0], // blue
        formatValue: fmtInt,
        value: (s) => s.sessions,
        daily: (d) => d.sessions,
    },
    {
        key: 'visitors',
        label: 'Visitors',
        axisTitle: 'Visitors',
        color: PALETTE[1], // orange
        formatValue: fmtInt,
        value: (s) => s.visitors,
        daily: (d) => d.visitors,
    },
    {
        key: 'conversions',
        label: 'Conversions',
        axisTitle: 'Conversions',
        color: PALETTE[2], // aqua
        formatValue: fmtInt,
        value: (s) => s.conversions,
        daily: (d) => d.conversions,
    },
    {
        key: 'conversionRate',
        label: 'Conv. rate',
        axisTitle: 'Conversion rate',
        color: PALETTE[6], // violet
        formatValue: fmtPct,
        value: (s) => s.conversionRate,
        daily: (d) => d.conversionRate,
    },
    {
        key: 'revenue',
        label: 'Revenue',
        axisTitle: 'Revenue',
        color: PALETTE[5], // green
        formatValue: fmtCurrency,
        value: (s) => s.revenue,
        daily: (d) => d.revenue,
    },
    {
        key: 'avgDuration',
        label: 'Avg. session',
        axisTitle: 'Avg. session duration',
        color: PALETTE[4], // magenta
        formatValue: fmtDuration,
        value: (s) => s.avgDuration,
        daily: (d) => d.avgDuration,
    },
];

export const METRIC_BY_KEY: Record<MetricKey, MetricDef> = Object.fromEntries(
    METRICS.map((metric) => [metric.key, metric])
) as Record<MetricKey, MetricDef>;
