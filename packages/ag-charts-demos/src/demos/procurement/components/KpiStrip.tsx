import { type CSSProperties, useMemo } from 'react';

import type { AgBarSeriesOptions, AgCartesianChartOptions } from 'ag-charts-community';
import { type AgLinearGaugeOptions } from 'ag-charts-enterprise';
import { AgCharts, AgGauge } from 'ag-charts-react';

import { SEGMENT_SEPARATOR, STATUS_COLORS, STATUS_ICONS, THEME } from '../chartTheme';
import { fmtCurrencyCompact, fmtInt, fmtPct } from '../format';
import type { Kpi, KpiGauge, KpiSegment, ShipmentStatus } from '../types';
import { type MySpendPosition, type MySummary, ON_TIME_TARGET } from '../workspace';

/** Bar ink per threshold state, matching the tile's own accent. */
const GAUGE_FILL: Record<Kpi['tone'], string> = {
    neutral: 'var(--pc-accent)',
    good: 'var(--pc-ok-fill)',
    warn: 'var(--pc-warn-fill)',
    bad: 'var(--pc-bad-fill)',
};

/**
 * The tile's figure against the thing it is measured against.
 *
 * A percentage says where she is; only the marker says whether that is where she should be, and at
 * a glance the gap between bar and marker is the reading — which is the question these two tiles
 * exist to answer.
 */
function gaugeOptions({ value, target, targetLabel }: KpiGauge, tone: Kpi['tone']): AgLinearGaugeOptions {
    // The scale runs past the target: clamped to it, an overrun would land on the marker and read as on plan.
    const max = Math.max(100, Math.ceil(value * 100));

    return {
        theme: THEME,
        type: 'linear-gauge',
        direction: 'horizontal',
        value: value * 100,
        thickness: 8,
        cornerRadius: 4,
        scale: {
            min: 0,
            max,
            fill: 'var(--pc-grid)',
            // The figure above the gauge is the number; ticks here would only repeat it.
            label: { enabled: false },
        },
        bar: { fill: GAUGE_FILL[tone] },
        targets: [
            {
                value: target * 100,
                text: targetLabel,
                shape: 'line',
                placement: 'middle',
                size: 14,
                strokeWidth: 2,
                stroke: 'var(--pc-text)',
            },
        ],
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
    };
}

function KpiGaugeBar({ gauge, tone }: { gauge: KpiGauge; tone: Kpi['tone'] }) {
    const options = useMemo(() => gaugeOptions(gauge, tone), [gauge, tone]);
    // The detail line already states the figure and its target, so the gauge stays out of accessible text.
    return (
        <span className="pc-kpi-gauge" aria-hidden="true">
            <AgGauge options={options} style={{ height: '100%', width: '100%' }} />
        </span>
    );
}

/** Bands of the shipment breakdown, worst first. */
const SEGMENT_ORDER: ShipmentStatus[] = ['Late', 'At risk', 'On time'];

/** One row of stacked bands, so the segments share a single 100%-wide bar. */
interface SegmentRow {
    row: string;
    [label: string]: string | number;
}

/**
 * The figure's composition, as one bar.
 *
 * The at-risk count says how many need watching but not how that sits against the rest of her
 * freight — three at risk out of five is a different morning from three out of thirty, and the
 * width of the healthy band is that reading.
 */
function segmentOptions(segments: KpiSegment[]): AgCartesianChartOptions<SegmentRow> {
    const datum: SegmentRow = { row: 'shipments' };
    for (const segment of segments) datum[segment.label] = segment.count;

    const series = segments.map<AgBarSeriesOptions<SegmentRow>>((segment) => ({
        type: 'bar',
        direction: 'horizontal',
        xKey: 'row',
        yKey: segment.label,
        yName: segment.label,
        stacked: true,
        normalizedTo: 100,
        fill: segment.color,
        ...SEGMENT_SEPARATOR,
        tooltip: {
            renderer: () => ({
                title: segment.label,
                content: `${fmtInt(segment.count)} ${segment.count === 1 ? 'shipment' : 'shipments'}`,
            }),
        },
    }));

    return {
        theme: THEME,
        data: [datum],
        series,
        // A single bar filling the box: every axis, tick and label would only repeat the tile.
        axes: {
            y: { type: 'category', label: { enabled: false }, line: { enabled: false }, tick: { enabled: false } },
            x: {
                type: 'number',
                label: { enabled: false },
                line: { enabled: false },
                tick: { enabled: false },
                gridLine: { enabled: false },
            },
        },
        legend: { enabled: false },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
    };
}

function KpiSegmentBar({ segments }: { segments: KpiSegment[] }) {
    const options = useMemo(() => segmentOptions(segments), [segments]);
    return (
        <span className="pc-kpi-segments">
            <AgCharts options={options} style={{ height: '100%', width: '100%' }} />
        </span>
    );
}

/** The bands in text, so the breakdown survives without colour or a hover. */
function KpiSegmentKeys({ segments }: { segments: KpiSegment[] }) {
    return (
        <span className="pc-kpi-segment-keys">
            {segments.map((segment) => (
                <span key={segment.label} className="pc-kpi-segment-key">
                    <span aria-hidden="true" style={{ color: segment.color }}>
                        {segment.icon}
                    </span>{' '}
                    {fmtInt(segment.count)} {segment.label.toLowerCase()}
                </span>
            ))}
        </span>
    );
}

