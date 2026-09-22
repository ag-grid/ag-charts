<script lang="ts">
import type { TrendMetric } from './SupplierTrendChart.vue';

/** Price leads: it is the metric the renewal conversation opens on. */
const METRIC_OPTIONS: { value: TrendMetric; label: string }[] = [
    { value: 'price', label: 'Price' },
    { value: 'onTime', label: 'On time' },
    { value: 'quality', label: 'Quality' },
];
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';

import type { QualityCost, SupplierScorecard as Row, SlipDistribution, SupplierTrendPoint } from '../types';
import ToggleGroup from '../ui/ToggleGroup.vue';
import CostReliabilityScatter from './CostReliabilityScatter.vue';
import DeliverySlipHistograms from './DeliverySlipHistograms.vue';
import EmptyState from './EmptyState.vue';
import QualityCostChart from './QualityCostChart.vue';
import SupplierScorecard from './SupplierScorecard.vue';
import SupplierTrendChart from './SupplierTrendChart.vue';

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
    trend: Map<string, SupplierTrendPoint[]>;
}>();

const emit = defineEmits<{
    selectSupplier: [supplierId: string];
}>();

const metric = ref<TrendMetric>('price');

// The control speaks option values (strings); the state is the metric union.
const metricValue = computed({
    get: () => metric.value,
    set: (value: string) => {
        metric.value = value as TrendMetric;
    },
});

const hasOrders = computed(() => props.rows.some((row) => row.orderCount > 0));
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
                <div class="pc-chart-box--grow">
                    <CostReliabilityScatter
                        v-if="hasOrders"
                        :rows="rows"
                        :supplier-colors="supplierColors"
                        :selected-supplier-id="selectedSupplierId"
                        @select="(supplierId) => emit('selectSupplier', supplierId)"
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
                    @select="(supplierId) => emit('selectSupplier', supplierId)"
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
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">Cost of rejected material</h2>
                    </div>
                </div>
                <div class="pc-chart-box">
                    <QualityCostChart
                        v-if="qualityCost.length > 0"
                        :rows="qualityCost"
                        :supplier-colors="supplierColors"
                        :selected-supplier-id="selectedSupplierId"
                        @select="(supplierId) => emit('selectSupplier', supplierId)"
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
                <!-- Sized by the scorecard beside it, which hugs its grid. -->
                <div class="pc-chart-box--match">
                    <SupplierTrendChart
                        :trend="trend"
                        :supplier-names="supplierNames"
                        :supplier-colors="supplierColors"
                        :metric="metric"
                        :selected-supplier-id="selectedSupplierId"
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
                @select="(supplierId) => emit('selectSupplier', supplierId)"
            />
        </section>
    </div>
</template>
