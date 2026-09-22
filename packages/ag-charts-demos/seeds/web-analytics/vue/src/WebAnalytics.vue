<script setup lang="ts">
import { AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

import WebAnalyticsApp from './WebAnalyticsApp.vue';
import './web-analytics.css';

// Funnel, Sankey and Map series are enterprise features.
ModuleRegistry.registerModules([AllEnterpriseModule]);
</script>

<template>
    <WebAnalyticsApp />
</template>
