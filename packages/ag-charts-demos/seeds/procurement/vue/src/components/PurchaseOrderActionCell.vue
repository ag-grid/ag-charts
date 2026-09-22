<script lang="ts">
import type { ICellRendererParams } from 'ag-grid-community';

import type { PoActionKind, PurchaseOrder } from '../types';

/** The decisions she can record against a line, in escalating order. */
const PO_ACTIONS: { kind: PoActionKind; label: string }[] = [
    { kind: 'Resolved', label: 'Resolve' },
    { kind: 'Reassigned', label: 'Reassign' },
    { kind: 'Escalated', label: 'Escalate' },
];

/** The grid's params plus what the column passes through `cellRendererParams`. */
export interface PurchaseOrderActionCellParams extends ICellRendererParams<PurchaseOrder> {
    /** What she has already recorded against a line, by PO id. */
    poActions: Record<string, PoActionKind>;
    onAction: (poId: string, kind: PoActionKind) => void;
}
</script>

<script setup lang="ts">
import { computed, shallowRef } from 'vue';

const props = defineProps<{ params: PurchaseOrderActionCellParams }>();

// A recorded decision reaches the cell through `refresh` with the column's new params (see StatusCell.vue).
const params = shallowRef(props.params);
function refresh(next: PurchaseOrderActionCellParams): boolean {
    params.value = next;
    return true;
}
defineExpose({ refresh });

const recorded = computed(() => (params.value.data ? params.value.poActions[params.value.data.poId] : undefined));
</script>

<template>
    <!-- Once a decision is recorded the line states it rather than offering the same buttons again. -->
    <span v-if="params.data && recorded" class="pc-po-action-done"
        ><span aria-hidden="true">✓</span> {{ recorded }}</span
    >
    <span v-else-if="params.data" class="pc-po-actions">
        <button
            v-for="action in PO_ACTIONS"
            :key="action.kind"
            type="button"
            class="pc-link-btn"
            @click="params.onAction(params.data.poId, action.kind)"
        >
            {{ action.label }}
        </button>
    </span>
</template>
