<script setup lang="ts">
// A styled native button: neither Radix nor reka-ui has a Button primitive. Attributes and
// listeners fall through to the element, and a `class` from the caller merges after `fin-btn`,
// which is the order the React helper composes.
</script>

<template>
    <button type="button" class="fin-btn"><slot /></button>
</template>
