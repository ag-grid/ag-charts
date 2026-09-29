<script lang="ts">
const SEVERITY_GLYPH = { bad: '▲' } as const;
</script>

<script setup lang="ts">
import type { AttentionAction, AttentionItem } from '../types';
import Button from '../ui/Button.vue';

/**
 * The first thing she sees: what needs a decision from her today, with the decisions
 * available in place.
 *
 * Deliberately not a chart. A workspace opens on what its owner has to do; a dashboard opens
 * on a summary of what happened. Each item resolves here and disappears, so the list is a
 * worklist that empties rather than a feed that accumulates.
 */
defineProps<{
    items: AttentionItem[];
}>();

const emit = defineEmits<{
    /** Selecting an item selects its shipment on the orders tab, where the worklist lives. */
    select: [shipmentId: string];
    /** Taking a decision resolves the item in place, removing it from the list. */
    resolve: [item: AttentionItem, action: AttentionAction];
}>();
</script>

<template>
    <div v-if="items.length === 0" class="pc-attention-clear">
        <span class="pc-attention-clear-glyph" aria-hidden="true">✓</span>
        <span
            ><strong>Nothing needs your attention.</strong> No shipment is projected to miss the date production needs
            it.</span
        >
    </div>
    <ul v-else class="pc-attention">
        <li v-for="item in items" :key="item.itemId" :class="`pc-attention-item is-${item.severity}`">
            <span class="pc-attention-glyph" aria-hidden="true">{{ SEVERITY_GLYPH[item.severity] }}</span>
            <button type="button" class="pc-attention-body" @click="emit('select', item.shipmentId)">
                <span class="pc-attention-title">{{ item.title }}</span>
                <span class="pc-attention-detail">{{ item.detail }}</span>
            </button>
            <span class="pc-attention-actions">
                <Button
                    v-for="action in item.actions"
                    :key="action.id"
                    class="pc-btn-sm"
                    @click="emit('resolve', item, action)"
                    >{{ action.label }}</Button
                >
            </span>
        </li>
    </ul>
</template>
