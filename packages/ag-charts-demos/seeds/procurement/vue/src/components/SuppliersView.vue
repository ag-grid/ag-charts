<script lang="ts">
import type { MaterialQualityCost } from '../types';
import type { TrendMetric } from './SupplierTrendChart.vue';

const NO_MATERIALS: MaterialQualityCost[] = [];

/** Price leads: it is the metric the renewal conversation opens on. */
const METRIC_OPTIONS: { value: TrendMetric; label: string }[] = [
    { value: 'price', label: 'Price' },
    { value: 'onTime', label: 'On time' },
    { value: 'quality', label: 'Quality' },
];
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { QualityCost, SupplierScorecard as Row, SlipDistribution, SupplierTrendPoint } from '../types';
import Button from '../ui/Button.vue';
import ToggleGroup from '../ui/ToggleGroup.vue';
import CostReliabilityScatter from './CostReliabilityScatter.vue';
import DeliverySlipHistograms from './DeliverySlipHistograms.vue';
import EmptyState from './EmptyState.vue';
import QualityCostChart from './QualityCostChart.vue';
import SupplierScorecard from './SupplierScorecard.vue';
import SupplierTrendChart from './SupplierTrendChart.vue';
import { useClickAway } from './useClickAway';

/**
 * The weekly scorecard review: how each of her suppliers is actually performing.
 *
 * Every view here reads a rolling twelve months rather than the selected period. Steel lead times
 * run to six weeks, so a quarter contains barely any completed deliveries — and three points is
 * not a trend. The period selector drives the spend views instead.
 */
const props = defineProps<{
    rows: Row[];
    supplierNames: Map<string, string>;
    supplierColors: Record<string, string>;
    selectedSupplierId?: string;
    slipDistributions: SlipDistribution[];
    qualityCost: QualityCost[];
    /** Each supplier's rejected cost per material, for drilling into a quality cost bar. */
    materialQualityCost: Map<string, MaterialQualityCost[]>;
    trend: Map<string, SupplierTrendPoint[]>;
}>();

const emit = defineEmits<{
    /** Every chart and the scorecard share this one selected supplier. */
    selectedSupplierChange: [supplierId: string | undefined];
}>();

const onSelectedSupplierChange = (supplierId: string | undefined) => emit('selectedSupplierChange', supplierId);

const metric = ref<TrendMetric>('price');
// The toggle speaks option values (strings); the state is typed.
const metricValue = computed({
    get: () => metric.value as string,
    set: (value: string) => {
        metric.value = value as TrendMetric;
    },
});
const drilledSupplierId = ref<string>();
const drilledMaterials = computed(() =>
    drilledSupplierId.value == null
        ? NO_MATERIALS
        : (props.materialQualityCost.get(drilledSupplierId.value) ?? NO_MATERIALS)
);

function onDrill(supplierId: string) {
    drilledSupplierId.value = supplierId;
    onSelectedSupplierChange(supplierId);
}

// The keyboard's way into a drill, as a chart's double-click has no key of its own.
const drillableSupplierId = computed(() => {
    const { selectedSupplierId } = props;
    return drilledSupplierId.value == null &&
        selectedSupplierId != null &&
        props.qualityCost.some((row) => row.supplierId === selectedSupplierId) &&
        (props.materialQualityCost.get(selectedSupplierId)?.length ?? 0) > 0
        ? selectedSupplierId
        : undefined;
});

const qualityCostBoxRef = ref<HTMLDivElement>();
function onBack() {
    drilledSupplierId.value = undefined;
    // With nothing selected no drill button replaces Back, so focus moves to the chart rather than the page.
    if (props.selectedSupplierId == null) {
        qualityCostBoxRef.value?.querySelector<HTMLElement>('.ag-charts-series-area')?.focus();
    }
}

// A drill shows one supplier's materials, so selecting another supplier leaves it; clearing the selection does not.
watch(
    () => props.selectedSupplierId,
    (selectedSupplierId) => {
        if (selectedSupplierId == null) return;
        if (drilledSupplierId.value !== selectedSupplierId) drilledSupplierId.value = undefined;
    }
);

// Mounted only while this tab is shown, so a click elsewhere on the page clears only while it is in view.
useClickAway(
    () => props.selectedSupplierId != null,
    () => onSelectedSupplierChange(undefined)
);

