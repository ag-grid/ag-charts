<script setup lang="ts">
// A styled native button: neither Radix nor reka-ui has a Button primitive. Attributes and
// listeners fall through to the element, and a `class` from the caller merges after `pc-btn`,
// which is the order the React helper composes. The root element is reachable through the
// component instance's `$el`, which stands in for the forwarded ref `AttentionAlert` uses to
// put focus back on the control it came from.
</script>

<template>
    <button type="button" class="pc-btn"><slot /></button>
</template>
