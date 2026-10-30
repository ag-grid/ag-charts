<script lang="ts">
import { h } from 'vue';

import type { SpendTrendSplit } from '../types';
import ToggleIcon from '../ui/ToggleIcon.vue';
import type { ToggleOption } from '../ui/types';
import type { SupplierShareView } from './SupplierShareChart.vue';

/** Icons are Carbon's `HeatMap_03` and `ChartBar` (Apache-2.0), as used for these series on the AG website. */
const SHARE_VIEW_OPTIONS: (ToggleOption & { value: SupplierShareView })[] = [
    {
        value: 'heatmap',
        label: 'Heatmap',
        icon: () =>
            h(ToggleIcon, null, () => [
                h('path', {
                    d: 'M27,3H5A2.0023,2.0023,0,0,0,3,5V27a2.0023,2.0023,0,0,0,2,2H27a2.0023,2.0023,0,0,0,2-2V5A2.0023,2.0023,0,0,0,27,3ZM19,9H13V5h6Zm0,2v4H13V11Zm-8,0v4H5V11Zm0,6v4H5V17Zm2,0h6v4H13Zm8-2V11h6l0,4ZM5,23h6v4H5Zm16,4V23h6v4Z',
                }),
            ]),
    },
    {
        value: 'bar',
        label: 'Stacked bar',
        icon: () =>
            h(ToggleIcon, null, () => [
                h('path', { d: 'M4,2H2V28a2,2,0,0,0,2,2H30V28H4V25H26V17H4V13H18V5H4ZM24,19v4H4V19ZM16,7v4H4V7Z' }),
            ]),
    },
];

type BreakdownView = 'sunburst' | 'grid';

/** Icons are Carbon's `ChartSunburst` and `DataTable` (Apache-2.0). */
const BREAKDOWN_VIEW_OPTIONS: (ToggleOption & { value: BreakdownView })[] = [
    {
        value: 'sunburst',
        label: 'Sunburst',
        icon: () =>
            h(ToggleIcon, null, () => [
                h('path', {
                    d: 'M16,2a1,1,0,0,0-1,1v7.09a5.9618,5.9618,0,0,0-2.46,1.043L7.8384,6.4311a1.4554,1.4554,0,0,0-2.087.0244A14.05,14.05,0,0,0,9.8047,28.5972a10.8482,10.8482,0,0,0,1.8989.7676,14.0982,14.0982,0,0,0,13.8443-3.1319,1.4336,1.4336,0,0,0,.0278-2.0639L20.877,19.47A5.963,5.963,0,0,0,21.91,17H29a1,1,0,0,0,1-1A14.0158,14.0158,0,0,0,16,2Zm0,10a4,4,0,1,1-4,4A4.0045,4.0045,0,0,1,16,12ZM6.83,8.251l4.2959,4.2959a5.91,5.91,0,0,0-.0113,6.9243L6.8381,23.7481A12.0168,12.0168,0,0,1,6.83,8.251Zm1.4228,16.91,4.2759-4.2759A5.9589,5.9589,0,0,0,15,21.91v6.042A11.8783,11.8783,0,0,1,8.2529,25.1612ZM17,27.9561V21.9092a5.9631,5.9631,0,0,0,2.4609-1.0273l4.2818,4.2817A11.8905,11.8905,0,0,1,17,27.9561ZM21.91,15A6.0063,6.0063,0,0,0,17,10.09V4.041A12.0208,12.0208,0,0,1,27.9585,15Z',
                }),
            ]),
    },
    {
        value: 'grid',
        label: 'Grouped table',
        icon: () =>
            h(ToggleIcon, null, () => [
                h('path', { d: 'M8 18H12V20H8z' }),
                h('path', { d: 'M14 18H18V20H14z' }),
                h('path', { d: 'M8 14H12V16H8z' }),
                h('path', { d: 'M14 22H18V24H14z' }),
                h('path', { d: 'M20 14H24V16H20z' }),
                h('path', { d: 'M20 22H24V24H20z' }),
                h('path', {
                    d: 'M27,3H5A2.0025,2.0025,0,0,0,3,5V27a2.0025,2.0025,0,0,0,2,2H27a2.0025,2.0025,0,0,0,2-2V5A2.0025,2.0025,0,0,0,27,3Zm0,2,0,4H5V5ZM5,27V11H27l0,16Z',
                }),
            ]),
    },
];

/** Material leads: it is the split the sunburst beside it opens on. */
const SPLIT_OPTIONS: { value: SpendTrendSplit; label: string }[] = [
    { value: 'material', label: 'Material' },
    { value: 'supplier', label: 'Supplier' },
];
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';

