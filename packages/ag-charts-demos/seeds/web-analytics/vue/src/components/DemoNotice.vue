<script setup lang="ts">
import { ref } from 'vue';

const NOTICE_ID = 'wa-demo-notice';
const NOTICE =
    'This is a sample application showcasing AG Charts and AG Grid features. ' +
    'All data shown is synthetic and randomly generated for demonstration purposes only.';

const open = ref(false);
</script>

<template>
    <span class="wa-notice">
        <button
            type="button"
            class="wa-notice-trigger"
            aria-label="About this demo"
            :aria-describedby="open ? NOTICE_ID : undefined"
            @mouseenter="open = true"
            @mouseleave="open = false"
            @focus="open = true"
            @blur="open = false"
            @keydown.escape="open = false"
        >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
                <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" />
                <path d="M8 7v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <circle cx="8" cy="4.75" r="0.9" fill="currentColor" />
            </svg>
        </button>
        <span v-if="open" :id="NOTICE_ID" role="tooltip" class="wa-notice-tip" v-text="NOTICE" />
    </span>
</template>
