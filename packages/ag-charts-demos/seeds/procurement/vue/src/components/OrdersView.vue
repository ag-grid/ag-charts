<script setup lang="ts">
import type { Kpi, PoActionKind, PurchaseOrder, TrackedShipment } from '../types';
import Button from '../ui/Button.vue';
import DeliveryMap from './DeliveryMap.vue';
import EmptyState from './EmptyState.vue';
import KpiStrip from './KpiStrip.vue';
import PurchaseOrderGrid from './PurchaseOrderGrid.vue';
import ShipmentSchedule from './ShipmentSchedule.vue';
import StatusLegend from './StatusLegend.vue';

/**
 * Her order book: what needs deciding, how she is tracking, where her freight is, and the lines a
 * selected shipment holds.
 *
 * Leads with the worklist rather than a chart — a workspace opens on what its owner has to do,
 * where a dashboard opens on a summary of what happened.
 */
defineProps<{
    kpis: Kpi[];
    shipments: TrackedShipment[];
    selectedShipmentId?: string;
    /** Her order lines under the current selection — the landing point for every selection. */
    orders: PurchaseOrder[];
    /** What the grid is showing, stated in the card's subtitle. */
    gridSubtitle: string;
    /** What she has already recorded against a line, by PO id. */
    poActions: Record<string, PoActionKind>;
    canClearSelection: boolean;
}>();

const emit = defineEmits<{
    selectShipment: [shipmentId: string];
    poAction: [poId: string, kind: PoActionKind];
    clearSelection: [];
}>();
</script>

<template>
    <div class="pc-view-content">
        <KpiStrip :kpis="kpis" />

        <div class="pc-grid-2">
            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">My suppliers — in transit</h2>
                        <span class="pc-card-sub">Select a marker to filter the orders.</span>
                    </div>
                    <StatusLegend />
                </div>
                <div class="pc-chart-box-md">
                    <DeliveryMap
                        v-if="shipments.length > 0"
                        :shipments="shipments"
                        :selected-shipment-id="selectedShipmentId"
                        @shipment-click="(shipmentId) => emit('selectShipment', shipmentId)"
                    />
                    <EmptyState
                        v-else
                        message="Nothing in transit for this supplier"
                        hint="Clear the supplier selection to see all my lanes."
                    />
                </div>
            </section>

            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">Arrival schedule</h2>
                        <span class="pc-card-sub">Select a bar to filter the orders.</span>
                    </div>
                </div>
                <div class="pc-chart-box-md">
                    <ShipmentSchedule
                        v-if="shipments.length > 0"
                        :shipments="shipments"
                        :selected-shipment-id="selectedShipmentId"
                        @select="(shipmentId) => emit('selectShipment', shipmentId)"
                    />
                    <EmptyState
                        v-else
                        message="Nothing in transit"
                        hint="Clear the supplier selection to see all my lanes."
                    />
                </div>
            </section>
        </div>

        <!-- Where this tab's own selections land — a shipment picked on the map or the schedule. -->
        <section class="pc-card">
            <div class="pc-card-head">
                <div>
                    <h2 class="pc-card-title">My purchase orders</h2>
                    <span class="pc-card-sub">{{ gridSubtitle }}</span>
                </div>
                <div class="pc-chips">
                    <span v-if="selectedShipmentId != null" class="pc-chip">{{ selectedShipmentId }}</span>
                    <Button :disabled="!canClearSelection" @click="emit('clearSelection')">Clear selection</Button>
                </div>
            </div>
            <PurchaseOrderGrid
                v-if="orders.length > 0"
                :orders="orders"
                :po-actions="poActions"
                @action="(poId, kind) => emit('poAction', poId, kind)"
            />
            <EmptyState
                v-else
                message="No orders match this selection"
                hint="Clear the selection, or widen the period."
            />
        </section>
    </div>
</template>
