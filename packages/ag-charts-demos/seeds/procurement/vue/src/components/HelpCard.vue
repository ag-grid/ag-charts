<script lang="ts">
import { FOCUSABLE } from './focusable';

/** The first focusable element after `element` in document order, outside it. */
function nextFocusable(element: HTMLElement): HTMLElement | undefined {
    return Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE)).find(
        (candidate) =>
            !element.contains(candidate) &&
            (element.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
    );
}
</script>

<script setup lang="ts">
import { ref } from 'vue';

/**
 * Where to get help with the workspace. Placeholder copy: the demo has no real support channel, so
 * nothing here is a link. Dismissal lasts for the session only, so a reload brings it back.
 */
const sectionRef = ref<HTMLElement>();
const dismissed = ref(false);

// The close button goes with the card, so focus moves on rather than dropping to the body.
const dismiss = () => {
    if (sectionRef.value != null) nextFocusable(sectionRef.value)?.focus();
    dismissed.value = true;
};
</script>

<template>
    <!-- Not a heading: the card sits before the page's h1 in the DOM. -->
    <section v-if="!dismissed" ref="sectionRef" class="pc-help" aria-labelledby="pc-help-title">
        <div class="pc-help-head">
            <p id="pc-help-title" class="pc-help-title">Need a hand?</p>
            <button type="button" class="pc-help-close" aria-label="Dismiss help" @click="dismiss">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false">
                    <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                </svg>
            </button>
        </div>
        <p class="pc-help-body">
            See the Supply Desk guide on the intranet, or contact Procurement Systems at help@example.com.
        </p>
    </section>
</template>
