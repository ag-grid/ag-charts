<script setup lang="ts">
import type { ICellRendererParams } from 'ag-grid-community';

import type { SupplierScorecard as Row } from '../types';
import Button from '../ui/Button.vue';

/**
 * The two ways she opens a conversation with a supplier.
 *
 * Icon-only, so the column stays narrow enough to pin, with the action named on each button for
 * anyone who cannot see the glyph — a bare icon is not a label.
 */
// Declared so the grid's params stay off the root element; nothing here reads them.
defineProps<{ params: ICellRendererParams<Row> }>();

// Static content, so a refresh has nothing to change.
function refresh(): boolean {
    return true;
}
defineExpose({ refresh });
</script>

<template>
    <span class="pc-contact-cell">
        <Button class="pc-icon-btn" aria-label="Call supplier" title="Call supplier">
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                    d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"
                />
            </svg>
        </Button>
        <Button class="pc-icon-btn" aria-label="Email supplier" title="Email supplier">
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="2.5" y="4.5" width="19" height="15" rx="1.5" />
                <path d="m3 7 9 6 9-6" />
            </svg>
        </Button>
    </span>
</template>