// A card has no empty space to click away on, so selecting the selected supplier again clears it.
function onToggleSupplier(supplierId: string) {
    onSelectedSupplierChange(supplierId === props.selectedSupplierId ? undefined : supplierId);
}

/** Drill and Back share one button, so the element and its focus survive the drill flipping. */
const drillButton = computed(() => {
    if (drilledSupplierId.value != null) return { label: '← Back to all suppliers', onClick: onBack };
    const supplierId = drillableSupplierId.value;
    if (supplierId == null) return undefined;
    return { label: `See ${props.supplierNames.get(supplierId)}'s materials →`, onClick: () => onDrill(supplierId) };
});
</script>

<template>
    <div class="pc-view-content pc-view-content--fill">
        <div class="pc-grid-2 pc-grid-2--fill">
            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">Cost vs delivery</h2>
                    </div>
                </div>
                <!-- Fills the card: a fixed box would leave dead space under it in a row that
                     takes the rest of the page. -->
                <div class="pc-chart-box--grow" data-keeps-selection="true">
                    <CostReliabilityScatter
                        v-if="rows.some((row) => row.orderCount > 0)"
                        :rows="rows"
                        :supplier-colors="supplierColors"
                        :selected-supplier-id="selectedSupplierId"
                        @selected-supplier-change="onSelectedSupplierChange"
                    />
                    <EmptyState
                        v-else
                        message="No orders for this selection"
                        hint="Nothing was ordered here in the selected period."
                    />
                </div>
            </section>

            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">Days late by supplier</h2>
                    </div>
                </div>
                <DeliverySlipHistograms
                    v-if="slipDistributions.length > 0"
                    :rows="slipDistributions"
                    :supplier-colors="supplierColors"
                    :selected-supplier-id="selectedSupplierId"
                    @selected-supplier-change="onSelectedSupplierChange"
                />
                <EmptyState
                    v-else
                    message="Not enough deliveries to describe a distribution"
                    hint="A histogram needs a handful of completed deliveries behind it."
                />
            </section>
        </div>

        <div class="pc-grid-2">
            <section class="pc-card">
                <div class="pc-card-head pc-card-head--action">
                    <div class="pc-card-title-inline">
                        <h2 class="pc-card-title">Cost of rejected material</h2>
                        <span v-if="drilledSupplierId != null" class="pc-card-sub"
                            >from {{ supplierNames.get(drilledSupplierId) }}</span
                        >
                    </div>
                    <Button v-if="drillButton != null" class="pc-btn-sm" @click="drillButton.onClick">{{
                        drillButton.label
                    }}</Button>
                </div>
                <div ref="qualityCostBoxRef" class="pc-chart-box" data-keeps-selection="true">
                    <QualityCostChart
                        v-if="qualityCost.length > 0 && (drilledSupplierId == null || drilledMaterials.length > 0)"
                        :rows="qualityCost"
                        :drilled-supplier-id="drilledSupplierId"
                        :material-rows="drilledMaterials"
                        :supplier-colors="supplierColors"
                        :selected-supplier-id="selectedSupplierId"
                        @selected-supplier-change="onSelectedSupplierChange"
                        @drill="onDrill"
                    />
                    <EmptyState
                        v-else
                        message="Nothing delivered in this window"
                        hint="Widen the period to see what inspection rejected."
                    />
                </div>
            </section>

            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">Supplier trend</h2>
                    </div>
                    <ToggleGroup v-model="metricValue" aria-label="Trend metric" :options="METRIC_OPTIONS" />
                </div>
                <div class="pc-chart-box" data-keeps-selection="true">
                    <SupplierTrendChart
                        :trend="trend"
                        :supplier-names="supplierNames"
                        :supplier-colors="supplierColors"
                        :metric="metric"
                        :selected-supplier-id="selectedSupplierId"
                        @selected-supplier-change="onSelectedSupplierChange"
                    />
                </div>
            </section>
        </div>

        <section class="pc-card">
            <div class="pc-card-head">
                <div>
                    <h2 class="pc-card-title">My suppliers</h2>
                </div>
            </div>
            <SupplierScorecard
                :rows="rows"
                :supplier-colors="supplierColors"
                :selected-supplier-id="selectedSupplierId"
                @select="onToggleSupplier"
            />
        </section>
    </div>
</template>
