<script lang="ts">
import { h } from 'vue';

import ToggleIcon from '../ui/ToggleIcon.vue';
import type { ToggleOption } from '../ui/types';

type ScheduleView = 'chart' | 'grid';

/** Icons are Carbon's `ChartBarFloating` and `DataTable` (Apache-2.0). */
const SCHEDULE_VIEW_OPTIONS: (ToggleOption & { value: ScheduleView })[] = [
    {
        value: 'chart',
        label: 'Range bar',
        icon: () =>
            h(ToggleIcon, null, () => [
                h('path', { d: 'M28,24H14V16H28ZM16,22H26V18H16Z' }),
                h('path', { d: 'M26,12H8V4H26ZM10,10H24V6H10Z' }),
                h('path', { d: 'M30,30H4a2.0023,2.0023,0,0,1-2-2V2H4V28H30Z' }),
            ]),
    },
    {
        value: 'grid',
        label: 'Table',
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
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';

import type { Kpi, PoActionKind, PurchaseOrder, TrackedShipment } from '../types';
import Button from '../ui/Button.vue';
import ToggleGroup from '../ui/ToggleGroup.vue';
import DeliveryMap from './DeliveryMap.vue';
import EmptyState from './EmptyState.vue';
import KpiStrip from './KpiStrip.vue';
import PurchaseOrderGrid from './PurchaseOrderGrid.vue';
import ShipmentSchedule from './ShipmentSchedule.vue';
import ShipmentScheduleGrid from './ShipmentScheduleGrid.vue';
import StatusKeys, { statusSegments } from './StatusKeys.vue';
import { useClickAway } from './useClickAway';

/**
 * Her order book: what needs deciding, how she is tracking, where her freight is, and the lines a
 * selected shipment holds.
 *
 * Leads with the worklist rather than a chart — a workspace opens on what its owner has to do,
 * where a dashboard opens on a summary of what happened.
 */
const props = defineProps<{
    kpis: Kpi[];
    shipments: TrackedShipment[];
    selectedShipmentIds: string[];
    /** Her order lines on the selected shipments; empty until one is selected. */
    orders: PurchaseOrder[];
    /** What the grid is showing, stated in the card's subtitle. */
    gridSubtitle: string;
    /** What she has already recorded against a line, by PO id. */
    poActions: Record<string, PoActionKind>;
    canClearSelection: boolean;
}>();

const emit = defineEmits<{
    shipmentSelectionChange: [added: string[], removed: string[]];
    poAction: [poId: string, kind: PoActionKind];
    clearSelection: [];
}>();

const onClearSelection = () => emit('clearSelection');
const onShipmentSelectionChange = (added: string[], removed: string[]) =>
    emit('shipmentSelectionChange', added, removed);

useClickAway(() => props.canClearSelection, onClearSelection);
const scheduleView = ref<ScheduleView>('chart');
// The toggle speaks option values (strings); the state is typed.
const scheduleViewValue = computed({
    get: () => scheduleView.value as string,
    set: (value: string) => {
        scheduleView.value = value as ScheduleView;
    },
});

const ALL_STATUS_SEGMENTS = statusSegments();
</script>

<template>
    <div class="pc-view-content">
        <!-- The headline and the map stack on the left; the schedule runs the full height beside them. -->
        <div class="pc-grid-2">
            <div class="pc-stack">
                <KpiStrip :kpis="kpis" />

                <section class="pc-card">
                    <div class="pc-card-head">
                        <div>
                            <h2 class="pc-card-title">Orders in transit</h2>
                        </div>
                        <StatusKeys :segments="ALL_STATUS_SEGMENTS" :show-counts="false" />
                    </div>
                    <div class="pc-chart-box-md" data-keeps-selection="true">
                        <DeliveryMap
                            v-if="shipments.length > 0"
                            :shipments="shipments"
                            :selected-shipment-ids="selectedShipmentIds"
                            @selection-change="onShipmentSelectionChange"
                        />
                        <EmptyState
                            v-else
                            message="Nothing in transit for these filters"
                            hint="Clear the supplier and subcategory filters to see all my lanes."
                        />
                    </div>
                </section>
            </div>

            <section class="pc-card">
                <div class="pc-card-head">
                    <div>
                        <h2 class="pc-card-title">Arrival schedule</h2>
                    </div>
                    <ToggleGroup
                        v-model="scheduleViewValue"
                        aria-label="View as: arrival schedule"
                        label="View as"
                        :options="SCHEDULE_VIEW_OPTIONS"
                    />
                </div>
                <div class="pc-chart-box--grow" data-keeps-selection="true">
                    <template v-if="shipments.length > 0">
                        <ShipmentSchedule
                            v-if="scheduleView === 'chart'"
                            :shipments="shipments"
                            :selected-shipment-ids="selectedShipmentIds"
                            @selection-change="onShipmentSelectionChange"
                        />
                        <ShipmentScheduleGrid
                            v-else
                            :shipments="shipments"
                            :selected-shipment-ids="selectedShipmentIds"
                            @selection-change="onShipmentSelectionChange"
                        />
                    </template>
                    <EmptyState
                        v-else
                        message="Nothing in transit for these filters"
                        hint="Clear the supplier and subcategory filters to see all my lanes."
                    />
                </div>
            </section>
        </div>

        <!-- Where this tab's own selections land — a shipment picked on the map or the schedule. -->
        <section class="pc-card">
            <div class="pc-card-head">
                <div>
                    <h2 class="pc-card-title">Purchase orders</h2>
                    <span class="pc-card-sub">{{ gridSubtitle }}</span>
                </div>
                <div class="pc-chips">
                    <span v-for="shipmentId in selectedShipmentIds" :key="shipmentId" class="pc-chip">{{
                        shipmentId
                    }}</span>
                    <Button :disabled="!canClearSelection" @click="onClearSelection">Clear selection</Button>
                </div>
            </div>
            <!-- With nothing selected the grid stays mounted and empty, showing its own prompt overlay. -->
            <EmptyState
                v-if="selectedShipmentIds.length > 0 && orders.length === 0"
                :message="
                    selectedShipmentIds.length === 1
                        ? 'No order lines on this shipment'
                        : 'No order lines on these shipments'
                "
                hint="Select another shipment."
            />
            <PurchaseOrderGrid
                v-else
                :orders="orders"
                :po-actions="poActions"
                @action="(poId, kind) => emit('poAction', poId, kind)"
            />
        </section>
    </div>
</template>
