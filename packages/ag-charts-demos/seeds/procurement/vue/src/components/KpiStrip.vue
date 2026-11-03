<script lang="ts">
import { fmtCurrencyCompact, fmtInt, fmtPct } from '../format';
import type { Kpi } from '../types';
import type { MySpendPosition, MySummary } from '../workspace';
import { STATUS_ORDER, statusSegments } from './StatusKeys.vue';

/**
 * Her delivery headline: the freight from her suppliers that needs watching.
 *
 * Scoped to her commodity rather than the portfolio, so the denominator is her commodity's
 * in-transit count, not the company's. Spend against allocation is a spend-tab
 * figure — see `buildSpendKpis`.
 *
 * `filterLabel` names what the orders tab's filters narrow to, so the detail line says the figure is filtered.
 */
export function buildKpis(summary: MySummary, filterLabel?: string): Kpi[] {
    const inTransit = STATUS_ORDER.reduce((total, status) => total + summary.shipmentsByStatus[status], 0);

    return [
        {
            key: 'atRisk',
            label: 'At-risk shipments',
            value: fmtInt(summary.atRiskShipments),
            detail:
                filterLabel == null
                    ? `Out of ${fmtInt(inTransit)} in transit from my suppliers`
                    : `Out of ${fmtInt(inTransit)} in transit · filtered to ${filterLabel}`,
            // The segmented bar already shows how many are late, so the tile carries no threshold state.
            tone: 'neutral',
            segments: statusSegments(summary.shipmentsByStatus),
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
            gauge: { value: projectedShare, target: 1, targetLabel: position.budgetLabel },
        },
    ];
}
</script>

<script setup lang="ts">
import KpiGaugeBar from './KpiGaugeBar.vue';
import KpiSegmentBar from './KpiSegmentBar.vue';
import StatusKeys from './StatusKeys.vue';

/**
 * Tiles share one card evenly, however many of them a view passes. `stacked` puts each chart under
 * its figure rather than beside it.
 */
withDefaults(defineProps<{ kpis: Kpi[]; stacked?: boolean }>(), { stacked: false });
</script>

<template>
    <div :class="stacked ? 'pc-kpis pc-kpis--stacked' : 'pc-kpis'" :style="{ '--pc-kpi-columns': kpis.length }">
        <div v-for="kpi in kpis" :key="kpi.key" class="pc-kpi">
            <span class="pc-kpi-label">{{ kpi.label }}</span>
            <!-- The chart the figure is read against: beside it, or under it when `stacked`. -->
            <span class="pc-kpi-figure">
                <span class="pc-kpi-value">{{ kpi.value }}</span>
                <KpiGaugeBar v-if="kpi.gauge" :gauge="kpi.gauge" :tone="kpi.tone" />
                <KpiSegmentBar v-if="kpi.segments" :segments="kpi.segments" />
            </span>
            <!-- The line explaining the figure and the bands it is drawn from read as one
                 row: the sentence on the left, the counts it refers to ranged right. -->
            <span v-if="kpi.detail != null || kpi.segments != null" class="pc-kpi-foot">
                <span v-if="kpi.detail" class="pc-kpi-detail">{{ kpi.detail }}</span>
                <StatusKeys v-if="kpi.segments" :segments="kpi.segments" />
            </span>
        </div>
    </div>
</template>
