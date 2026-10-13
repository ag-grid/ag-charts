<script setup lang="ts">
import { type ICellRendererParams } from 'ag-grid-community';
import { shallowRef } from 'vue';

import TickerBadge from './TickerBadge.vue';

type TickerCellParams = ICellRendererParams<{ ticker: string }, string>;

/**
 * A market cell: the coloured initial, then the cell's own text. The badge is a
 * recognition aid for scanning a long board, so it keys off the ticker even when the
 * column shows the company name.
 */
const props = defineProps<{ params: TickerCellParams }>();

// The grid streams a changed cell in through `refresh` rather than new props, so the rendered
// params are held here; returning true keeps this instance instead of recreating it.
const params = shallowRef(props.params);
function refresh(next: TickerCellParams): boolean {
    params.value = next;
    return true;
}
defineExpose({ refresh });
</script>

<template>
    <span class="fin-ticker">
        <TickerBadge :ticker="params.data?.ticker ?? ''" />
        <span class="fin-ticker-label">{{ params.value }}</span>
    </span>
</template>