import { SUBCATEGORY_RAMP } from '../chartTheme';
import type { BurnUpPoint, Kpi, SpendNode, SpendTrend, SupplierShareRow } from '../types';
import ToggleGroup from '../ui/ToggleGroup.vue';
import type { MySpendPosition } from '../workspace';
import BudgetBurnUp from './BudgetBurnUp.vue';
import EmptyState from './EmptyState.vue';
import KpiStrip from './KpiStrip.vue';
import SpendBreakdownGrid from './SpendBreakdownGrid.vue';
import SpendSunburst from './SpendSunburst.vue';
import SpendTrendChart, { type SpendTrendStack } from './SpendTrendChart.vue';
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

const trendBuckets = computed(() => props.spendTrend.rows.length);
// Weeks are named by their day, months by their month — the granularity the bars are drawn at.
const trendEndLabel = computed(() =>
    props.spendTrend.end.toLocaleDateString(
        'en-US',
        props.spendTrend.grain === 'week' ? { month: 'short', day: 'numeric' } : { month: 'short', year: 'numeric' }
    )
);

const split = ref<SpendTrendSplit>('material');
const trendStacks = computed<SpendTrendStack[]>(() =>
    split.value === 'material'
        ? props.subcategories.map((subcategory, index) => ({
              key: subcategory,
              name: subcategory,
              fill: SUBCATEGORY_RAMP[index % SUBCATEGORY_RAMP.length],
          }))
        : Array.from(props.supplierNames, ([supplierId, name]) => ({
              key: supplierId,
              name,
              fill: props.supplierColors[supplierId],
          }))
);
const shareView = ref<SupplierShareView>('heatmap');
const breakdownView = ref<BreakdownView>('sunburst');

// The toggles speak option values (strings); the state is typed.
const splitValue = computed({
    get: () => split.value as string,
    set: (value: string) => {
        split.value = value as SpendTrendSplit;
    },
});
const shareViewValue = computed({
    get: () => shareView.value as string,
    set: (value: string) => {
        shareView.value = value as SupplierShareView;
    },
});
const breakdownViewValue = computed({
    get: () => breakdownView.value as string,
    set: (value: string) => {
        breakdownView.value = value as BreakdownView;
    },
});
</script>

<template>
    <div class="pc-view-content">
        <KpiStrip :kpis="kpis" stacked />

        <div class="pc-grid-2">
            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">Remaining runway</h2>
                    </div>
                </div>
                <div class="pc-chart-box--grow">
                    <BudgetBurnUp :points="burnUp" :budget="spendPosition.budget" />
                </div>
            </section>
            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">Spend over time</h2>
                        <!-- The bucket still in progress is left out, so the bars can stop short of today. -->
                        <span
                            class="pc-card-sub"
                            v-text="
                                `${trendBuckets} complete ${spendTrend.grain}${trendBuckets === 1 ? '' : 's'} to ${trendEndLabel}`
                            "
                        />
                    </div>
                    <ToggleGroup v-model="splitValue" aria-label="Split by" label="Split by" :options="SPLIT_OPTIONS" />
                </div>
                <div class="pc-chart-box">
                    <SpendTrendChart
                        v-if="trendBuckets > 0"
                        :rows="split === 'material' ? spendTrend.rows : spendTrend.supplierRows"
                        :stacks="trendStacks"
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
                        <h2 class="pc-card-title">Spend breakdown</h2>
                    </div>
                    <ToggleGroup
                        v-model="breakdownViewValue"
                        aria-label="View as: breakdown"
                        label="View as"
                        :options="BREAKDOWN_VIEW_OPTIONS"
                    />
                </div>
                <div class="pc-chart-box-md">
                    <template v-if="tree.spend > 0">
                        <SpendSunburst
                            v-if="breakdownView === 'sunburst'"
                            :tree="tree"
                            :supplier-colors="supplierColors"
                        />
                        <SpendBreakdownGrid v-else :tree="tree" :supplier-colors="supplierColors" />
                    </template>
                    <EmptyState v-else message="No spend in this period" hint="Try a wider period from the header." />
                </div>
            </section>
            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">Supplier concentration</h2>
                    </div>
                    <ToggleGroup
                        v-model="shareViewValue"
                        aria-label="View as: concentration"
                        label="View as"
                        :options="SHARE_VIEW_OPTIONS"
                    />
                </div>
                <div class="pc-chart-box-md">
                    <SupplierShareChart
                        v-if="tree.spend > 0"
                        :rows="shareRows"
                        :supplier-names="supplierNames"
                        :supplier-colors="supplierColors"
                        :view="shareView"
                    />
                    <EmptyState v-else message="No spend in this period" hint="Try a wider period from the header." />
                </div>
            </section>
        </div>
    </div>
</template>
