<script lang="ts">
import { STATUS_COLORS, STATUS_ICONS } from '../chartTheme';
import { fmtCurrencyCompact, fmtInt, fmtPct } from '../format';
import type { Kpi, ShipmentStatus } from '../types';
import { type MySpendPosition, type MySummary, ON_TIME_TARGET } from '../workspace';

/** Bands of the shipment breakdown, worst first. */
const SEGMENT_ORDER: ShipmentStatus[] = ['Late', 'At risk', 'On time'];

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
</script>

<script setup lang="ts">
import KpiGaugeBar from './KpiGaugeBar.vue';
import KpiSegmentBar from './KpiSegmentBar.vue';
import KpiSegmentKeys from './KpiSegmentKeys.vue';

/** Tiles share the row evenly, however many of them a view passes. */
defineProps<{ kpis: Kpi[] }>();
</script>

<template>
    <div class="pc-kpis" :style="{ '--pc-kpi-columns': kpis.length }">
        <div v-for="kpi in kpis" :key="kpi.key" :class="kpi.tone === 'neutral' ? 'pc-kpi' : `pc-kpi is-${kpi.tone}`">
            <!-- The glyph restates the threshold state the accent colour carries. -->
            <span class="pc-kpi-label"
                >{{ kpi.label
                }}<span v-if="kpi.tone !== 'neutral'" class="pc-kpi-icon" aria-hidden="true">{{ kpi.icon }}</span></span
            >
            <span class="pc-kpi-value">{{ kpi.value }}</span>
            <KpiGaugeBar v-if="kpi.gauge" :gauge="kpi.gauge" :tone="kpi.tone" />
            <KpiSegmentBar v-if="kpi.segments" :segments="kpi.segments" />
            <!-- The line explaining the figure and the bands it is drawn from read as one
                 row: the sentence on the left, the counts it refers to ranged right. -->
            <span v-if="kpi.detail != null || kpi.segments != null" class="pc-kpi-foot">
                <span v-if="kpi.detail" class="pc-kpi-detail">{{ kpi.detail }}</span>
                <KpiSegmentKeys v-if="kpi.segments" :segments="kpi.segments" />
            </span>
        </div>
    </div>
</template>
