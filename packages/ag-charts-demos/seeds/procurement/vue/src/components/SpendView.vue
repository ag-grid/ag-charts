<script setup lang="ts">
import { computed } from 'vue';

import type { BurnUpPoint, Kpi, SpendNode, SpendTrend, SupplierShareRow } from '../types';
import type { MySpendPosition } from '../workspace';
import BudgetBurnUp from './BudgetBurnUp.vue';
import EmptyState from './EmptyState.vue';
import KpiStrip from './KpiStrip.vue';
import SpendSunburst from './SpendSunburst.vue';
import SpendTrendChart from './SpendTrendChart.vue';
import SupplierShareChart from './SupplierShareChart.vue';

/**
 * The quarterly review: where her spend goes, whether it is on plan, and why it moved.
 *
 * This is the tab she opens for a supplier business review or a budget conversation, which is why
 * the composition, the pacing and the variance decomposition sit together — they are the three
 * questions that always follow one another.
 */
const props = defineProps<{
    /** Her spend against her annual allocation, which frames every figure below it. */
    kpis: Kpi[];
    tree: SpendNode;
    supplierNames: Map<string, string>;
    supplierColors: Record<string, string>;
    shareRows: SupplierShareRow[];
    burnUp: BurnUpPoint[];
    /** Her position against the selected window's allocation — the tile above reads the same object. */
    spendPosition: MySpendPosition;
    /** Committed spend over the selected window, at whatever grain that window is read in. */
    spendTrend: SpendTrend;
    subcategories: string[];
}>();

// Weeks are named by their day, months by their month — the granularity the bars are drawn at.
const trendEndLabel = computed(() =>
    props.spendTrend.end.toLocaleDateString(
        'en-US',
        props.spendTrend.grain === 'week' ? { month: 'short', day: 'numeric' } : { month: 'short', year: 'numeric' }
    )
);
const trendBuckets = computed(() => props.spendTrend.rows.length);
</script>

<template>
    <div class="pc-view-content">
        <KpiStrip :kpis="kpis" />

        <div class="pc-grid-2">
            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">Remaining runway</h2>
                    </div>
                </div>
                <div class="pc-chart-box">
                    <BudgetBurnUp :points="burnUp" :budget="spendPosition.budget" />
                </div>
            </section>
            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">My spend over time</h2>
                    </div>
                    <!--
                        Names the grain and where the bars stop: the window follows the period
                        selector, and the bucket still in progress is excluded from it.
                    -->
                    <span
                        class="pc-card-sub"
                        v-text="
                            `${trendBuckets} complete ${spendTrend.grain}${trendBuckets === 1 ? '' : 's'} to ${trendEndLabel}`
                        "
                    />
                </div>
                <div class="pc-chart-box">
                    <SpendTrendChart
                        v-if="trendBuckets > 0"
                        :rows="spendTrend.rows"
                        :subcategories="subcategories"
                        :grain="spendTrend.grain"
                    />
                    <EmptyState
                        v-else
                        :message="`No complete ${spendTrend.grain} in this period yet`"
                        hint="Try a wider period from the header."
                    />
                </div>
            </section>
        </div>

        <div class="pc-grid-2">
            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">My spend breakdown</h2>
                    </div>
                </div>
                <div class="pc-chart-box-md">
                    <SpendSunburst v-if="tree.spend > 0" :tree="tree" :supplier-colors="supplierColors" />
                    <EmptyState v-else message="No spend in this period" hint="Try a wider period from the header." />
                </div>
            </section>
            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">Supplier concentration</h2>
                    </div>
                </div>
                <div class="pc-chart-box-md">
                    <SupplierShareChart
                        v-if="tree.spend > 0"
                        :rows="shareRows"
                        :supplier-names="supplierNames"
                        :supplier-colors="supplierColors"
                    />
                    <EmptyState v-else message="No spend in this period" hint="Try a wider period from the header." />
                </div>
            </section>
        </div>
    </div>
</template>
