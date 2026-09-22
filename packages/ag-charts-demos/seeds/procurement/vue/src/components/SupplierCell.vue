<script lang="ts">
import type { ICellRendererParams } from 'ag-grid-community';

import type { SupplierScorecard as Row } from '../types';

/** The grid's params plus what the column passes through `cellRendererParams`. */
export interface SupplierCellParams extends ICellRendererParams<Row> {
    supplierColors: Record<string, string>;
    /** The supplier currently selected, if any. */
    selectedSupplierId?: string;
    /** Selecting a row again clears it. */
    onSelect: (supplierId: string) => void;
}
</script>

<script setup lang="ts">
import { shallowRef } from 'vue';

// The selector carries the pressed state, and a button is keyboard-reachable where a row is not.
const props = defineProps<{ params: SupplierCellParams }>();

// A change of selection reaches the cell through `refresh` with the column's new params (see StatusCell.vue).
const params = shallowRef(props.params);
function refresh(next: SupplierCellParams): boolean {
    params.value = next;
    return true;
}
defineExpose({ refresh });
</script>

<template>
    <button
        v-if="params.data != null"
        type="button"
        class="pc-supplier-main"
        :aria-pressed="params.data.supplierId === params.selectedSupplierId"
        @click="params.onSelect(params.data.supplierId)"
    >
        <span
            class="pc-supplier-swatch"
            :style="{ background: params.supplierColors[params.data.supplierId] }"
            aria-hidden="true"
        />
        <span class="pc-supplier-name">{{ params.data.supplier }}</span>
    </button>
</template>
