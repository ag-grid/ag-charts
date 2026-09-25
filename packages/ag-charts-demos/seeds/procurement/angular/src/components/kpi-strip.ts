import { Component, computed, input } from '@angular/core';

import { AgCharts, AgGauge } from 'ag-charts-angular';
import type { AgBarSeriesOptions, AgCartesianChartOptions } from 'ag-charts-community';
import { type AgLinearGaugeOptions } from 'ag-charts-enterprise';

import { SEGMENT_SEPARATOR, STATUS_COLORS, STATUS_ICONS, THEME } from '../chartTheme';
import { fmtCurrencyCompact, fmtInt, fmtPct } from '../format';
import type { Kpi, KpiGauge, KpiSegment, ShipmentStatus } from '../types';
import { AfterRender } from '../ui';
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

/** The React `KpiGaugeBar`: its root `.pc-kpi-gauge` is this component's host. */
@Component({
    selector: 'span[pcKpiGauge]',
    imports: [AfterRender, AgGauge],
    // The detail line already states the figure and its target, so the gauge stays out of accessible text.
    host: { class: 'pc-kpi-gauge', 'aria-hidden': 'true' },
    template: '<ag-gauge *pcAfterRender style="display: block; height: 100%; width: 100%;" [options]="options()" />',
})
export class KpiGaugeBar {
    readonly gauge = input.required<KpiGauge>();
    readonly tone = input.required<Kpi['tone']>();

    protected readonly options = computed(() => gaugeOptions(this.gauge(), this.tone()));
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

/** The React `KpiSegmentBar`: its root `.pc-kpi-segments` is this component's host. */
@Component({
    selector: 'span[pcKpiSegments]',
    imports: [AfterRender, AgCharts],
    host: { class: 'pc-kpi-segments' },
    template: '<ag-charts *pcAfterRender style="display: block; height: 100%; width: 100%;" [options]="options()" />',
})
export class KpiSegmentBar {
    readonly segments = input.required<KpiSegment[]>();

    protected readonly options = computed(() => segmentOptions(this.segments()));
}

/** The bands in text, so the breakdown survives without colour or a hover. */
@Component({
    selector: 'span[pcKpiSegmentKeys]',
    host: { class: 'pc-kpi-segment-keys' },
    template: `
        @for (segment of segments(); track segment.label) {
            <span class="pc-kpi-segment-key"
                ><span aria-hidden="true" [style.color]="segment.color">{{ segment.icon }}</span>
                {{ fmtInt(segment.count) }} {{ segment.label.toLowerCase() }}</span
            >
        }
    `,
})
export class KpiSegmentKeys {
    readonly segments = input.required<KpiSegment[]>();

    protected readonly fmtInt = fmtInt;
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

/** Tiles share the row evenly, however many of them a view passes. The host is the React root `.pc-kpis`. */
@Component({
    selector: 'div[pcKpiStrip]',
    imports: [KpiGaugeBar, KpiSegmentBar, KpiSegmentKeys],
    host: { class: 'pc-kpis', '[style.--pc-kpi-columns]': 'kpis().length' },
    template: `
        @for (kpi of kpis(); track kpi.key) {
            <div [class]="kpi.tone === 'neutral' ? 'pc-kpi' : 'pc-kpi is-' + kpi.tone">
                <!-- The glyph restates the threshold state the accent colour carries; kept tight
                    against the label, as the JSX is, so no space precedes it. -->
                <span class="pc-kpi-label"
                    >{{ kpi.label }}
                    @if (kpi.tone !== 'neutral') {
                        <span class="pc-kpi-icon" aria-hidden="true">{{ kpi.icon }}</span>
                    }
                </span>
                <span class="pc-kpi-value">{{ kpi.value }}</span>
                @if (kpi.gauge; as gauge) {
                    <span pcKpiGauge [gauge]="gauge" [tone]="kpi.tone"></span>
                }
                @if (kpi.segments; as segments) {
                    <span pcKpiSegments [segments]="segments"></span>
                }
                <!-- The line explaining the figure and the bands it is drawn from read as one
                    row: the sentence on the left, the counts it refers to ranged right. -->
                @if (kpi.detail != null || kpi.segments != null) {
                    <span class="pc-kpi-foot">
                        @if (kpi.detail) {
                            <span class="pc-kpi-detail">{{ kpi.detail }}</span>
                        }
                        @if (kpi.segments; as segments) {
                            <span pcKpiSegmentKeys [segments]="segments"></span>
                        }
                    </span>
                }
            </div>
        }
    `,
})
export class KpiStrip {
    readonly kpis = input.required<Kpi[]>();
}
