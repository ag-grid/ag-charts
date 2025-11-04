<script setup lang="ts">
import { ModuleRegistry, AllCommunityModules } from 'ag-charts-community';
import { AgCharts } from "ag-charts-vue3";

// Register modules before component initialization
ModuleRegistry.registerModules(AllCommunityModules);

// Insert options.partial here.
</script>

<template>
    <AgCharts :options="options" />
</template>

<style scoped>
</style>
