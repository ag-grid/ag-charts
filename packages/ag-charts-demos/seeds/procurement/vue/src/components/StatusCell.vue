<script lang="ts">
import { STATUS_ICONS } from '../chartTheme';
import type { PoStatus } from '../types';

/** Grid status ink and glyph. `Delivered` is terminal, so it is chrome, not a warning. */
const STATUS_STYLE: Record<PoStatus, { className: string; icon: string }> = {
    'On time': { className: 'is-ok', icon: STATUS_ICONS['On time'] },
    'At risk': { className: 'is-warn', icon: STATUS_ICONS['At risk'] },
    Late: { className: 'is-bad', icon: STATUS_ICONS['Late'] },
    Delivered: { className: 'is-done', icon: '✓' },
};
</script>

<script setup lang="ts">
import type { ICellRendererParams } from 'ag-grid-community';
import { computed, shallowRef } from 'vue';

import type { PurchaseOrder } from '../types';

type StatusCellParams = ICellRendererParams<PurchaseOrder, PoStatus>;

/**
 * Status cell: glyph plus text, so the state survives without colour. The accessibility
 * requirement is that this grid and the scorecard are the accessible table equivalents of
 * the sunburst and scatter, so it has to be legible on its own terms.
 */
const props = defineProps<{ params: StatusCellParams }>();

// The grid hands a changed cell in through `refresh` rather than new props, so the rendered
// params are held here; returning true keeps this instance instead of recreating it.
const params = shallowRef(props.params);
function refresh(next: StatusCellParams): boolean {
    params.value = next;
    return true;
}
defineExpose({ refresh });

const style = computed(() => STATUS_STYLE[params.value.value as PoStatus]);
</script>

<template>
    <span :class="`pc-status-cell ${style.className}`">
        <span aria-hidden="true">{{ style.icon }}</span>
        <span class="pc-status-cell-text">{{ params.value }}</span>
    </span>
</template>
