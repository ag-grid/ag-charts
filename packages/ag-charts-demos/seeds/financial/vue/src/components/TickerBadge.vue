<script lang="ts">
// Number of avatar colours defined in financial.css as
// `.fin-ticker-badge[data-avatar='N']`. Keep the two in step.
const AVATAR_COLORS = 8;

/**
 * A stable colour slot for a ticker. FNV-1a rather than a character sum, so
 * same-letter tickers (ACME/ASTL) land on different colours instead of clustering.
 */
function avatarIndex(ticker: string): number {
    let hash = 2166136261;
    for (let i = 0; i < ticker.length; i++) {
        hash = Math.imul(hash ^ ticker.charCodeAt(i), 16777619);
    }
    return (hash >>> 0) % AVATAR_COLORS;
}
</script>

<script setup lang="ts">
/**
 * A market's coloured initial. Decorative — it abbreviates a ticker that is always
 * shown beside it — so it stays out of the accessibility tree. Sized by context in
 * financial.css rather than by a prop.
 */
defineProps<{ ticker: string }>();
</script>

<template>
    <span class="fin-ticker-badge" :data-avatar="avatarIndex(ticker)" aria-hidden="true">{{ ticker.charAt(0) }}</span>
</template>
