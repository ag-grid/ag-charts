<script lang="ts">
import type { StyleValue } from 'vue';

const NOTICE_ID = 'pc-demo-notice';
const GAP = 6;
const EDGE = 12;
/** Below this much room to the right, the tip opens to the left of the icon instead. */
const MIN_TIP_WIDTH = 200;

// Fixed, not absolute: the scrolling side bar would clip it. Hover-only, so it never follows a scroll.
function tipPosition(trigger: HTMLElement): StyleValue {
    const rect = trigger.getBoundingClientRect();
    const vertical =
        rect.top > window.innerHeight / 2
            ? { bottom: `${window.innerHeight - rect.bottom}px` }
            : { top: `${rect.top}px` };
    const roomRight = window.innerWidth - rect.right - GAP - EDGE;
    const horizontal =
        roomRight >= MIN_TIP_WIDTH
            ? { left: `${rect.right + GAP}px`, maxWidth: `min(320px, ${roomRight}px)` }
            : {
                  right: `${window.innerWidth - rect.left + GAP}px`,
                  maxWidth: `min(320px, ${rect.left - GAP - EDGE}px)`,
              };
    return { ...vertical, ...horizontal };
}
</script>

<script setup lang="ts">
import { ref, shallowRef } from 'vue';

const triggerRef = ref<HTMLButtonElement>();
const tipStyle = shallowRef<StyleValue | null>(null);

const show = () => {
    if (triggerRef.value != null) tipStyle.value = tipPosition(triggerRef.value);
};
const hide = () => {
    tipStyle.value = null;
};
</script>

<template>
    <span class="pc-notice">
        <button
            ref="triggerRef"
            type="button"
            class="pc-notice-trigger"
            aria-label="About this demo"
            :aria-describedby="tipStyle == null ? undefined : NOTICE_ID"
            @mouseenter="show"
            @mouseleave="hide"
            @focus="show"
            @blur="hide"
            @keydown="(event: KeyboardEvent) => event.key === 'Escape' && hide()"
        >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
                <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" />
                <path d="M8 7v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <circle cx="8" cy="4.75" r="0.9" fill="currentColor" />
            </svg>
        </button>
        <span v-if="tipStyle != null" :id="NOTICE_ID" role="tooltip" class="pc-notice-tip" :style="tipStyle"
            >This is a sample application showcasing AG Charts and AG Grid features. All data shown is fictional and for
            demonstration purposes only.</span
        >
    </span>
</template>