/**
 * Her delivery headlines, with the threshold logic that selects each tile's state.
 *
 * These are her scorecard, not a portfolio summary: every one is scoped to her commodity, so
 * the labels say "my" and the denominators are her commodity's, not the company's.
 *
 * Every tile is absolute rather than period-scoped, and says which window it covers — see
 * `mySummary`. Spend against allocation is a spend-tab figure — see `buildSpendKpis`.
 */
export function buildKpis(summary: MySummary): Kpi[] {
    const belowTarget = summary.onTimeRate < ON_TIME_TARGET;
    const inTransit = SEGMENT_ORDER.reduce((total, status) => total + summary.shipmentsByStatus[status], 0);

    return [
        {
            key: 'onTime',
            label: 'My on-time delivery',
            value: fmtPct(summary.onTimeRate),
            detail: `${fmtInt(summary.deliveredCount)} deliveries, rolling 12 months · ${fmtPct(ON_TIME_TARGET)} target`,
            tone: belowTarget ? 'bad' : 'good',
            icon: belowTarget ? '▼' : '▲',
            gauge: {
                value: summary.onTimeRate,
                target: ON_TIME_TARGET,
                targetLabel: `${fmtPct(ON_TIME_TARGET)} target`,
            },
        },
        {
            key: 'atRisk',
            label: 'My at-risk shipments',
            value: fmtInt(summary.atRiskShipments),
            detail: `Of ${fmtInt(inTransit)} in transit from my suppliers`,
            tone: summary.atRiskShipments > 0 ? 'bad' : 'good',
            icon: summary.atRiskShipments > 0 ? '▲' : '●',
            // Worst first, so the bands she is being measured on lead the bar.
            segments: SEGMENT_ORDER.map((status) => ({
                label: status,
                count: summary.shipmentsByStatus[status],
                color: STATUS_COLORS[status],
                icon: STATUS_ICONS[status],
            })),
        },
    ];
}

/** What the spend tab's tiles are built from. */
export interface SpendKpis {
    position: MySpendPosition;
    /** Label for the committed figure, e.g. "My spend YTD". */
    label: string;
    /** Label for the projection, which names where the window ends. */
    projectionLabel: string;
}

/**
 * Spend against the selected window's allocation, which heads the spend tab.
 *
 * Judged against the share of the window elapsed rather than a fixed threshold, because a share of
 * an allocation on its own is not a position: committing 70% of a year's budget is comfortable in
 * November and alarming in March. Spending ahead of the window is what the tile warns on, and it
 * says how far in the window it is so the warning can be read.
 */
export function buildSpendKpis({ position, label, projectionLabel }: SpendKpis): Kpi[] {
    let tone: Kpi['tone'] = 'neutral';
    if (position.used >= 1) tone = 'bad';
    else if (position.used > position.elapsed) tone = 'warn';

    const overrun = position.projected - position.budget;
    const projectedShare = position.budget > 0 ? position.projected / position.budget : 0;

    return [
        {
            key: 'spend',
            label,
            value: fmtCurrencyCompact(position.spend),
            detail: `${fmtPct(position.used)} of my ${fmtCurrencyCompact(position.budget)} ${position.budgetLabel} · ${fmtPct(position.elapsed)} of the ${position.windowLabel} elapsed`,
            tone,
            icon: tone === 'neutral' ? '●' : '▲',
            // The allocation is the ceiling, so the target sits at the far end of the scale.
            gauge: { value: position.used, target: 1, targetLabel: position.budgetLabel },
        },
        {
            key: 'projected',
            label: projectionLabel,
            value: fmtCurrencyCompact(position.projected),
            // Says the assumption out loud: a run rate is a projection, not a commitment.
            detail: `${fmtCurrencyCompact(Math.abs(overrun))} ${overrun >= 0 ? 'over' : 'under'} my ${fmtCurrencyCompact(position.budget)} ${position.budgetLabel} at my recent run rate`,
            tone: overrun > 0 ? 'bad' : 'good',
            icon: overrun > 0 ? '▲' : '▼',
            gauge: { value: projectedShare, target: 1, targetLabel: position.budgetLabel },
        },
    ];
}

/** Tiles share the row evenly, however many of them a view passes. */
export function KpiStrip({ kpis }: { kpis: Kpi[] }) {
    return (
        <div className="pc-kpis" style={{ '--pc-kpi-columns': kpis.length } as CSSProperties}>
            {kpis.map((kpi) => (
                <div key={kpi.key} className={kpi.tone === 'neutral' ? 'pc-kpi' : `pc-kpi is-${kpi.tone}`}>
                    <span className="pc-kpi-label">
                        {kpi.label}
                        {/* The glyph restates the threshold state the accent colour carries. */}
                        {kpi.tone !== 'neutral' && (
                            <span className="pc-kpi-icon" aria-hidden="true">
                                {kpi.icon}
                            </span>
                        )}
                    </span>
                    <span className="pc-kpi-value">{kpi.value}</span>
                    {kpi.gauge && <KpiGaugeBar gauge={kpi.gauge} tone={kpi.tone} />}
                    {kpi.segments && <KpiSegmentBar segments={kpi.segments} />}
                    {/* The line explaining the figure and the bands it is drawn from read as one
                        row: the sentence on the left, the counts it refers to ranged right. */}
                    {(kpi.detail != null || kpi.segments != null) && (
                        <span className="pc-kpi-foot">
                            {kpi.detail && <span className="pc-kpi-detail">{kpi.detail}</span>}
                            {kpi.segments && <KpiSegmentKeys segments={kpi.segments} />}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}
